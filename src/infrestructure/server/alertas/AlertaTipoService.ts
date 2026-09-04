/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from "express";
import { DataService } from "../DataService";
import { AlertaTipo } from "../../../core/modelo/alerta/AlertaTipo";

const dataService: DataService<AlertaTipo> = new DataService("alertas_tipos");
export const AlertaTiposService = {
    async obtener(req: Request, res: Response) {
        try {
           const { colegio_id, ...where } = req.query; // Convertir los parámetros de consulta en filtros
            const alertaTipo = await dataService.getAll(["*"], where);
            res.status(200).json(alertaTipo);
           
            // const tiposAlertas = [
            //     {
            //       "alerta_tipo_id": 1,
            //       "nombre": "Académica",
            //       "tiempo_atencion": 48,    // horas
            //       "tiempo_resolucion": 168   // horas (7 días)
            //     },
            //     {
            //       "alerta_tipo_id": 2,
            //       "nombre": "Conductual",
            //       "tiempo_atencion": 24,
            //       "tiempo_resolucion": 72
            //     },
            //     {
            //       "alerta_tipo_id": 3,
            //       "nombre": "Asistencia",
            //       "tiempo_atencion": 12,
            //       "tiempo_resolucion": 24
            //     },
            //     {
            //       "alerta_tipo_id": 4,
            //       "nombre": "Psicoemocional",
            //       "tiempo_atencion": 6,
            //       "tiempo_resolucion": 48
            //     },
            //     {
            //       "alerta_tipo_id": 5,
            //       "nombre": "Tecnológica",
            //       "tiempo_atencion": 4,
            //       "tiempo_resolucion": 24
            //     },
            //     {
            //       "alerta_tipo_id": 6,
            //       "nombre": "Urgente",
            //       "tiempo_atencion": 1,
            //       "tiempo_resolucion": 6
            //     }
            //   ];
            // res.json(tiposAlertas);

        } catch (error) {
            console.error("Error al obtener la alerta tipo:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    guardar: async (req: Request, res: Response) => {
        try {
            const alertaTipo: AlertaTipo = req.body;
            const savedAlertaTipo = await dataService.processData(alertaTipo);
            res.status(201).json(savedAlertaTipo);
        } catch (error) {
            console.error("Error al guardar la alerta tipo:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const alertaTipo: AlertaTipo = req.body;
            await dataService.updateById(id, alertaTipo);
            res.status(200).json({ message: "Alerta tipo actualizada correctamente" });
        } catch (error) {
            console.error("Error al actualizar la alerta tipo:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await dataService.deleteById(id);
            res.status(200).json({ message: "Alerta tipo eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar la alerta tipo:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
}