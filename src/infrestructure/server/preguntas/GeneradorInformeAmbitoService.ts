import { Request, Response } from "express";

import { DataService } from "../DataService";
import { GeneradorInformeAmbito } from "../../../core/modelo/preguntasRespuestas/GeneradorInformeAmbito";

const dataService:DataService<GeneradorInformeAmbito> = new DataService("generadores_informes_ambitos","generador_informe_ambito_id");
export const GeneradorInformeAmbitoService = {
async obtener(req: Request, res: Response) {
        try {
            const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
            const generadorInformeAmbito = await dataService.getAll(["*"],where);
            res.json(generadorInformeAmbito);
        } catch (error) {
            console.error("Error al obtener el generadorInformeAmbito:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    guardar: async (req: Request, res: Response) => {
        try {
            const generadorInformeAmbito: GeneradorInformeAmbito = req.body;
            const savedGeneradorInformeAmbito = await dataService.processData(generadorInformeAmbito);
            res.status(201).json(savedGeneradorInformeAmbito);
        } catch (error) {
            console.error("Error al guardar el generadorInformeAmbito:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const generadorInformeAmbito: GeneradorInformeAmbito = req.body;
            await dataService.updateById(id, generadorInformeAmbito);
            res.status(200).json({ message: "GeneradorInformeAmbito actualizado correctamente" });
        } catch (error) {
            console.error("Error al actualizar el generadorInformeAmbito:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await dataService.deleteById(id);
            res.status(200).json({ message: "Generador Informe eliminado correctamente" });
        } catch (error) {
            console.error("Error al eliminar el generadorInformeAmbito:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    }

}