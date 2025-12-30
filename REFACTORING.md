# Refactoring Recommendations

## Overview

This document provides actionable refactoring recommendations to improve code quality, maintainability, and scalability in the ArchDesigner codebase. These recommendations are based on the comprehensive audit conducted in December 2024.

**Priority Levels:**
- 🔴 **P0 - Critical**: Must address for production readiness
- 🟡 **P1 - High**: Should address in Q1 2025
- 🟢 **P2 - Medium**: Address as part of ongoing improvement
- ⚪ **P3 - Low**: Nice to have, address when convenient

---

## Table of Contents

- [Type Safety](#type-safety)
- [Testing Infrastructure](#testing-infrastructure)
- [Code Organization](#code-organization)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Security Hardening](#security-hardening)
- [Configuration Management](#configuration-management)
- [Anti-Pattern Elimination](#anti-pattern-elimination)

---

## Type Safety

### 🔴 P0: Migrate from JSX to TSX

**Issue**: Codebase uses `.jsx` files instead of `.tsx`, missing type safety benefits.

**Current State**:
- 218 `.jsx` files
- Limited type checking
- Runtime errors that could be caught at compile time

**Recommendation**:

1. **Phase 1: Core Infrastructure (Week 1-2)**
   ```bash
   # Migrate utilities and hooks first
   mv src/utils/formatting.js src/utils/formatting.ts
   mv src/hooks/useProject.js src/hooks/useProject.ts
   ```

   Add types to utilities:
   ```typescript
   // Before
   export function formatDate(date) {
     return new Date(date).toLocaleDateString();
   }

   // After
   export function formatDate(date: Date | string | number): string {
     return new Date(date).toLocaleDateString();
   }
   ```

2. **Phase 2: Components (Week 3-8)**
   - Start with leaf components (no dependencies)
   - Move to parent components
   - Define prop types with interfaces

   ```typescript
   // Before (ProjectCard.jsx)
   export default function ProjectCard({ project, onDelete }) {
     // ...
   }

   // After (ProjectCard.tsx)
   interface ProjectCardProps {
     project: Project;
     onDelete: (id: string) => void;
   }

   export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
     // ...
   }
   ```

3. **Phase 3: Enable Strict Mode**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true
     }
   }
   ```

**Expected Benefits**:
- Catch errors at compile time
- Better IDE autocomplete
- Easier refactoring
- Self-documenting code
- Reduced runtime errors by ~40%

**Effort**: 6-8 weeks (incremental migration)

---

## Testing Infrastructure

### 🔴 P0: Implement Comprehensive Testing

**Issue**: Test coverage <20%, no test infrastructure configured.

**Recommendation**:

1. **Setup Testing Framework (Week 1)**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom \
     @testing-library/user-event vitest jsdom @vitest/ui
   ```

   Create `vitest.config.js`:
   ```javascript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test/setup.ts',
       coverage: {
         reporter: ['text', 'json', 'html'],
         exclude: [
           'node_modules/',
           'src/test/',
         ]
       }
     }
   });
   ```

2. **Write Unit Tests (Weeks 2-4)**

   **Component Test Example**:
   ```typescript
   // ProjectCard.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { describe, it, expect, vi } from 'vitest';
   import ProjectCard from './ProjectCard';

   describe('ProjectCard', () => {
     const mockProject = {
       id: '1',
       name: 'Test Project',
       description: 'Test Description',
       status: 'active'
     };

     it('renders project information', () => {
       render(<ProjectCard project={mockProject} onDelete={vi.fn()} />);
       expect(screen.getByText('Test Project')).toBeInTheDocument();
       expect(screen.getByText('Test Description')).toBeInTheDocument();
     });

     it('calls onDelete when delete button clicked', () => {
       const onDelete = vi.fn();
       render(<ProjectCard project={mockProject} onDelete={onDelete} />);
       
       fireEvent.click(screen.getByRole('button', { name: /delete/i }));
       expect(onDelete).toHaveBeenCalledWith('1');
     });

     it('displays correct status badge', () => {
       render(<ProjectCard project={mockProject} onDelete={vi.fn()} />);
       expect(screen.getByText('active')).toHaveClass('status-badge-active');
     });
   });
   ```

   **Utility Test Example**:
   ```typescript
   // utils/formatting.test.ts
   import { describe, it, expect } from 'vitest';
   import { formatDate, sanitizeInput } from './formatting';

   describe('formatDate', () => {
     it('formats Date objects correctly', () => {
       const date = new Date('2024-12-29');
       expect(formatDate(date)).toBe('12/29/2024');
     });

     it('handles string inputs', () => {
       expect(formatDate('2024-12-29')).toBe('12/29/2024');
     });

     it('throws error for invalid dates', () => {
       expect(() => formatDate('invalid')).toThrow();
     });
   });
   ```

3. **Integration Tests (Weeks 5-6)**

   ```typescript
   // ProjectDetail.integration.test.tsx
   import { render, screen, waitFor } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { BrowserRouter } from 'react-router-dom';
   import ProjectDetail from './ProjectDetail';
   import { server } from '../test/mocks/server';

   describe('ProjectDetail Integration', () => {
     beforeAll(() => server.listen());
     afterEach(() => server.resetHandlers());
     afterAll(() => server.close());

     it('loads and displays project data', async () => {
       render(
         <QueryClientProvider client={queryClient}>
           <BrowserRouter>
             <ProjectDetail />
           </BrowserRouter>
         </QueryClientProvider>
       );

       await waitFor(() => {
         expect(screen.getByText('Project Name')).toBeInTheDocument();
       });
     });

     it('handles error states', async () => {
       server.use(
         rest.get('/api/projects/:id', (req, res, ctx) => {
           return res(ctx.status(500));
         })
       );

       render(<ProjectDetail />);

       await waitFor(() => {
         expect(screen.getByText(/error loading project/i)).toBeInTheDocument();
       });
     });
   });
   ```

4. **E2E Tests (Weeks 7-8)**

   ```typescript
   // e2e/project-workflow.spec.ts
   import { test, expect } from '@playwright/test';

   test('complete project creation workflow', async ({ page }) => {
     await page.goto('/');
     await page.click('text=Create Project');
     
     await page.fill('input[name="name"]', 'E2E Test Project');
     await page.fill('textarea[name="description"]', 'Test Description');
     await page.selectOption('select[name="category"]', 'web');
     
     await page.click('button[type="submit"]');
     
     await expect(page.locator('text=E2E Test Project')).toBeVisible();
   });
   ```

**Coverage Targets**:
- End of Week 4: 60% coverage
- End of Week 8: 80% coverage
- Maintain >80% for new code

**Effort**: 8 weeks

---

## Code Organization

### 🟡 P1: Modularize Large Components

**Issue**: Some components exceed 200 lines, violating single responsibility principle.

**Example Refactoring**:

**Before**:
```jsx
// ProjectDetail.jsx (300+ lines)
export default function ProjectDetail() {
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState([]);
  // ... 50+ lines of state and logic
  
  const handleAddService = () => { /* complex logic */ };
  const handleUpdateService = () => { /* complex logic */ };
  const handleDeleteService = () => { /* complex logic */ };
  // ... many more handlers
  
  return (
    <div>
      {/* 200+ lines of JSX */}
    </div>
  );
}
```

**After**:
```tsx
// ProjectDetail.tsx (50 lines)
export default function ProjectDetail() {
  const { project, services } = useProject(projectId);
  const { addService, updateService, deleteService } = useServiceManagement(projectId);
  
  return (
    <div>
      <ProjectHeader project={project} />
      <ServiceList services={services} />
      <ServiceActions onAdd={addService} onUpdate={updateService} onDelete={deleteService} />
    </div>
  );
}

// hooks/useProject.ts (30 lines)
export function useProject(projectId: string) {
  // Data fetching logic
}

// hooks/useServiceManagement.ts (40 lines)
export function useServiceManagement(projectId: string) {
  // Service CRUD logic
}

// components/ProjectHeader.tsx (30 lines)
export function ProjectHeader({ project }: ProjectHeaderProps) {
  // Header display logic
}

// components/ServiceList.tsx (40 lines)
export function ServiceList({ services }: ServiceListProps) {
  // Service list display
}

// components/ServiceActions.tsx (50 lines)
export function ServiceActions({ onAdd, onUpdate, onDelete }: ServiceActionsProps) {
  // Action buttons and modals
}
```

**Benefits**:
- Easier testing (test each component independently)
- Better reusability
- Clearer responsibilities
- Easier code review
- Improved performance (React.memo opportunities)

**Effort**: 2-3 weeks

---

## Performance Optimization

### 🟡 P1: Implement Code Splitting

**Issue**: Large initial bundle size, all code loaded upfront.

**Recommendation**:

1. **Route-Based Code Splitting**
   ```typescript
   // Before
   import Dashboard from './pages/Dashboard';
   import Projects from './pages/Projects';
   import ProjectDetail from './pages/ProjectDetail';

   // After
   import { lazy, Suspense } from 'react';

   const Dashboard = lazy(() => import('./pages/Dashboard'));
   const Projects = lazy(() => import('./pages/Projects'));
   const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));

   function App() {
     return (
       <Suspense fallback={<LoadingSpinner />}>
         <Routes>
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/projects" element={<Projects />} />
           <Route path="/project/:id" element={<ProjectDetail />} />
         </Routes>
       </Suspense>
     );
   }
   ```

2. **Component-Based Code Splitting**
   ```typescript
   // Heavy components
   const ArchitectureCanvas = lazy(() => import('./components/ArchitectureCanvas'));
   const SecurityAuditPanel = lazy(() => import('./components/SecurityAuditPanel'));

   // Use with Suspense
   <Suspense fallback={<ComponentLoader />}>
     <ArchitectureCanvas project={project} />
   </Suspense>
   ```

3. **Library Code Splitting**
   ```typescript
   // vite.config.js
   export default {
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom', 'react-router-dom'],
             ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
             charts: ['recharts'],
             3d: ['three']
           }
         }
       }
     }
   };
   ```

**Expected Impact**:
- Initial bundle size: -50%
- Time to Interactive: -40%
- Lighthouse score: +15 points

**Effort**: 1-2 weeks

---

### 🟢 P2: Optimize Re-renders

**Issue**: Unnecessary re-renders causing performance issues.

**Recommendation**:

1. **Use React.memo for Pure Components**
   ```typescript
   // Before
   function ServiceCard({ service, onUpdate }) {
     return <div>{/* ... */}</div>;
   }

   // After
   import { memo } from 'react';

   const ServiceCard = memo(function ServiceCard({ service, onUpdate }) {
     return <div>{/* ... */}</div>;
   }, (prevProps, nextProps) => {
     return prevProps.service.id === nextProps.service.id &&
            prevProps.service.updated_at === nextProps.service.updated_at;
   });
   ```

2. **Use useMemo for Expensive Calculations**
   ```typescript
   // Before
   function AnalyticsDashboard({ projects }) {
     const stats = calculateComplexStats(projects); // Runs on every render
     return <div>{/* ... */}</div>;
   }

   // After
   import { useMemo } from 'react';

   function AnalyticsDashboard({ projects }) {
     const stats = useMemo(
       () => calculateComplexStats(projects),
       [projects]
     );
     return <div>{/* ... */}</div>;
   }
   ```

3. **Use useCallback for Event Handlers**
   ```typescript
   // Before
   function ProjectList({ projects }) {
     const handleDelete = (id) => deleteProject(id); // New function every render
     return projects.map(p => <ProjectCard key={p.id} onDelete={handleDelete} />);
   }

   // After
   import { useCallback } from 'react';

   function ProjectList({ projects }) {
     const handleDelete = useCallback((id) => deleteProject(id), []);
     return projects.map(p => <ProjectCard key={p.id} onDelete={handleDelete} />);
   }
   ```

**Effort**: 2-3 weeks

---

## Error Handling

### 🔴 P0: Implement Error Boundaries

**Issue**: No error boundaries, errors crash entire app.

**Recommendation**:

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <ErrorBoundary fallback={<ProjectError />}>
        <ProjectDetail />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

**Effort**: 3-5 days

---

## Security Hardening

### 🟡 P1: Fix Dependency Vulnerabilities

**Issue**: 8 vulnerabilities detected (6 moderate, 2 high).

**Recommendation**:

```bash
# 1. Update vulnerable dependencies
npm audit fix

# 2. For breaking changes
npm audit fix --force

# 3. Manual updates for major versions
npm update jspdf@latest
npm update glob@latest
npm update js-yaml@latest

# 4. Add automated security scanning
npm install --save-dev snyk
npx snyk test
npx snyk monitor
```

**GitHub Actions Workflow**:
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit --audit-level=moderate
      - run: npx snyk test
```

**Effort**: 2-3 days

---

### 🟡 P1: Add CSP Headers

**Issue**: No Content Security Policy headers.

**Recommendation**:

```typescript
// vite.config.js
export default {
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://base44.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.base44.com wss://base44.com",
        "font-src 'self' data:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    }
  }
};
```

**Effort**: 1-2 days

---

## Configuration Management

### 🟡 P1: Centralize Configuration

**Issue**: Configuration scattered across files.

**Recommendation**:

```typescript
// config/index.ts
interface AppConfig {
  base44: {
    appId: string;
    apiKey: string;
    region: string;
  };
  features: {
    aiAgents: boolean;
    codeGeneration: boolean;
    securityAudit: boolean;
  };
  llm: {
    provider: 'claude' | 'gemini';
    model: string;
    maxTokens: number;
  };
  limits: {
    maxProjects: number;
    maxServices: number;
    maxFileSize: number;
  };
}

const config: AppConfig = {
  base44: {
    appId: import.meta.env.VITE_BASE44_APP_ID,
    apiKey: import.meta.env.VITE_BASE44_API_KEY,
    region: import.meta.env.VITE_BASE44_REGION || 'us-east-1'
  },
  features: {
    aiAgents: import.meta.env.VITE_ENABLE_AI_AGENTS === 'true',
    codeGeneration: import.meta.env.VITE_ENABLE_CODE_GENERATION === 'true',
    securityAudit: import.meta.env.VITE_ENABLE_SECURITY_AUDIT === 'true'
  },
  llm: {
    provider: (import.meta.env.VITE_LLM_PROVIDER as 'claude' | 'gemini') || 'claude',
    model: import.meta.env.VITE_LLM_MODEL || 'claude-3-sonnet',
    maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS) || 4096
  },
  limits: {
    maxProjects: 100,
    maxServices: 50,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  }
};

export default config;

// Validation
if (!config.base44.appId) {
  throw new Error('VITE_BASE44_APP_ID is required');
}
```

**Effort**: 1 week

---

## Anti-Pattern Elimination

### 🟢 P2: Eliminate Prop Drilling

**Issue**: Props passed through multiple levels.

**Recommendation**:

```typescript
// Before: Prop drilling
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} />;
}

function Dashboard({ user }) {
  return <ProjectList user={user} />;
}

function ProjectList({ user }) {
  return <ProjectCard user={user} />;
}

function ProjectCard({ user }) {
  return <div>User: {user.name}</div>;
}

// After: Context
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={user}>
      <Dashboard />
    </UserContext.Provider>
  );
}

function ProjectCard() {
  const user = useContext(UserContext);
  return <div>User: {user.name}</div>;
}
```

**Effort**: 1-2 weeks

---

### 🟢 P2: Extract Magic Numbers

**Issue**: Hard-coded values throughout codebase.

**Recommendation**:

```typescript
// Before
if (projects.length > 100) {
  showWarning();
}

setTimeout(refetch, 5000);

// After
// constants.ts
export const LIMITS = {
  MAX_PROJECTS: 100,
  MAX_SERVICES: 50,
  MAX_FILE_SIZE_MB: 10
} as const;

export const TIMEOUTS = {
  REFETCH_INTERVAL_MS: 5000,
  DEBOUNCE_MS: 300,
  TOAST_DURATION_MS: 3000
} as const;

// Usage
import { LIMITS, TIMEOUTS } from '@/constants';

if (projects.length > LIMITS.MAX_PROJECTS) {
  showWarning();
}

setTimeout(refetch, TIMEOUTS.REFETCH_INTERVAL_MS);
```

**Effort**: 3-5 days

---

## Implementation Timeline

### Q1 2025 (Jan-Mar)

**Week 1-2**: Critical Priorities
- [ ] Setup testing infrastructure
- [ ] Add error boundaries
- [ ] Fix dependency vulnerabilities

**Week 3-6**: Type Safety
- [ ] Migrate utilities to TypeScript
- [ ] Migrate hooks to TypeScript
- [ ] Migrate components to TypeScript (Phase 1)

**Week 7-10**: Testing
- [ ] Write unit tests (60% coverage target)
- [ ] Write integration tests
- [ ] Setup E2E testing

**Week 11-12**: Performance
- [ ] Implement code splitting
- [ ] Optimize re-renders
- [ ] Add CSP headers

### Q2 2025 (Apr-Jun)

**Week 13-16**: Advanced Improvements
- [ ] Complete TypeScript migration
- [ ] Centralize configuration
- [ ] Modularize large components

**Week 17-20**: Quality Improvements
- [ ] Eliminate prop drilling
- [ ] Extract magic numbers
- [ ] Refactor anti-patterns

**Week 21-24**: Testing & Polish
- [ ] Achieve 80%+ test coverage
- [ ] Performance optimization
- [ ] Documentation updates

---

## Success Metrics

### Code Quality
- **Test Coverage**: 60% → 80%+ (Q1), maintain >80% (Q2+)
- **TypeScript Adoption**: 0% → 50% (Q1), 50% → 100% (Q2)
- **Bundle Size**: Baseline → -50%
- **Lighthouse Score**: Baseline → +15 points

### Development Velocity
- **Time to Add Feature**: Baseline → -30%
- **Bug Fix Time**: Baseline → -40%
- **Code Review Time**: Baseline → -25%

### Stability
- **Production Errors**: Baseline → -60%
- **Failed Deployments**: Baseline → -80%
- **Rollback Rate**: Baseline → -70%

---

## Monitoring Progress

### Weekly Metrics
```bash
# Test coverage
npm run test:coverage

# Bundle size
npm run build && du -sh dist/

# TypeScript adoption
find src -name "*.tsx" | wc -l
find src -name "*.jsx" | wc -l

# Linting issues
npm run lint

# Lighthouse score
lighthouse http://localhost:5173 --view
```

### Monthly Reviews
- Review progress against timeline
- Adjust priorities based on feedback
- Update documentation
- Share wins with team

---

## Conclusion

These refactoring recommendations will significantly improve:
- **Code Quality**: Type safety, testing, organization
- **Performance**: Bundle size, render optimization
- **Security**: Dependency updates, CSP headers
- **Maintainability**: Modularization, configuration management
- **Developer Experience**: Faster development, fewer bugs

**Next Steps**:
1. Review and prioritize recommendations
2. Create GitHub issues for each item
3. Assign owners and timelines
4. Begin implementation in Q1 2025
5. Track progress weekly

---

**Maintained by**: Krosebrook Team  
**Last Updated**: December 29, 2024  
**Version**: 0.0.0
