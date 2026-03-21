@non-functional @performance @regression
Feature: Page Performance
  As a product owner
  I want the application pages to load within acceptable time limits
  So that users have a fast and responsive experience

  Background:
    Given I measure performance from the home page

  Scenario: Home page loads within 3 seconds
    When I navigate to the home page
    Then the page should load within 3000 milliseconds

  Scenario: LCP metric is within budget
    When I navigate to the home page
    Then the Largest Contentful Paint should be under 2500 milliseconds
