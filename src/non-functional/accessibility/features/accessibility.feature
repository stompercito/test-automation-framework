@non-functional @accessibility @smoke @v3
Feature: Accessibility Compliance
  As a product owner
  I want the application to meet WCAG 2.1 AA accessibility standards
  So that users with disabilities can use the application

  Background:
    Given I am on the home page

  @critical
  Scenario: Home page has no critical accessibility violations
    Then the page should have no critical accessibility violations

  @regression
  Scenario: All images have alt text
    Then all images should have descriptive alt text

  @regression
  Scenario: Interactive elements are keyboard navigable
    Then all interactive elements should be reachable via keyboard
