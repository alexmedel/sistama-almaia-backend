import { SupabaseClient } from "@supabase/supabase-js";
import { ISupabaseRepository } from "../../core/interface/ISupabaseRepository";
import { SupabaseAdminService } from "../../core/services/supabaseAdmin";
//import { getSecret, loginToVault } from "../../core/services/valutClient";
 
export class SupabaseRepository<T> implements ISupabaseRepository<T> {
  private client!: SupabaseClient;
  private table: string = "";
  protected pkName: string;

  constructor(tableName: string, pkName: string = "id") {
    this.table = tableName;
    this.pkName = pkName
    this.init().catch((err) => {
      throw new Error(`Error al inicializar SupabaseClient: ${err.message}`);
    });
  }
  setClient(client: SupabaseClient) {
    this.client = client;
  }

  private async init() {
    const supabaseService = new SupabaseAdminService();
    this.client = supabaseService.getClient();
  }

  private async ensureClientInitialized() {
    if (!this.client) {
      await this.init();
    }
  }

  async saveData(entity: T): Promise<any> {
    await this.ensureClientInitialized();
    const { data, error } = await this.client
      .from(this.table)
      .insert([entity])
      .select();
    if (error) throw new Error(error.message);
    return data[0];
  }
  async getAll<T>(
    columns: string[],
    where: Record<string, any> = {},
    orderBy?: string, // columna opcional para ordenar  
    ascending: boolean = true, // dirección del ordenamiento, por defecto ascendente,
  ): Promise<T[]> {
    await this.ensureClientInitialized();
    const limit = where?.limit;
    delete where?.limit; // Eliminar el límite de la consulta
    if (!columns.length) {
      throw new Error(
        "Debes especificar al menos una columna para generar el reporte."
      );
    }

    const columnQuery = columns.join(",");
    let query = this.client.from(this.table).select(columnQuery);
    Object.keys(where).forEach((key) => {
      //si la query es un array, usar in
      if (Array.isArray(where[key])) {
        query = query.in(key, where[key]);
      } else {
        query = query.eq(key, where[key]);
      }
    });

    if (orderBy && orderBy !== "*") {
      query = query.order(orderBy, { ascending: ascending });
    }
    // Si se especifica un límite, aplicarlo a la consulta
    //validar que limit sea un número y no sea NaN
    if (limit && !isNaN(parseInt(limit))) {

      query = query.limit(parseInt(limit));

    }

    const { data, error } = await query.returns<T[]>();

    if (error) {
      throw new Error(
        `Error al consultar la tabla '${this.table}': ${error.message}`
      );
    }

    return data ?? [];
  }

  async getData(id: number): Promise<any> {
    await this.ensureClientInitialized();
    const { data, error } = await this.client
      .from(this.table)
      .select("*")
      .eq("id", id);
    if (error) throw new Error(error.message);
    return data[0];
  }

  async deleteData(id: number): Promise<any> {
    await this.ensureClientInitialized();
    const { error } = await this.client.from(this.table)
      .update({ activo: false })
      .eq(this.pkName, id);
    if (error) throw new Error(error.message);
  }

  async updateData(id: number, data: T): Promise<any> {
    await this.ensureClientInitialized();
    const { data: dataUpdate, error } = await this.client
      .from(this.table)
      .update(data)
      .eq(this.pkName, id);
    if (error) throw new Error(error.message);
    return dataUpdate
  }
}
