
import { Request, Response } from "express";
import { DataService } from "../DataService";
import { TipoPregunta } from "../../../core/modelo/preguntasRespuestas/TipoPregunta";

const dataService:DataService<TipoPregunta> = new DataService("tipos_tipopreguntas");
export const TipoPreguntaService = {
      async obtener(req: Request, res: Response) {
            try {
                /*const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
                const tipopregunta = await dataService.getAll(["*"],where);
                res.json(tipopregunta);*/
               const tipos_preguntas = [
                    {
                      "tipo_pregunta_id": 1,
                      "nombre": "Evaluación inicial"
                    }
                  ]
                res.json(tipos_preguntas);
            } catch (error) {
                console.error("Error al obtener la tipopregunta:", error);
                 res.status(500).json({ message: "Error interno del servidor" });
            }
        },
        guardar: async (req: Request, res: Response) => {
            try {
                const tipopregunta: TipoPregunta = req.body;
                const savedTipoPregunta = await dataService.processData(tipopregunta);
                res.status(201).json(savedTipoPregunta);
            } catch (error) {
                console.error("Error al guardar la tipopregunta:", error);
                 res.status(500).json({ message: "Error interno del servidor" });
            }
        }
        ,
        async actualizar(req: Request, res: Response) {
            try {
                const id = parseInt(req.params.id);
                const tipopregunta: TipoPregunta = req.body;
                await dataService.updateById(id, tipopregunta);
                res.status(200).json({ message: "TipoPregunta actualizada correctamente" });
            } catch (error) {
                console.error("Error al actualizar la tipopregunta:", error);
                 res.status(500).json({ message: "Error interno del servidor" });
            }
        },
        async eliminar(req: Request, res: Response) {
            try {
                const id = parseInt(req.params.id);
                await dataService.deleteById(id);
                res.status(200).json({ message: "TipoPregunta eliminada correctamente" });
            } catch (error) {
                console.error("Error al eliminar la tipopregunta:", error);
                 res.status(500).json({ message: "Error interno del servidor" });
            }
        },
}
