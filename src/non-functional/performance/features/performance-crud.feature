@non-functional @performance @regression
Feature: Performance and Stability - Employees API CRUD Flow
  As a QA engineer
  I want a single performance suite for list and CRUD behavior
  So that timing and stability checks are clear and centralized

  Scenario: [PERF-NF-001] Employee list endpoint responds within agreed threshold
    Given performance threshold for list endpoint is 2000 ms
    When I measure response time for employee list endpoint
    Then the list endpoint should return success and respond within threshold

  Scenario: [PERF-NF-002] Create, update, and delete operations each respond within agreed threshold
    Given performance threshold for CRUD operations is 2500 ms
    And a valid employee payload is prepared for performance run
    When I measure create, update, and delete operation times
    Then create, update, and delete should return expected statuses and remain within threshold

  Scenario Outline: [PERF-NF-003] Repeated CRUD cycles remain stable with no unexpected failures
    Given a valid employee payload is prepared for performance run
    When I run repeated CRUD cycles for <iterations> iterations
    Then repeated CRUD run should complete with zero unexpected failures

    Examples:
      | iterations |
      | 10         |
      | 20         |
