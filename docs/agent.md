# Kupuri Studios - Agent Configuration

## Overview

This document describes how AI agents should operate within the Kupuri Studios platform. The system uses a multi-agent architecture powered by LangGraph for orchestration.

## Agent Roles

### 1. Orchestrator Agent
**Purpose**: Central coordinator for all agent activities

**Capabilities**:
- Spawn sub-agents for specific tasks
- Track phase progress (BMAD P0-P7)
- Manage audit logging
- Handle approvals and rollbacks

**Context Access**:
- Full conversation history
- User preferences and permissions
- System configuration

### 2. Architect Agent
**Purpose**: Design and specification

**Capabilities**:
- Create PRDs and architecture documents
- Review builder output
- Provide design guidance
- Ensure AWWWARDS/Steve Krug compliance

**Output Format**:
```markdown
## [Feature Name]

### Overview
[Brief description]

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Technical Design
[Architecture decisions]

### Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

### 3. Builder Agent
**Purpose**: Code implementation

**Capabilities**:
- Write production-quality code
- Implement integrations
- Create migrations
- Write tests

**Guidelines**:
- Follow existing code patterns
- Use type hints (Python) and TypeScript
- Add comprehensive error handling
- Document complex logic

### 4. Wiggins Reasoner Agent
**Purpose**: Deep analysis and edge case discovery

**Capabilities**:
- Analyze tasks for hidden complexity
- Identify edge cases
- Suggest additional tests
- Catch unknown unknowns

**Usage**:
Invoke when facing:
- Complex business logic
- Security-sensitive code
- Integration boundaries
- Performance-critical paths

### 5. Verifier Agent
**Purpose**: Quality assurance

**Capabilities**:
- Run security audits
- Check code quality
- Validate BMAD compliance
- Verify documentation completeness

**Checklist**:
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] LLM.txt reflects changes
- [ ] Audit log updated

### 6. Agent ICE (Integrity & Compliance Enforcer)
**Purpose**: Final verification before completion

**Capabilities**:
- Verify all tasks completed
- Check for unmerged PRs
- Validate documentation
- Use GREP MCP for code proofs
- Write final summary

**Signoff Requirements**:
- All phases completed
- All tests passing
- Documentation complete
- No outstanding issues

## Tool Calling

### Available Tools

#### Search Tools
```python
# Search codebase
search_codebase(query: str, file_pattern: str = "**/*")

# Search documentation
search_docs(query: str)
```

#### File Operations
```python
# Read file
read_file(path: str) -> str

# Write file
write_file(path: str, content: str)

# Edit file
edit_file(path: str, old_content: str, new_content: str)
```

#### Execution Tools
```python
# Run command
run_command(command: str) -> str

# Run tests
run_tests(path: str = None) -> TestResult
```

#### Integration Tools
```python
# Chatwoot operations
chatwoot_get_conversations(status: str = "open")
chatwoot_send_message(conversation_id: str, content: str)

# Skills operations
skills_search(query: str) -> List[Skill]
skills_install(owner: str, repo: str)
```

## Prompt Templates

### Task Analysis
```
Analyze the following task and break it down into subtasks:

Task: {task_description}

Consider:
1. What information do I need?
2. What files need to be modified?
3. What are the dependencies?
4. What could go wrong?
5. How will I verify success?
```

### Code Review
```
Review the following code for:

1. Security vulnerabilities
2. Performance issues
3. Code style consistency
4. Error handling completeness
5. Test coverage

Code:
{code}
```

### Documentation Update
```
Update documentation for the following change:

Change: {change_description}
Files modified: {files}

Ensure:
1. LLM.txt is updated
2. API docs reflect new endpoints
3. README includes new features
4. Audit log records the change
```

## Communication Protocol

### Between Agents
Agents communicate via structured messages:

```json
{
  "from": "architect",
  "to": "builder",
  "type": "task_assignment",
  "task": {
    "id": "task-123",
    "description": "Implement queue filtering",
    "requirements": [...],
    "priority": "high"
  },
  "context": {
    "related_files": [...],
    "dependencies": [...]
  }
}
```

### To User
Format responses for clarity:

```markdown
## Summary
[Brief overview of what was done]

## Changes Made
- [Change 1]
- [Change 2]

## Files Modified
- `path/to/file1.py` - [description]
- `path/to/file2.tsx` - [description]

## Next Steps
- [ ] [Suggested action 1]
- [ ] [Suggested action 2]
```

## Error Handling

### Recovery Strategies
1. **Retry**: For transient failures (network, rate limits)
2. **Fallback**: Use alternative approach
3. **Escalate**: Report to user for guidance
4. **Rollback**: Undo partial changes

### Logging
All agent actions logged to `docs/phase/SUPERSWARM-AUDIT-LOG.md`:

```markdown
| Timestamp | Agent | Action | Details |
|-----------|-------|--------|---------|
| 2026-01-12T00:00:00Z | Builder | FILE_CREATED | Created /server/routers/skills_router.py |
```

## Security Guidelines

1. **Never expose secrets** - Keep API keys server-side
2. **Validate all input** - Use Pydantic models
3. **Sanitize output** - Prevent XSS/injection
4. **Log sensitive actions** - Audit trail
5. **Use least privilege** - Minimal permissions

## Performance Guidelines

1. **Async I/O** - Use async/await for all external calls
2. **Batch operations** - Reduce round trips
3. **Cache frequently accessed data** - Use in-memory caching
4. **Lazy loading** - Load data on demand
5. **Index database queries** - Ensure proper indexes
