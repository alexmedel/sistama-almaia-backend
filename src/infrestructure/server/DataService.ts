 
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRepository } from "../adapter/SupabaseRepository";
import { PaginationOptions } from "../../helpers/paginate";

export class DataService<T> {
  protected repository: SupabaseRepository<T>;
  protected pkName: string;
  protected client?: SupabaseClient;

  constructor(
    tableName: string,
    pkName: string = "id",
    client?: SupabaseClient
  ) {
    this.pkName = pkName;
    this.repository = new SupabaseRepository<T>(tableName, pkName);
    if (client) {
      this.repository.setClient(client);
    }
  }
  setClient(client: SupabaseClient) {
    this.client = client;
    this.repository.setClient(client);
  }
  async processData(entity: T): Promise<T> {
    const processedEntity = this.transformData(entity);
    const result = await this.repository.saveData(processedEntity);
    return result;
  }

  protected transformData(entity: T): T {
    return entity; // Puede ser sobrescrito en servicios específicos
  }

  async getAll(
    columns: string[],
    where: Record<string, any> = {},
    orderby?: string,
    
  ): Promise<T[]> {
     return await this.repository.getAll(columns, where, orderby, true);
  }

  async getById(id: number): Promise<T> {
    return await this.repository.getData(id);
  }

  async deleteById(id: number): Promise<void> {
    await this.repository.deleteData(id);
  }

  async updateById(id: number, entity: T): Promise<void> {
    await this.repository.updateData(id, entity);
  }
}
