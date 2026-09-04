import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseClientService } from "./supabaseClient";

const supabaseService = new SupabaseClientService();
const client: SupabaseClient = supabaseService.getClient();

export async function obtenerCalendarioPorColegio(colegio_id:number){
     const { data: calendario_escolar, error: errorcalendario_escolar } =
        await client
          .from("calendarios_escolares")
          .select("*")
          .eq("colegio_id", colegio_id)
          ;
          
      if (errorcalendario_escolar) {
        throw new Error(errorcalendario_escolar.message);
      }
      return calendario_escolar
}