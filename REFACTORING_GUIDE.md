# ArchDesigner Refactoring Guide
## Strategic Code Improvements and Modernization

**Last Updated**: December 30, 2024  
**Version**: 0.0.0

---

## Table of Contents

- [Overview](#overview)
- [Refactoring Priorities](#refactoring-priorities)
- [Code Modularization](#code-modularization)
- [TypeScript Migration](#typescript-migration)
- [Performance Optimization](#performance-optimization)
- [State Management](#state-management)
- [API Layer Improvements](#api-layer-improvements)
- [Component Architecture](#component-architecture)
- [Configuration Management](#configuration-management)
- [Anti-Pattern Elimination](#anti-pattern-elimination)

---

## Overview

This guide outlines strategic refactoring initiatives to improve code quality, maintainability, and scalability of the ArchDesigner codebase. The approach follows industry best practices and ensures minimal disruption to existing functionality.

**Refactoring Principles**:
1. **Incremental Changes** - Small, testable improvements
2. **Backward Compatibility** - Don't break existing features
3. **Test First** - Add tests before refactoring
4. **Continuous Integration** - Refactor continuously, not in big bangs
5. **Measure Impact** - Track performance and quality metrics

---

## Refactoring Priorities

### Phase 1: Foundation (Q1 2025)
**Focus**: Type safety, testing, critical bugs

- [ ] TypeScript migration (JSX → TSX)
- [ ] Test infrastructure setup
- [ ] Error boundaries implementation
- [ ] Security vulnerability fixes
- [ ] Input validation enhancement

**Timeline**: 8-10 weeks  
**Impact**: High (reduces 40% of runtime errors)

### Phase 2: Architecture (Q2 2025)
**Focus**: Modularity, performance, scalability

- [ ] Component modularization
- [ ] State management optimization
- [ ] API layer refactoring
- [ ] Bundle size optimization
- [ ] Performance improvements

**Timeline**: 8 weeks  
**Impact**: Medium-High (30% performance gain)

### Phase 3: Polish (Q3 2025)
**Focus**: Developer experience, code quality

- [ ] Code documentation
- [ ] Developer tooling
- [ ] Storybook integration
- [ ] E2E test coverage
- [ ] CI/CD enhancements

**Timeline**: 6 weeks  
**Impact**: Medium (improves DX significantly)

---

## Code Modularization

### Current Structure Issues

```
src/
├── components/
│   ├── dashboard/         # Mixed concerns
│   ├── projects/          # Tightly coupled
│   ├── visual-editor/     # Monolithic
│   └── ...
```

**Problems**:
1. Large, monolithic components (500+ lines)
2. Business logic mixed with UI
3. Difficult to test in isolation
4. High coupling between features

### Recommended Structure

```
src/
├── features/                    # Feature-based organization
│   ├── projects/
│   │   ├── api/                # API calls
│   │   ├── components/          # UI components
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   └── CreateProjectModal.tsx
│   │   ├── hooks/              # Custom hooks
│   │   │   ├── useProjects.ts
│   │   │   └── useProjectMutations.ts
│   │   ├── types/              # TypeScript types
│   │   │   └── project.types.ts
│   │   └── utils/              # Utilities
│   │       └── projectValidation.ts
│   │
│   ├── services/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   │
│   └── architecture/
│       ├── api/
│       ├── components/
│       │   ├── VisualEditor/
│       │   │   ├── Canvas.tsx
│       │   │   ├── ServiceNode.tsx
│       │   │   ├── Connection.tsx
│       │   │   └── index.ts
│       │   └── ArchitectureAnalysis/
│       ├── hooks/
│       └── types/
│
├── shared/                      # Shared across features
│   ├── components/              # Reusable UI
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Layout/
│   ├── hooks/                   # Common hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useDebounce.ts
│   ├── utils/                   # Common utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   └── types/                   # Global types
│       └── common.types.ts
│
├── lib/                         # Core libraries
│   ├── api/                     # API client
│   ├── auth/                    # Authentication
│   └── config/                  # Configuration
│
└── app/                         # App-level
    ├── App.tsx
    ├── routes.tsx
    └── providers.tsx
```

### Benefits

1. **Clear Boundaries** - Each feature is self-contained
2. **Easy to Find** - Related code lives together
3. **Better Testing** - Test features in isolation
4. **Scalable** - Add features without affecting others
5. **Team Collaboration** - Multiple teams can work independently

### Migration Strategy

```typescript
// Step 1: Create new structure (don't move files yet)
mkdir -p src/features/projects/{api,components,hooks,types,utils}

// Step 2: Move one feature at a time
// Start with smallest/simplest feature

// Step 3: Update imports
// Use path aliases for easier refactoring
// tsconfig.json:
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}

// Step 4: Update component imports
// Old: import ProjectCard from '../../components/projects/ProjectCard';
// New: import { ProjectCard } from '@features/projects';
```

---

## TypeScript Migration

### Current State

- **Frontend**: 216 JSX files (no type checking)
- **Backend**: 10 TypeScript files (good)
- **Type Coverage**: ~30% (backend only)

### Migration Strategy

#### Week 1-2: Setup and Utilities

```bash
# 1. Update tsconfig.json
{
  "compilerOptions": {
    "strict": true,              # Enable strict mode
    "noImplicitAny": true,       # Require types
    "strictNullChecks": true,    # Catch null/undefined
    "jsx": "react-jsx"           # JSX support
  }
}

# 2. Start with utilities (no React)
mv src/utils/validation.js src/utils/validation.ts
mv src/utils/formatting.js src/utils/formatting.ts

# 3. Add types
// validation.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateProject(project: unknown): project is Project {
  // Type guard implementation
  return (
    typeof project === 'object' &&
    project !== null &&
    'name' in project &&
    typeof project.name === 'string'
  );
}
```

#### Week 3-4: Shared Components

```typescript
// Button.jsx → Button.tsx

// Before (JSX)
export default function Button({ children, onClick, variant }) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// After (TSX)
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
```

#### Week 5-6: Feature Components

```typescript
// ProjectCard.jsx → ProjectCard.tsx

// Define types
interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'development' | 'deployed';
  created_at: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  className?: string;
}

// Component with types
export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  className
}: ProjectCardProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(project);
    }
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(project.id);
    }
  };
  
  return (
    <div className={`project-card ${className}`}>
      <h3>{project.name}</h3>
      {project.description && <p>{project.description}</p>}
      <span className={`status ${project.status}`}>
        {project.status}
      </span>
      <div className="actions">
        {onEdit && <Button onClick={handleEdit}>Edit</Button>}
        {onDelete && <Button onClick={handleDelete} variant="danger">Delete</Button>}
      </div>
    </div>
  );
}
```

#### Week 7-8: Pages and Complex Features

```typescript
// Dashboard.jsx → Dashboard.tsx

import { useQuery } from '@tanstack/react-query';
import type { Project } from '@features/projects/types';
import type { DashboardStats } from '@features/dashboard/types';

export default function Dashboard() {
  // Types inferred from API response
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects
  });
  
  if (statsLoading || projectsLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="dashboard">
      <StatsOverview stats={stats} />
      <RecentProjects projects={projects} />
    </div>
  );
}
```

### Common Migration Patterns

#### Pattern 1: Props with Default Values

```typescript
// Before
function Component({ title, subtitle, enabled }) {
  const _enabled = enabled ?? true;
  // ...
}

// After
interface ComponentProps {
  title: string;
  subtitle?: string;
  enabled?: boolean;
}

function Component({ 
  title, 
  subtitle, 
  enabled = true 
}: ComponentProps) {
  // ...
}
```

#### Pattern 2: Event Handlers

```typescript
// Before
function Component({ onChange }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };
}

// After
interface ComponentProps {
  onChange: (value: string) => void;
}

function Component({ onChange }: ComponentProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
}
```

#### Pattern 3: Children Props

```typescript
// Various children types
interface Props {
  children: React.ReactNode;          // Most flexible
  children: React.ReactElement;       // Single React element
  children: React.ReactElement[];     // Array of elements
  children: string;                   // Text only
  children: () => React.ReactNode;    // Render prop
}
```

---

## Performance Optimization

### 1. Component Memoization

**When to Use**:
- Expensive render logic
- Large lists
- Frequently re-rendering parent

```typescript
// Before
function ProjectList({ projects, filters }) {
  const filtered = projects.filter(p => 
    filters.status.includes(p.status)
  );
  
  return (
    <div>
      {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}

// After
import { useMemo, memo } from 'react';

const ProjectCard = memo(({ project }: { project: Project }) => {
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      {/* ... */}
    </div>
  );
});

function ProjectList({ projects, filters }: ProjectListProps) {
  // Memoize expensive filtering
  const filtered = useMemo(() => 
    projects.filter(p => filters.status.includes(p.status)),
    [projects, filters.status]
  );
  
  return (
    <div>
      {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

### 2. Virtual Scrolling

**When to Use**:
- Lists with 100+ items
- Complex list items
- Performance-critical UIs

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualProjectList({ projects }: { projects: Project[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5 // Render 5 extra items
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <ProjectCard project={projects[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Code Splitting

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

// Lazy load pages
const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const Projects = lazy(() => import('@features/projects/pages/Projects'));
const VisualEditor = lazy(() => import('@features/architecture/pages/VisualEditor'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/editor/:id" element={<VisualEditor />} />
      </Routes>
    </Suspense>
  );
}

// Lazy load heavy components
const ThreeJSVisualization = lazy(() => 
  import('@features/visualization/components/ThreeJSVisualization')
);

function ArchitectureView() {
  const [show3D, setShow3D] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShow3D(true)}>Show 3D View</Button>
      {show3D && (
        <Suspense fallback={<Spinner />}>
          <ThreeJSVisualization />
        </Suspense>
      )}
    </div>
  );
}
```

### 4. Bundle Analysis

```bash
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
};

# Build and analyze
npm run build

# Look for:
# - Large dependencies (>100KB)
# - Duplicate dependencies
# - Unnecessary imports
```

---

## State Management

### Current State Management Issues

1. **Prop Drilling** - Passing props through many levels
2. **Duplicated State** - Same data in multiple places
3. **Sync Issues** - State gets out of sync
4. **Performance** - Unnecessary re-renders

### Recommended Architecture

```
┌─────────────────────────────────────┐
│         Component Tree               │
├─────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Server State (React Query)   │ │
│  │   - Projects                   │ │
│  │   - Services                   │ │
│  │   - Analytics                  │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Global State (Context)       │ │
│  │   - Auth (user, token)         │ │
│  │   - Theme (dark/light)         │ │
│  │   - Preferences                │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Local State (useState)       │ │
│  │   - Form inputs                │ │
│  │   - UI toggles                 │ │
│  │   - Temporary data             │ │
│  └────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### Server State Management (React Query)

```typescript
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@lib/api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: api.projects.list,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000  // 10 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.projects.get(id),
    enabled: !!id
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.projects.create,
    onSuccess: () => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      api.projects.update(id, data),
    onSuccess: (_, { id }) => {
      // Update cache optimistically
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

// Usage in component
function ProjectDetail({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error } = useProject(projectId);
  const updateProject = useUpdateProject();
  
  const handleUpdate = (data: Partial<Project>) => {
    updateProject.mutate({ id: projectId, data });
  };
  
  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return <ProjectForm project={project} onSubmit={handleUpdate} />;
}
```

### Global State (Context)

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const user = await api.auth.login(email, password);
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage
function Header() {
  const { user, logout } = useAuth();
  
  return (
    <header>
      <span>Welcome, {user?.name}</span>
      <button onClick={logout}>Logout</button>
    </header>
  );
}
```

---

## Anti-Pattern Elimination

### 1. God Components

**Anti-Pattern**:
```typescript
// 1000+ line component doing everything
function ProjectPage() {
  // Fetching data
  // Business logic
  // Form handling
  // Validation
  // Rendering complex UI
  // ...hundreds of lines...
}
```

**Refactored**:
```typescript
// Split into focused components
function ProjectPage() {
  return (
    <div>
      <ProjectHeader />
      <ProjectDetails />
      <ServicesList />
      <ArchitectureView />
    </div>
  );
}

// Extract hooks
function ProjectDetails() {
  const { project } = useProject();
  const { updateProject } = useProjectMutations();
  // Focused logic
}
```

### 2. Prop Drilling

**Anti-Pattern**:
```typescript
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} setUser={setUser} />;
}

function Dashboard({ user, setUser }) {
  return <ProjectList user={user} setUser={setUser} />;
}

function ProjectList({ user, setUser }) {
  return <ProjectCard user={user} setUser={setUser} />;
}

function ProjectCard({ user, setUser }) {
  // Finally use it here, 3 levels deep!
}
```

**Refactored**:
```typescript
// Use Context
function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

function ProjectCard() {
  const { user, setUser } = useAuth();
  // Direct access, no drilling!
}
```

### 3. Inline Functions in Render

**Anti-Pattern**:
```typescript
function List({ items }) {
  return items.map(item => (
    <Item
      key={item.id}
      onClick={() => handleClick(item.id)}  // New function every render!
    />
  ));
}
```

**Refactored**:
```typescript
function List({ items }) {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);
  
  return items.map(item => (
    <Item key={item.id} onClick={handleClick} itemId={item.id} />
  ));
}

const Item = memo(({ onClick, itemId }) => (
  <div onClick={() => onClick(itemId)}>...</div>
));
```

---

## Configuration Management

### Current Issues

1. Environment variables scattered
2. Hard-coded values
3. No type safety for config
4. Difficult to change settings

### Recommended Approach

```typescript
// lib/config/config.ts

interface Config {
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
  api: {
    timeout: number;
    retries: number;
  };
  ui: {
    itemsPerPage: number;
    debounceMs: number;
  };
}

function loadConfig(): Config {
  return {
    base44: {
      appId: import.meta.env.VITE_BASE44_APP_ID || '',
      apiKey: import.meta.env.VITE_BASE44_API_KEY || '',
      region: import.meta.env.VITE_BASE44_REGION || 'us-east-1'
    },
    features: {
      aiAgents: import.meta.env.VITE_ENABLE_AI_AGENTS === 'true',
      codeGeneration: import.meta.env.VITE_ENABLE_CODE_GENERATION === 'true',
      securityAudit: import.meta.env.VITE_ENABLE_SECURITY_AUDIT === 'true'
    },
    api: {
      timeout: 30000,
      retries: 3
    },
    ui: {
      itemsPerPage: 20,
      debounceMs: 300
    }
  };
}

export const config = loadConfig();

// Validate config on startup
function validateConfig(config: Config) {
  if (!config.base44.appId) {
    throw new Error('VITE_BASE44_APP_ID is required');
  }
  // ... more validation
}

validateConfig(config);

// Usage
import { config } from '@lib/config';

if (config.features.aiAgents) {
  // Show AI agent features
}
```

---

## Conclusion

This refactoring guide provides a roadmap for systematic codebase improvements. Follow the phased approach to ensure smooth transitions and minimal disruption.

**Next Steps**:
1. Review and prioritize refactoring tasks
2. Set up testing infrastructure (critical first step)
3. Begin TypeScript migration
4. Implement performance optimizations
5. Regular code reviews and quality checks

---

**Maintained by**: Krosebrook Team  
**Last Updated**: December 30, 2024
