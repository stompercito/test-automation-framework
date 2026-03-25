@functional @ui @smoke
Feature: Dashboard Smoke
  As a benefits administrator
  I want a full happy path check of employee management
  So that core UI behavior is validated end to end

  Scenario: [SMK-F-001] E2E happy path for add, edit, and delete employee
    Given I am on the Paylocity login page
    When I login with configured credentials
    Then I should see the benefits dashboard
    When I add a new employee through the UI modal
    Then the new employee should be visible in the employee table
    And the created employee row should show correct payroll calculations
    And the dashboard should remain in a valid state
    When I open the edit modal for the created employee
    Then the edit modal should show the created employee values
    When I edit the existing employee through the UI modal
    Then the employee row should show updated values
    And the dashboard should remain in a valid state
    When I delete the existing employee and confirm
    Then the employee should not be visible in the table by id
    And the table should show no employees message
    And the dashboard should remain in a valid state
