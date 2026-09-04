import express , { Request, Response } from "express";
import { AuditoriaController } from "./auditoria.controller";
import { AuditoriaService } from "./auditoria.service";
import { SupabaseAdminService } from "../../core/services/supabaseAdmin";
import { TrazabilidadRepository } from "./trazabilidadRepository";
import { sessionAuth } from "../../middleware/supabaseMidleware";
 

// Asume que necesitas otros servicios/repositorios para inicializar TrazabilidadRepository

const auditoriaRoute = express.Router();

 
const supabaseService = new SupabaseAdminService();
const trazabilidadRepository = new TrazabilidadRepository(supabaseService);  
const auditoriaService = new AuditoriaService(trazabilidadRepository);  

// 2. Pasar el Servicio al Controlador
const controller = new AuditoriaController(auditoriaService); // ✅ AQUÍ ESTÁ EL ARGUMENTO

// Ejemplo de cómo usar el controlador
  auditoriaRoute.post("/",   controller.guardarAuditoria.bind(controller));
 auditoriaRoute.get("/", (req: Request, res: Response) => controller.test(req, res));

export default auditoriaRoute;
