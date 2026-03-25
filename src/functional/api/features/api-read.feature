@functional @api @regression
Feature: Employees API Read
  As a QA engineer
  I want employee retrieval behavior to be reliable
  So that employee data can be queried safely

  Scenario: [API-F-002] Get all employees returns a valid list
    Given an employee exists via API
    When I request all employees
    Then the employee list response should be successful

  Scenario: [API-F-003] Get employee by valid id
    Given an employee exists via API
    When I request employee by id
    Then the employee by id response should match seeded employee
    And the employee by id payroll should match business rules

  Scenario Outline: [API-F-009] Invalid UUID handling for get
    Given I use invalid employee id "<invalidId>"
    When I request "get" with invalid employee id
    Then the API response should be a client error

    Examples:
      | invalidId                           |
      | not-a-uuid                          |
      | 12345                               |
      | 12345678-1234-1234-1234-12345678901 |
