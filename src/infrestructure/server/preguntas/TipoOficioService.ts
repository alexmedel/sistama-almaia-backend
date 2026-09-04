import { Request, Response } from "express";

import { DataService } from "../DataService";
import { TipoOficio } from "../../../core/modelo/preguntasRespuestas/TipoOficio";
const dataService:DataService<TipoOficio> = new DataService("tipos_oficios");
export const TipoOficioService = {
    async obtener(req: Request, res: Response) {
        try {
            const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
            const tipoOficio = await dataService.getAll(["*"],where);
            res.json(tipoOficio);
        } catch (error) {
            console.error("Error al obtener el tipoOficio:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    guardar: async (req: Request, res: Response) => {
        try {
            const tipoOficio: TipoOficio = req.body;
            const savedTipoOficio = await dataService.processData(tipoOficio);
            res.status(201).json(savedTipoOficio);
        } catch (error) {
            console.error("Error al guardar el tipoOficio:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    }
    ,
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const tipoOficio: TipoOficio = req.body;
            await dataService.updateById(id, tipoOficio);
            res.status(200).json({ message: "TipoOficio actualizada correctamente" });
        } catch (error) {
            console.error("Error al actualizar el tipoOficio:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await dataService.deleteById(id);
            res.status(200).json({ message: "TipoOficio eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar el tipoOficio:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
}