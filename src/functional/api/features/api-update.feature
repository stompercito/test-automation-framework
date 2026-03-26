@functional @api @regression
Feature: Employees API Update
  As a QA engineer
  I want employee update behavior to be reliable
  So that employee data stays consistent after changes

  Scenario: [API-F-004] Update employee with valid payload
    Given an employee exists via API
    When I update the seeded employee with valid data
    Then updated employee data should be persisted
    And updated employee payroll should match business rules
