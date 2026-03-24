@functional @api @smoke
Feature: Employees API Smoke
  As a QA engineer
  I want a full CRUD happy path check in smoke
  So that the core API journey is validated end to end

  Scenario: [SMK-A-001] E2E happy path for employee CRUD operations
    Given I have a valid employee payload
    When I complete a full employee CRUD chain
    Then each API operation should return expected statuses
