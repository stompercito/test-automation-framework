import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { DeleteModal } from './delete-modal.component';
import { EmployeeFormData, EmployeeModal } from './employee-modal.component';

export type DashboardRow = {
  id: string;
  firstName: string;
  lastName: string;
  dependants: string;
  salary: string;
  gross: string;
  benefitsCost: string;
  net: string;
};

export class BenefitsDashboardPage extends BasePage {
  readonly table: Locator;
  readonly addButton: Locator;
  readonly employeeModal: EmployeeModal;
  readonly deleteModal: DeleteModal;

  constructor(page: Page) {
    super(page);
    this.table = page.locator('#employeesTable');
    this.addButton = page.locator('#add');
    this.employeeModal = new EmployeeModal(page);
    this.deleteModal = new DeleteModal(page);
  }

  async assertLoaded(): Promise<void> {
    await expect(this.table).toBeVisible();
    await expect(this.addButton).toBeVisible();
  }

  async assertCoreTableHeaders(): Promise<void> {
    const headers = (await this.readHeaderLabels()).map((header) => header.trim());
    expect(headers).toEqual([
      'Id',
      'Last Name',
      'First Name',
      'Dependents',
      'Salary',
      'Gross Pay',
      'Benefits Cost',
      'Net Pay',
      'Actions',
    ]);
  }

  async openAddModal(): Promise<void> {
    await this.click(this.addButton);
    try {
      await this.employeeModal.waitUntilOpen('add');
    } catch {
      // Retry once in case click happened before Bootstrap handlers finished binding.
      await this.click(this.addButton);
      await this.employeeModal.waitUntilOpen('add');
    }
  }

  async addEmployee(data: EmployeeFormData): Promise<void> {
    await this.openAddModal();
    await this.employeeModal.fill(data);
    await this.employeeModal.submitAdd();
  }

  async openEditById(id: string): Promise<void> {
    const row = await this.findRowById(id);
    await row.locator('.fa-edit').click();
    await this.employeeModal.waitUntilOpen('edit');
  }

  async openDeleteById(id: string): Promise<void> {
    const row = await this.findRowById(id);
    await row.locator('.fa-times').click();
    await this.deleteModal.waitUntilOpen();
  }

  async readHeaderLabels(): Promise<string[]> {
    return this.table.locator('thead th').allTextContents();
  }

  async readRows(): Promise<DashboardRow[]> {
    const rows = this.table.locator('tbody tr');
    const count = await rows.count();
    const results: DashboardRow[] = [];

    for (let i = 0; i < count; i += 1) {
      const cells = await rows.nth(i).locator('td').allTextContents();
      if (cells.length < 8) {
        continue;
      }

      results.push({
        id: cells[0].trim(),
        firstName: cells[1].trim(),
        lastName: cells[2].trim(),
        dependants: cells[3].trim(),
        salary: cells[4].trim(),
        gross: cells[5].trim(),
        benefitsCost: cells[6].trim(),
        net: cells[7].trim(),
      });
    }

    return results;
  }

  async findStructuredRowById(id: string): Promise<DashboardRow | undefined> {
    const rows = await this.readRows();
    return rows.find((row) => row.id === id);
  }

  async findRowById(id: string): Promise<Locator> {
    const row = this.table.locator('tbody tr').filter({ has: this.page.locator('td', { hasText: id }) }).first();
    await expect(row).toBeVisible();
    return row;
  }

  async isEmployeeVisibleByFullName(firstName: string, lastName: string): Promise<boolean> {
    const row = this.table
      .locator('tbody tr')
      .filter({ has: this.page.locator('td', { hasText: firstName }) })
      .filter({ has: this.page.locator('td', { hasText: lastName }) })
      .first();

    return row.isVisible();
  }

  async hasNoEmployeesMessage(): Promise<boolean> {
    const emptyCell = this.table.locator('tbody tr td[colspan="9"]');
    const isVisible = await emptyCell.isVisible().catch(() => false);
    if (!isVisible) {
      return false;
    }

    const text = (await emptyCell.textContent())?.trim() ?? '';
    return text === 'No employees found.';
  }
}
