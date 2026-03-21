# test-automation-framework

A scalable, maintainable, and BDD-driven test automation framework built on **Playwright** and **Cucumber (Gherkin)**, covering both **functional** (UI & API) and **non-functional** (accessibility & performance) testing.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Quick Start](#quick-start)
4. [Running Tests](#running-tests)
5. [Reports & Dashboard](#reports--dashboard)
6. [Writing Tests](#writing-tests)
   - [Page Object Model (UI)](#page-object-model-ui)
   - [API Clients & Hooks](#api-clients--hooks)
   - [BDD / Gherkin Feature Files](#bdd--gherkin-feature-files)
7. [Configuration](#configuration)
8. [Tags & Test Filtering](#tags--test-filtering)
9. [Framework Design Decisions (ISTQB-backed)](#framework-design-decisions-istqb-backed)
10. [Scalability & Extensibility](#scalability--extensibility)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  test-automation-framework                   │
│                                                              │
│  ┌───────────────────────┐  ┌──────────────────────────────┐ │
│  │    FUNCTIONAL          │  │    NON-FUNCTIONAL            │ │
│  │  ┌────────┐ ┌───────┐  │  │  ┌───────────┐ ┌──────────┐ │ │
│  │  │  UI    │ │  API  │  │  │  │Accessibility│ │Performance│ │ │
│  │  │ (POM)  │ │(Client│  │  │  │ (WCAG 2.1)│ │(Nav Timing│ │ │
│  │  └────────┘ └───────┘  │  │  └───────────┘ └──────────┘ │ │
│  └───────────────────────┘  └──────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     SHARED LAYER                        │  │
│  │   config  │  fixtures/world  │  fixtures/hooks  │ utils │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │  Playwright Test │  │  Cucumber (Gherkin / BDD)        │  │
│  │  (native .spec)  │  │  (.feature + step definitions)  │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │             Reports (HTML dashboard + Allure)        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
test-automation-framework/
├── src/
│   ├── functional/
│   │   ├── ui/
│   │   │   ├── pages/           # Page Object Model classes
│   │   │   │   ├── base.page.ts
│   │   │   │   ├── login.page.ts
│   │   │   │   └── dashboard.page.ts
│   │   │   ├── features/        # Gherkin feature files (UI)
│   │   │   │   └── authentication.feature
│   │   │   ├── steps/           # Cucumber step definitions (UI)
│   │   │   │   └── authentication.steps.ts
│   │   │   └── ui.spec.ts       # Playwright-native UI spec
│   │   └── api/
│   │       ├── clients/         # API client classes
│   │       │   └── posts.client.ts
│   │       ├── features/        # Gherkin feature files (API)
│   │       │   └── posts.feature
│   │       ├── steps/           # Cucumber step definitions (API)
│   │       │   └── posts.steps.ts
│   │       └── api.spec.ts      # Playwright-native API spec
│   └── non-functional/
│       ├── accessibility/
│       │   ├── features/        # Gherkin feature files (a11y)
│       │   │   └── accessibility.feature
│       │   ├── steps/
│       │   │   └── accessibility.steps.ts
│       │   └── accessibility.spec.ts
│       └── performance/
│           ├── features/        # Gherkin feature files (perf)
│           │   └── performance.feature
│           ├── steps/
│           │   └── performance.steps.ts
│           └── performance.spec.ts
├── shared/
│   ├── config/
│   │   ├── config.ts            # Central environment configuration
│   │   └── tags.ts              # BDD tag constants
│   ├── fixtures/
│   │   ├── world.ts             # Cucumber CustomWorld (shared context)
│   │   └── hooks.ts             # Before/After lifecycle hooks
│   └── utils/
│       ├── api-client.ts        # Abstract API client base class
│       └── helpers.ts           # Miscellaneous utilities
├── reports/                     # Generated reports (git-ignored)
│   ├── html/
│   └── allure-results/
├── playwright.config.ts         # Playwright multi-project config
├── cucumber.config.ts           # Cucumber / BDD config
├── tsconfig.json
├── .env.example                 # Environment variable template
└── package.json
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/stompercito/test-automation-framework.git
cd test-automation-framework

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install

# 4. Copy and edit environment variables
cp .env.example .env
# Edit .env with your BASE_URL, credentials, etc.

# 5. Run all tests
npm test
```

---

## Running Tests

| Command | Description |
|---|---|
| `npm test` | Run ALL Playwright tests across all projects |
| `npm run test:ui` | Functional – UI tests only |
| `npm run test:api` | Functional – API tests only |
| `npm run test:accessibility` | Non-functional – Accessibility tests |
| `npm run test:performance` | Non-functional – Performance tests |
| `npm run test:functional` | UI + API tests combined |
| `npm run test:non-functional` | Accessibility + Performance combined |
| `npm run test:bdd` | Run ALL BDD (Gherkin) scenarios via Cucumber |
| `npm run test:bdd:ui` | BDD UI scenarios only (`@ui` tag) |
| `npm run test:bdd:api` | BDD API scenarios only (`@api` tag) |
| `npm run test:bdd:smoke` | Smoke scenarios only (`@smoke` tag) |
| `npm run test:bdd:regression` | Regression scenarios only |

---

## Reports & Dashboard

### Playwright HTML Report (built-in)

After any test run the HTML report is written to `reports/html/`. Open it with:

```bash
npm run report:open
```

This opens an interactive dashboard showing pass/fail counts, durations, screenshots on failure, video replays, and trace viewer links.

### Allure Report

Allure provides a rich, interactive dashboard with trend charts, categories, and timeline views:

```bash
# Generate + open
npm run report:allure

# Or step by step:
npm run report:allure:generate   # process raw results → HTML site
npm run report:allure:open       # open the site in the browser
```

---

## Writing Tests

### Page Object Model (UI)

Every screen in the application gets a **Page class** that extends `BasePage`:

```typescript
// src/functional/ui/pages/my-screen.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class MyScreenPage extends BasePage {
  readonly heading: Locator = this.page.getByRole('heading', { level: 1 });

  constructor(page: Page) { super(page); }

  async goto() {
    await this.navigate('/my-screen');
    await this.waitForLoad();
  }
}
```

Use the page object in your spec or step definition:

```typescript
const screen = new MyScreenPage(page);
await screen.goto();
await expect(screen.heading).toBeVisible();
```

### API Clients & Hooks

Extend `ApiClient` to create a typed client for each API resource:

```typescript
// src/functional/api/clients/users.client.ts
import { ApiClient } from '../../../shared/utils/api-client';
export class UsersClient extends ApiClient {
  async getUser(id: number) { return this.get(`/users/${id}`); }
}
```

Use the client in BDD `Before` hooks to **seed prerequisites without touching the UI**:

```typescript
// In a step definitions file
Before({ tags: '@requires-user' }, async function (this: CustomWorld) {
  const users = new UsersClient(this.apiContext);
  const { body } = await users.createUser({ name: 'Test User' });
  this.data['userId'] = body.id;
});
```

This keeps UI scenarios fast by avoiding unnecessary browser interactions for setup steps.

### BDD / Gherkin Feature Files

Write human-readable scenarios using **Gherkin** syntax:

```gherkin
@functional @ui @smoke
Feature: Product Search
  As a shopper
  I want to search for products
  So that I can find what I need quickly

  @critical
  Scenario: Search returns relevant results
    Given the user is on the home page
    When the user searches for "laptop"
    Then at least 1 product result should be displayed
    And all results should contain the word "laptop"
```

Step definitions live in the co-located `steps/` folder and receive the `CustomWorld` context which provides both `this.page` (UI) and `this.apiContext` (API).

---

## Configuration

All configuration is centralised in `shared/config/config.ts` and driven by environment variables. Copy `.env.example` to `.env` and set the values for your environment:

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://example.com` | Web application URL |
| `API_BASE_URL` | `https://jsonplaceholder.typicode.com` | API base URL |
| `TEST_USERNAME` | `test_user` | Default test user |
| `TEST_PASSWORD` | `test_password` | Default test password |
| `ENVIRONMENT` | `local` | `local` / `staging` / `production` |
| `HEADLESS` | `true` | Run browser headlessly |
| `SLOW_MO` | `0` | Milliseconds between Playwright actions |
| `DEFAULT_TIMEOUT` | `30000` | Default action timeout (ms) |
| `NAVIGATION_TIMEOUT` | `60000` | Page navigation timeout (ms) |
| `MAX_LOAD_TIME_MS` | `5000` | Performance test load time budget |
| `MAX_LCP_MS` | `2500` | LCP budget for performance tests |

---

## Tags & Test Filtering

Tags are defined in `shared/config/tags.ts` and applied in feature files:

| Tag | Meaning |
|---|---|
| `@smoke` | Fast, critical path checks |
| `@regression` | Full regression suite |
| `@sanity` | Post-deployment sanity checks |
| `@functional` | Functional test category |
| `@non-functional` | Non-functional category |
| `@ui` | Browser-level UI tests |
| `@api` | API-level tests |
| `@accessibility` | WCAG accessibility tests |
| `@performance` | Load/performance tests |
| `@critical` | Must pass before release |
| `@high` / `@medium` / `@low` | Priority levels |

```bash
# Run only critical smoke tests
npm run test:bdd -- --tags "@smoke and @critical"

# Run everything except low-priority
npm run test:bdd -- --tags "not @low"
```

---

## Framework Design Decisions (ISTQB-backed)

This section justifies every architectural decision with references to the **ISTQB Foundation Level (FL)** syllabus and **ISTQB Test Automation Engineer (TAE)** guidelines.

### 1. Two-Layer Testing Taxonomy: Functional vs Non-Functional

**ISTQB FL 2.3** classifies testing into functional and non-functional testing. Keeping them in separate directory trees (`src/functional/` and `src/non-functional/`) ensures:
- Each layer can be run in isolation (`npm run test:functional`).
- Non-functional tests (performance, accessibility) do not pollute functional test reports.
- Teams can be organised by domain without merge conflicts.

### 2. Page Object Model (POM)

**ISTQB TAE** explicitly recommends the Page Object Model pattern to improve test maintainability. `BasePage` centralises all common interactions; individual page classes own their locators. This means:
- A selector change only requires a one-line edit in the page class, not across dozens of test files.
- Tests become **readable business specifications** rather than technical automation scripts.
- New team members can add pages without understanding Playwright internals.

### 3. BDD / Gherkin with Cucumber

**ISTQB FL 1.5** states that one of testing's core values is communication between stakeholders. BDD achieves this by expressing tests in **ubiquitous language** (Gherkin: Given/When/Then) that business analysts, developers, and testers all understand. Benefits:
- Living documentation: feature files describe what the system does.
- Traceability: each scenario maps directly to a business requirement.
- Reduced ambiguity: acceptance criteria are executable tests.

### 4. API Hooks for Test Prerequisites

**ISTQB TAE** advises minimising the scope of each test to reduce flakiness. UI interactions are slower and more brittle than API calls. Using `ApiClient` hooks to seed data means:
- Setup is ~10–50× faster than clicking through a UI flow.
- UI tests focus on UI behaviour, not data setup.
- Failures are isolated to the scenario under test, not setup steps.

### 5. Centralised Configuration

**ISTQB FL 5.1** (test environment management) requires that environments are identifiable and repeatable. The `config.ts` module reads from `.env` files so that:
- No credentials are hard-coded in test files.
- The same test suite runs against `local`, `staging`, and `production` without code changes.
- CI/CD pipelines inject environment variables securely.

### 6. Playwright as the Core Engine

Playwright was chosen over Selenium and Cypress because:
- **Multi-browser support** (Chromium, Firefox, WebKit) out of the box – aligns with ISTQB FL risk-based test approach (cover more browsers).
- **Trace viewer, screenshots, video** on failure aid ISTQB FL 5.4 defect reporting.
- **Native API request context** enables hybrid UI/API tests without extra dependencies.
- **Auto-waiting** reduces flaky tests caused by timing issues (ISTQB TAE reliability principle).

### 7. Dual Runners: Playwright Native + Cucumber

The framework supports both:
- **Playwright `.spec.ts` files** – for developers who prefer code-first, fast feedback loops.
- **Cucumber `.feature` files** – for BDD collaboration with non-technical stakeholders.

Both runners share the same Page Objects and API clients, so there is no duplication.

### 8. Allure + Playwright HTML Reports

**ISTQB FL 5.3** requires test progress and results to be communicated effectively. Two report formats are provided:
- **Playwright HTML report** – detailed per-test traces, screenshots, and timeline.
- **Allure report** – executive-level dashboard with trend history, categories (broken vs failed), and retry statistics useful for release decisions.

### 9. Non-Functional Testing built-in

**ISTQB FL 2.3** defines non-functional testing as testing "how well" a system behaves. Most frameworks bolt this on as an afterthought. This framework treats it as a first-class citizen:
- **Accessibility** – WCAG 2.1 AA compliance (legal requirement in many jurisdictions).
- **Performance** – Navigation Timing API metrics with configurable budgets, ensuring CI gates on load time regressions.

### 10. TypeScript Throughout

TypeScript catches type errors at compile time rather than at runtime. For a test framework, this means:
- Incorrect API response shapes are caught before running tests.
- Refactoring page locators is safe because the compiler reports all usages.
- IDE autocompletion speeds up test authoring (ISTQB TAE: tester productivity).

---

## Scalability & Extensibility

The framework is designed to grow with the product:

| Need | How to extend |
|---|---|
| New page | Add a class in `src/functional/ui/pages/` extending `BasePage` |
| New API resource | Add a client in `src/functional/api/clients/` extending `ApiClient` |
| New test category | Add a folder under `src/functional/` or `src/non-functional/` and register it in `playwright.config.ts` and `cucumber.config.ts` |
| New environment | Add a `.env.staging` file and pass it via `dotenv -e .env.staging npm test` |
| CI/CD integration | Use `npm test` (Playwright) or `npm run test:bdd` (Cucumber); both exit with code 1 on failure |
| Visual regression | Add `@playwright/experimental-ct-react` or integrate Percy/Applitools |
| Load testing | Add a `src/non-functional/load/` project using k6 or Artillery |
| Contract testing | Add Pact.js under `src/functional/api/contracts/` |
| Parallel execution | Increase `workers` in `playwright.config.ts`; Cucumber supports `--parallel N` |
