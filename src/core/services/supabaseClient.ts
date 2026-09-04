import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

export class SupabaseClientService {
  private supabase: SupabaseClient;

  constructor() {
  
    const { SUPABASE_HOST, SUPABASE_PASSWORD } = process.env;
    if (!SUPABASE_HOST || !SUPABASE_PASSWORD) {
      throw new Error("Faltan variables de entorno de Supabase");
    }
    const supabaseUrl = SUPABASE_HOST;
    const supabaseKey = SUPABASE_PASSWORD;

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: "public"
      },
      global: {
        fetch: (url, options) => {
          // Esto envuelve la llamada fetch con un timeout manual de 10 minutos
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 600000); 
          return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timeout));
        }
      }
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
