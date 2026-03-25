@functional @ui @regression
Feature: Edit Employee
  As a benefits administrator
  I want to edit existing employees
  So that employee details stay accurate

  @requiresEmployee
  Scenario: [UI-F-003] Edit employee happy path
    Given I am authenticated on the benefits dashboard
    When I edit the existing employee through the UI modal
    Then the employee row should show updated values
    And payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee

  @requiresEmployee
  Scenario: [UI-F-006] Cancel edit should not persist changes
    Given I am authenticated on the benefits dashboard
    When I open edit and cancel for the existing employee
    Then the existing employee should remain unchanged in the table

  @requiresEmployee
  Scenario: [UI-F-007] Modal action buttons toggle correctly
    Given I am authenticated on the benefits dashboard
    When I open the add employee modal
    Then the add button should be visible and update button hidden
    When I open the edit modal for the existing employee
    Then the update button should be visible and add button hidden

  @requiresEmployee
  Scenario: [UI-F-015] Edit modal pre-populates selected employee values
    Given I am authenticated on the benefits dashboard
    When I open the edit modal for the existing employee
    Then the edit modal should show the selected employee values
