// src/services/AlumnoAntecedenteFamiliarService.ts
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
 
import { FormatResponse } from "../../../helpers/Response";
import { AlumnoAntecedenteFamiliarBusiness } from "./funciones/AlumnoAtencedente/AlumnoAntecedenteFamiliarBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoAntecedenteFamiliarsService = {
    async obtener(req: Request, res: Response) {
        try {
            const antecedentes = await AlumnoAntecedenteFamiliarBusiness.obtener(client, req.query);
            res.json(antecedentes);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteFamiliarService.obtener");
        }
    },
    async guardar(req: Request, res: Response) {
        try {
            const savedAntecedente = await AlumnoAntecedenteFamiliarBusiness.guardar(client, req.body, {
                creado_por: req.creado_por,
                actualizado_por: req.actualizado_por
            });
            FormatResponse(res, 201, savedAntecedente);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteFamiliarService.guardar");
        }
    },
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                  res.status(400).json({ message: "ID de registro no válido." });
            }
            await AlumnoAntecedenteFamiliarBusiness.actualizar(client, id, req.body, {
                actualizado_por: req.actualizado_por
            });
            FormatResponse(res, 200, { message: "Antecedente familiar actualizado correctamente" });
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteFamiliarService.actualizar");
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                  res.status(400).json({ message: "ID de registro no válido." });
            }
            const result = await AlumnoAntecedenteFamiliarBusiness.eliminar(client, id);
            FormatResponse(res, 200, result);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteFamiliarService.eliminar");
        }
    },
};