@functional @ui @regression
Feature: Add Employee
  As a benefits administrator
  I want to add employees
  So that new hires are included in payroll

  Scenario: [UI-F-002] Add employee happy path
    Given I am authenticated on the benefits dashboard
    When I add a new employee through the UI modal
    Then the new employee should be visible in the employee table
    And payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee

  Scenario: [UI-F-006] Cancel add should not persist new record
    Given I am authenticated on the benefits dashboard
    When I attempt to add an employee but cancel the modal
    Then no new employee should be created

  Scenario: [UI-F-008] Add modal opens clean after cancel
    Given I am authenticated on the benefits dashboard
    When I open add modal, type values, cancel, and open add modal again
    Then the add modal fields should be empty

  Scenario Outline: [UI-F-012] Add employee modal rejects invalid dependants values and does not save the employee
    Given I am authenticated on the benefits dashboard
    When I open the add employee modal
    And I enter valid employee data except for invalid dependants variation "<dependantsCase>"
    And I submit the add employee form
    Then the add employee flow should not complete successfully
    And no new employee should be created

    Examples:
      | dependantsCase          |
      | negative dependants     |
      | dependants above max    |
      | decimal dependants      |
      | text dependants         |
      | blank dependants        |
      | spaces only dependants  |
      | mixed dependants text   |

  Scenario Outline: [UI-F-020] Add employee modal rejects invalid firstName or lastName values and does not persist them
    Given I am authenticated on the benefits dashboard
    When I open the add employee modal
    And I enter employee data using invalid name variation "<nameCase>"
    And I submit the add employee form
    Then the add employee flow should not complete successfully
    And invalid employee name values should not be accepted in the table

    Examples:
      | nameCase                 |
      | firstName numeric only   |
      | lastName numeric only    |
      | both names numeric only  |
      | firstName blank          |
      | lastName blank           |
      | both names blank         |
      | firstName spaces only    |
      | lastName spaces only     |
      | both names spaces only   |
      | firstName mixed alphanumeric |
      | lastName mixed alphanumeric  |
      | firstName over 50 chars  |
      | lastName over 50 chars   |
      | both names over 50 chars |

  Scenario Outline: [UI-F-021] Add employee modal accepts valid boundary values and persists them correctly
    Given I am authenticated on the benefits dashboard
    When I open the add employee modal
    And I enter employee data using valid add boundary variation "<boundaryCase>"
    And I submit the add employee form
    Then the new employee should be visible in the employee table
    And first and last name columns should map correctly for that employee
    And payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee

    Examples:
      | boundaryCase                    |
      | min names and min dependants    |
      | max names and max dependants    |
      | typical names and zero dependants |
      | typical names and max dependants  |
