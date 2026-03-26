@functional @api @smoke
Feature: Employees API Smoke
  As a QA engineer
  I want smoke validation per CRUD operation
  So that failures are immediately visible by operation

  Scenario: [API-F-014] End-to-end CRUD chain remains consistent
    Given I have a valid employee payload
    When I create the employee via API
    Then the employee is created successfully
    And the created employee payroll should match business rules
    When I request employee by id
    Then the employee by id response should match seeded employee
    When I update the seeded employee with valid data
    Then updated employee data should be persisted
    And updated employee payroll should match business rules
    When I delete the seeded employee by id
    And I request employee by id
    Then the API response should be a client error

  Scenario Outline: [SMK-A-001] <operation> uses <method> <endpoint> and returns expected status
    Given API smoke prerequisites are ready for "<operation>"
    When I execute API smoke operation "<operation>"
    Then API smoke operation "<operation>" should return "<expectedStatus>"
    And API smoke payroll should follow business rules for "<operation>"
    And I attach API smoke trace for operation "<operation>" using "<method>" on "<endpoint>"

    Examples:
      | operation | method | endpoint            | expectedStatus |
      | create    | POST   | /api/Employees      | 200            |
      | read      | GET    | /api/Employees/{id} | 200            |
      | update    | PUT    | /api/Employees      | 200            |
      | delete    | DELETE | /api/Employees/{id} | 200-or-204     |
