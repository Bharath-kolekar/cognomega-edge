# Contribution Guide

## Welcome Contributors!

Thank you for your interest in contributing to Cognomega Edge. This guide will help you get started with contributing code, documentation, bug reports, and feature requests.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Types of Contributions](#types-of-contributions)
3. [Development Process](#development-process)
4. [Pull Request Process](#pull-request-process)
5. [Issue Guidelines](#issue-guidelines)
6. [Code Review Process](#code-review-process)
7. [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- ✅ Read the [README.md](../../README.md)
- ✅ Reviewed [docs/SOT/00-RULES.md](./00-RULES.md) (Non-negotiable rules)
- ✅ Set up your [development environment](./development-workflow.md)
- ✅ Familiarized yourself with the [codebase structure](./monorepo-structure.md)

### First-Time Contributors

If you're new to open source or this project:

1. **Look for "good first issue" labels** on GitHub Issues
2. **Join discussions** to understand the project better
3. **Ask questions** - we're here to help!
4. **Start small** - fix typos, improve docs, or tackle small bugs

## Types of Contributions

### 1. Code Contributions

**What we accept**:
- ✅ Bug fixes
- ✅ New features (discussed and approved first)
- ✅ Performance improvements
- ✅ Refactoring (with clear benefit)
- ✅ Test coverage improvements

**What we don't accept**:
- ❌ Changes that remove existing features (per 00-RULES.md)
- ❌ Breaking changes without migration plan
- ❌ Purely cosmetic changes without functional value
- ❌ Code that doesn't follow our standards

### 2. Documentation

**Always welcome**:
- ✅ Fixing typos or grammar
- ✅ Clarifying confusing sections
- ✅ Adding examples
- ✅ Translating documentation
- ✅ Updating outdated information

**Documentation locations**:
- Technical docs: `docs/SOT/`
- API docs: Inline JSDoc comments
- User guides: Root `README.md`
- Operations: `OPS.md`

### 3. Bug Reports

**Good bug reports include**:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Screenshots or error logs
- Minimal reproduction example

### 4. Feature Requests

**Good feature requests include**:
- Clear use case and problem statement
- Proposed solution
- Alternative solutions considered
- Impact assessment
- Willingness to implement (if applicable)

### 5. Testing

**Help improve quality**:
- Write unit tests for uncovered code
- Add integration tests
- Create E2E test scenarios
- Improve test infrastructure

## Development Process

### Step-by-Step Workflow

#### 1. Find or Create an Issue

**Before coding**:
- Check if an issue exists for your contribution
- If not, create one to discuss the approach
- Wait for approval on significant changes

**Issue template example**:
```markdown
**Problem**: Brief description

**Proposed Solution**: How to fix/implement

**Alternatives**: Other options considered

**Additional Context**: Any relevant information
```

#### 2. Fork and Clone

```powershell
# Fork repository on GitHub first

# Clone your fork
git clone https://github.com/YOUR_USERNAME/cognomega-edge.git
cd cognomega-edge

# Add upstream remote
git remote add upstream https://github.com/Bharath-kolekar/cognomega-edge.git

# Verify remotes
git remote -v
```

#### 3. Create a Branch

```powershell
# Sync with upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

**Branch naming**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions

#### 4. Make Changes

**Guidelines**:
- Follow [best practices](./best-practices.md)
- Write tests for new code
- Update documentation
- Keep commits atomic and focused
- Test locally before committing

#### 5. Commit Changes

```powershell
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(api): add user preferences endpoint"
```

**Commit message format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Maintenance

**Example**:
```
feat(frontend): add dark mode toggle

Add dark mode support with system preference detection
and manual toggle in settings. Preferences stored in
localStorage and synced with API.

Closes #123
```

#### 6. Push to Your Fork

```powershell
# Push branch to your fork
git push origin feature/your-feature-name
```

#### 7. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out PR template
5. Submit for review

## Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (fix or feature)
- [ ] Documentation update

## Related Issue(s)
Fixes #123
Relates to #456

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] Tests pass locally
- [ ] No breaking changes (or documented)
- [ ] Backward compatible
```

### PR Requirements

**Before submitting**:
- ✅ All tests pass locally
- ✅ Code lints without errors
- ✅ TypeScript compiles without errors
- ✅ Documentation updated
- ✅ Self-reviewed changes
- ✅ Commit messages follow convention

**CI checks must pass**:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests
- Build succeeds

### PR Size Guidelines

**Keep PRs manageable**:
- **Ideal**: < 300 lines changed
- **Acceptable**: 300-500 lines
- **Large**: 500-1000 lines (requires justification)
- **Too Large**: > 1000 lines (split into multiple PRs)

**For large changes**:
- Break into logical, reviewable chunks
- Submit as series of related PRs
- Explain the overall plan in first PR

### Draft PRs

**Use draft PRs for**:
- Work in progress
- Early feedback
- Experimental approaches
- Discussion before completion

**Mark as ready when**:
- All requirements met
- Tests pass
- Documentation complete
- Ready for review

## Issue Guidelines

### Reporting Bugs

**Use the bug report template**:

```markdown
**Describe the bug**
Clear description of what went wrong

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

**Include**:
- Error messages (full stack trace)
- Console logs
- Network errors
- Minimal reproduction
- Relevant configuration

### Requesting Features

**Use the feature request template**:

```markdown
**Is your feature request related to a problem?**
Describe the problem: "I'm frustrated when..."

**Describe the solution you'd like**
Clear description of desired functionality

**Describe alternatives you've considered**
Other approaches you've thought about

**Additional context**
Mockups, examples, use cases

**Are you willing to implement this?**
[ ] Yes
[ ] No
[ ] With guidance
```

**Good feature requests**:
- Solve a real problem
- Align with project goals
- Don't duplicate existing features
- Are well-scoped and specific

### Issue Labels

**Priority**:
- `priority:critical` - Breaks production
- `priority:high` - Important but not critical
- `priority:medium` - Normal priority
- `priority:low` - Nice to have

**Type**:
- `type:bug` - Something broken
- `type:feature` - New functionality
- `type:docs` - Documentation
- `type:question` - Question/discussion
- `type:drift` - Configuration/code drift

**Status**:
- `status:needs-triage` - Needs review
- `status:blocked` - Blocked by external factor
- `status:in-progress` - Being worked on
- `status:review` - Under review

**Difficulty**:
- `good first issue` - Great for newcomers
- `help wanted` - Community help needed
- `difficult` - Complex issue

## Code Review Process

### Timeline

- **Initial response**: Within 2-3 business days
- **Full review**: Within 1 week
- **Follow-up reviews**: Within 2-3 business days

### Review Criteria

**Reviewers check**:
1. **Functionality**: Does it work as intended?
2. **Code quality**: Follows best practices?
3. **Tests**: Adequate test coverage?
4. **Documentation**: Updated and clear?
5. **Performance**: No regressions?
6. **Security**: No vulnerabilities introduced?
7. **Compatibility**: Backward compatible?

### Review Feedback

**Feedback types**:
- **Must fix**: Blocking issues that must be addressed
- **Should fix**: Important but not blocking
- **Consider**: Suggestions for improvement
- **Question**: Seeking clarification
- **Praise**: Recognition of good work

**Responding to feedback**:
- Be professional and respectful
- Ask for clarification if needed
- Explain your decisions
- Be open to suggestions
- Update code based on feedback
- Mark conversations as resolved

### Approval Process

**Approval requirements**:
- At least 1 maintainer approval
- All CI checks pass
- No unresolved conversations
- No merge conflicts

**After approval**:
- Maintainer will merge (or author if trusted)
- Branch will be deleted
- Issue will be closed (if linked)

## Community Guidelines

### Code of Conduct

**We are committed to**:
- Welcoming and inclusive environment
- Respectful communication
- Constructive feedback
- Harassment-free experience

**Expected behavior**:
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

**Unacceptable behavior**:
- Harassment or discrimination
- Trolling or inflammatory comments
- Personal or political attacks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

### Communication Channels

**GitHub Issues**: Bug reports, feature requests, discussions  
**Pull Requests**: Code contributions and reviews  
**GitHub Discussions**: General questions and community chat

### Getting Help

**Need help?**
1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Create a new issue with `type:question` label

**When asking**:
- Be specific about your question
- Include relevant context
- Show what you've tried
- Be patient and respectful

## Recognition

### Contributors

All contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Credited in relevant documentation

### Maintainers

Outstanding contributors may be invited to become maintainers with:
- Commit access
- Review privileges
- Decision-making input

## Legal

### Licensing

By contributing, you agree that your contributions will be licensed under the same license as the project.

### Contributor License Agreement

- You have the right to submit the contribution
- You grant us a perpetual, worldwide license to use your contribution
- You retain copyright to your contribution

## Additional Resources

- [Development Workflow](./development-workflow.md)
- [Best Practices](./best-practices.md)
- [CI/CD Pipeline](./ci-cd.md)
- [Monorepo Structure](./monorepo-structure.md)

## Questions?

Don't hesitate to ask! Open an issue with the `type:question` label and we'll help you get started.

---

**Thank you for contributing to Cognomega Edge!** 🎉

*We appreciate your time and effort in making this project better.*
