@nonfunctional @accessibility @ui @hybrid
Feature: Dashboard Accessibility Hybrid Coverage
  As a QA engineer
  I want keyboard and focus automation coverage
  So that hybrid accessibility checks are continuously validated

  @requiresEmployee
  Scenario: [ACC-NF-001] Keyboard navigation works on dashboard main controls
    Given I am authenticated on the benefits dashboard
    When I navigate through dashboard controls using only the keyboard
    Then the add employee action should be reachable by keyboard
    And the edit action for the seeded employee should be reachable by keyboard
    And the delete action for the seeded employee should be reachable by keyboard

  Scenario: [ACC-NF-002] Employee modal focus behavior is usable
    Given I am authenticated on the benefits dashboard
    When I open add employee modal using only the keyboard
    Then focus should move to a logical control in the employee modal
    And keyboard navigation should reach modal action controls
