# 🤖 AI Agent Guide for Gati Project

This guide helps AI coding agents understand how to work effectively with the Gati project.

---

## 📚 Essential Documents

Before starting any work, familiarize yourself with these documents in order:

1. **[README.md](../README.MD)** - Project overview and vision
2. **[Gati_PRD.md](../Gati_PRD.md)** - Product requirements and architecture
3. **[MILESTONES.md](../MILESTONES.md)** - Detailed milestone breakdown (THIS IS KEY)
4. **[ROADMAP.md](../ROADMAP.MD)** - High-level timeline

---

## 🎯 How to Use MILESTONES.md

### Understanding the Structure

`MILESTONES.md` is the **single source of truth** for project execution. It contains:

- **Milestone Overview Table**: Quick status of all milestones
- **Detailed Milestone Sections**: Each milestone (M1-M7) with deliverables
- **Checkboxes**: Track completion status (use `[x]` for completed)
- **File Paths**: Exact locations where code should be created
- **Dependencies**: What must be completed before starting
- **Success Criteria**: Measurable goals for milestone completion

### When Starting Work

1. **Read the relevant milestone section completely**
2. **Check dependencies** - Ensure prerequisites are met
3. **Review "Files to Create"** - Know what you're building
4. **Understand success criteria** - Know when you're done
5. **Check for blockers** - Address any known issues

### Updating Progress

Always update `MILESTONES.md` when:

- ✅ Completing a deliverable checkbox: `- [x]`
- 📊 Changing milestone status in overview table
- 🔴 Identifying blockers
- 📈 Updating completion percentages
- 📝 Adding to change log

### Example Workflow

```markdown
Before:
- [ ] Handler execution pipeline implementation

After completing work:
- [x] Handler execution pipeline implementation
  - [x] Request/response objects (req, res)
  - [x] Global context manager (gctx)
  - [x] Local context manager (lctx)
```

---

## 🗺️ Project Navigation

### Current Project Structure

```
/gati
├── README.MD                 # Project overview
├── ROADMAP.MD               # High-level roadmap
├── MILESTONES.md            # Detailed milestone tracking (USE THIS!)
├── .github/
│   └── AI_AGENT_GUIDE.md   # This file
└── (other files to be created per milestones)
```

### Where to Create Files

**Always follow the file paths in MILESTONES.md**. For example:

- **Runtime code**: `src/runtime/`
- **CLI commands**: `src/cli/commands/`
- **Cloud plugins**: `src/plugins/`
- **Packages**: `packages/@gati/`
- **Documentation**: `docs/`
- **Examples**: `examples/`
- **Tests**: `tests/`

---

## 🔍 Finding What to Work On

### Priority Order

1. **P0 (Critical)**: Must be completed on schedule
   - M1, M2, M3, M5 are P0
2. **P1 (High)**: Important but can be delayed
   - M4, M6, M7 are P1
3. **P2 (Medium)**: Nice to have

### Current Focus (as of 2025-11-09)

**Milestone 1 is in progress (15% complete)**

Highest priority deliverables:
1. M1.1: Handler & Module Runtime Engine
2. M1.2: CLI Foundation
3. M1.3: Project Structure & Boilerplate

---

## ✅ Task Completion Guidelines

### Marking Tasks Complete

Only mark a task complete when:

- ✅ Code is written and tested
- ✅ Files are created in correct locations
- ✅ Basic tests pass
- ✅ Documentation is updated (if applicable)

### DO NOT mark complete if:

- ❌ Only partially implemented
- ❌ Has known bugs
- ❌ Missing error handling
- ❌ No tests at all

### Updating Completion Percentages

Calculate based on checkboxes:
```
Completion % = (Completed checkboxes / Total checkboxes) × 100
```

---

## 🏗️ Implementation Patterns

### For Handlers

```typescript
// Location: src/runtime/handlers/example.ts
export const route = 'POST /resource/:id';

export async function handler(req, res, gctx, lctx) {
  // Business logic only
  // Use gctx for modules, effects, db
  // Use lctx for request-scoped data
}
```

### For Modules

```typescript
// Location: src/runtime/modules/example.ts
export class ExampleModule {
  constructor(private db: Database) {}
  
  async doSomething() {
    // Stateless, reusable logic
  }
}
```

### For CLI Commands

```typescript
// Location: src/cli/commands/example.ts
export async function exampleCommand(args: Args) {
  // Command implementation
  // Use logging, validation, error handling
}
```

---

## 📊 Tracking Dependencies

### Understanding Dependency Chain

```
M1 (Foundation)
  ↓
M2 (Deployment) + M3 (Versioning)
  ↓
M4 (Control Panel) + M5 (SDK Generation)
  ↓
M6 (CDN) + M7 (Effects)
```

**Rule**: Never start a milestone before its dependencies are complete.

### Inter-Deliverable Dependencies

Within a milestone, some deliverables depend on others:

Example from M1:
- 1.4 (Documentation) depends on 1.1, 1.2, 1.3
- Complete foundation before documentation

---

## 🧪 Testing Requirements

### Test Coverage Targets

- **Unit tests**: >80% coverage
- **Integration tests**: All major workflows
- **E2E tests**: Critical user paths

### Test Locations

```
tests/
├── unit/           # Unit tests mirroring src/
├── integration/    # Cross-component tests
└── e2e/           # End-to-end scenarios
```

### When to Write Tests

- **During development**: Write tests alongside code
- **Before marking complete**: Ensure tests exist
- **After bugs**: Add regression tests

---

## 📝 Documentation Standards

### Code Comments

```typescript
/**
 * Brief description of function
 * 
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @returns Promise resolving to response
 */
```

### Documentation Files

Every major feature needs:
- **User guide**: How to use it
- **API reference**: Technical details
- **Examples**: Code samples

Location: `docs/` as specified in milestones

---

## 🚨 When to Report Blockers

Report blockers immediately when you encounter:

- **Missing dependencies**: External services not available
- **Technical impossibility**: Approach won't work
- **Scope ambiguity**: Requirements unclear
- **Resource constraints**: Need external resources

### How to Report

Update `MILESTONES.md`:

```markdown
### Blockers
- [2025-11-09] Cannot implement X because Y is not defined
- Need clarification on Z before proceeding
```

---

## 🔄 Change Log Updates

After completing significant work, update the change log in `MILESTONES.md`:

```markdown
| Date | Milestone | Change | Author |
|------|-----------|--------|--------|
| 2025-11-09 | M1 | Completed handler runtime engine | AI Agent |
```

---

## 💡 Best Practices for AI Agents

### DO:

✅ Read milestone documentation before coding  
✅ Follow exact file paths from MILESTONES.md  
✅ Update checkboxes as you complete work  
✅ Create tests alongside implementation  
✅ Ask for clarification when requirements are ambiguous  
✅ Reference PRD for architectural decisions  
✅ Keep changes focused on one deliverable at a time  
✅ Update completion percentages regularly  

### DON'T:

❌ Start coding without reading milestone docs  
❌ Create files in random locations  
❌ Mark tasks complete without tests  
❌ Skip documentation  
❌ Work on multiple milestones simultaneously  
❌ Ignore dependencies  
❌ Assume implementation details not in docs  
❌ Create features not in milestones  

---

## 🎯 Quick Reference Commands

### Check Current Status
```bash
# View milestone overview
cat MILESTONES.md | grep "M1:"

# Check completion percentage
cat MILESTONES.md | grep "Completion %"
```

### Find What to Work On
```bash
# Find incomplete tasks in M1
cat MILESTONES.md | grep -A 100 "M1:" | grep "- \[ \]"
```

### Update Task Status
```bash
# Use your preferred editor to update MILESTONES.md
# Change [ ] to [x] for completed tasks
```

---

## 🔗 Quick Links

- [Milestone Tracking](../MILESTONES.md) - **START HERE**
- [Project README](../README.MD)
- [Product Requirements](../Gati_PRD.md)
- [Roadmap](../ROADMAP.MD)

---

## 📞 When You Need Help

If you encounter issues:

1. **Check MILESTONES.md** for clarification
2. **Review Gati_PRD.md** for architecture decisions
3. **Look for similar implementations** in existing code
4. **Report blockers** in MILESTONES.md
5. **Ask specific questions** with context

---

**Remember**: The goal is to build Gati systematically, one milestone at a time, with high quality and complete documentation. Use MILESTONES.md as your guide, and update it religiously!

🚀 **Happy coding!**
