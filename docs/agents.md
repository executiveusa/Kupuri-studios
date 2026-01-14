# Kupuri Studios Agent Capability Matrix

## Overview

This document defines all AI agents in the Kupuri Studios system, their capabilities, and interaction patterns.

---

## 🎯 Agent Roster

### 1. Supervisor Agent
**ID:** `supervisor-001`  
**Role:** Orchestrator  
**Model:** claude-sonnet-4-20250514  
**Temperature:** 0.3

#### Capabilities
| Capability | Description | Input | Output |
|------------|-------------|-------|--------|
| `task_routing` | Route tasks to specialists | task description | agent role, reasoning |
| `task_decomposition` | Break complex tasks | complex task | array of subtasks |

#### Routing Logic
```
IF task.type == "lead" → Lead Qualifier Agent
IF task.type == "content" → Content Creator Agent
IF task.type == "support" → Customer Support Agent
IF task.type == "analysis" → Analyst Agent
ELSE → Handle directly or escalate
```

---

### 2. Lead Qualifier Agent
**ID:** `lead-qualifier-001`  
**Role:** Lead Qualification  
**Model:** claude-sonnet-4-20250514  
**Temperature:** 0.5

#### Capabilities
| Capability | Description | Input | Output |
|------------|-------------|-------|--------|
| `lead_scoring` | Score lead quality | lead object | score (0-100), quality tier, next action |
| `intent_detection` | Detect purchase intent | message | intent level, signals |

#### Scoring Criteria (BANT Framework)
- **Budget:** Has financial capacity (0-25 points)
- **Authority:** Decision maker (0-25 points)
- **Need:** Clear problem to solve (0-25 points)
- **Timeline:** Ready to act (0-25 points)

#### Quality Tiers
- **Hot (70-100):** Immediate follow-up required
- **Warm (40-69):** Nurture sequence
- **Cold (20-39):** Long-term nurture
- **Unqualified (<20):** Marketing automation only

---

### 3. Content Creator Agent
**ID:** `content-creator-001`  
**Role:** Content Generation  
**Model:** claude-sonnet-4-20250514  
**Temperature:** 0.8

#### Capabilities
| Capability | Description | Input | Output |
|------------|-------------|-------|--------|
| `landing_page_copy` | Landing page content | niche, business name | headline, subheadline, body, CTA |
| `social_post` | Social media content | platform, topic | post text, hashtags |
| `email_sequence` | Email campaign | goal, audience | subject lines, body content |
| `ad_copy` | Advertising copy | platform, objective | ad variations |

#### Supported Languages
- English (en)
- Spanish (es-MX)
- Chinese (zh-CN)

#### Brand Voice Guidelines
- Professional yet approachable
- Confident but not arrogant
- Action-oriented
- Culturally sensitive per market

---

### 4. Customer Support Agent
**ID:** `support-agent-001`  
**Role:** Customer Service  
**Model:** claude-sonnet-4-20250514  
**Temperature:** 0.4

#### Capabilities
| Capability | Description | Input | Output |
|------------|-------------|-------|--------|
| `ticket_response` | Respond to tickets | ticket object | response, should_escalate |
| `faq_answer` | Answer FAQs | question | answer, confidence |
| `sentiment_analysis` | Detect customer mood | message | sentiment, urgency |

#### Escalation Rules
- Profanity detected → Human review
- Legal mention → Legal team
- Refund >$100 → Manager approval
- Technical issue → Dev team
- 3+ back-and-forth → Human takeover

#### Response Templates
- Greeting: Acknowledge + empathy
- Solution: Clear steps
- Closing: Confirmation + follow-up offer

---

## 🔄 Agent Interaction Patterns

### Sequential Handoff
```
User Message → Supervisor → Specialist → Response
```

### Parallel Processing
```
Complex Task → Supervisor → [Agent A, Agent B, Agent C] → Aggregate → Response
```

### Escalation Chain
```
Support Agent → (can't resolve) → Supervisor → Human Agent
```

---

## 📊 Performance Metrics

### Agent SLAs
| Agent | Response Time | Resolution Rate | CSAT Target |
|-------|---------------|-----------------|-------------|
| Lead Qualifier | <30s | 95% | N/A |
| Content Creator | <2min | 90% | N/A |
| Customer Support | <1min | 85% | 4.5/5 |
| Supervisor | <10s | 99% | N/A |

### Health Checks
- Heartbeat: Every 30 seconds
- Load check: Before task assignment
- Error threshold: 3 failures → offline status

---

## 🛠 Adding New Agents

### 1. Define Configuration
```python
config = AgentConfig(
    agent_id="new-agent-001",
    name="New Agent",
    role=AgentRole.CUSTOM,
    description="What this agent does",
    model="claude-sonnet-4-20250514",
    system_prompt="Agent instructions..."
)
```

### 2. Create Capabilities
```python
capabilities=[
    AgentCapability(
        name="capability_name",
        description="What it does",
        input_schema={"field": "type"},
        output_schema={"result": "type"}
    )
]
```

### 3. Register Agent
```python
agent = Agent(config)
registry.register(agent)
```

### 4. Update Supervisor Routing
Add new role to supervisor's routing logic.

---

## 🔐 Security & Permissions

### Agent Access Levels
| Agent | Customer Data | Financial Data | Admin Actions |
|-------|---------------|----------------|---------------|
| Supervisor | Read | None | Task routing |
| Lead Qualifier | Read | None | None |
| Content Creator | Read | None | None |
| Support Agent | Read/Write | Read | Escalation |

### Audit Logging
All agent actions are logged with:
- Timestamp
- Agent ID
- Action type
- Input/Output summary
- Outcome

---

## 📚 Training & Updates

### Model Updates
- Review performance monthly
- A/B test new prompts
- Update system prompts quarterly

### Capability Expansion
- Document new capabilities
- Test in staging
- Deploy with feature flag
- Monitor for 7 days before full rollout

---

*Last Updated: 2026-01-12*
*Version: 1.0.0*
