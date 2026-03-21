@functional @api @smoke
Feature: Posts API
  As a developer
  I want to verify the Posts REST API
  So that I can ensure data operations work correctly

  @critical
  Scenario: Retrieve a list of posts
    When I send a GET request to "/posts"
    Then the response status should be 200
    And the response body should contain a list of posts

  @critical
  Scenario: Retrieve a single post by ID
    When I send a GET request to "/posts/1"
    Then the response status should be 200
    And the post should have a title and body

  @regression
  Scenario: Create a new post
    Given I have a new post with title "My Test Post" and body "Post content here"
    When I send a POST request to "/posts"
    Then the response status should be 201
    And the created post should have the title "My Test Post"

  @regression
  Scenario: Update an existing post
    Given I have an update for post 1 with title "Updated Title"
    When I send a PUT request to "/posts/1"
    Then the response status should be 200
    And the post title should be "Updated Title"

  @regression
  Scenario: Delete a post
    When I send a DELETE request to "/posts/1"
    Then the response status should be 200
