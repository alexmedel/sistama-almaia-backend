import { Request, Response } from "express";
import { DataService } from "../DataService";
import { CalendarioDiaFestivo } from "../../../core/modelo/colegio/CalendarioDiaFestivo";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";

const dataService: DataService<CalendarioDiaFestivo> = new DataService(
  "calendarios_dias_festivos",
  "calendario_dia_festivo_id"
);
export const CalendarioDiaFestivosService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query;
      let respuestaEnviada = false;
      if (colegio_id !== undefined) {
        const diasFestivos = await obtenerRelacionados({
          tableFilter: "calendarios_escolares",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "calendario_escolar_id",
          tableIn: "calendarios_dias_festivos",
          inField: "calendario_escolar_id",
          selectFields: `*,                      
                        calendarios_escolares(calendario_escolar_id,ano_escolar,fecha_inicio,fecha_fin,dias_habiles,colegios(colegio_id,nombre))`,
        });
        respuestaEnviada = true;
        res.json(diasFestivos);
      }
      if (!respuestaEnviada) {
        const diasFestivos = await dataService.getAll(
          [
            "*",
            "calendarios_escolares(calendario_escolar_id,ano_escolar,fecha_inicio,fecha_fin,dias_habiles,colegios(colegio_id,nombre))",
          ],
          where
        );
        res.json(diasFestivos);
      }
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
  },
};
