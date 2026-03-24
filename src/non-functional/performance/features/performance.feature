@non-functional @performance @regression
Feature: Performance template
  As a product owner
  I want baseline page performance checks
  So that load time remains acceptable

  Scenario: Home page load budget
    When I navigate to the home page
    Then the page should load within 5000 milliseconds
