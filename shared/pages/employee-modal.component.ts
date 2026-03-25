import { expect, Locator, Page } from '@playwright/test';

export type EmployeeFormData = {
  firstName: string;
  lastName: string;
  dependants: number;
};

export class EmployeeModal {
  readonly modal: Locator;
  readonly modalDialog: Locator;
  readonly idInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dependantsInput: Locator;
  readonly addButton: Locator;
  readonly updateButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#employeeModal');
    this.modalDialog = this.modal.locator('.modal-dialog');
    this.idInput = page.locator('#id');
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.dependantsInput = page.locator('#dependants');
    this.addButton = page.locator('#addEmployee');
    this.updateButton = page.locator('#updateEmployee');
  }

  async fill(data: EmployeeFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.dependantsInput.fill(String(data.dependants));
  }

  async submitAdd(): Promise<void> {
    await expect(this.addButton).toBeVisible();
    await this.addButton.click();
    await this.waitUntilClosed();
  }

  async submitUpdate(): Promise<void> {
    await expect(this.updateButton).toBeVisible();
    await this.updateButton.click();
    await this.waitUntilClosed();
  }

  async cancel(): Promise<void> {
    await this.modal.getByRole('button', { name: /cancel|close/i }).first().click();
    await this.waitUntilClosed();
  }

  async waitUntilOpen(mode?: 'add' | 'edit'): Promise<void> {
    await expect(this.modal).toHaveClass(/show/);
    await this.modalDialog.waitFor({ state: 'visible' });
    await this.firstNameInput.waitFor({ state: 'visible' });
    await this.lastNameInput.waitFor({ state: 'visible' });
    await this.dependantsInput.waitFor({ state: 'visible' });

    if (mode === 'add') {
      await expect(this.addButton).toBeVisible();
      await expect(this.updateButton).toBeHidden();
    }

    if (mode === 'edit') {
      await expect(this.updateButton).toBeVisible();
      await expect(this.addButton).toBeHidden();
    }
  }

  async waitUntilClosed(): Promise<void> {
    await expect(this.modal).not.toHaveClass(/show/);
    await this.modalDialog.waitFor({ state: 'hidden' });
  }

  async isOpen(): Promise<boolean> {
    const hasShowClass = await this.modal
      .evaluate((node) => node.classList.contains('show'))
      .catch(() => false);
    if (!hasShowClass) {
      return false;
    }

    return this.modalDialog.isVisible().catch(() => false);
  }
}
