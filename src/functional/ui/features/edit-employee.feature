@functional @ui @regression
Feature: Edit Employee
  As a benefits administrator
  I want to edit existing employees
  So that employee details stay accurate

  @requiresEmployee
  Scenario: [UI-F-003] Edit employee happy path
    Given I am authenticated on the benefits dashboard
    When I edit the existing employee through the UI modal
    Then the employee row should appear in the table with the expected values and business-rule calculations

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

  @requiresEmployee
  Scenario Outline: [UI-F-016] Edit modal rejects invalid dependants values and does not save the changes
    Given I am authenticated on the benefits dashboard
    When I open the edit modal for the existing employee
    And I replace dependants with invalid edit variation "<dependantsCase>"
    And I submit the edit employee form
    Then the edit employee flow should not complete as a successful save
    And the existing employee should remain unchanged in the table

    Examples:
      | dependantsCase         |
      | negative dependants    |
      | dependants above max   |
      | decimal dependants     |
      | text dependants        |
      | blank dependants       |
      | spaces only dependants |
