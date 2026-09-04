import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Grado } from "../../../core/modelo/colegio/Grado";

const dataService: DataService<Grado> = new DataService("grados");
export const GradosService = {
    async obtener(req: Request, res: Response) {
        try {
        const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
        const grados = await dataService.getAll(["*"], where);
        res.json(grados);
        } catch (error) {
        console.error("Error al obtener los grados:", error);
        res.status(500).json({ error: "Error al obtener los grados" });
        }
    },
    
    async guardar(req: Request, res: Response) {
        try {
        const grado = req.body;
        const nuevoGrado = await dataService.processData(grado);
        res.status(201).json(nuevoGrado);
        } catch (error) {
        console.error("Error al guardar el grado:", error);
        res.status(500).json({ error: "Error al guardar el grado" });
        }
    },
    
    async actualizar(req: Request, res: Response) {
        try {
        const gradoId = parseInt(req.params.id);
        const grado = req.body;
        const gradoActualizado = await dataService.updateById(gradoId, grado);
        res.json(gradoActualizado);
        } catch (error) {
        console.error("Error al actualizar el grado:", error);
        res.status(500).json({ error: "Error al actualizar el grado" });
        }
    },
    
    async eliminar(req: Request, res: Response) {
        try {
        const gradoId = parseInt(req.params.id);
        await dataService.deleteById(gradoId);
        res.status(204).send();
        } catch (error) {
        console.error("Error al eliminar el grado:", error);
        res.status(500).json({ error: "Error al eliminar el grado" });
        }
    },
}