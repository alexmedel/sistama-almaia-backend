import { Request, Response } from "express";
import { DataService } from "../DataService";
import { CalendarioEscolar } from "../../../core/modelo/colegio/CalendarioEscolar";

const dataService: DataService<CalendarioEscolar> = new DataService("calendarios_escolares");
export const CalendarioEscolarsService = {
    async obtener(req: Request, res: Response) {
        try {
                  const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
            const calendariosEscolares = await dataService.getAll(["*"], where);
            res.json(calendariosEscolares);              
        } catch (error) {
            res.status(500).json(error);
        }
    },

    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const calendarioActualizado = req.body;
            const resultado = await dataService.updateById(id, calendarioActualizado);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(500).json(error);
        }
    },

    async guardar(req: Request, res: Response) {
        try {
            const nuevoCalendario = req.body;
            const resultado = await dataService.processData(nuevoCalendario);
            res.status(201).json(resultado);
        } catch (error) {
            res.status(500).json(error);
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const resultado = await dataService.deleteById(id);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(500).json(error);
        }
    }

}