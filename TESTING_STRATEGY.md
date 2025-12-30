# ArchDesigner Testing Strategy
## Comprehensive Testing Framework and Coverage Plan

**Last Updated**: December 30, 2024  
**Version**: 0.0.0  
**Current Coverage**: < 20%  
**Target Coverage**: > 80%

---

## Table of Contents

- [Overview](#overview)
- [Testing Pyramid](#testing-pyramid)
- [Technology Stack](#technology-stack)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Component Testing](#component-testing)
- [API Testing](#api-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Test Data Management](#test-data-management)
- [CI/CD Integration](#cicd-integration)
- [Coverage Goals](#coverage-goals)

---

## Overview

This document outlines the comprehensive testing strategy for ArchDesigner. The goal is to achieve 80%+ code coverage while ensuring high-quality, reliable software.

**Current State**:
- ❌ No test infrastructure
- ❌ < 20% test coverage
- ❌ No automated testing in CI/CD
- ❌ Manual testing only

**Target State** (Q1 2025):
- ✅ Full test infrastructure
- ✅ > 80% test coverage
- ✅ Automated CI/CD testing
- ✅ TDD/BDD practices

---

## Testing Pyramid

```
                    ┌─────────────┐
                    │     E2E     │  10% of tests
                    │  (Slow)     │  Critical paths
                    └─────────────┘
                   ┌───────────────┐
                   │  Integration  │  20% of tests
                   │   (Medium)    │  Feature flows
                   └───────────────┘
                  ┌─────────────────┐
                  │      Unit       │  70% of tests
                  │     (Fast)      │  Functions/Logic
                  └─────────────────┘
```

### Philosophy

1. **Fast Feedback** - Unit tests run in milliseconds
2. **Confidence** - Integration tests verify features work together
3. **User Focus** - E2E tests validate critical user journeys
4. **Maintainable** - Tests are easy to read and update
5. **Reliable** - No flaky tests

---

## Technology Stack

### Frontend Testing

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/ui": "^1.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^23.0.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0"
  }
}
```

**Why Vitest?**
- Native Vite integration
- Faster than Jest
- Better TypeScript support
- Compatible with Jest APIs

### Backend Testing

```json
{
  "devDependencies": {
    "@deno/std/testing": "latest"
  }
}
```

**Deno Built-in Testing**:
- No additional dependencies
- Fast execution
- TypeScript native

---

## Unit Testing

### Setup

```bash
# Install dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Create vitest.config.ts
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  }
});
```

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### Example: Utility Function Tests

```typescript
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail, validateProject, validateUUID } from './validation';

describe('validateEmail', () => {
  it('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
  });
  
  it('rejects invalid email addresses', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('no@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
  
  it('handles edge cases', () => {
    expect(validateEmail(null as any)).toBe(false);
    expect(validateEmail(undefined as any)).toBe(false);
    expect(validateEmail(123 as any)).toBe(false);
  });
});

describe('validateProject', () => {
  it('accepts valid project objects', () => {
    const project = {
      id: '123',
      name: 'My Project',
      description: 'A test project',
      status: 'active'
    };
    expect(validateProject(project)).toBe(true);
  });
  
  it('rejects invalid project objects', () => {
    expect(validateProject(null)).toBe(false);
    expect(validateProject({})).toBe(false);
    expect(validateProject({ name: 'Only Name' })).toBe(false);
  });
});
```

### Example: Hook Tests

```typescript
// src/hooks/useDebounce.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });
  
  it('delays value update', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    expect(result.current).toBe('initial');
    
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Still old value
    
    await waitFor(() => {
      expect(result.current).toBe('updated');
    }, { timeout: 600 });
  });
  
  it('cancels previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'v1', delay: 500 } }
    );
    
    rerender({ value: 'v2', delay: 500 });
    rerender({ value: 'v3', delay: 500 });
    
    await waitFor(() => {
      expect(result.current).toBe('v3');
    }, { timeout: 600 });
  });
});
```

---

## Component Testing

### Example: Simple Component

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
    
    rerender(<Button variant="danger">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });
  
  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Example: Complex Component with Data Fetching

```typescript
// src/features/projects/components/ProjectCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectCard } from './ProjectCard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ProjectCard', () => {
  const mockProject = {
    id: '123',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    created_at: '2024-01-01'
  };
  
  it('renders project information', () => {
    render(<ProjectCard project={mockProject} />, { wrapper });
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button clicked', () => {
    const handleEdit = vi.fn();
    render(
      <ProjectCard project={mockProject} onEdit={handleEdit} />,
      { wrapper }
    );
    
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledWith(mockProject);
  });
  
  it('calls onDelete when delete button clicked', async () => {
    const handleDelete = vi.fn();
    render(
      <ProjectCard project={mockProject} onDelete={handleDelete} />,
      { wrapper }
    );
    
    fireEvent.click(screen.getByText('Delete'));
    
    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Confirm'));
    expect(handleDelete).toHaveBeenCalledWith(mockProject.id);
  });
});
```

---

## Integration Testing

### API Mocking with MSW

```typescript
// src/tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Get projects
  http.get('/api/projects', () => {
    return HttpResponse.json([
      { id: '1', name: 'Project 1', status: 'active' },
      { id: '2', name: 'Project 2', status: 'inactive' }
    ]);
  }),
  
  // Get single project
  http.get('/api/projects/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      name: `Project ${id}`,
      status: 'active'
    });
  }),
  
  // Create project
  http.post('/api/projects', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: '123', ...body },
      { status: 201 }
    );
  }),
  
  // Error scenario
  http.get('/api/projects/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  })
];
```

```typescript
// src/tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/tests/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Example: Feature Integration Test

```typescript
// src/features/projects/ProjectList.integration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectList } from './ProjectList';

describe('ProjectList Integration', () => {
  it('fetches and displays projects', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectList />
      </QueryClientProvider>
    );
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });
  
  it('handles API errors gracefully', async () => {
    // Override handler to return error
    server.use(
      http.get('/api/projects', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch' },
          { status: 500 }
        );
      })
    );
    
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectList />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });
});
```

---

## End-to-End Testing

### Setup Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### Example: Critical User Journey

```typescript
// e2e/create-project.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create Project Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
  
  test('creates a new project successfully', async ({ page }) => {
    // Navigate to projects page
    await page.click('text=Projects');
    await expect(page).toHaveURL('/projects');
    
    // Click create button
    await page.click('text=Create Project');
    
    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('textarea[name="description"]', 'Created by E2E test');
    await page.selectOption('select[name="category"]', 'web');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Project created successfully')).toBeVisible();
    
    // Verify project appears in list
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });
  
  test('validates required fields', async ({ page }) => {
    await page.click('text=Projects');
    await page.click('text=Create Project');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
  
  test('handles API errors', async ({ page }) => {
    // Mock API error
    await page.route('/api/projects', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    await page.click('text=Projects');
    await page.click('text=Create Project');
    
    await page.fill('input[name="name"]', 'Test Project');
    await page.click('button[type="submit"]');
    
    // Check error message
    await expect(page.locator('text=Failed to create project')).toBeVisible();
  });
});
```

### Example: Visual Editor E2E Test

```typescript
// e2e/visual-editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Editor', () => {
  test('creates and connects services', async ({ page }) => {
    await page.goto('/projects');
    
    // Create project first
    await page.click('text=Create Project');
    await page.fill('input[name="name"]', 'Visual Editor Test');
    await page.click('button[type="submit"]');
    
    // Open visual editor
    await page.click('text=Visual Editor Test');
    await page.click('text=Open Editor');
    
    // Add first service
    await page.click('text=Add Service');
    await page.fill('input[name="serviceName"]', 'API Gateway');
    await page.selectOption('select[name="type"]', 'api-gateway');
    await page.click('button:has-text("Add")');
    
    // Verify service appears on canvas
    await expect(page.locator('text=API Gateway')).toBeVisible();
    
    // Add second service
    await page.click('text=Add Service');
    await page.fill('input[name="serviceName"]', 'User Service');
    await page.selectOption('select[name="type"]', 'microservice');
    await page.click('button:has-text("Add")');
    
    // Connect services
    await page.click('text=API Gateway');
    await page.click('text=Connect');
    await page.click('text=User Service');
    
    // Verify connection
    await expect(page.locator('.connection-line')).toBeVisible();
    
    // Export architecture
    await page.click('text=Export');
    await page.click('text=PNG');
    
    // Verify download started
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Download')
    ]);
    
    expect(download.suggestedFilename()).toContain('.png');
  });
});
```

---

## API Testing (Backend)

### Deno Test Example

```typescript
// functions/analyzeArchitecture.test.ts
import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';
import { analyzeArchitecture } from './analyzeArchitecture.ts';

Deno.test('analyzeArchitecture - validates input', async () => {
  const req = new Request('http://localhost/analyze', {
    method: 'POST',
    body: JSON.stringify({})
  });
  
  const response = await analyzeArchitecture(req);
  assertEquals(response.status, 400);
  
  const body = await response.json();
  assertExists(body.error);
});

Deno.test('analyzeArchitecture - returns analysis for valid input', async () => {
  const req = new Request('http://localhost/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: 'test-123',
      services: [
        { name: 'API Gateway', type: 'gateway' },
        { name: 'User Service', type: 'microservice' }
      ]
    })
  });
  
  const response = await analyzeArchitecture(req);
  assertEquals(response.status, 200);
  
  const body = await response.json();
  assertExists(body.health_score);
  assertExists(body.bottlenecks);
  assertExists(body.recommendations);
});
```

---

## Performance Testing

### Load Testing with k6

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 }    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01']    // Less than 1% failure rate
  }
};

export default function() {
  // Test project list endpoint
  const res = http.get('http://localhost:5173/api/projects');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
  
  sleep(1);
}
```

### Frontend Performance Tests

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('meets Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure performance
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        lcp: navigation.loadEventEnd - navigation.fetchStart,
        ttfb: navigation.responseStart - navigation.requestStart
      };
    });
    
    // Assert performance budgets
    expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.ttfb).toBeLessThan(600); // TTFB < 600ms
  });
  
  test('bundle size is within limits', async ({ page }) => {
    await page.goto('/');
    
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .map((r: PerformanceResourceTiming) => ({
          name: r.name,
          size: r.transferSize
        }));
    });
    
    const jsBundle = resources.find(r => r.name.includes('index'));
    expect(jsBundle?.size).toBeLessThan(500000); // < 500KB
  });
});
```

---

## Security Testing

```typescript
// e2e/security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Security', () => {
  test('prevents XSS in project name', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=Create Project');
    
    // Try to inject script
    await page.fill('input[name="name"]', '<script>alert("XSS")</script>');
    await page.click('button[type="submit"]');
    
    // Verify script is escaped
    const content = await page.content();
    expect(content).not.toContain('<script>alert("XSS")</script>');
    expect(content).toContain('&lt;script&gt;');
  });
  
  test('requires authentication for protected routes', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/projects');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
  
  test('sanitizes user input', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=Create Project');
    
    // Try SQL injection
    await page.fill('input[name="name"]', "'; DROP TABLE projects; --");
    await page.click('button[type="submit"]');
    
    // Verify input is sanitized (no server error)
    await expect(page.locator('text=Project created')).toBeVisible();
  });
});
```

---

## Test Data Management

### Factories

```typescript
// src/tests/factories/project.factory.ts
export function createProject(overrides = {}) {
  return {
    id: `project-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    category: 'web',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

export function createProjects(count: number, overrides = {}) {
  return Array.from({ length: count }, () => createProject(overrides));
}
```

### Fixtures

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { createProjects } from '../src/tests/factories/project.factory';

export const test = base.extend({
  // Authenticated page
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
  
  // Pre-populated projects
  projectsPage: async ({ authenticatedPage }, use) => {
    // Create test projects via API
    const projects = createProjects(5);
    for (const project of projects) {
      await authenticatedPage.request.post('/api/projects', {
        data: project
      });
    }
    await authenticatedPage.goto('/projects');
    await use(authenticatedPage);
  }
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Coverage Goals

### Overall Targets

| Metric | Current | Q1 2025 | Q2 2025 |
|--------|---------|---------|---------|
| **Overall** | <20% | >80% | >85% |
| **Utilities** | 0% | 90% | 95% |
| **Components** | 0% | 75% | 85% |
| **Hooks** | 0% | 85% | 90% |
| **Backend** | 30% | 85% | 90% |

### Priority Areas

1. **Critical Paths** (100% coverage)
   - Authentication
   - Project CRUD
   - Service management
   - AI agent calls

2. **High Risk** (90% coverage)
   - Payment processing
   - Data export
   - Security features

3. **Standard** (80% coverage)
   - UI components
   - Utilities
   - Hooks

---

## Running Tests

```bash
# Unit tests
npm run test:unit

# Watch mode
npm run test:unit -- --watch

# Coverage
npm run test:unit -- --coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# E2E in headed mode (see browser)
npm run test:e2e -- --headed

# All tests
npm run test
```

---

## Best Practices

1. **Test Behavior, Not Implementation**
2. **Use Descriptive Test Names**
3. **Follow AAA Pattern** (Arrange, Act, Assert)
4. **One Assertion Per Test** (when possible)
5. **Avoid Test Interdependence**
6. **Clean Up After Tests**
7. **Use Factories for Test Data**
8. **Mock External Dependencies**
9. **Test Error Cases**
10. **Keep Tests Fast**

---

## Conclusion

This comprehensive testing strategy provides a roadmap to achieve 80%+ test coverage and ensure high-quality software. Implementation should begin immediately in Q1 2025.

---

**Maintained by**: Krosebrook Team  
**Last Updated**: December 30, 2024
