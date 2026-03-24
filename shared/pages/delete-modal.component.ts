import { Locator, Page } from '@playwright/test';

export class DeleteModal {
  readonly modal: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#deleteModal');
    this.confirmDeleteButton = page.locator('#deleteEmployee');
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
  }

  async cancelDelete(): Promise<void> {
    await this.modal.getByRole('button', { name: /cancel|close/i }).first().click();
  }
}
