"""
Metrics service for observability and monitoring.
Provides Prometheus metrics for API performance, error tracking, and model/tool usage.
"""

import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    REGISTRY,
    CollectorRegistry,
)

# Initialize custom registry for metrics
metrics_registry = CollectorRegistry()

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=metrics_registry
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint'],
    registry=metrics_registry,
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
)

# Error metrics
errors_total = Counter(
    'errors_total',
    'Total errors',
    ['error_type', 'endpoint'],
    registry=metrics_registry
)

# Model/Tool usage
model_requests_total = Counter(
    'model_requests_total',
    'Total model requests',
    ['provider', 'model_name'],
    registry=metrics_registry
)

model_request_duration_seconds = Histogram(
    'model_request_duration_seconds',
    'Model request latency in seconds',
    ['provider', 'model_name'],
    registry=metrics_registry
)

tool_requests_total = Counter(
    'tool_requests_total',
    'Total tool requests',
    ['provider', 'tool_name'],
    registry=metrics_registry
)

tool_request_duration_seconds = Histogram(
    'tool_request_duration_seconds',
    'Tool request latency in seconds',
    ['provider', 'tool_name'],
    registry=metrics_registry
)

# Active connections
active_connections = Gauge(
    'active_connections',
    'Number of active WebSocket connections',
    registry=metrics_registry
)

# Chat messages
chat_messages_total = Counter(
    'chat_messages_total',
    'Total chat messages processed',
    ['sender_type'],  # 'user' or 'model'
    registry=metrics_registry
)


class MetricsService:
    """Service for tracking and exposing application metrics."""
    
    def __init__(self):
        self.request_start_times: Dict[str, float] = {}
        self.metrics_window: Dict[str, List[float]] = defaultdict(list)
        self.window_size = 300  # 5-minute window for aggregation
        
    def record_request_start(self, request_id: str):
        """Record the start time of a request."""
        self.request_start_times[request_id] = time.time()
    
    def record_request_end(
        self, 
        request_id: str, 
        method: str, 
        endpoint: str, 
        status_code: int
    ):
        """Record the end of a request and update metrics."""
        if request_id in self.request_start_times:
            duration = time.time() - self.request_start_times[request_id]
            
            # Update counters
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status_code
            ).inc()
            
            # Update histograms
            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            # Track for aggregation
            key = f"{method}:{endpoint}"
            self.metrics_window[key].append(duration)
            
            # Clean old entries
            if len(self.metrics_window[key]) > 1000:
                self.metrics_window[key] = self.metrics_window[key][-1000:]
            
            del self.request_start_times[request_id]
    
    def record_error(self, error_type: str, endpoint: str):
        """Record an error occurrence."""
        errors_total.labels(
            error_type=error_type,
            endpoint=endpoint
        ).inc()
    
    def record_model_request(
        self,
        provider: str,
        model_name: str,
        duration: float
    ):
        """Record a model API request."""
        model_requests_total.labels(
            provider=provider,
            model_name=model_name
        ).inc()
        
        model_request_duration_seconds.labels(
            provider=provider,
            model_name=model_name
        ).observe(duration)
    
    def record_tool_request(
        self,
        provider: str,
        tool_name: str,
        duration: float
    ):
        """Record a tool request."""
        tool_requests_total.labels(
            provider=provider,
            tool_name=tool_name
        ).inc()
        
        tool_request_duration_seconds.labels(
            provider=provider,
            tool_name=tool_name
        ).observe(duration)
    
    def set_active_connections(self, count: int):
        """Set the current number of active connections."""
        active_connections.set(count)
    
    def record_chat_message(self, sender_type: str):
        """Record a chat message."""
        chat_messages_total.labels(sender_type=sender_type).inc()
    
    def get_metrics(self) -> str:
        """Get metrics in Prometheus text format."""
        return generate_latest(metrics_registry).decode('utf-8')
    
    def get_aggregated_metrics(self) -> Dict:
        """Get aggregated metrics for the API response."""
        aggregated = {}
        
        for key, durations in self.metrics_window.items():
            if not durations:
                continue
            
            method, endpoint = key.split(':', 1)
            
            avg_duration = sum(durations) / len(durations)
            min_duration = min(durations)
            max_duration = max(durations)
            p95_duration = sorted(durations)[int(len(durations) * 0.95)] if len(durations) > 1 else durations[0]
            
            aggregated[key] = {
                'method': method,
                'endpoint': endpoint,
                'request_count': len(durations),
                'avg_duration_ms': round(avg_duration * 1000, 2),
                'min_duration_ms': round(min_duration * 1000, 2),
                'max_duration_ms': round(max_duration * 1000, 2),
                'p95_duration_ms': round(p95_duration * 1000, 2),
            }
        
        return aggregated
    
    def get_summary(self) -> Dict:
        """Get a summary of all metrics."""
        aggregated = self.get_aggregated_metrics()
        
        # Calculate totals
        total_requests = sum(m['request_count'] for m in aggregated.values())
        
        # Calculate average latency
        all_durations = []
        for key, durations in self.metrics_window.items():
            all_durations.extend(durations)
        
        avg_latency = (sum(all_durations) / len(all_durations) * 1000) if all_durations else 0
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'total_requests': total_requests,
            'avg_latency_ms': round(avg_latency, 2),
            'active_connections': active_connections._value.get(),
            'endpoints': aggregated,
        }


# Global instance
metrics_service = MetricsService()
