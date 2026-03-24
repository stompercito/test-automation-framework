import { ApiClient } from '../../../../shared/utils/api-client';
import { buildApiAuthHeaders } from '../../../../shared/utils/auth';
import { EmployeePayload } from '../../../../shared/test-data/employee.builder';
import { EmployeeResponse } from '../validators/employee.validator';

export class EmployeesClient extends ApiClient {
  private readonly basePath = '/api/Employees';

  async create(payload: EmployeePayload, auth?: { token?: string; username?: string; password?: string }) {
    return this.post<EmployeeResponse>(this.basePath, payload, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async getAll(auth?: { token?: string; username?: string; password?: string }) {
    return this.get<EmployeeResponse[]>(this.basePath, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async getById(id: string, auth?: { token?: string; username?: string; password?: string }) {
    return this.get<EmployeeResponse>(`${this.basePath}/${id}`, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async update(id: string, payload: EmployeePayload, auth?: { token?: string; username?: string; password?: string }) {
    return this.put<EmployeeResponse>(`${this.basePath}/${id}`, payload, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async deleteById(id: string, auth?: { token?: string; username?: string; password?: string }) {
    return this.delete<{ deleted?: boolean }>(`${this.basePath}/${id}`, {
      headers: buildApiAuthHeaders(auth),
    });
  }
}
