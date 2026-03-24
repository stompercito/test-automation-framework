@functional @ui @smoke
Feature: UI flow template
  As a user
  I want to validate a basic UI flow
  So that I can confirm core behavior

  Background:
    Given the user is on the application home page

  Scenario: Search and validate results
    When the user searches for "<search-term>"
    Then the result area should be visible
