import { SupabaseClient } from "@supabase/supabase-js";

export interface TrazabilidadType {
  tipo_auditoria_id: number;
  colegio_id: number;
  fecha: Date;
  usuario_id: number;
  descripcion: string;
  modulo_afectado: string;
  accion_realizada: string;
  ip_origen?: string;
  model?: string;
  referencia_id?: number;
}
export class TrazabilidadRepository {
  private readonly supabaseService: { getClient(): SupabaseClient };
  private readonly supabase: SupabaseClient;

  constructor(supabaseService: { getClient(): SupabaseClient }) {
    this.supabaseService = supabaseService;
    this.supabase = this.supabaseService.getClient();
  }

  async MonitorearTrazabilidad(metadata: TrazabilidadType) {
    const { data, error } = await this.supabase
      .from("auditorias")
      .insert(metadata)
      .select("*")
      .single()
      ;

    if (error) {
      throw new Error(error.message);
    }

    console.log(data , "color: #fff; font-weight: bold; background-color: yellow; padding: 5px;");
    return data;
  }
}
