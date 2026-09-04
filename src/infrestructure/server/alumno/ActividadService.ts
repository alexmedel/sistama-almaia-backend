import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Actividad } from "../../../core/modelo/alumno/Actividad";

const dataService: DataService<Actividad> = new DataService("actividades");
export const ActividadsService = {

    async obtener(req: Request, res: Response) {
        try {
           /* const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
            const actividad = await dataService.getAll(["*"], where);
            res.json(actividad);*/
            const actividades = [
                {
                  "actividad_id": 1,
                  "nombre": "Examen parcial de Matemáticas"
                },
                {
                  "actividad_id": 2,
                  "nombre": "Taller de lectura crítica"
                },
                {
                  "actividad_id": 3,
                  "nombre": "Proyecto final de Ciencias"
                },
                {
                  "actividad_id": 4,
                  "nombre": "Presentación oral de Historia"
                },
                {
                  "actividad_id": 5,
                  "nombre": "Práctica de laboratorio"
                }
              ];
            res.json(actividades);
        } catch (error) {
            console.error("Error al obtener la actividad:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    guardar: async (req: Request, res: Response) => {
        try {
            const actividad: Actividad = req.body;
            const savedActividad = await dataService.processData(actividad);
            res.status(201).json(savedActividad);
        } catch (error) {
            console.error("Error al guardar la actividad:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const actividad: Actividad = req.body;
            await dataService.updateById(id, actividad);
            res.status(200).json({ message: "Actividad actualizada correctamente" });
        } catch (error) {
            console.error("Error al actualizar la actividad:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await dataService.deleteById(id);
            res.status(200).json({ message: "Actividad eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar la actividad:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }

}