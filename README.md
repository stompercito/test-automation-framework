# test-automation-framework

A scalable, maintainable, and BDD-driven test automation framework built on **Playwright** and **Cucumber (Gherkin)**, covering both **functional** (UI & API) and **non-functional** (accessibility & performance) testing.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Quick Start](#quick-start)
4. [Running Tests](#running-tests)
5. [Reports](#reports--dashboard)
6. [Test Plan, Test Cases & Bugs](#test-plan-test-cases--bugs)
7. [Writing Tests](#writing-tests)
   - [Page Object Model (UI)](#page-object-model-ui)
   - [API Clients & Hooks](#api-clients--hooks)
   - [BDD / Gherkin Feature Files](#bdd--gherkin-feature-files)
8. [Configuration](#configuration)
9. [Tags & Test Filtering](#tags--test-filtering)
10. [Framework Design Decisions (ISTQB-backed)](#framework-design-decisions-istqb-backed)
11. [Scalability & Extensibility](#scalability--extensibility)

---

## Architecture Overview

```
+--------------------------------------------------------------+
|                  test-automation-framework                   |
|                                                              |
|  +-----------------------+  +------------------------------+ |
|  |    FUNCTIONAL          |  |    NON-FUNCTIONAL            | |
|  |  +--------+ +-------+  |  |  +-----------+ +----------+ | |
|  |  |  UI    | |  API  |  |  |  |Accessibility| |Performance| | |
|  |  | (POM)  | |CRUD/Auth| |  |  |  (Hybrid)  | |CRUD/Stable| | |
|  |  +--------+ +-------+  |  |  +-----------+ +----------+ | |
|  +-----------------------+  +------------------------------+ |
|                                                              |
|  +--------------------------------------------------------+  |
|  |                     SHARED LAYER                        |  |
|  | clients | config | fixtures | pages |                    |  |
|  | steps   | test-data | utils                              |  |
|  +--------------------------------------------------------+  |
|                                                              |
|  +------------------+  +---------------------------------+  |
|  | Playwright Engine|  | Cucumber Runner (Primary)        |  |
|  |  (UI/API driver) |  |  (.feature + step definitions)  |  |
|  +------------------+  +---------------------------------+  |
|                                                              |
|  +------------------------------------------------------+    |
|  |        Reports (Cucumber HTML dashboard)             |    |
|  +------------------------------------------------------+    |
+--------------------------------------------------------------+
```

---

## Directory Structure

```
test-automation-framework/
+-- src/
|   +-- functional/
|   |   +-- ui/
|   |   |   +-- features/        # Gherkin feature files (UI)
|   |   |   |   +-- smoke.feature
|   |   |   |   +-- add-employee.feature
|   |   |   |   +-- edit-employee.feature
|   |   |   |   +-- delete-employee.feature
|   |   |   |   +-- dashboard-validations.feature
|   |   +-- api/
|   |       +-- features/        # Gherkin feature files (API)
|   |       |   +-- api-smoke.feature
|   |       |   +-- api-create.feature
|   |       |   +-- api-read.feature
|   |       |   +-- api-update.feature
|   |       |   +-- api-delete.feature
|   |       |   +-- api-auth.feature
|   +-- non-functional/
|       +-- accessibility/
|       |   +-- features/        # Gherkin feature files (a11y)
|       |   |   +-- accessibility-hybrid.feature
|       +-- performance/
|           +-- features/        # Gherkin feature files (perf)
|           |   +-- performance-crud.feature
+-- shared/
|   +-- clients/
|   |   +-- employees.client.ts  # Shared API client classes
|   +-- config/
|   |   +-- config.ts            # Central environment configuration
|   +-- fixtures/
|   |   +-- world.ts             # Cucumber CustomWorld (shared context)
|   |   +-- hooks.ts             # Before/After lifecycle hooks
|   +-- pages/                   # Shared UI page objects/components
|   +-- steps/                   # Shared Cucumber step definitions
|   |   +-- api/
|   |   +-- ui/
|   |   +-- performance/
|   |   +-- accessibility/
|   +-- test-data/               # Builders and DDT matrices
|   +-- utils/
|       +-- api-client.ts        # Abstract API client base class
|       +-- auth.ts              # API auth header helpers
|       +-- payroll.ts           # Payroll/business-rule helpers
+-- reports/                     # Generated reports (git-ignored)
|   +-- html/
|   +-- csv/
+-- playwright.config.ts         # Playwright multi-project config
+-- cucumber.config.js           # Cucumber / BDD config
+-- tsconfig.json
+-- .env.example                 # Environment variable template
+-- package.json
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

Primary execution is **Cucumber**, which acts as the test runner for this framework by executing `.feature` files and matching them to step definitions in `shared/steps/**`.

BDD was chosen so test scenarios can be written in business-readable language (`Given / When / Then`), making the suite easier to review with non-developers, map to acceptance criteria, and maintain as living documentation.

| Command | Description |
|---|---|
| `npm test` | Run all suites (functional + non-functional) |
| `npm run test:functional` | Run all functional suites (UI + API) |
| `npm run test:non-functional` | Run all non-functional suites (Accessibility + Performance) |
| `npm run test:ui` | Run UI functional suite only |
| `npm run test:ui:headed` | Run UI functional suite only with visible browser (`HEADLESS=false`) |
| `npm run test:api` | Run API functional suite only |
| `npm run test:smoke` | Run only scenarios tagged with `@smoke` |
| `npm run test:accessibility` | Run accessibility non-functional suite only |
| `npm run test:accessibility:headed` | Run accessibility suite with visible browser (`HEADLESS=false`) |
| `npm run test:performance` | Run performance non-functional suite only |

`npm test` also updates `reports/csv/paylocity-test-cases.csv` after execution by writing the latest automated result into the `last_execution` column.

- Single-scenario test cases are written as the latest timestamp plus `PASS` or `FAIL`
- Scenario outlines / repeated automated executions are written with example-style entries such as `#1.1 PASS | #1.2 FAIL`
- Rows for test cases that were not part of the latest automated execution remain untouched, which keeps manual-only or not-run rows intact

---

## Reports & Dashboard

The framework generates a single primary report via Cucumber HTML:

- Output file: `reports/html/cucumber-report.html`
- Source: `cucumber.config.js` formatter `html:reports/html/cucumber-report.html`
- `npm test` also writes a machine-readable JSON report to `reports/json/cucumber-report.json` so the CSV test-case catalog can be synced automatically

Open it directly after any test run:

- Windows: `start reports\html\cucumber-report.html`
- macOS: `open reports/html/cucumber-report.html`
- Linux: `xdg-open reports/html/cucumber-report.html`
- npm script (Windows): `npm run report:cucumber:open`

---

## Test Plan, Test Cases & Bugs

Use the following files as the source of QA strategy, coverage, and defect tracking artifacts:

- **Test strategy / approach**
  - `paylocity-test-plan.md` (canonical source in repo root)
  - `reports/paylocity-test-plan.md`
- **Test cases catalog (CSV)**
  - `reports/csv/paylocity-test-cases.csv`
- **Data-driven matrices (CSV)**
  - `reports/csv/paylocity-test-data-matrices.csv`
- **Bug reporting template (CSV)**
  - `reports/csv/paylocity-bug-report-template.csv`
- **Bug reports output (recommended location)**
  - `reports/csv/` (for generated or manually filled bug report files)

Recommended reading order:
1. Test plan (`paylocity-test-plan.md`)
2. Test cases (`reports/csv/paylocity-test-cases.csv`)
3. Data matrices (`reports/csv/paylocity-test-data-matrices.csv`)
4. Bug report template (`reports/csv/paylocity-bug-report-template.csv`)
5. Bug report outputs (stored under `reports/csv/`)

---

## Writing Tests

### Page Object Model (UI)

Every screen in the application gets a **Page class** that extends `BasePage`:

```typescript
// shared/pages/my-screen.page.ts
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
// shared/clients/users.client.ts
import { ApiClient } from '../utils/api-client';
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

Step definitions live in `shared/steps/**` and receive the `CustomWorld` context which provides both `this.page` (UI) and `this.apiContext` (API).

---

## Configuration

All configuration is centralised in `shared/config/config.ts` and driven by environment variables. Copy `.env.example` to `.env` and set the values for your environment:

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod/Account/Login` | UI login URL used by functional UI tests |
| `API_BASE_URL` | `https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod` | Base URL for API clients and API tests |
| `PAYLOCITY_USERNAME` | `replace_me` | Primary username used for UI/API authentication |
| `PAYLOCITY_PASSWORD` | `replace_me` | Primary password used for UI/API authentication |
| `API_AUTH_TOKEN` | `` | Optional API token auth for API requests |
| `ENVIRONMENT` | `staging` | Optional environment label: `local` / `staging` / `production` |
| `HEADLESS` | `true` | Runs browser headlessly unless set to `false` |
| `SLOW_MO` | `0` | Milliseconds between Playwright actions |
| `DEFAULT_TIMEOUT` | `30000` | Default action timeout (ms) |
| `NAVIGATION_TIMEOUT` | `60000` | Navigation timeout (ms) |

---

## Tags & Test Filtering

Tags are applied directly in feature files and used for test filtering:

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
npx cucumber-js --config cucumber.config.js --tags "@smoke and @critical"

# Run everything except low-priority
npx cucumber-js --config cucumber.config.js --tags "not @low"
```

---

## Framework Design Decisions (ISTQB-backed)

This section justifies every architectural decision with references to the **ISTQB Foundation Level (FL)** syllabus and **ISTQB Test Automation Engineer (TAE)** guidelines.

### 1. Two-Layer Testing Taxonomy: Functional vs Non-Functional

**ISTQB FL 2.3** classifies testing into functional and non-functional testing. Keeping them in separate directory trees (`src/functional/` and `src/non-functional/`) ensures:
- Each layer can be run in isolation (`npm run test:functional` and `npm run test:non-functional`).
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

In this framework, Cucumber is the primary test runner, while Playwright is the execution engine used underneath for browser automation, API interactions, and hybrid checks. This separation keeps test intent readable at the feature level while still giving the suite reliable low-level automation capabilities.

### 4. API Hooks for Test Prerequisites

**ISTQB TAE** advises minimising the scope of each test to reduce flakiness. UI interactions are slower and more brittle than API calls. Using `ApiClient` hooks to seed data means:
- Setup is ~10-50x faster than clicking through a UI flow.
- UI tests focus on UI behaviour, not data setup.
- Failures are isolated to the scenario under test, not setup steps.

### 5. Centralised Configuration

**ISTQB FL 5.1** (test environment management) requires that environments are identifiable and repeatable. The `config.ts` module reads from `.env` files so that:
- No credentials are hard-coded in test files.
- The same test suite runs against `local`, `staging`, and `production` without code changes.
- CI/CD pipelines inject environment variables securely.

### 6. Playwright as the Core Engine

Playwright was chosen over Selenium and Cypress because:
- **Multi-browser support** (Chromium, Firefox, WebKit) out of the box - aligns with ISTQB FL risk-based test approach (cover more browsers).
- **Trace viewer, screenshots, video** on failure aid ISTQB FL 5.4 defect reporting.
- **Native API request context** enables hybrid UI/API tests without extra dependencies.
- **Auto-waiting** reduces flaky tests caused by timing issues (ISTQB TAE reliability principle).

### 7. Cucumber-First Execution Model

The framework is executed primarily through **Cucumber `.feature` files** for collaborative, requirement-aligned automation.

Playwright remains the execution engine (browser/API driver), while scenarios and step definitions are the source of truth for test intent.

### 8. Cucumber HTML Reports

**ISTQB FL 5.3** requires test progress and results to be communicated effectively. This framework standardises reporting through:
- **Cucumber HTML report** - scenario/step execution results generated from `.feature` + step definitions.

### 9. Non-Functional Testing built-in

**ISTQB FL 2.3** defines non-functional testing as testing "how well" a system behaves. Most frameworks bolt this on as an afterthought. This framework treats it as a first-class citizen:
- **Accessibility** - WCAG 2.1 AA compliance (legal requirement in many jurisdictions).
- **Performance** - Navigation Timing API metrics with configurable budgets, ensuring CI gates on load time regressions.

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
| New page | Add a class in `shared/pages/` extending `BasePage` |
| New API resource | Add a client in `shared/clients/` extending `ApiClient` |
| New test category | Add feature files under `src/functional/` or `src/non-functional/` and register paths/profiles in `cucumber.config.js` |
| New environment | Add a new `.env.<name>` file and load it in your local shell/CI before running `npm test` |
| CI/CD integration | Use `npm run test:functional` (or `npm test` for full coverage) as primary pipeline execution |
| Visual regression | Add `@playwright/experimental-ct-react` or integrate Percy/Applitools |
| Load testing | Add a `src/non-functional/load/` project using k6 or Artillery |
| Contract testing | Add Pact.js under `src/functional/api/contracts/` |
| Parallel execution | Increase `workers` in `playwright.config.ts`; Cucumber supports `--parallel N` |

