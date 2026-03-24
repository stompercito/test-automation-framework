# Paylocity Benefits Dashboard Test Plan

## 1. Purpose
This document defines the testing strategy for the Paylocity Benefits Dashboard bug challenge. The goal is to find defects in both the UI and API, keep the scope practical for repository documentation, and leave a strong base for future automation.

## 2. Application Summary
The application allows an employer to manage employee records and preview benefit-related payroll impact.

### Business rules
- All employees are paid **$2000 per paycheck** before deductions
- There are **26 paychecks per year**
- Employee benefit cost is **$1000/year**
- Each dependent costs **$500/year**

### Core user story
As an Employer, I want to input my employee data so that I can get a preview of benefit costs.

### Acceptance criteria in scope
- Add Employee
- Edit Employee
- Delete Employee
- See the employee in the table
- Verify benefit cost calculations

## 3. Scope

### In scope
#### Functional
- **UI testing**
  - Dashboard load
  - Employees table
  - Add Employee
  - Edit Employee
  - Delete Employee
  - Modal behavior
  - Table refresh and empty state
  - Display of calculated values
- **API testing**
  - Create employee
  - Get all employees
  - Get employee by id
  - Update employee
  - Delete employee
  - Authentication behavior
  - Field validation
  - Schema and contract validation
  - Calculation consistency

#### Non-functional
- **Performance**
  - Basic response time checks for key API operations
  - Basic dashboard/table load checks
  - Repeated CRUD stability checks
- **Accessibility**
  - Keyboard navigation
  - Modal focus behavior
  - Labels and controls
  - Visible focus
  - Icon/button usability
- **UX / Responsive / Visual quality**
  - Layout fit
  - Table overflow
  - Alignment issues
  - Responsiveness across practical viewport sizes
  - Zoom/readability issues

### Out of scope
- Deep security testing
- Penetration testing
- Database validation
- Unit testing
- Full browser compatibility matrix
- Infrastructure/deployment validation
- Localization
- Long-duration endurance testing

## 4. Test Approach

### Test suite layering
The suite must be separated by intent:
- **Smoke**: fast validation of the main happy path flow
- **Detailed / Functional**: deeper coverage per feature
- **Negative**: boundaries, invalid inputs, and error handling
- **Non-Functional**: performance, accessibility, UX/responsive

Smoke does **not** replace detailed suites; it only validates that the most important path still works end-to-end.

### Smoke testing strategy
The smoke suite should run as an end-to-end happy path that validates the primary user flow from start to finish:
- open dashboard
- add employee
- validate the new row appears in the table
- edit that employee
- validate updated values are reflected in the table
- delete the employee
- validate the row disappears from the table

### Test types
- Functional UI
- Functional API
- Non-functional Performance
- Non-functional Accessibility
- Non-functional UX / Responsive / Visual
- Exploratory testing

### Execution classification
Each test case must be classified as one of the following:
- **Manual**
- **Automatable**
- **Hybrid**

### Why some tests remain manual
Some checks should stay manual because they depend on human judgment or are poor automation candidates, for example:
- UX clarity issues
- Visual defects
- Layout misalignment
- Table fit on smaller screens
- Responsive behavior across viewport sizes
- Zoom/readability issues
- Accessibility findings that need real human validation

### Gherkin-like style
Test cases should use human-readable language when possible:
- Given
- When
- Then
- And

Technical detail is allowed inside steps when needed, such as:
- dynamic variables
- ids
- API hooks
- generated test data

### Data-driven testing
Data-driven design should be used when the flow is the same and only the data changes, especially for:
- Boundary values
- Equivalent partitions
- Negative validations
- Repetitive UI or API field validation

This avoids creating many duplicated test cases that differ only by one input value.

### Data-driven traceability
Every data-driven test case must keep explicit traceability to its source matrix.
The main test case should reference the matrix identifier (for example `data_matrix_id` in CSV artifacts).

## 5. ISTQB-Aligned Design Techniques
The following techniques will guide test design:
- **Equivalence Partitioning**
- **Boundary Value Analysis**
- **Decision Table thinking**
- **State Transition thinking**
- **Error Guessing**
- **Exploratory Testing**

Primary candidates:
- `dependants`: boundaries `-1, 0, 1, 31, 32, 33`
- text lengths for `firstName`, `lastName`, `username`: `0, 1, 49, 50, 51`
- invalid UUIDs
- unexpected properties in payloads
- malformed date-time values

## 6. Test Data Strategy
Tests must **not** rely on pre-existing records.

### Rules
- Create test data during execution whenever possible
- Use unique employee data
- Clean up data at the end when appropriate
- Avoid coupling one test to another

### Prerequisites
When a UI test needs an existing employee, prefer creating it through an **API hook** instead of using the UI, unless record creation itself is the behavior being tested.

This keeps the test:
- faster
- less fragile
- more focused
- more deterministic

Example:
- A UI **Delete Employee** test may create the employee by API in the prerequisite step, execute deletion through UI, and skip separate cleanup because delete is the behavior under test.
- A UI **Edit Employee** test may create the employee by API before opening the dashboard, then validate only the edit behavior in UI.

## 7. UI Coverage Notes 
After exploratory testing the inspected UI structure confirms:
- Employees table: `#employeesTable`
- Add button: `#add`
- Employee modal: `#employeeModal`
- Delete confirmation modal: `#deleteModal`
- Fields: `#id`, `#firstName`, `#lastName`, `#dependants`
- Action buttons: `#addEmployee`, `#updateEmployee`, `#deleteEmployee`

### Early UI risk areas
- Application is not responsive when changing the window size.
- `dependants` is a text input in the UI even though it behaves as numeric data, so negative and boundary validation is important.
- Action controls are icon-based, which increases accessibility and usability risk.

### Modal behavior coverage requirements
Add explicit coverage for **Add Employee modal**:
- inputs open empty
- modal opens in the correct state for creation
- only creation actions are visible

Add explicit coverage for **Edit Employee modal**:
- loaded values match the selected employee exactly
- modal opens in the correct state for edition
- only edition actions are visible

### Invalid input handling in UI (not only API)
Boundary and invalid-input checks must be validated directly in UI modals (Create and Edit), not just at API level.
These scenarios must verify:
- operation is not completed
- record is not created or not updated
- modal does not close as if the action succeeded
- visible user feedback exists when an error occurs

### Silent failure risk note
Add an explicit UI risk category for **silent failures**:
- API rejects an invalid operation
- UI shows no clear message or actionable feedback
- user perceives that "nothing happened"

This must be treated as a UX/UI and error-handling defect class and included in planned negative coverage.

## 8. API Coverage Notes
Documented endpoints:
- `POST /api/Employees`
- `GET /api/Employees`
- `PUT /api/Employees`
- `GET /api/Employees/{id}`
- `DELETE /api/Employees/{id}`

### Key schema rules
Required:
- `firstName`
- `lastName`
- `username`

Field constraints:
- `firstName`, `lastName`, `username`: max length 50
- `dependants`: min 0, max 32
- `id`: UUID
- `expiration`: date-time
- `partitionKey`, `sortKey`, `gross`, `benefitsCost`, `net`: read-only
- `additionalProperties: false`

## 9. Non-Functional Strategy

### Performance
Automatable smoke checks should cover:
- employee list response time
- create/update/delete response time
- repeated CRUD stability
- basic dashboard load timing

### Accessibility
Accessibility should be treated mostly as **Hybrid**:
- automated checks for obvious technical issues
- manual checks for keyboard usability, focus order, icon clarity, and interaction quality

### UX / Responsive / Visual
These are usually **Manual** or **Hybrid**, not pure automation candidates:
- table fit on practical viewport sizes
- overflow/truncation
- modal readability
- alignment and spacing
- zoom behavior
- visual clarity of icon actions

## 10. Exploratory Testing
Exploratory testing is part of the plan and should focus on:
- unusual CRUD sequences
- invalid or surprising inputs
- UI/API mismatches
- calculation anomalies
- modal state issues
- refresh and empty-state recovery
- visual and usability defects not covered by scripted tests

## 11. Exit Criteria
A planned scope is considered complete when:
- functional UI tests were executed
- functional API tests were executed
- planned non-functional checks were executed
- exploratory sessions were executed
- defects were documented with reproducible steps
- known gaps, assumptions, and limitations were documented

## 12. Defect Reporting
Each defect report should include:
- Bug ID
- Title
- Area
- Severity / Priority
- Preconditions
- Steps to reproduce
- Test data
- Actual result
- Expected result
- Evidence
- Notes

Deliver bug reports in two groups:
- UI defects
- API defects

## 13. Coverage Gap Analysis
If a defect is found later that was **not** caught by the planned tests, document:
- what was missed
- whether a related test existed
- why it was not detected
- whether a new test should be added
- whether that new test should be **Manual**, **Automatable**, or **Hybrid**
- the reason behind that choice

## 14. Deliverables
This effort should produce:
1. Test Plan
2. Test Cases CSV
3. Bug report for UI defects
4. Bug report for API defects
5. Exploratory notes
6. Coverage gap analysis for missed issues

## 16. References
- UI URL: `https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod/Account/Login`
- Swagger JSON: `https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod/swagger/v1/swagger.json`
- Additional input used for this plan:
  - provided business rules and acceptance criteria
