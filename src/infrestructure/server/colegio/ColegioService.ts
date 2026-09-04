 
import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Colegio } from "../../../core/modelo/colegio/Colegio";
import XLSX from "exceljs";
import { ColegioExcel } from "../../../core/modelo/import/ColegioExcel";
import { Fileservice } from "../../../core/services/FileService";
import { CalendarioEscolarExcel } from "../../../core/modelo/import/CalendarioEscolarExcel";
import { DiaFestivoExcel } from "../../../core/modelo/import/DiaFestivoExcel";
import { FechaImportanteExcel } from "../../../core/modelo/import/FechaImportanteExcel";
import { NivelEducativoExcel } from "../../../core/modelo/import/NivelEducativoExcel";
import { GradoExcel } from "../../../core/modelo/import/GradoExcel";
import { MateriaExcel } from "../../../core/modelo/import/MateriaExcel";
import { CursoExcel } from "../../../core/modelo/import/CursoExcel";
import { DirectivoExcel } from "../../../core/modelo/import/DirectivoExcel";
import { DocenteExcel } from "../../../core/modelo/import/DocenteExcel";
import { AlumnoExcel } from "../../../core/modelo/import/AlumnoExcel";
import { AulaExcel } from "../../../core/modelo/import/AulaExcel";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { errorHandler, ValidationError } from "../../../helpers/ErrorResponse";
import { ColegioExcelStagingLoader } from "../../../core/services/ColegioExcelStagingLoader";
import Joi from "joi";

const dataService: DataService<Colegio> = new DataService(
  "colegios",
  "colegio_id"
);

const ColegioSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
  nombre_fantasia: Joi.string().trim().min(1).required(),
  tipo_colegio: Joi.string().trim().min(1).required(),
  dependencia: Joi.string().allow("", null).optional(),
  sitio_web: Joi.string().allow("", null).optional(),
  direccion: Joi.string().trim().min(1).required(),
  telefono_contacto: Joi.string().trim().min(1).required(),
  correo_electronico: Joi.string().email().required(),
  comuna_id: Joi.number().integer().positive().required(),
  region_id: Joi.number().integer().positive().required(),
  pais_id: Joi.number().integer().positive().required(),
  correo_sos: Joi.string().email().allow("", null).optional(),
  correo_denuncia: Joi.string().email().allow("", null).optional(),
  permitir_anonimo: Joi.boolean().optional(),
  forzar_identificacion: Joi.boolean().optional(),
  zona_horaria: Joi.string().allow("", null).optional(),
}).unknown(false);

export const ColegiosService = {
  async cargarExcelStaging(req: Request, res: Response) {
    try {
      const file =
        req.file ||
        (Array.isArray(req.files) ? req.files[0] : undefined);

      if (!file) {
        throw new Error("Archivo no encontrado");
      }

      const loader = new ColegioExcelStagingLoader({
        supabaseClient: req.supabaseAdmin,
      });
      const resultado = await loader.load(file);

      FormatResponse(res, STATUS_CODES.CREATED, resultado);
    } catch (error) {
      errorHandler.handleError(error, res, "ColegiosService.cargarExcelStaging");
    }
  },

  async importarExcelColegio(req: Request, res: Response) {
    try {
      const fileService = new Fileservice();
      const { colegio_id } = req.query;
      if (!req.file) throw new Error("Archivo no encontrado");
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(req.file.buffer); // Cargar el archivo Excel desde el buffer
      // const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

      const ordenLectura = [
        "Colegio",
        "Año_Academico",
        "Dias Festivos",
        "Fechas Importantes",
        "Cargos_Directivos",
        "Directivos",
        "Niveles_Educativos",
        "Grados",
        "Materias",
        "Cursos",
        "Docentes",
        "Alumnos",
        "Aulas",
      ];
      fileService.setColegio(colegio_id);
      for (const hoja of ordenLectura) {
        const worksheet = workbook.getWorksheet(hoja);
        if (!worksheet) continue;
        // const datos = XLSX.utils.sheet_to_json(workbook.Sheets[hoja]);

        // Obtiene los encabezados
        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell) => {
          headers.push(cell.value?.toString() ?? "");
        });

        // Convierte las filas a objetos usando los encabezados
        const datos: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // omitir encabezado
          const obj: any = {};
          row.eachCell((cell, colNumber) => {
            obj[headers[colNumber - 1]] = cell.value;
          });
          datos.push(obj);
        });

        switch (hoja) {
          case "Año_Academico":
            if (colegio_id === undefined) {
              await fileService.procesarAnioAcademico({
                data: datos as CalendarioEscolarExcel[],
              });
            }
            break;

          case "Dias Festivos":
            if (colegio_id === undefined) {
              await fileService.procesarDiasFestivos({
                data: datos as DiaFestivoExcel[],
              });
            }
            break;

          case "Fechas Importantes":
            if (colegio_id === undefined) {
              await fileService.procesarFechasImportantes({
                data: datos as FechaImportanteExcel[],
              });
            }
            break;

          case "Colegio":
            if (colegio_id === undefined) {
              await fileService.procesarColegio({
                data: datos as ColegioExcel[],
              });
            }
            break;

          case "Cargos_Directivos":
            await fileService.procesarCargosDirectivos({ data: datos });
            break;

          case "Directivos":
            if (colegio_id === undefined) {
              await fileService.procesarDirectivos({
                data: datos as DirectivoExcel[],
              });
            }
            break;

          case "Niveles_Educativos":
            if (colegio_id === undefined) {
              await fileService.procesarNivelesEducativos({
                data: datos as NivelEducativoExcel[],
              });
            }
            break;

          case "Grados":
            await fileService.procesarGrados({ data: datos as GradoExcel[] });
            break;

          case "Materias":
            await fileService.procesarMaterias({
              data: datos as MateriaExcel[],
            });
            break;

          case "Cursos":
            if (colegio_id === undefined) {
              await fileService.procesarCursos({ data: datos as CursoExcel[] });
            }
            break;

          case "Docentes":
            if (colegio_id === undefined) {
              await fileService.procesarDocentes({
                data: datos as DocenteExcel[],
              });
            }
            break;

          case "Alumnos":
            await fileService.procesarAlumnos({ data: datos as AlumnoExcel[] });
            break;

          case "Aulas":
            if (colegio_id === undefined) {
              await fileService.procesarAulas({ data: datos as AulaExcel[] });
            }
            break;

          default:
            console.warn(`Hoja desconocida: ${hoja}`);
        }
      }
      FormatResponse(res, STATUS_CODES.CREATED, {
        message: "Excel procesado correctamente.",
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "ColegiosService.importarExcelColegio"
      );
    }
  },

  async obtener(req: Request, res: Response) {
    try {
       
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const colegios = await dataService.getAll(["*"], where);
     
      FormatResponse(res, STATUS_CODES.OK, colegios);
    } catch (error) {
      errorHandler.handleError(error, res, "ColegiosService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const { value, error: validationError } = ColegioSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (validationError) {
        throw new ValidationError(
          "Datos de colegio inválidos",
          validationError.details.map((detail) => detail.message)
        );
      }

      const { data: comuna, error: comunaError } = await req.supabaseAdmin
        .from("comunas")
        .select("comuna_id")
        .eq("comuna_id", value.comuna_id)
        .eq("region_id", value.region_id)
        .eq("pais_id", value.pais_id)
        .maybeSingle();

      if (comunaError) {
        throw comunaError;
      }

      if (!comuna) {
        throw new ValidationError(
          "comuna_id, region_id y pais_id no corresponden a una localidad válida"
        );
      }

      const now = new Date().toISOString();
      const colegio = {
        ...value,
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
        fecha_creacion: now,
        fecha_actualizacion: now,
        activo: true,
      } as Colegio;

      const savedcolegio = await dataService.processData(colegio);

      FormatResponse(res, STATUS_CODES.CREATED, savedcolegio);
    } catch (error) {
      errorHandler.handleError(error, res, "ColegiosService.guardar");
    }
  },
  actualizar: async (req: Request, res: Response) => {
    try {
      const colegioId = parseInt(req.params.id);
      const colegio: Colegio = req.body;
      const updatedcolegio = await dataService.updateById(colegioId, colegio);
      FormatResponse(res, STATUS_CODES.OK, updatedcolegio);
    } catch (error) {
      errorHandler.handleError(error, res, "ColegiosService.actualizar");
    }
  },
  eliminar: async (req: Request, res: Response) => {
    try {
      const colegioId = parseInt(req.params.id);
      await dataService.deleteById(colegioId);
      res.status(204).send();
    } catch (error) {
      errorHandler.handleError(error, res, "ColegiosService.actualizar");
    }
  },
};
