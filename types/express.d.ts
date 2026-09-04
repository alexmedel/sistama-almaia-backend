import { SupabaseClient } from '@supabase/supabase-js';
import 'express';
// types/express.d.ts
declare module 'express-serve-static-core' {
  interface Request {
    creado_por: number; // o number, según tu caso
    actualizado_por:number
    fecha_creacion:string
     
    user:any
    supabase:SupabaseClient
    supabaseAdmin:SupabaseClient
    file?: Express.Multer.File; 

  }
}