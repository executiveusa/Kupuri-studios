"""
Metrics router for exposing Prometheus metrics and dashboard data.
Endpoints:
  - GET /metrics - Prometheus metrics in text format
  - GET /api/metrics - JSON summary of metrics for dashboard
"""

from fastapi import APIRouter, Request
from fastapi.responses import Response
from services.metrics_service import metrics_service

router = APIRouter()

@router.get("/metrics", tags=["metrics"])
async def get_prometheus_metrics():
    """
    Return metrics in Prometheus text format.
    Compatible with Prometheus scraping.
    """
    metrics_text = metrics_service.get_metrics()
    return Response(content=metrics_text, media_type="text/plain; version=0.0.4")


@router.get("/api/metrics", tags=["metrics"])
async def get_metrics_json():
    """
    Return aggregated metrics as JSON for dashboard consumption.
    Includes request counts, latency, and endpoint breakdowns.
    """
    summary = metrics_service.get_summary()
    return summary


@router.get("/api/metrics/endpoints", tags=["metrics"])
async def get_endpoints_metrics():
    """
    Return detailed metrics per endpoint.
    """
    aggregated = metrics_service.get_aggregated_metrics()
    return {
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
        "endpoints": aggregated
    }
