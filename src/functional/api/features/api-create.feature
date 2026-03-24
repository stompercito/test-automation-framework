@functional @api @regression
Feature: Employees API Create
  As a QA engineer
  I want employee creation validations to be reliable
  So that new employees are created with valid data

  Scenario: [API-F-001] Create employee with valid payload
    Given I have a valid employee payload
    When I create the employee via API
    Then the employee is created successfully

  Scenario Outline: [API-F-006] Required fields validation
    Given I have an invalid employee payload missing "<field>"
    When I create the employee via API
    Then the API response should be a client error

    Examples:
      | field     |
      | firstName |
      | lastName  |
      | username  |

  Scenario Outline: [API-F-007] String length boundaries
    Given I have a payload with "<field>" length <length>
    When I create the employee via API
    Then the API response should be "<outcome>"

    Examples:
      | field     | length | outcome  |
      | firstName | 0      | rejected |
      | firstName | 1      | accepted |
      | firstName | 50     | accepted |
      | firstName | 51     | rejected |
      | lastName  | 1      | accepted |
      | lastName  | 50     | accepted |
      | lastName  | 51     | rejected |
      | username  | 1      | accepted |
      | username  | 50     | accepted |
      | username  | 51     | rejected |

  Scenario Outline: [API-F-008] Dependants boundary validation
    Given I have a valid employee payload with dependants <dependants>
    When I create the employee via API
    Then the API response should be "<outcome>"

    Examples:
      | dependants | outcome  |
      | -1         | rejected |
      | 0          | accepted |
      | 1          | accepted |
      | 31         | accepted |
      | 32         | accepted |
      | 33         | rejected |

  Scenario Outline: [API-F-010] Read-only fields cannot be client-controlled
    Given I have a payload attempting to control read-only field "<field>"
    When I create the employee via API
    Then read-only enforcement should be respected for "<field>"

    Examples:
      | field        |
      | gross        |
      | benefitsCost |
      | net          |
      | partitionKey |
      | sortKey      |

  Scenario Outline: [API-F-011] Additional properties are rejected
    Given I have a payload with additional property "<property>"
    When I create the employee via API
    Then the API response should be a client error

    Examples:
      | property     |
      | middleName   |
      | randomFlag   |
      | nestedObject |

  Scenario Outline: [API-F-012] Expiration field format handling
    Given I have a payload with expiration value "<expirationValue>"
    When I create the employee via API
    Then expiration handling outcome should be "<outcome>"

    Examples:
      | expirationValue      | outcome                 |
      | 2026-03-24T10:00:00Z | accepted                |
      | tomorrow             | rejected                |
      | 2026-13-99T99:99:99Z | rejected                |
      | 2026-03-24           | implementation-specific |
