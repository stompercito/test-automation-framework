@functional @api @smoke
Feature: Employees API smoke
  As a QA engineer
  I want core employee API coverage
  So that CRUD risks are detected early

  Scenario: Create and read employee
    Given I have a valid employee payload
    When I create the employee via API
    Then the employee is created successfully
