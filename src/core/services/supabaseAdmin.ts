import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

export class SupabaseAdminService {
  private supabase: SupabaseClient;

  constructor() {

    const { SUPABASE_HOST, SUPABASE_PASSWORD_ADMIN } = process.env;
    if (!SUPABASE_HOST || !SUPABASE_PASSWORD_ADMIN) {
      throw new Error("Faltan variables de entorno de Supabase");
    }
    const supabaseUrl = SUPABASE_HOST;
    const supabaseKey = SUPABASE_PASSWORD_ADMIN;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}