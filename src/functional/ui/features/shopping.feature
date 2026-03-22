@functional @ui @smoke @v3
Feature: ShopTest shopping journey
  As a shopper
  I want to browse products and add items to the cart
  So that I can continue toward checkout

  Background:
    Given the shopper is on the ShopTest home page

  @critical
  Scenario: Search for a product and review its details
    When the shopper searches for "Headphones"
    And the shopper opens the details for "Wireless Headphones"
    Then the shopper should see the "Wireless Headphones" product detail page

  @regression
  Scenario: Add a product to the cart
    When the shopper adds "Wireless Headphones" to the cart from the catalog
    And the shopper opens the cart
    Then the cart should contain "Wireless Headphones"
    And checkout should be available
