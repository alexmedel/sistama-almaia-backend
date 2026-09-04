import AdmZip from "adm-zip";
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlmacenamientoServicio } from "./funciones/AlumnoAlmacenamiento";
import { HtmlPdfRenderer, PdfRenderer } from "./pdf/HtmlPdfRenderer";
import { renderColegioInformeHtml } from "./pdf/templates/colegioInformeHtml";
import { renderCursoInformeHtml } from "./pdf/templates/cursoInformeHtml";
import { renderNivelInformeHtml } from "./pdf/templates/nivelInformeHtml";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const logoCache = new Map<string, string>();

type InformeGeneralDetalle = {
  informe_id: number;
  tipo: string;
  template_informe?: string;
  periodo: string;
  periodo_anio: number;
  periodo_mes: number;
  descripcion_informe: string;
  recomendacion_almaia: string;
  nivel?: string;
  nombre_curso?: string;
  docente?: string;
  colegio?: string;
  nombre_fantasia?: string;
  alerta_neurodivergencia?: boolean;
};

function normalizarTipo(tipo?: string): 2 | 3 | 4 {
  if (!tipo) {
    throw new Error("Tipo de informe no definido");
  }
  const clean = String(tipo).toLowerCase().trim();
  if (clean === "2" || clean === "grado" || clean === "grados" || clean === "nivel" || clean === "niveles") {
    return 2;
  }
  if (clean === "3" || clean === "curso" || clean === "cursos") {
    return 3;
  }
  if (clean === "4" || clean === "colegio" || clean === "colegios") {
    return 4;
  }
  throw new Error(`Tipo de informe no soportado: ${tipo}`);
}

function textoNeurodivergencia(activa?: boolean, tipo?: 2 | 3 | 4): string {
  if (!activa) {
    return "";
  }
  if (tipo === 2) {
    return "En algunos estudiantes del Nivel se han identificado indicios que podrian estar asociados a un perfil neurodivergente.";
  }
  if (tipo === 3) {
    return "En algunos estudiantes del Curso se han identificado indicios que podrian estar asociados a un perfil neurodivergente.";
  }
  return "En algunos estudiantes del colegio se han identificado indicios que podrian estar asociados a un perfil neurodivergente.";
}

async function obtenerLogoDataUriDesdePlantilla(
  templatePath: string
): Promise<string | undefined> {
  if (logoCache.has(templatePath)) {
    return logoCache.get(templatePath);
  }

  const templateBuffer = await AlmacenamientoServicio.descargarPlantilla(templatePath);
  const zip = new AdmZip(templateBuffer);
  const imageEntry =
    zip.getEntry("word/media/image1.jpg") ||
    zip.getEntry("word/media/image1.png") ||
    zip.getEntries().find((entry) => entry.entryName.startsWith("word/media/"));

  if (!imageEntry) {
    return undefined;
  }

  const imageBuffer = imageEntry.getData();
  const mimeType = imageEntry.entryName.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";
  const dataUri = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  logoCache.set(templatePath, dataUri);
  return dataUri;
}

async function obtenerDetalle(informeId: number): Promise<InformeGeneralDetalle> {
  const { data, error } = await client.rpc("consultar_informe_general_pdf", {
    p_informe_id: informeId,
  });
  const informe = Array.isArray(data) ? data[0] : data;
  if (error || !informe) {
    throw new Error("Informe general no encontrado");
  }
  return informe as InformeGeneralDetalle;
}

export const InformeGeneralPdfService = {
  async generarPdfGeneral(
    informeId: number,
    dependencies: { renderer?: PdfRenderer } = {}
  ) {
    const renderer = dependencies.renderer || HtmlPdfRenderer;
    const detalle = await obtenerDetalle(informeId);
    const tipo = normalizarTipo(detalle.tipo);
    const templatePath =
      tipo === 2
        ? "templates/niveles/TEMPLATE_NIVELES.docx"
        : tipo === 3
        ? "templates/cursos/TEMPLATE_CURSOS.docx"
        : "templates/colegios/TEMPLATE_COLEGIOS.docx";
    const logoDataUri = await obtenerLogoDataUriDesdePlantilla(templatePath).catch(
      () => undefined
    );

    const neuro = textoNeurodivergencia(detalle.alerta_neurodivergencia, tipo);
    const html =
      tipo === 2
        ? renderNivelInformeHtml({
            nivel: detalle.nivel || "",
            periodo: detalle.periodo || "",
            cuerpo: detalle.descripcion_informe || "",
            recomendaciones: detalle.recomendacion_almaia || "",
            neurodivergencias: neuro,
            logoDataUri,
          })
        : tipo === 3
        ? renderCursoInformeHtml({
            curso: detalle.nombre_curso || "",
            nivel: detalle.nivel || "",
            periodo: detalle.periodo || "",
            docente: detalle.docente || "",
            cuerpo: detalle.descripcion_informe || "",
            recomendaciones: detalle.recomendacion_almaia || "",
            neurodivergencia: neuro,
            logoDataUri,
          })
        : renderColegioInformeHtml({
            colegio: detalle.nombre_fantasia || detalle.colegio || "",
            periodo: detalle.periodo || "",
            cuerpo: detalle.descripcion_informe || "",
            recomendaciones: detalle.recomendacion_almaia || "",
            neurodivergencia: neuro,
            logoDataUri,
          });

    const pdfBuffer = await renderer.render(html, { format: "Letter" });
    return {
      pdfBuffer,
      filename: `informe_general_${informeId}.pdf`,
    };
  },
};
