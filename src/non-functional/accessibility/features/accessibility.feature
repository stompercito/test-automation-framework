@non-functional @accessibility @smoke
Feature: Accessibility template
  As a product owner
  I want baseline accessibility checks
  So that users can navigate key pages

  Background:
    Given I am on the home page

  Scenario: Title is present
    Then the page should have a title

  Scenario: Images include alt text
    Then all images should have alt text
