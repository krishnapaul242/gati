# 🎭 Gati Agent Profiles - Quick Reference

This directory contains specialized agent profiles for GitHub Copilot to assist with different aspects of the Gati framework development.

---

## 📋 Available Agents

### 1. 🏗️ [Gati Architect](./gati-architect.md)
**Use for:** System design, architecture decisions, technical planning

**Specialties:**
- Handler runtime architecture
- Versioned routing system design
- Kubernetes deployment topology
- Database schema design
- Plugin interface design

**Invoke with:** `As the Architect:`

---

### 2. 💻 [Gati Implementation Engineer](./gati-implementation-engineer.md)
**Use for:** Writing production-ready code

**Specialties:**
- Runtime components (handler-engine, route-manager, module-loader)
- CLI commands (dev, build, deploy, generate)
- Cloud provider plugins (AWS, GCP, Azure)
- Code analyzer and SDK generator

**Invoke with:** `As the Implementation Engineer:`

---

### 3. 🧪 [Gati Test Engineer](./gati-test-engineer.md)
**Use for:** Testing strategy and implementation

**Specialties:**
- Unit and integration tests
- E2E test scenarios
- Version routing tests
- Performance and load testing
- Test fixtures and mocks

**Invoke with:** `As the Test Engineer:`

---

### 4. 📝 [Gati Spec Writer](./gati-spec-writer.md)
**Use for:** Technical documentation and specifications

**Specialties:**
- Feature specifications
- API contracts and interfaces
- Behavior scenarios (Given/When/Then)
- Acceptance criteria
- Edge case documentation

**Invoke with:** `As the Spec Writer:`

---

### 5. 🔍 [Gati Code Reviewer](./gati-code-reviewer.md)
**Use for:** Code review and quality assurance

**Specialties:**
- Bug detection
- Security vulnerabilities
- Performance issues
- TypeScript best practices
- Code maintainability

**Invoke with:** `As the Code Reviewer:`

---

### 6. 🎨 [Gati DevOps Engineer](./gati-devops-engineer.md)
**Use for:** Deployment and infrastructure

**Specialties:**
- Kubernetes manifests
- Helm charts
- CI/CD pipelines (GitHub Actions)
- Multi-region deployment
- Monitoring and observability

**Invoke with:** `As the DevOps Engineer:`

---

### 7. 🐛 [Gati Debugger](./gati-debugger.md)
**Use for:** Troubleshooting and bug fixing

**Specialties:**
- Error analysis
- Root cause identification
- Performance debugging
- Deployment failure investigation
- Integration issue resolution

**Invoke with:** `As the Debugger:`

---

### 8. 📊 [Gati Product Manager](./gati-product-manager.md)
**Use for:** Feature planning and prioritization

**Specialties:**
- Milestone breakdown
- MVP definition
- User stories
- Feature prioritization
- Dependency management

**Invoke with:** `As the Product Manager:`

---

### 9. 🎨 [Gati Frontend Engineer](./gati-frontend-engineer.md)
**Use for:** Control Panel and Playground UI

**Specialties:**
- Next.js + TRPC implementation
- Topology visualization
- Dashboard creation
- API Playground interface
- TOTP authentication

**Invoke with:** `As the Frontend Engineer:`

---

### 10. 📚 [Gati Documentation Engineer](./gati-documentation-engineer.md)
**Use for:** User-facing documentation

**Specialties:**
- Getting started guides
- API reference
- Tutorials and examples
- Deployment guides
- Troubleshooting documentation

**Invoke with:** `As the Documentation Engineer:`

---

## 🔄 Recommended Workflow

### For a New Feature:

```
1. Product Manager → Define scope and priority
2. Architect → Design system approach
3. Spec Writer → Create detailed specification
4. Implementation Engineer → Build the code
5. Test Engineer → Write comprehensive tests
6. Code Reviewer → Review and suggest improvements
7. Debugger → Fix any issues
8. Documentation Engineer → Write user docs
9. DevOps Engineer → Create deployment configs (if needed)
10. Frontend Engineer → Build UI (if needed)
```

---

## 🎯 Quick Selection Guide

| Need to... | Use Agent |
|------------|-----------|
| Plan what to build | Product Manager |
| Design how it works | Architect |
| Write requirements | Spec Writer |
| Build the feature | Implementation Engineer |
| Test it | Test Engineer |
| Review code quality | Code Reviewer |
| Fix a bug | Debugger |
| Deploy it | DevOps Engineer |
| Build UI | Frontend Engineer |
| Document it | Documentation Engineer |

---

## 💡 Usage Tips

### 1. **Be Specific**
```
❌ "As the Architect: Design something"
✅ "As the Architect: Design the API versioning resolution algorithm"
```

### 2. **Provide Context**
```
✅ "As the Implementation Engineer: Implement handler-engine.ts 
    according to specs/runtime/handler-engine.md"
```

### 3. **Chain Agents**
```
✅ "As the Architect: Design the module loader.
    Then, as the Spec Writer: Document it.
    Finally, as the Implementation Engineer: Implement it."
```

### 4. **Reference Existing Work**
```
✅ "As the Code Reviewer: Review src/runtime/handler-engine.ts 
    for memory leaks and security issues"
```

---

## 📂 Project Context

These agents are tailored for the **Gati Framework** project:

- **PRD:** [ROADMAP.MD](../ROADMAP.MD)
- **Overview:** [README.MD](../README.MD)
- **Specs:** `/specs` directory (to be created)
- **Docs:** `/docs` directory (to be created)

---

## 🚀 Getting Started

1. **Choose the right agent** based on your task
2. **Prefix your request** with `As the [Agent Name]:`
3. **Provide context** (specs, files, requirements)
4. **Be specific** about what you need

---

## 📝 Example Interactions

### Example 1: New Feature
```
User: As the Product Manager: Break down "Handler Runtime" 
      into deliverable tasks

[Review tasks]

User: As the Spec Writer: Create detailed spec for handler-engine

[Review spec]

User: As the Implementation Engineer: Implement handler-engine.ts 
      according to the spec

[Test code]

User: As the Test Engineer: Create test suite for handler-engine

[Review tests]

User: As the Code Reviewer: Review the implementation
```

### Example 2: Bug Fix
```
User: As the Debugger: Handler throws "modules is undefined". 
      Stack trace: [paste]. Help fix this.

[Get diagnosis and fix]

User: As the Test Engineer: Add regression test for this bug

[Get test]

User: As the Documentation Engineer: Add this to troubleshooting guide
```

### Example 3: Deployment
```
User: As the DevOps Engineer: Create K8s manifests for Gati runtime

[Review manifests]

User: As the DevOps Engineer: Create GitHub Action for deployment

[Review workflow]

User: As the Documentation Engineer: Document deployment process
```

---

**Last Updated:** 2025-11-09  
**Created:** 2025-11-09  
**Version:** 1.0

---

**Ready to build Gati!** 🚀
