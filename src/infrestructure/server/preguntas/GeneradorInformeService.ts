import { Request, Response } from "express";

import { DataService } from "../DataService";
import { GeneradorInforme } from "../../../core/modelo/preguntasRespuestas/GeneradorInforme";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const GeneradorInformeSchema = Joi.object({
  pregunta: Joi.string().max(50).required(),
  tiene_respuesta: Joi.boolean().required(),
  texto: Joi.string().required(),
  freq_dias: Joi.number().integer().required(),
  generador_informe_ambito_id: Joi.number().integer().required(),
});
const dataService: DataService<GeneradorInforme> = new DataService(
  "generadores_informes"
);
export const GeneradorInformeService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const generadorInforme = await dataService.getAll(
        ["*", "generador_imformes_ambitos(generador_imforme_ambito_id,nombre)"],
        where
      );
      res.json(generadorInforme);
    } catch (error) {
      console.error("Error al obtener el generadorInforme:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const generadorInforme: GeneradorInforme = req.body;
      Object.assign(generadorInforme, req.body);
      generadorInforme.creado_por = req.creado_por;
      generadorInforme.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = GeneradorInformeSchema.validate(
        req.body
      );
      const { data, error } = await client
        .from("generador_informes_ambitos")
        .select("*")
        .eq(
          "generador_informe_ambito_id",
          generadorInforme.generador_imforme_ambito_id
        )
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedGeneradorInforme = await dataService.processData(
          generadorInforme
        );
        res.status(201).json(savedGeneradorInforme);
      }
    } catch (error) {
      console.error("Error al guardar el generadorInforme:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const generadorInforme: GeneradorInforme = req.body;
      Object.assign(generadorInforme, req.body);
      generadorInforme.creado_por = req.creado_por;
      generadorInforme.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = GeneradorInformeSchema.validate(
        req.body
      );
      const { data, error } = await client
        .from("generador_informes_ambitos")
        .select("*")
        .eq(
          "generador_informe_ambito_id",
          generadorInforme.generador_imforme_ambito_id
        )
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, generadorInforme);
        res
          .status(200)
          .json({ message: "GeneradorInforme actualizado correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar el generadorInforme:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "Generador Informe eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el generadorInforme:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
