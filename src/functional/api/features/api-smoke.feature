@functional @api @smoke
Feature: Employees API Smoke
  As a QA engineer
  I want smoke validation per CRUD operation
  So that failures are immediately visible by operation

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
