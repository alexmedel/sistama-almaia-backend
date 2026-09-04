import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseClientService } from "../core/services/supabaseClient";

export class HttpSupabaseBase {
  private readonly supabaseService: SupabaseClientService;
  protected  readonly supabase: SupabaseClient;

  constructor() {
    this.supabaseService = new SupabaseClientService();
    this.supabase = this.supabaseService.getClient();
  }
}
