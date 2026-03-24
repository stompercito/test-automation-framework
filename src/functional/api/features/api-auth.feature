@functional @api @regression
Feature: Employees API Authentication
  As a security-focused QA engineer
  I want auth validation coverage
  So that unauthorized access is blocked

  Scenario Outline: [API-F-013] Authentication is required for employee endpoints
    Given I use authentication variation "<authVariation>"
    When I request all employees with the selected auth variation
    Then auth outcome should be "<outcome>"

    Examples:
      | authVariation | outcome  |
      | missing       | rejected |
      | invalid-token | rejected |
      | wrong-scheme  | rejected |
      | valid-basic   | accepted |
