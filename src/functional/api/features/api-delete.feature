@functional @api @regression
Feature: Employees API Delete
  As a QA engineer
  I want employee deletion behavior to be reliable
  So that removed employees are no longer accessible

  Scenario: [API-F-005] Delete employee by valid id
    Given an employee exists via API
    When I delete the seeded employee by id
    And I request employee by id
    Then the API response should be a client error

  Scenario Outline: [API-F-009] Invalid UUID handling for delete
    Given I use invalid employee id "<invalidId>"
    When I request "delete" with invalid employee id
    Then the API response should be a client error

    Examples:
      | invalidId                           |
      | not-a-uuid                          |
      | 12345                               |
      | 12345678-1234-1234-1234-12345678901 |
