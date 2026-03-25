@functional @ui @regression
Feature: Add Employee
  As a benefits administrator
  I want to add employees
  So that new hires are included in payroll

  Scenario: [UI-F-002] Add employee happy path
    Given I am authenticated on the benefits dashboard
    When I add a new employee through the UI modal
    Then the new employee should be visible in the employee table
    And the created employee row should show correct payroll calculations

  Scenario: [UI-F-006] Cancel add should not persist new record
    Given I am authenticated on the benefits dashboard
    When I attempt to add an employee but cancel the modal
    Then no new employee should be created

  Scenario: [UI-F-008] Add modal opens clean after cancel
    Given I am authenticated on the benefits dashboard
    When I open add modal, type values, cancel, and open add modal again
    Then the add modal fields should be empty
