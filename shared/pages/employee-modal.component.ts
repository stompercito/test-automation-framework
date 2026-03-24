import { Locator, Page } from '@playwright/test';

export type EmployeeFormData = {
  firstName: string;
  lastName: string;
  dependants: number;
};

export class EmployeeModal {
  readonly modal: Locator;
  readonly idInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dependantsInput: Locator;
  readonly addButton: Locator;
  readonly updateButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#employeeModal');
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
    await this.addButton.click();
  }

  async submitUpdate(): Promise<void> {
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.modal.getByRole('button', { name: /cancel|close/i }).first().click();
  }
}
