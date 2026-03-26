import { expect, Locator, Page } from '@playwright/test';
import { config } from '../config/config';

export type EmployeeFormData = {
  firstName: string;
  lastName: string;
  dependants: number | string;
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

  private get interactionTimeout(): number {
    return Math.min(config.timeouts.default, 5_000);
  }

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

  async waitUntilOpen(mode?: 'add' | 'edit', timeout = this.interactionTimeout): Promise<void> {

    await expect(this.modal).toHaveClass(/show/, { timeout });
    await this.modalDialog.waitFor({ state: 'visible', timeout });
    await this.firstNameInput.waitFor({ state: 'visible', timeout });
    await this.lastNameInput.waitFor({ state: 'visible', timeout });
    await this.dependantsInput.waitFor({ state: 'visible', timeout });

    if (mode === 'add') {
      await expect(this.addButton).toBeVisible();
      await expect(this.updateButton).toBeHidden();
    }

    if (mode === 'edit') {
      await expect(this.updateButton).toBeVisible();
      await expect(this.addButton).toBeHidden();
    }
  }

  async waitUntilClosed(timeout = this.interactionTimeout): Promise<void> {
    await expect(this.modal).not.toHaveClass(/show/, { timeout });
    await this.modalDialog.waitFor({ state: 'hidden', timeout });
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
