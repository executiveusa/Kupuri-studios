# PRD: Kupuri Studios Internal AI OS Dashboard

**Document Version**: 1.0.0
**Last Updated**: 2026-01-12
**Author**: ARCHITECT Agent (BMAD Super Swarm Protocol)
**Status**: APPROVED - P1 Complete

---

## 1. Executive Summary

### 1.1 Purpose
This PRD defines the requirements for an **internal-only admin/operator dashboard** for Kupuri Studios. The dashboard provides a unified workspace for operators to manage AI-powered customer conversations, leveraging Chatwoot as the backend communications layer while presenting a **Sprinklr-familiar** workflow experience.

### 1.2 Key Objectives
1. **Unified Operator Workspace**: Single-pane-of-glass for all conversation management
2. **Chatwoot Integration**: Wrap Chatwoot's API/WebSocket for data, custom UI for presentation
3. **Sprinklr-Familiar UX**: Adopt workflow patterns (queue views, case management, macros) - NOT visual clone
4. **Steve Krug Principles**: "Don't make me think" - minimize cognitive load at every interaction
5. **Design System Alignment**: Maintain existing glassmorphism, dark theme, Framer Motion animations

### 1.3 Success Criteria
- Reduce average handle time (AHT) by 25%
- First response time < 30 seconds for AI-assisted conversations
- Operator satisfaction score > 4.5/5
- Zero context switches required for standard workflows

---

## 2. Product Vision & Goals

### 2.1 Vision Statement
> "Empower operators with AI-augmented superpowers to deliver exceptional customer experiences through an intuitive, unified workspace."

### 2.2 Strategic Goals

| Goal | Description | Metric |
|------|-------------|--------|
| **Efficiency** | Reduce time-to-resolution | 30% improvement in resolution time |
| **Consistency** | Standardize operator responses | 90% macro utilization rate |
| **Visibility** | Real-time performance insights | Dashboard latency < 100ms |
| **Scalability** | Support team growth | 50+ concurrent operators |

### 2.3 Non-Goals (Explicit Exclusions)
- External/customer-facing interfaces (internal-only)
- Multi-tenant architecture (single organization)
- Mobile-native applications (desktop-first)
- Direct Chatwoot UI embedding (custom UI layer)

---

## 3. User Personas

### 3.1 Operator (Primary User)
- **Name**: Sofia Martinez
- **Role**: Customer Success Agent
- **Goals**: Handle conversations quickly, access customer context, use pre-built responses
- **Pain Points**: Context switching, searching for history, typing repetitive responses

### 3.2 Supervisor
- **Name**: Marcus Chen
- **Role**: Team Lead
- **Goals**: Monitor team performance, reassign conversations, identify training opportunities
- **Pain Points**: Lack of real-time visibility, manual routing, delayed reporting

### 3.3 Admin
- **Name**: Dr. Raj Patel
- **Role**: Operations Director
- **Goals**: Configure system settings, define SLA policies, manage user access

---

## 4. Feature Requirements

### 4.1 Queue Management (P0 - Critical)
- Unified inbox for all conversations
- Real-time updates via WebSocket
- Filtering by status (Open, Pending, Resolved, Snoozed)
- Search by customer name, email, message content
- Queue views: My Queue, Team Queue, Escalated, All

### 4.2 Case Management (P0 - Critical)
- Case lifecycle: New → Open → Pending → Resolved → Closed
- Assignment tracking (who, when, by whom)
- Resolution tracking with outcome documentation
- Full audit trail of all actions

### 4.3 Routing Engine (P1 - High)
- Round-robin assignment
- Skills-based routing
- Capacity-based routing
- Priority routing for premium customers

### 4.4 Macros System (P0 - Critical)
- Searchable macro library
- Keyboard shortcuts for quick insertion
- Variable substitution ({{customer_name}}, {{order_id}})
- Category organization

### 4.5 SLA Timers (P0 - Critical)
- First response SLA configuration
- Resolution SLA configuration
- Tier-based SLA policies
- Business hours consideration
- Visual countdown timers with color coding
- Breach alerts at 15m, 5m, and at breach

### 4.6 Analytics Dashboard (P1 - High)
- Operator metrics (cases handled, AHT, FRT, SLA compliance)
- Team performance leaderboard
- Queue depth chart
- Volume trends and topic distribution

### 4.7 Agent Workspace (P0 - Critical)
- Three-panel layout: Queue + Conversation + Context
- Resizable and collapsible panels
- Full keyboard navigation support

### 4.8 Customer Context (P1 - High)
- 360-degree customer view
- Basic info, tier status, account age
- Past conversations and order history
- Activity timeline

---

## 5. Technical Architecture

### 5.1 Architecture Overview
```
CLIENT (React 19 + TanStack Router + Zustand)
    ↓
BFF LAYER (FastAPI)
    ↓
SERVICE LAYER (ChatwootClient, RoutingEngine, SLAMonitor, MacrosService)
    ↓
EXTERNAL (Chatwoot REST/WS, SQLite, AI Services)
```

### 5.2 Chatwoot Integration Pattern
- ChatwootClient wraps API and normalizes data
- ChatwootWebSocketBridge re-broadcasts events to dashboard clients
- All secrets remain server-side

### 5.3 New API Endpoints
See `/server/routers/bff_router.py` and `/server/routers/chatwoot_router.py`

---

## 6. Database Schema Extensions

### New Tables
- `operators` - Operator profiles with roles, skills, Chatwoot agent ID
- `macros` - Macro templates with categories and shortcuts
- `routing_rules` - Auto-assignment rules
- `sla_policies` - SLA targets by tier
- `sla_events` - SLA tracking for reporting
- `case_assignments` - Assignment history

---

## 7. UI/UX Design Specifications

### Design System Alignment
- Background: `slate-950` (#020617)
- Card Background: `slate-900/80` with backdrop-blur
- Border: `slate-700/50`
- Text Primary: `slate-50`
- Text Secondary: `slate-400`
- Accent Gradient: `indigo-400 → purple-400 → pink-400`
- Animations: Framer Motion, 0.3-0.6s duration

---

## 8. Success Metrics

### KPIs
| Metric | Target |
|--------|--------|
| First Response Time | < 30 seconds |
| Average Handle Time | < 10 minutes |
| SLA Compliance | > 95% |
| Macro Usage Rate | > 60% |

### Technical Metrics
| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| WebSocket Latency | < 100ms |
| API Response Time | < 200ms |
| Uptime | 99.9% |

---

## 9. Implementation Phases

- **Phase 1**: Foundation - Database schema, Chatwoot client, BFF routes
- **Phase 2**: Core UI - Queue panel, Conversation view, Context panel
- **Phase 3**: Productivity - Macros, SLA timers, Keyboard shortcuts
- **Phase 4**: Analytics & Polish - Dashboards, Performance optimization

---

**Document Status**: APPROVED
**Approved By**: Orchestrator Agent
**Approval Date**: 2026-01-12
