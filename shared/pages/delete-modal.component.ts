import { Locator, Page } from '@playwright/test';

export class DeleteModal {
  readonly modal: Locator;
  readonly modalDialog: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#deleteModal');
    this.modalDialog = this.modal.locator('.modal-dialog');
    this.confirmDeleteButton = page.locator('#deleteEmployee');
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
    await this.waitUntilClosed();
  }

  async cancelDelete(): Promise<void> {
    await this.modal.getByRole('button', { name: /cancel|close/i }).first().click();
    await this.waitUntilClosed();
  }

  async waitUntilOpen(): Promise<void> {
    await this.modalDialog.waitFor({ state: 'visible' });
    await this.confirmDeleteButton.waitFor({ state: 'visible' });
  }

  async waitUntilClosed(): Promise<void> {
    await this.modalDialog.waitFor({ state: 'hidden' });
  }
}
