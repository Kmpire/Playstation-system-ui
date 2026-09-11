import type { CompanyInfo } from "../../domain/models/types"
import type { ICompanyRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiCompanyRepository implements ICompanyRepository {
  async getCompanyInfo(): Promise<CompanyInfo> {
    return apiClient<CompanyInfo>("/company")
  }

  async updateCompanyInfo(info: CompanyInfo): Promise<CompanyInfo> {
    return apiClient<CompanyInfo>("/company", {
      method: "PUT",
      body: JSON.stringify(info),
    })
  }
}
