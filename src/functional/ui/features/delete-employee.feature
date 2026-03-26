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

  Scenario: [UI-F-018] Delete flow remains correct when multiple employees are present
    Given I am authenticated on the benefits dashboard
    And multiple employees exist via API
    When I delete the existing employee and confirm
    Then only the selected employee should be removed while other seeded employees remain visible
