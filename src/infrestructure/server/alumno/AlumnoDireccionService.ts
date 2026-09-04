// src/services/AlumnoDireccionService.ts
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlumnoDireccionBusiness } from "./funciones/AlumnoDireccion/AlumnoDireccionBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
 

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoDireccionService = {
    async obtener(req: Request, res: Response) {
        try {
            const direcciones = await AlumnoDireccionBusiness.obtener(client, req.query);
            res.json(direcciones);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoDireccionService.obtener");
        }
    },
    async guardar(req: Request, res: Response) {
        try {
            const savedDireccion = await AlumnoDireccionBusiness.guardar(client, req.body, {
                creado_por: req.creado_por,
                actualizado_por: req.actualizado_por
            });
            res.status(201).json(savedDireccion);
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoDireccionService.guardar");
        }
    },
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                FormatResponse(res, 400, { message: "ID de registro no válido." });
            }
            const updatedDireccion = await AlumnoDireccionBusiness.actualizar(client, id, req.body, {
                actualizado_por: req.actualizado_por
            });
            FormatResponse(res, 200, { message: "Dirección del alumno actualizada correctamente", updatedDireccion });
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoDireccionService.actualizar");
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                  res.status(400).json({ message: "ID de registro no válido." });
            }
            const result = await AlumnoDireccionBusiness.eliminar(client, id);
            FormatResponse(
                res,
                200,
                result
            )
        } catch (error) {
            errorHandler.handleError(error, res, "AlumnoDireccionService.eliminar");
        }
    },
};