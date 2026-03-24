@functional @api @smoke
Feature: API template
  As a tester
  I want to validate core API responses
  So that I can trust service behavior

  Scenario: GET endpoint returns success
    When I send a "GET" request to "/<endpoint>"
    Then the response status should be 200

  Scenario: POST endpoint creates resource
    Given I have a request payload with title "<title>" and body "<body>"
    When I send a "POST" request to "/<endpoint>"
    Then the response status should be 201
