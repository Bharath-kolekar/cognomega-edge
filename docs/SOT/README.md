# Source of Truth (SOT) Documentation

Welcome to the Cognomega Edge Source of Truth documentation suite. This directory contains comprehensive, living documentation for the entire monorepo.

## 📚 Documentation Index

### Core Documentation

1. **[Monorepo Structure](./monorepo-structure.md)**
   - Directory layout and organization
   - Package structure and dependencies
   - File organization principles

2. **[Microservices & Agents](./microservices.md)**
   - AI engines and intelligence layers
   - Specialized agents and their roles
   - Service architecture and communication

3. **[Builder Service](./builder.md)**
   - UI builder architecture
   - Deployment and hosting
   - Integration with AI systems

4. **[Development Workflow](./development-workflow.md)**
   - Setting up development environment
   - Contribution guidelines
   - Adding new packages/services
   - Branching strategy

5. **[CI/CD Pipeline](./ci-cd.md)**
   - Build and test processes
   - Deployment pipelines
   - Cloudflare Pages deployment
   - GitHub Actions workflows

6. **[Best Practices](./best-practices.md)**
   - Coding standards
   - Testing guidelines
   - Security best practices
   - Performance optimization

7. **[Contribution Guide](./contribution-guide.md)**
   - How to contribute
   - Pull request process
   - Issue guidelines
   - Code review standards

8. **[Migration History](./migration-history.md)**
   - Major refactoring decisions
   - Migration rationale
   - Breaking changes log
   - Upgrade paths

### Existing Canonical Documents

The following documents at the root level are also part of the Source of Truth:

- **[README.md](../../README.md)** - Product overview, quickstart, commands
- **[OPS.md](../../OPS.md)** - Operations runbook, deploy, rollback, secrets
- **[00-RULES.md](./00-RULES.md)** - Non-negotiable operating rules

## 🎯 Purpose

This SOT documentation suite serves as:

- **Single source of truth** for all architectural and operational decisions
- **Onboarding resource** for new contributors
- **Reference guide** for existing team members
- **Historical record** of major changes and migrations

## 📝 Documentation Principles

1. **Accuracy**: All documentation reflects the current state of the codebase
2. **Completeness**: Cover all aspects of the system comprehensively
3. **Maintainability**: Keep docs up-to-date with code changes
4. **Clarity**: Write for both technical and non-technical audiences
5. **Searchability**: Use consistent terminology and cross-references

## 🔄 Keeping Documentation Updated

When making changes to the codebase:

1. ✅ Update relevant SOT documents
2. ✅ Add entries to migration-history.md for breaking changes
3. ✅ Review and update cross-references
4. ✅ Ensure code and docs remain in sync

## 🚀 Quick Links

- **Architecture Overview**: See [MULTI_AGENT_ARCHITECTURE.md](../../MULTI_AGENT_ARCHITECTURE.md)
- **Implementation Status**: See [IMPLEMENTATION_COMPLETE.md](../../IMPLEMENTATION_COMPLETE.md)
- **Super Intelligence**: See [SIPlaybook.md](../../SIPlaybook.md)
- **Changelog**: See [CHANGELOG.md](../../CHANGELOG.md)

## 📞 Support

For documentation issues:
- Open a GitHub issue labeled `type:documentation`
- Include the document name and section
- Suggest improvements or corrections

---

*Last Updated: 2025-01-30*
*Maintained by: Cognomega Team*
