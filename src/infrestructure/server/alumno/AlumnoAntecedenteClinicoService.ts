// src/services/AlumnoAntecedenteClinicosService.ts
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlumnoAntecedenteClinicoBusiness } from "./funciones/AlumnosAntecedentesClinicos/AlumnoAntecedenteClinicoBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
 

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoAntecedenteClinicosService = {
    async obtener(req: Request, res: Response) {
        try {
            const antecedentes = await AlumnoAntecedenteClinicoBusiness.obtener(client, req.query);
            FormatResponse(res, 200, antecedentes);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteClinicosService.obtener");
        }
    },
    async guardar(req: Request, res: Response) {
        try {
            const savedAntecedente = await AlumnoAntecedenteClinicoBusiness.guardar(client, req.body, {
                creado_por: req.creado_por,
                actualizado_por: req.actualizado_por
            });
            FormatResponse(res, 201, savedAntecedente);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteClinicosService.guardar");
        }
    },
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                  res.status(400).json({ message: "ID de registro no válido." });
            }
            await AlumnoAntecedenteClinicoBusiness.actualizar(client, id, req.body, {
                actualizado_por: req.actualizado_por
            });
            FormatResponse(res, 200, { message: "Antecedente clínico actualizado correctamente" });
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteClinicosService.actualizar");
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                  res.status(400).json({ message: "ID de registro no válido." });
            }
            const result = await AlumnoAntecedenteClinicoBusiness.eliminar(client, id);
            FormatResponse(res, 200, result);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoAntecedenteClinicosService.eliminar");
        }
    },
};