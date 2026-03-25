@functional @ui @regression
Feature: Dashboard Data Validations
  As a QA engineer
  I want dashboard values to be accurate
  So that payroll data is trustworthy

  Scenario: [UI-F-001] Login and dashboard visibility
    Given I am on the Paylocity login page
    When I login with configured credentials
    Then I should see the benefits dashboard

  @requiresEmployee @seedDependants_2
  Scenario: [UI-F-010] Calculations display correctly for known dependants
    Given I am authenticated on the benefits dashboard
    Then payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee

  Scenario Outline: [UI-F-019] Payroll calculations are correct for accepted dependants limits
    Given I am authenticated on the benefits dashboard
    And an employee exists with dependants <dependants> via API
    Then payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee

    Examples:
      | dependants |
      | 0          |
      | 1          |
      | 31         |
      | 32         |

  @requiresEmployee @seedFirst_Alpha @seedLast_Zulu
  Scenario: [UI-F-011] Header/value mapping for first and last name
    Given I am authenticated on the benefits dashboard
    Then first and last name columns should map correctly for that employee

  @requiresEmployee
  Scenario: [UI-F-014] Table reflects latest state after edit and delete actions
    Given I am authenticated on the benefits dashboard
    When I edit the existing employee through the UI modal
    And I delete the existing employee and confirm
    Then the employee should not be visible in the table by id
