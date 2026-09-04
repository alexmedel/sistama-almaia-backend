import { Router } from 'express';
import { BeneficiosController } from "../core/controller/beneficios.controller";
import { sessionAuth } from '../middleware/supabaseMidleware';

export const BeneficiosRouters = Router();

const beneficiosController = new BeneficiosController();

BeneficiosRouters.get("/todos" ,beneficiosController.getBeneficios.bind(beneficiosController) );
BeneficiosRouters.get("/:beneficio_id" ,beneficiosController.getBeneficiosPorId.bind(beneficiosController) );
BeneficiosRouters.post("/click", sessionAuth ,beneficiosController.beneficiosClick.bind(beneficiosController) );