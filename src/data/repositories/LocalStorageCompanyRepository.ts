import type { CompanyInfo } from "../../domain/models/types"
import type { ICompanyRepository } from "../../domain/repositories"
import { seedCompanyInfo } from "../mock/seedData"

export class LocalStorageCompanyRepository implements ICompanyRepository {
  async getCompanyInfo(): Promise<CompanyInfo> {
    return seedCompanyInfo
  }
}
