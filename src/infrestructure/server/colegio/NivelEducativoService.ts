import { Request, Response } from "express";
import { DataService } from "../DataService";
import { NivelEducativo } from "../../../core/modelo/colegio/NivelEducativo";
import { obtenerIdColegio } from "../../../core/services/ColegioServiceCasoUso";

const dataService: DataService<NivelEducativo> = new DataService(
  "niveles_educativos",
  "nivel_educativo_id"
);
export const NivelEducativosService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id_bd } = req.params;
      let colegio_id = parseInt(colegio_id_bd);
      colegio_id = await obtenerIdColegio(colegio_id, req.user.usuario_id);
      const where = { ...req.query, colegio_id: colegio_id }; // Convertir los parámetros de consulta en filtros
      const nivelesEducativos = await dataService.getAll(["*"], where);
      res.json(nivelesEducativos);
    } catch (error) {

      res.status(500).json(error);
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const nuevoNivelEducativo = req.body;
      const nivelEducativoCreado = await dataService.processData(
        nuevoNivelEducativo
      );
      res.status(201).json(nivelEducativoCreado);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const nivelEducativoId = parseInt(req.params.id);
      const nivelEducativoActualizado = req.body;
      const nivelEducativo = await dataService.updateById(
        nivelEducativoId,
        nivelEducativoActualizado
      );
      res.json(nivelEducativo);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const nivelEducativoId = parseInt(req.params.id);
      await dataService.deleteById(nivelEducativoId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
