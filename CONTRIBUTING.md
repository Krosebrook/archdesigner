# Contributing to ArchDesigner

Thank you for your interest in contributing to ArchDesigner! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Deno** v1.40 or higher (for backend development)
- **Git** for version control
- **Base44 Account** (sign up at [base44.com](https://base44.com))

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/archdesigner.git
   cd archdesigner
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Krosebrook/archdesigner.git
   ```

### Install Dependencies

```bash
npm install
```

### Set Up Environment

```bash
cp .env.example .env
# Edit .env with your Base44 credentials
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see the app running.

---

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add/update tests as needed
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type check (for TypeScript files)
npm run typecheck

# Run tests (when available)
npm run test
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add new feature"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, build, etc.)
- `ci:` - CI/CD changes

**Examples:**
```bash
git commit -m "feat: add real-time collaboration"
git commit -m "fix: resolve service deletion bug"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify authentication logic"
```

### 5. Keep Your Branch Updated

Regularly sync with the upstream repository:

```bash
git fetch upstream
git rebase upstream/main
```

If conflicts arise, resolve them and continue:

```bash
# Resolve conflicts in your editor
git add .
git rebase --continue
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template
5. Submit the PR

---

## Coding Standards

### JavaScript/JSX

**File Structure:**
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// 2. Constants
const MAX_RETRIES = 3;

// 3. Helper functions
function calculateScore(data) {
  // ...
}

// 4. Component
export default function MyComponent({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(null);
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* Content */}
    </div>
  );
}
```

**Naming Conventions:**
- **Components**: PascalCase (`MyComponent`)
- **Functions**: camelCase (`calculateScore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: PascalCase for components (`MyComponent.jsx`), camelCase for utilities (`utils.js`)

**Component Guidelines:**
- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Extract complex logic into custom hooks
- Use prop destructuring
- Add PropTypes or TypeScript types

**Example:**
```javascript
// Good
export default function ProjectCard({ project, onDelete }) {
  const handleDelete = () => onDelete(project.id);
  
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

// Avoid
export default function ProjectCard(props) {
  return (
    <div className="project-card">
      <h3>{props.project.name}</h3>
      <button onClick={() => props.onDelete(props.project.id)}>Delete</button>
    </div>
  );
}
```

### TypeScript (Backend)

**Type Definitions:**
```typescript
// Define interfaces for data structures
interface Project {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}

// Use types for function parameters
function analyzeProject(project: Project): AnalysisResult {
  // ...
}
```

**Function Structure:**
```typescript
// 1. Imports
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// 2. Type definitions
interface RequestBody {
  project_id: string;
}

// 3. Helper functions
function validateInput(body: RequestBody): boolean {
  // ...
}

// 4. Main handler
Deno.serve(async (req) => {
  // Handler logic
});
```

### CSS/Styling

**Tailwind CSS:**
- Use utility classes for styling
- Extract repeated patterns into components
- Use `@apply` sparingly (prefer composition)

```jsx
// Good
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Title</h2>
</div>

// For repeated patterns, create a component
const Card = ({ children }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    {children}
  </div>
);
```

### ESLint Rules

The project uses ESLint for code quality. Key rules:

- **No unused variables**: Remove unused imports and variables
- **No console.log**: Use proper logging (except in development)
- **Consistent quotes**: Use single quotes
- **Semicolons**: Required
- **Arrow functions**: Prefer arrow functions for callbacks

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

---

## Testing Guidelines

### Test Structure (When Available)

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interactions', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('handles error states', () => {
    render(<MyComponent error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
```

### Testing Best Practices

1. **Write tests for all new features**
2. **Test user interactions, not implementation details**
3. **Use descriptive test names**
4. **Mock external dependencies**
5. **Test edge cases and error states**
6. **Aim for >80% code coverage**

### Test Types

**Unit Tests:**
- Test individual functions and components
- Fast execution
- Isolated from dependencies

**Integration Tests:**
- Test component interactions
- Test API integration
- Verify data flow

**E2E Tests:**
- Test complete user flows
- Test critical paths
- Verify production-like scenarios

---

## Documentation

### Code Documentation

**JSDoc Comments:**
```javascript
/**
 * Calculates the health score for a project
 * @param {Object} project - The project object
 * @param {Array} services - Array of services
 * @returns {number} Health score from 0-100
 */
function calculateHealthScore(project, services) {
  // Implementation
}
```

**TypeScript Comments:**
```typescript
/**
 * Analyzes architecture and provides recommendations
 * @param projectId - Unique project identifier
 * @returns Promise resolving to analysis results
 */
async function analyzeArchitecture(projectId: string): Promise<AnalysisResult> {
  // Implementation
}
```

### Documentation Files

When updating documentation:
- Keep README.md up-to-date
- Update CHANGELOG.md for version changes
- Add Architecture Decision Records (ADRs) for significant decisions
- Update API documentation for endpoint changes
- Include code examples

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Linter passes without errors
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with main

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
Describe the tests you ran and how to reproduce them.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. **Automated Checks**: CI/CD runs linting, tests, security scans
2. **Code Review**: At least one maintainer reviews the code
3. **Feedback**: Address reviewer comments
4. **Approval**: Maintainer approves the PR
5. **Merge**: PR is merged into main branch

### PR Guidelines

- Keep PRs focused (one feature/fix per PR)
- Write clear, descriptive PR titles
- Provide context in the PR description
- Respond to review feedback promptly
- Keep discussions professional and constructive

---

## Issue Guidelines

### Creating Issues

**Bug Reports:**
```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Browser: Chrome 120
- OS: macOS 14.0
- Version: 0.0.0

## Screenshots
If applicable, add screenshots.

## Additional Context
Any other relevant information.
```

**Feature Requests:**
```markdown
## Feature Description
Clear description of the proposed feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about.

## Additional Context
Any other relevant information.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested
- `wontfix` - This will not be worked on

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussions
- **Email**: support@archdesigner.com (coming soon)

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Acknowledged in project documentation

### Becoming a Maintainer

Active contributors who demonstrate:
- Consistent high-quality contributions
- Good understanding of the codebase
- Helpful code reviews
- Community engagement

May be invited to become maintainers.

---

## Development Tips

### Debugging

**Frontend:**
```javascript
// Use React DevTools
// Enable verbose logging in development
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

**Backend:**
```typescript
// Use structured logging
logger.info('Processing request', { projectId, userId });
logger.error('Request failed', { error: error.message, stack: error.stack });
```

### Performance

- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and components
- Optimize images (WebP, lazy loading)
- Monitor bundle size

### Security

- Never commit secrets or API keys
- Sanitize all user inputs
- Validate data on both client and server
- Use HTTPS for all API calls
- Follow OWASP guidelines

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search GitHub Issues
3. Ask in GitHub Discussions
4. Contact the maintainers

---

**Thank you for contributing to ArchDesigner! 🎉**

---

**Maintained by**: Krosebrook Team  
**Last Updated**: December 29, 2024
