@functional @ui @smoke
Feature: Benefits Dashboard smoke
  As a benefits administrator
  I want to access the dashboard
  So that I can manage employees

  Scenario: Login and dashboard visibility
    Given I am on the Paylocity login page
    When I login with configured credentials
    Then I should see the benefits dashboard
