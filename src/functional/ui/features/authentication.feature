@functional @ui @smoke
Feature: User Authentication
  As a registered user
  I want to be able to log in to the application
  So that I can access my personal dashboard

  Background:
    Given the user is on the login page

  @critical
  Scenario: Successful login with valid credentials
    When the user enters username "test_user" and password "test_password"
    And the user clicks the sign-in button
    Then the user should be redirected to the dashboard
    And the dashboard should display a welcome message

  @regression
  Scenario: Failed login with invalid credentials
    When the user enters username "invalid_user" and password "wrong_pass"
    And the user clicks the sign-in button
    Then an error message should be displayed
    And the user should remain on the login page

  @regression
  Scenario Outline: Login with multiple credential combinations
    When the user enters username "<username>" and password "<password>"
    And the user clicks the sign-in button
    Then the login result should be "<result>"

    Examples:
      | username    | password      | result  |
      | test_user   | test_password | success |
      | bad_user    | bad_pass      | failure |
      | test_user   | wrong_pass    | failure |
