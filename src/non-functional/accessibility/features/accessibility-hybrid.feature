@nonfunctional @accessibility @ui @hybrid
Feature: Dashboard Accessibility Hybrid Coverage
  As a QA engineer
  I want keyboard and focus automation coverage
  So that hybrid accessibility checks are continuously validated

  Scenario: [ACC-NF-001] Add employee action is reachable by keyboard
    Given I am authenticated on the benefits dashboard
    When I reset keyboard focus to the dashboard
    Then the add employee action should be reachable by keyboard

  @requiresEmployee
  Scenario: [ACC-NF-002] Edit action for the seeded employee is reachable by keyboard
    Given I am authenticated on the benefits dashboard
    When I reset keyboard focus to the dashboard
    Then the edit action for the seeded employee should be reachable by keyboard

  @requiresEmployee
  Scenario: [ACC-NF-003] Delete action for the seeded employee is reachable by keyboard
    Given I am authenticated on the benefits dashboard
    When I reset keyboard focus to the dashboard
    Then the delete action for the seeded employee should be reachable by keyboard

  Scenario: [ACC-NF-004] Employee add modal focus behavior is usable
    Given I am authenticated on the benefits dashboard
    When I open add employee modal using only the keyboard
    Then focus should move to a logical control in the employee modal
    And keyboard navigation should reach modal action controls
