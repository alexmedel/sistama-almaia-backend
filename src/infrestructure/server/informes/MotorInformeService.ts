 
import AdmZip from "adm-zip";
import { SupabaseClient } from "@supabase/supabase-js";
import moment from "moment";
import "moment/locale/es";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlmacenamientoServicio } from "./funciones/AlumnoAlmacenamiento";
import { InformeGeneralBusiness } from "./funciones/InformeGeneralBusiness";
import {
  llenarTablaInformesAlumnosPorPeriodo,
  llenarTablaInformesGeneralesPorPeriodo,
  obtenerPeriodosPendientesPorColegio,
} from "./funciones/motorInformePeriodoRunner";
import {
  ColegioActivo,
  formatearPeriodo,
} from "./funciones/motorInformePeriodoTypes";
import { HtmlPdfRenderer } from "./pdf/HtmlPdfRenderer";
import { renderAlumnoInformeHtml } from "./pdf/templates/alumnoInformeHtml";
import { renderAlumnoNoDataInformeHtml } from "./pdf/templates/alumnoNoDataInformeHtml";
import { renderColegioInformeHtml } from "./pdf/templates/colegioInformeHtml";
import { renderCursoInformeHtml } from "./pdf/templates/cursoInformeHtml";
import { renderNivelInformeHtml } from "./pdf/templates/nivelInformeHtml";

moment.locale("es");

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const COLEGIOS_INFORMES_PREDETERMINADOS = [0, 13, 14];
const LOGO_CACHE = new Map<string, string>();
const CHUNK_ALUMNOS = Number(process.env.INFORMES_ALUMNOS_CHUNK || 2);
const CHUNK_GENERALES = Number(process.env.INFORMES_GENERALES_CHUNK || 5);

function obtenerColegiosInformesConfigurados(): number[] {
  const raw = process.env.INFORMES_COLEGIO_IDS;
  if (!raw) {
    return COLEGIOS_INFORMES_PREDETERMINADOS;
  }

  const colegioIds = raw
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id));

  return colegioIds.length > 0 ? colegioIds : COLEGIOS_INFORMES_PREDETERMINADOS;
}

export const MotorInformeService = {
  async obtenerColegiosActivos(): Promise<ColegioActivo[]> {
    const colegioIds = obtenerColegiosInformesConfigurados();
    const { data: colegios, error } = await client
      .from("colegios")
      .select("colegio_id, nombre")
      .in("colegio_id", colegioIds);

    if (error) {
      console.error("Error al obtener colegios:", error);
      throw new Error("Error al obtener colegios");
    }

    return (colegios || []) as ColegioActivo[];
  },

  async insertarAuditoria(
    descripcion: string,
    modulo_afectado: string,
    accion_realizada: string
  ) {
    await client.from("auditorias").insert({
      tipo_auditoria_id: 3,
      colegio_id: 0,
      fecha: new Date().toISOString(),
      usuario_id: 1,
      descripcion,
      modulo_afectado,
      accion_realizada,
      ip_origen: "127.0.0.1",
      referencia_id: 0,
      model: "motor_informes_backend",
    });
  },

  async ejecutarMotor() {
    console.log("--- Iniciando la ejecución del motor de informes ---");
    const inicioTotal = Date.now();

    try {
      const colegios = await this.obtenerColegiosActivos();
      if (colegios.length === 0) {
        console.log("No hay colegios para procesar.");
        return;
      }

      for (const colegio of colegios) {
        await this.procesarColegioPendiente(colegio);
      }

      const finTotal = Date.now();
      console.log(
        `--- Motor de informes ejecutado correctamente en ${
          (finTotal - inicioTotal) / 1000
        } segundos ---`
      );
    } catch (error) {
      console.error("Error al ejecutar el motor de informes:", error);
      throw error;
    }
  },

  async procesarColegioPendiente(colegio: ColegioActivo) {
    console.log(
      `Procesando colegio: ${colegio.nombre} (ID: ${colegio.colegio_id})`
    );
    const inicioColegio = Date.now();
    const periodosPendientes = await obtenerPeriodosPendientesPorColegio(
      client,
      colegio
    );

    if (periodosPendientes.length === 0) {
      console.log(`No hay períodos pendientes para colegio ${colegio.nombre}`);
      return;
    }

    console.log(
      `Períodos pendientes para ${colegio.nombre}: ${periodosPendientes
        .map((periodo) => formatearPeriodo(periodo.anio, periodo.mes))
        .join(", ")}`
    );

    for (const periodo of periodosPendientes) {
      await this.procesarPeriodoPendiente(colegio, periodo);
    }

    const finColegio = Date.now();
    console.log(
      `Colegio ${colegio.nombre} procesado en ${
        (finColegio - inicioColegio) / 1000
      } segundos`
    );
    await this.insertarAuditoria(
      `Procesamiento completado para colegio ${colegio.nombre} (ID: ${colegio.colegio_id})`,
      "motor_informes",
      "procesamiento_colegio"
    );
  },

  async procesarPeriodoPendiente(
    colegio: ColegioActivo,
    periodo: { anio: number; mes: number; alumnosPendientes: boolean; generalesPendientes: boolean }
  ) {
    const periodoTexto = formatearPeriodo(periodo.anio, periodo.mes);
    console.log(
      `Procesando período ${periodoTexto} para colegio ${colegio.nombre}`
    );

    if (periodo.alumnosPendientes) {
      await this.insertarAuditoria(
        `Inicio llenado alumnos_informes para colegio ${colegio.nombre} período ${periodoTexto}`,
        "motor_informes",
        "inicio_alumnos_periodo"
      );
      await llenarTablaInformesAlumnosPorPeriodo(client, colegio, periodo);
      await this.insertarAuditoria(
        `Fin llenado alumnos_informes para colegio ${colegio.nombre} período ${periodoTexto}`,
        "motor_informes",
        "fin_alumnos_periodo"
      );
    }

    if (periodo.generalesPendientes) {
      await this.insertarAuditoria(
        `Inicio llenado informes_generales para colegio ${colegio.nombre} período ${periodoTexto}`,
        "motor_informes",
        "inicio_generales_periodo"
      );
      await llenarTablaInformesGeneralesPorPeriodo(client, colegio, periodo);
      await this.insertarAuditoria(
        `Fin llenado informes_generales para colegio ${colegio.nombre} período ${periodoTexto}`,
        "motor_informes",
        "fin_generales_periodo"
      );
    }
  },

  async consultarAlertas(
    alumnoId: number,
    periodo: string,
    tipoConcepto: string
  ) {
    const fecha = moment(periodo, "MMMM YYYY", "es");
    const startOfMonth = fecha.startOf("month").toISOString();
    const endOfMonth = fecha.endOf("month").toISOString();

    const { data } = await client
      .from("alumnos_alertas")
      .select("*")
      .eq("alumno_id", alumnoId)
      .eq("tipo_concepto", tipoConcepto)
      .gte("fecha", startOfMonth)
      .lte("fecha", endOfMonth);

    return data && data.length > 0;
  },

  async determinarTemplateYDatos(informe: any) {
    const usarTemplateAlternativo =
      informe.template_informe ===
      "No existe suficiente información del periodo para generar el informe.";

    if (usarTemplateAlternativo) {
      return this.prepararTemplateAlternativo(informe);
    }

    return {
      templatePath: `templates/alumnos/TEMPLATE_ALUMNOS.docx`,
      dataInforme: {
        esTemplateNoData: false,
        alumno: `${informe.nombres} ${informe.apellidos}`,
        curso: informe.nombre_curso || "",
        periodo: informe.periodo || "",
        analisis_diagnostico: informe.descripcion_informe || "",
        analisis_recomendaciones: informe.recomendacion_almaia || "",
        patologia: informe.alerta_neurodivergencia
          ? "Se observan señales que pueden orientar a una Neurodivergencia"
          : "",
      },
    };
  },

  async prepararTemplateAlternativo(informe: any) {
    const periodo = informe.periodo || "";
    const [hayAlertaEmociones, hayAlertaPatologica, hayAlertaNeurodivergencia] =
      await Promise.all([
        this.consultarAlertas(informe.alumno_id, periodo, "Emociones"),
        this.consultarAlertas(informe.alumno_id, periodo, "Patologica"),
        this.consultarAlertas(informe.alumno_id, periodo, "Neurodivergencia"),
      ]);

    return {
      templatePath: `templates/alumnos/TEMPLATE_ALUMNOS_NO_DATA.docx`,
      dataInforme: {
        esTemplateNoData: true,
        nombre: `${informe.nombres} ${informe.apellidos}`,
        curso: informe.nombre_curso || "",
        periodo,
        notas_emociones: hayAlertaEmociones
          ? "Existe una alerta en el periodo indicado que fue reportada al Colegio."
          : "Sin datos disponibles",
        notas_patologias: hayAlertaPatologica
          ? "Existe una alerta en el periodo indicado que fue reportada al Colegio."
          : "Sin datos disponibles",
        notas_neurodivergencia: hayAlertaNeurodivergencia
          ? "Se observan señales que pueden orientar a una Neurodivergencia."
          : "Sin datos disponibles",
      },
    };
  },

  async procesarYGuardarInforme(
    templatePath: string,
    dataInforme: Record<string, any>,
    informe: any
  ) {
    const logoDataUri = await this.obtenerLogoDataUriDesdePlantilla(templatePath);
    const html = dataInforme.esTemplateNoData
      ? renderAlumnoNoDataInformeHtml({
          nombre: dataInforme.nombre,
          curso: dataInforme.curso,
          periodo: dataInforme.periodo,
          notas_emociones: dataInforme.notas_emociones,
          notas_patologias: dataInforme.notas_patologias,
          notas_neurodivergencia: dataInforme.notas_neurodivergencia,
          logoDataUri,
        })
      : renderAlumnoInformeHtml({
          alumno: dataInforme.alumno,
          curso: dataInforme.curso,
          periodo: dataInforme.periodo,
          analisis_diagnostico: dataInforme.analisis_diagnostico,
          analisis_recomendaciones: dataInforme.analisis_recomendaciones,
          patologia: dataInforme.patologia,
          logoDataUri,
        });

    const pdfBuffer = await HtmlPdfRenderer.render(html, { format: "Letter" });
    const outputPath = this.construirRutaAlumno(informe);
    const fileUrl = await AlmacenamientoServicio.guardarArchivo(
      outputPath,
      pdfBuffer,
      "application/pdf"
    );

    return { fileUrl, outputPath };
  },

  construirRutaAlumno(informe: any) {
    const colegioLimpio = this.limpiarTextoArchivo(informe.colegio);
    const periodoLimpio = (informe.periodo || "").replace(/\s+/g, "_");
    const nombreFantasiaLimpio = this.limpiarTextoArchivo(
      informe.nombre_fantasia || ""
    );
    const templateLimpio = this.limpiarTextoArchivo(
      informe.template_informe || ""
    );

    return `alumnos/${colegioLimpio}/informe_${periodoLimpio}_${nombreFantasiaLimpio}_${informe.alumno_informe_id}_${informe.alumno_id}_${templateLimpio}.pdf`;
  },

  limpiarTextoArchivo(texto: string) {
    return (texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9\-_.]/g, "_");
  },

  async actualizarBaseDatos(alumnoInformeId: number, fileUrl: string) {
    const { error } = await client
      .from("alumnos_informes")
      .update({
        generado: true,
        url_reporte: fileUrl,
        fecha_actualizacion: new Date().toUTCString(),
      })
      .eq("alumno_informe_id", alumnoInformeId);

    if (error) {
      throw new Error(`Error al actualizar la base de datos: ${error.message}`);
    }
  },

  async generarInformeAlumnos() {
    console.log("--- Generando informes de alumnos ---");
    const inicioTotal = Date.now();

    try {
      const colegios = await this.obtenerColegiosActivos();
      if (colegios.length === 0) {
        console.log("No hay colegios para procesar.");
        return;
      }

      for (const colegio of colegios) {
        await this.generarInformeAlumnosPorColegio(colegio);
      }

      const finTotal = Date.now();
      console.log(
        `--- Generación de informes de alumnos completada en ${
          (finTotal - inicioTotal) / 1000
        } segundos ---`
      );
    } catch (error) {
      console.error("Error al generar informes de alumnos:", error);
    }
  },

  async generarInformeAlumnosPorColegio(colegio: ColegioActivo) {
    console.log(
      `Procesando colegio: ${colegio.nombre} (ID: ${colegio.colegio_id})`
    );
    const inicioColegio = Date.now();
    const informes = await InformeGeneralBusiness.obtenerInformesPendientes(
      client,
      colegio.colegio_id
    );

    if (informes.length === 0) {
      console.log(`No hay informes pendientes para el colegio ${colegio.nombre}`);
      return;
    }

    const chunkSize = CHUNK_ALUMNOS;
    let fallidosPrimeraVuelta: any[] = [];
    for (let i = 0; i < informes.length; i += chunkSize) {
      const lote = informes.slice(i, i + chunkSize);
      const fallidosLote = await this.procesarLoteInformesAlumnos(
        colegio,
        informes.length,
        i,
        lote,
        chunkSize
      );
      fallidosPrimeraVuelta = fallidosPrimeraVuelta.concat(fallidosLote);
    }

    if (fallidosPrimeraVuelta.length > 0) {
      console.log(
        `Reintentando ${fallidosPrimeraVuelta.length} informes de alumnos fallidos en segunda vuelta (${colegio.nombre})`
      );
      await this.insertarAuditoria(
        `Segunda vuelta alumnos: ${fallidosPrimeraVuelta.length} pendientes para colegio ${colegio.nombre}`,
        "motor_informes",
        "segunda_vuelta_alumnos"
      );

      for (let i = 0; i < fallidosPrimeraVuelta.length; i += chunkSize) {
        const lote = fallidosPrimeraVuelta.slice(i, i + chunkSize);
        await this.procesarLoteInformesAlumnos(
          colegio,
          fallidosPrimeraVuelta.length,
          i,
          lote,
          chunkSize,
          true
        );
      }
    }

    const finColegio = Date.now();
    console.log(
      `Colegio ${colegio.nombre} procesado en ${
        (finColegio - inicioColegio) / 1000
      } segundos`
    );
    await this.insertarAuditoria(
      `Procesamiento de informes de alumnos completado para colegio ${colegio.nombre} (ID: ${colegio.colegio_id})`,
      "motor_informes",
      "procesamiento_colegio_alumnos"
    );
  },

  async procesarLoteInformesAlumnos(
    colegio: ColegioActivo,
    totalInformes: number,
    inicioIndice: number,
    lote: any[],
    chunkSize: number,
    esSegundaVuelta = false
  ) {
    const inicioLote = Date.now();
    console.log(
      `Procesando lote ${Math.floor(inicioIndice / chunkSize) + 1} de ${Math.ceil(
        totalInformes / chunkSize
      )} para colegio ${colegio.nombre} (informes ${inicioIndice + 1} a ${Math.min(
        inicioIndice + chunkSize,
        totalInformes
      )})`
    );

    const resultados = await Promise.all(
      lote.map(async (informe) => {
        try {
          await this.procesarInformeAlumnoIndividual(informe);
          return { ok: true, informe };
        } catch (error) {
          console.error(
            `Error al generar el informe para el alumno ID ${informe.alumno_informe_id}:`,
            error
          );
          await this.insertarAuditoria(
            `Error al generar informe para alumno ID ${
              informe.alumno_informe_id
            }: ${error instanceof Error ? error.message : String(error)}`,
            "motor_informes",
            esSegundaVuelta
              ? "error_procesamiento_alumno_segunda_vuelta"
              : "error_procesamiento_alumno"
          );
          return { ok: false, informe };
        }
      })
    );

    const finLote = Date.now();
    console.log(
      `Lote ${Math.floor(inicioIndice / chunkSize) + 1} completado en ${
        (finLote - inicioLote) / 1000
      } segundos para colegio ${colegio.nombre}`
    );
    await this.insertarAuditoria(
      `Lote ${
        Math.floor(inicioIndice / chunkSize) + 1
      } de informes de alumnos procesado para colegio ${colegio.nombre}`,
      "motor_informes",
      esSegundaVuelta
        ? "procesamiento_lote_alumnos_segunda_vuelta"
        : "procesamiento_lote_alumnos"
    );

    return resultados.filter((r) => !r.ok).map((r) => r.informe);
  },

  async procesarInformeAlumnoIndividual(informe: any) {
    const { templatePath, dataInforme } = await this.determinarTemplateYDatos(
      informe
    );
    const { fileUrl } = await this.procesarYGuardarInforme(
      templatePath,
      dataInforme,
      informe
    );
    await this.actualizarBaseDatos(informe.alumno_informe_id, fileUrl);
  },

  prepararDatosInforme(
    informe: any,
    tipoInforme: 2 | 3 | 4
  ): Record<string, any> {
    const neurodivergenciaMensaje = informe.alerta_neurodivergencia
      ? tipoInforme === 2
        ? "En algunos estudiantes del Nivel se han identificado indicios que podrían estar asociados a un perfil neurodivergente."
        : tipoInforme === 3
        ? "En algunos estudiantes del Curso se han identificado indicios que podrían estar asociados a un perfil neurodivergente."
        : "En algunos estudiantes del colegio se han identificado indicios que podrían estar asociados a un perfil neurodivergente."
      : "";

    if (tipoInforme === 2) {
      return {
        nivel: informe.nivel || "",
        periodo: informe.periodo || "",
        cuerpo: informe.descripcion_informe || "",
        recomendaciones: informe.recomendacion_almaia || "",
        neurodivergencias: neurodivergenciaMensaje,
      };
    }

    if (tipoInforme === 3) {
      return {
        curso: informe.nombre_curso || "",
        nivel: informe.nivel || "",
        periodo: informe.periodo || "",
        docente: informe.docente || "",
        cuerpo: informe.descripcion_informe || "",
        recomendaciones: informe.recomendacion_almaia || "",
        neurodivergencia: neurodivergenciaMensaje,
      };
    }

    return {
      colegio: informe.nombre_fantasia || "",
      periodo: informe.periodo || "",
      cuerpo: informe.descripcion_informe || "",
      recomendaciones: informe.recomendacion_almaia || "",
      neurodivergencia: neurodivergenciaMensaje,
    };
  },

  generarNombreArchivo(informe: any, tipoInforme: 2 | 3 | 4): string {
    const nivelLimpio = this.limpiarTextoArchivo(informe.nivel || "");
    const periodoLimpio = (informe.periodo || "").replace(/\s+/g, "_");
    const nombreFantasiaLimpio = this.limpiarTextoArchivo(
      informe.nombre_fantasia || ""
    );
    const templateLimpio = this.limpiarTextoArchivo(
      informe.template_informe || ""
    );

    if (tipoInforme === 2) {
      return `informe_2_${nivelLimpio}_${periodoLimpio}_${nombreFantasiaLimpio}_${informe.informe_id}_${templateLimpio}`;
    }

    if (tipoInforme === 3) {
      return `informe_3_${nivelLimpio}_${periodoLimpio}_${nombreFantasiaLimpio}_${informe.curso_id}_${informe.informe_id}_${templateLimpio}`;
    }

    return `informe_4_${periodoLimpio}_${nombreFantasiaLimpio}_${informe.informe_id}`;
  },

  async actualizarBaseDatosGeneral(informeId: number, fileUrl: string) {
    const { error } = await client
      .from("informes_generales")
      .update({
        generado: true,
        url_reporte: fileUrl,
        fecha_actualizacion: new Date().toUTCString(),
      })
      .eq("informe_id", informeId);

    if (error) {
      throw new Error(`Error al actualizar la base de datos: ${error.message}`);
    }
  },

  async generarInformeGenerales(tipoInforme: 2 | 3 | 4 = 2) {
    const nombreTipo =
      tipoInforme === 2 ? "Grados" : tipoInforme === 3 ? "Cursos" : "Colegios";
    console.log(`--- Generando informes generales: ${nombreTipo} ---`);
    const inicioTotal = Date.now();

    try {
      if (tipoInforme === 4) {
        await this.generarInformesColegio();
      } else {
        await this.generarInformesGeneralesPorColegios(tipoInforme, nombreTipo);
      }

      const finTotal = Date.now();
      console.log(
        `--- Generación de informes generales ${nombreTipo} completada en ${
          (finTotal - inicioTotal) / 1000
        } segundos ---`
      );
    } catch (error) {
      console.error("Error al generar informes generales:", error);
    }
  },

  async generarInformesColegio() {
    const informes =
      await InformeGeneralBusiness.obtenerInformesColegioPendientes(client);

    if (informes.length === 0) {
      console.log("No hay informes pendientes de generación");
      return;
    }

    const tipoNombre = "colegios";
    const templatePath = `templates/${tipoNombre}/TEMPLATE_${tipoNombre.toUpperCase()}.docx`;

    const fallidos = await this.procesarLotesInformesGenerales(
      informes,
      4,
      tipoNombre,
      templatePath
    );

    if (fallidos.length > 0) {
      console.log(
        `Segunda vuelta generales (colegios): ${fallidos.length} informes fallidos`
      );
      await this.procesarLotesInformesGenerales(
        fallidos,
        4,
        tipoNombre,
        templatePath,
        true
      );
    }
  },

  async generarInformesGeneralesPorColegios(
    tipoInforme: 2 | 3,
    nombreTipo: string
  ) {
    const colegios = await this.obtenerColegiosActivos();
    if (colegios.length === 0) {
      console.log("No hay colegios para procesar.");
      return;
    }

    for (const colegio of colegios) {
      console.log(
        `Procesando ${nombreTipo.toLowerCase()} para colegio: ${colegio.nombre} (ID: ${colegio.colegio_id})`
      );
      const inicioColegio = Date.now();
      const informes =
        tipoInforme === 2
          ? await InformeGeneralBusiness.obtenerInformesGradoPendientes(
              client,
              colegio.colegio_id
            )
          : await InformeGeneralBusiness.obtenerInformesCursoPendientes(
              client,
              colegio.colegio_id
            );

      if (informes.length === 0) {
        console.log(
          `No hay informes pendientes de ${nombreTipo.toLowerCase()} para el colegio ${colegio.nombre}`
        );
        continue;
      }

      const tipoNombre = tipoInforme === 2 ? "niveles" : "cursos";
      const templatePath = `templates/${tipoNombre}/TEMPLATE_${tipoNombre.toUpperCase()}.docx`;

      const fallidos = await this.procesarLotesInformesGenerales(
        informes,
        tipoInforme,
        tipoNombre,
        templatePath
      );

      if (fallidos.length > 0) {
        console.log(
          `Segunda vuelta ${nombreTipo.toLowerCase()} (${colegio.nombre}): ${fallidos.length} informes fallidos`
        );
        await this.procesarLotesInformesGenerales(
          fallidos,
          tipoInforme,
          tipoNombre,
          templatePath,
          true
        );
      }

      const finColegio = Date.now();
      console.log(
        `${nombreTipo} para colegio ${colegio.nombre} procesado en ${
          (finColegio - inicioColegio) / 1000
        } segundos`
      );
    }
  },

  async procesarInformeGeneralIndividual(
    informe: any,
    tipoInforme: 2 | 3 | 4,
    tipoNombre: string,
    templatePath: string
  ) {
    try {
      console.log(
        `Procesando informe ID: ${informe.informe_id} (${informe.nombre_fantasia || informe.nivel || informe.nombre_curso})`
      );
      const dataInforme = this.prepararDatosInforme(informe, tipoInforme);
      const logoDataUri = await this.obtenerLogoDataUriDesdePlantilla(templatePath);
      const html =
        tipoInforme === 2
          ? renderNivelInformeHtml({
              nivel: dataInforme.nivel,
              periodo: dataInforme.periodo,
              cuerpo: dataInforme.cuerpo,
              recomendaciones: dataInforme.recomendaciones,
              neurodivergencias: dataInforme.neurodivergencias,
              logoDataUri,
            })
          : tipoInforme === 3
          ? renderCursoInformeHtml({
              curso: dataInforme.curso,
              nivel: dataInforme.nivel,
              periodo: dataInforme.periodo,
              docente: dataInforme.docente,
              cuerpo: dataInforme.cuerpo,
              recomendaciones: dataInforme.recomendaciones,
              neurodivergencia: dataInforme.neurodivergencia,
              logoDataUri,
            })
          : renderColegioInformeHtml({
              colegio: dataInforme.colegio,
              periodo: dataInforme.periodo,
              cuerpo: dataInforme.cuerpo,
              recomendaciones: dataInforme.recomendaciones,
              neurodivergencia: dataInforme.neurodivergencia,
              logoDataUri,
            });
      const pdfBuffer = await HtmlPdfRenderer.render(html, { format: "Letter" });
      const nombreArchivo = this.generarNombreArchivo(informe, tipoInforme);
      const outputPath = `${tipoNombre}/${nombreArchivo}.pdf`;
      const fileUrl = await AlmacenamientoServicio.guardarArchivo(
        outputPath,
        pdfBuffer,
        "application/pdf"
      );

      await this.actualizarBaseDatosGeneral(informe.informe_id, fileUrl);
      console.log(`Informe generado y guardado en: ${outputPath}`);
    } catch (error) {
      console.error(`Error al generar el informe ${informe.informe_id}:`, error);
      await this.insertarAuditoria(
        `Error al generar informe general ${informe.informe_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "motor_informes",
        "error_procesamiento_general"
      );
      throw error;
    }
  },

  async procesarLotesInformesGenerales(
    informes: any[],
    tipoInforme: 2 | 3 | 4,
    tipoNombre: string,
    templatePath: string,
    esSegundaVuelta = false
  ): Promise<any[]> {
    const fallidos: any[] = [];
    const chunkSize = CHUNK_GENERALES;

    for (let i = 0; i < informes.length; i += chunkSize) {
      const lote = informes.slice(i, i + chunkSize);
      const resultados = await Promise.all(
        lote.map(async (informe) => {
          try {
            await this.procesarInformeGeneralIndividual(
              informe,
              tipoInforme,
              tipoNombre,
              templatePath
            );
            return { ok: true, informe };
          } catch {
            return { ok: false, informe };
          }
        })
      );

      fallidos.push(...resultados.filter((r) => !r.ok).map((r) => r.informe));
    }

    if (fallidos.length > 0) {
      await this.insertarAuditoria(
        `Fallidos informes generales (${tipoNombre}) ${
          esSegundaVuelta ? "segunda" : "primera"
        } vuelta: ${fallidos.length}`,
        "motor_informes",
        esSegundaVuelta
          ? "fallidos_generales_segunda_vuelta"
          : "fallidos_generales_primera_vuelta"
      );
    }

    return fallidos;
  },

  async obtenerLogoDataUriDesdePlantilla(
    templatePath: string
  ): Promise<string | undefined> {
    if (LOGO_CACHE.has(templatePath)) {
      return LOGO_CACHE.get(templatePath);
    }

    const templateBuffer = await AlmacenamientoServicio.descargarPlantilla(
      templatePath
    );
    const zip = new AdmZip(templateBuffer);
    const imageEntry =
      zip.getEntry("word/media/image1.jpg") ||
      zip.getEntry("word/media/image1.png") ||
      zip
        .getEntries()
        .find((entry) => entry.entryName.startsWith("word/media/"));

    if (!imageEntry) {
      return undefined;
    }

    const imageBuffer = imageEntry.getData();
    const lowerName = imageEntry.entryName.toLowerCase();
    const mimeType = lowerName.endsWith(".png") ? "image/png" : "image/jpeg";
    const dataUri = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    LOGO_CACHE.set(templatePath, dataUri);
    return dataUri;
  },
};
