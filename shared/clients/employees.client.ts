import { ApiClient } from '../utils/api-client';
import { buildApiAuthHeaders } from '../utils/auth';
import { EmployeePayload } from '../test-data/employee.builder';
import { EmployeeResponse } from '../../src/functional/api/validators/employee.validator';

export class EmployeesClient extends ApiClient {
  private readonly basePath = 'api/Employees';

  async create(payload: EmployeePayload, auth?: { token?: string }) {
    return this.post<EmployeeResponse>(this.basePath, payload, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async getAll(auth?: { token?: string }) {
    return this.get<EmployeeResponse[]>(this.basePath, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async getById(id: string, auth?: { token?: string }) {
    return this.get<EmployeeResponse>(`${this.basePath}/${id}`, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async update(id: string, payload: EmployeePayload, auth?: { token?: string }) {
    const payloadWithId = { ...payload, id } as EmployeePayload & { id: string };
    return this.put<EmployeeResponse>(this.basePath, payloadWithId, {
      headers: buildApiAuthHeaders(auth),
    });
  }

  async deleteById(id: string, auth?: { token?: string }) {
    return this.delete<{ deleted?: boolean }>(`${this.basePath}/${id}`, {
      headers: buildApiAuthHeaders(auth),
    });
  }
}
