import AdmZip from "adm-zip";
import { SupabaseClient } from "@supabase/supabase-js";
import moment from "moment";
import "moment/locale/es";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlmacenamientoServicio } from "./funciones/AlumnoAlmacenamiento";
import { HtmlPdfRenderer, PdfRenderer } from "./pdf/HtmlPdfRenderer";
import {
  AlumnoInformePdfData,
  renderAlumnoInformeHtml,
} from "./pdf/templates/alumnoInformeHtml";
import { renderAlumnoNoDataInformeHtml } from "./pdf/templates/alumnoNoDataInformeHtml";

moment.locale("es");

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

type AlumnoInformeDetalle = AlumnoInformePdfData & {
  alumno_informe_id: number;
  template_informe?: string;
  alerta_emociones?: boolean;
  alerta_patologica?: boolean;
  alerta_neurodivergencia?: boolean;
};

export interface AlumnoInformePdfDataSource {
  obtenerDetalleParaPdf(alumnoInformeId: number): Promise<AlumnoInformeDetalle>;
  obtenerLogoAlumnoDataUri(): Promise<string | undefined>;
}

let cachedLogoDataUri: string | undefined;

function obtenerTextoPersona(alumno: any): string {
  const persona = Array.isArray(alumno?.personas)
    ? alumno.personas[0]
    : alumno?.personas;
  return [persona?.nombres, persona?.apellidos].filter(Boolean).join(" ");
}

function obtenerCursoAlumno(alumno: any, periodoAnio?: number): string {
  const cursos = Array.isArray(alumno?.alumnos_cursos)
    ? alumno.alumnos_cursos
    : [];
  const cursoActivo =
    cursos.find(
      (item: any) =>
        item?.activo === true &&
        (!periodoAnio || item?.ano_escolar === periodoAnio)
    ) || cursos[0];
  return cursoActivo?.cursos?.nombre_curso || "";
}

function obtenerPeriodo(row: any): string {
  if (row.periodo) {
    return row.periodo;
  }

  if (typeof row.periodo_anio === "number" && typeof row.periodo_mes === "number") {
    return moment()
      .year(row.periodo_anio)
      .month(row.periodo_mes - 1)
      .format("MMMM YYYY");
  }

  return "";
}

export function mapearDetalleAlumnoPdf(row: any): AlumnoInformeDetalle {
  return {
    alumno_informe_id: row.alumno_informe_id,
    template_informe: row.template_informe || "",
    alumno:
      row.alumno ||
      row.nombre_alumno ||
      obtenerTextoPersona(row.alumnos) ||
      `${row.nombres || ""} ${row.apellidos || ""}`.trim(),
    curso: row.curso || row.nombre_curso || obtenerCursoAlumno(row.alumnos, row.periodo_anio),
    periodo: obtenerPeriodo(row),
    analisis_diagnostico:
      row.analisis_diagnostico || row.descripcion_informe || "",
    analisis_recomendaciones:
      row.analisis_recomendaciones || row.recomendacion_almaia || "",
    alerta_emociones:
      typeof row.alerta_emociones === "boolean" ? row.alerta_emociones : undefined,
    alerta_patologica:
      typeof row.alerta_patologica === "boolean"
        ? row.alerta_patologica
        : undefined,
    alerta_neurodivergencia:
      typeof row.alerta_neurodivergencia === "boolean"
        ? row.alerta_neurodivergencia
        : undefined,
    patologia: row.alerta_neurodivergencia
      ? "Se observan se\u00f1ales que pueden orientar a una Neurodivergencia"
      : row.patologia || "",
  };
}

function esTemplateAlumnoNoData(templateInforme?: string): boolean {
  if (!templateInforme) {
    return false;
  }
  return (
    templateInforme ===
      "No existe suficiente informaciÃ³n del periodo para generar el informe." ||
    templateInforme ===
      "No existe suficiente información del periodo para generar el informe." ||
    templateInforme === "TEMPLATE_ALUMNOS_NO_DATA.docx"
  );
}

export const AlumnoInformePdfDataSourceSupabase: AlumnoInformePdfDataSource = {
  async obtenerDetalleParaPdf(alumnoInformeId: number) {
    const { data, error } = await client.rpc(
      "consultar_informe_alumno_pdf",
      { p_alumno_informe_id: alumnoInformeId }
    );

    const informe = Array.isArray(data) ? data[0] : data;
    if (error || !informe) {
      throw new Error("Informe de alumno no encontrado");
    }

    return mapearDetalleAlumnoPdf(informe);
  },

  async obtenerLogoAlumnoDataUri() {
    if (cachedLogoDataUri) {
      return cachedLogoDataUri;
    }

    const templateBuffer = await AlmacenamientoServicio.descargarPlantilla(
      "templates/alumnos/TEMPLATE_ALUMNOS.docx"
    );
    const zip = new AdmZip(templateBuffer);
    const imageEntry =
      zip.getEntry("word/media/image1.jpg") ||
      zip
        .getEntries()
        .find((entry) => entry.entryName.startsWith("word/media/"));

    if (!imageEntry) {
      return undefined;
    }

    const imageBuffer = imageEntry.getData();
    cachedLogoDataUri = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    return cachedLogoDataUri;
  },
};

export const AlumnoInformePdfService = {
  async generarPdfAlumno(
    alumnoInformeId: number,
    dependencies: {
      dataSource?: AlumnoInformePdfDataSource;
      renderer?: PdfRenderer;
    } = {}
  ) {
    const dataSource =
      dependencies.dataSource || AlumnoInformePdfDataSourceSupabase;
    const renderer = dependencies.renderer || HtmlPdfRenderer;
    const detalle = await dataSource.obtenerDetalleParaPdf(alumnoInformeId);
    const logoDataUri = await dataSource
      .obtenerLogoAlumnoDataUri()
      .catch(() => undefined);

    const html = esTemplateAlumnoNoData(detalle.template_informe)
      ? renderAlumnoNoDataInformeHtml({
          nombre: detalle.alumno,
          curso: detalle.curso,
          periodo: detalle.periodo,
          notas_emociones: detalle.alerta_emociones
            ? "Existe una alerta en el periodo indicado que fue reportada al Colegio."
            : "Sin datos disponibles",
          notas_patologias: detalle.alerta_patologica
            ? "Existe una alerta en el periodo indicado que fue reportada al Colegio."
            : "Sin datos disponibles",
          notas_neurodivergencia: detalle.alerta_neurodivergencia
            ? "Se observan se\u00f1ales que pueden orientar a una Neurodivergencia."
            : "Sin datos disponibles",
          logoDataUri,
        })
      : renderAlumnoInformeHtml({
          ...detalle,
          logoDataUri,
        });
    const pdfBuffer = await renderer.render(html, { format: "Letter" });

    return {
      pdfBuffer,
      filename: `informe_alumno_${alumnoInformeId}.pdf`,
    };
  },
};

