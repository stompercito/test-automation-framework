@functional @ui @regression
Feature: Delete Employee
  As a benefits administrator
  I want to remove employees
  So that inactive records are no longer shown

  @requiresEmployee
  Scenario: [UI-F-004] Delete employee happy path
    Given I am authenticated on the benefits dashboard
    When I delete the existing employee and confirm
    Then the employee should not be visible in the table by id

  @requiresEmployee
  Scenario: [UI-F-005] Cancel delete keeps employee
    Given I am authenticated on the benefits dashboard
    When I open delete and cancel for the existing employee
    Then the employee should remain visible in the table by id
