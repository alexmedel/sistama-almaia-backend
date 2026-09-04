import { SupabaseClient } from "@supabase/supabase-js";
import {
  chunk,
  ColegioActivo,
  crearClavePeriodo,
  formatearPeriodo,
  Periodo,
  PeriodoPendiente,
  procesarConcurrencia,
} from "./motorInformePeriodoTypes";

const ALUMNOS_WORKERS = 6;
const ALUMNOS_RPC_LIMIT = 1;
const SUPABASE_PAGE_SIZE = 1000;

export async function obtenerAlumnoIdsActivosPorColegioYAnio(
  client: SupabaseClient,
  colegioId: number,
  anio: number
): Promise<number[]> {
  const { data, error } = await client
    .from("alumnos_cursos")
    .select("alumno_id, cursos!inner(colegio_id)")
    .eq("activo", true)
    .eq("ano_escolar", anio)
    .eq("cursos.colegio_id", colegioId);

  if (error) {
    console.error(
      `Error al obtener alumnos activos para colegio ${colegioId} año ${anio}:`,
      error
    );
    throw new Error("Error al obtener alumnos activos por período");
  }

  const ids = new Set<number>();
  for (const row of data || []) {
    if (typeof row.alumno_id === "number") {
      ids.add(row.alumno_id);
    }
  }

  return [...ids];
}

export async function obtenerPeriodosValidosPorColegio(
  client: SupabaseClient,
  colegioId: number
): Promise<Periodo[]> {
  const { data: alumnos, error: alumnosError } = await client
    .from("alumnos")
    .select("alumno_id")
    .eq("activo", true)
    .eq("colegio_id", colegioId);

  if (alumnosError) {
    console.error(
      `Error al obtener alumnos para detectar períodos válidos de colegio ${colegioId}:`,
      alumnosError
    );
    throw new Error("Error al obtener alumnos para detectar períodos válidos");
  }

  const alumnoIds = (alumnos || [])
    .map((alumno) => alumno.alumno_id)
    .filter((id): id is number => typeof id === "number");

  if (alumnoIds.length === 0) {
    return [];
  }

  const now = new Date();
  const inicioVentanaUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 1)
  ).toISOString();
  const inicioMesActualUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const periodos = new Map<string, Periodo>();

  for (const idsChunk of chunk(alumnoIds, 500)) {
    let from = 0;

    while (true) {
      const to = from + SUPABASE_PAGE_SIZE - 1;
        const { data, error } = await client
          .from("alumnos_respuestas_seleccion")
          .select("fecha_pregunta")
          .in("alumno_id", idsChunk)
          .eq("activo", true)
          .eq("respondio", true)
          .not("respuesta_posible_id", "is", null)
          .gte("fecha_pregunta", inicioVentanaUtc)
          .lt("fecha_pregunta", inicioMesActualUtc)
          .range(from, to);

      if (error) {
        console.error(
          `Error al obtener respuestas para períodos válidos de colegio ${colegioId}:`,
          error
        );
        throw new Error("Error al obtener períodos válidos");
      }

      if (!data || data.length === 0) {
        break;
      }

      for (const row of data) {
        if (!row.fecha_pregunta) {
          continue;
        }

        const fecha = new Date(row.fecha_pregunta);
        const anio = fecha.getUTCFullYear();
        const mes = fecha.getUTCMonth() + 1;
        periodos.set(crearClavePeriodo(anio, mes), { anio, mes });
      }

      if (data.length < SUPABASE_PAGE_SIZE) {
        break;
      }

      from += SUPABASE_PAGE_SIZE;
    }
  }

  return [...periodos.values()]
    .sort((a, b) => a.anio - b.anio || a.mes - b.mes)
    .slice(-12);
}

async function obtenerPeriodosProcesadosAlumnosPorColegio(
  client: SupabaseClient,
  colegioId: number,
  periodos: Periodo[]
) {
  const procesados = new Set<string>();
  const alumnosPorAnio = new Map<number, number[]>();

  for (const periodo of periodos) {
    if (!alumnosPorAnio.has(periodo.anio)) {
      alumnosPorAnio.set(
        periodo.anio,
        await obtenerAlumnoIdsActivosPorColegioYAnio(client, colegioId, periodo.anio)
      );
    }
  }

  for (const periodo of periodos) {
    const alumnoIds = alumnosPorAnio.get(periodo.anio) || [];
    if (alumnoIds.length === 0) {
      continue;
    }

    let hayRegistro = false;
    let hayNoDefinido = false;

    for (const idsChunk of chunk(alumnoIds, 500)) {
      // Verificar si existe algún registro para el periodo
      const { data, error } = await client
        .from("alumnos_informes")
        .select("alumno_informe_id")
        .in("alumno_id", idsChunk)
        .eq("activo", true)
        .eq("tipo_informe", "Mensual")
        .eq("periodo_anio", periodo.anio)
        .eq("periodo_mes", periodo.mes)
        .limit(1);

      if (error) {
        console.error(
          `Error al revisar informes de alumnos procesados de colegio ${colegioId}:`,
          error
        );
        throw new Error("Error al revisar períodos de alumnos procesados");
      }

      if ((data || []).length > 0) {
        hayRegistro = true;
      }

      // Verificar si existe algún NO_DEFINIDO pendiente de resolver
      const { data: noDefinidoData } = await client
        .from("alumnos_informes")
        .select("alumno_informe_id")
        .in("alumno_id", idsChunk)
        .eq("activo", true)
        .eq("tipo_informe", "Mensual")
        .eq("periodo_anio", periodo.anio)
        .eq("periodo_mes", periodo.mes)
        .eq("template_informe", "NO_DEFINIDO_MATRIZ.docx")
        .limit(1);

      if ((noDefinidoData || []).length > 0) {
        hayNoDefinido = true;
        break;
      }
    }

    // Periodo procesado solo si tiene registros Y ninguno es NO_DEFINIDO
    if (hayRegistro && !hayNoDefinido) {
      procesados.add(crearClavePeriodo(periodo.anio, periodo.mes));
    }
  }

  return procesados;
}

async function obtenerPeriodosProcesadosGeneralesPorColegio(
  client: SupabaseClient,
  colegioId: number
): Promise<Map<string, Set<string>>> {
  const tipos = new Map<string, Set<string>>([
    ["Grado", new Set<string>()],
    ["Curso", new Set<string>()],
    ["Colegio", new Set<string>()],
  ]);

  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await client
      .from("informes_generales")
      .select("tipo, periodo_anio, periodo_mes")
      .eq("colegio_id", colegioId)
      .eq("activo", true)
      .not("periodo_anio", "is", null)
      .not("periodo_mes", "is", null)
      .range(from, to);

    if (error) {
      console.error(
        `Error al revisar informes generales procesados de colegio ${colegioId}:`,
        error
      );
      throw new Error("Error al revisar períodos generales procesados");
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      if (
        typeof row.periodo_anio !== "number" ||
        typeof row.periodo_mes !== "number"
      ) {
        continue;
      }

      const tipo = typeof row.tipo === "string" ? row.tipo : "";
      const set = tipos.get(tipo);
      if (set) {
        set.add(crearClavePeriodo(row.periodo_anio, row.periodo_mes));
      }
    }

    if (data.length < SUPABASE_PAGE_SIZE) {
      break;
    }

    from += SUPABASE_PAGE_SIZE;
  }

  return tipos;
}

export async function obtenerPeriodosPendientesPorColegio(
  client: SupabaseClient,
  colegio: ColegioActivo
): Promise<PeriodoPendiente[]> {
  const periodosValidos = await obtenerPeriodosValidosPorColegio(
    client,
    colegio.colegio_id
  );

  if (periodosValidos.length === 0) {
    return [];
  }

  const [periodosAlumnosProcesados, periodosGeneralesProcesados] =
    await Promise.all([
      obtenerPeriodosProcesadosAlumnosPorColegio(
        client,
        colegio.colegio_id,
        periodosValidos
      ),
      obtenerPeriodosProcesadosGeneralesPorColegio(client, colegio.colegio_id),
    ]);

  return periodosValidos
    .map((periodo) => {
      const key = crearClavePeriodo(periodo.anio, periodo.mes);
      const generalesCompletos =
        periodosGeneralesProcesados.get("Grado")?.has(key) &&
        periodosGeneralesProcesados.get("Curso")?.has(key) &&
        periodosGeneralesProcesados.get("Colegio")?.has(key);

      return {
        ...periodo,
        alumnosPendientes: !periodosAlumnosProcesados.has(key),
        generalesPendientes: !generalesCompletos,
      };
    })
    .filter((periodo) => periodo.alumnosPendientes || periodo.generalesPendientes);
}

export async function llenarTablaInformesAlumnosPorPeriodo(
  client: SupabaseClient,
  colegio: ColegioActivo,
  periodo: Periodo
) {
  const alumnoIds = await obtenerAlumnoIdsActivosPorColegioYAnio(
    client,
    colegio.colegio_id,
    periodo.anio
  );

  if (alumnoIds.length === 0) {
    console.log(
      `Sin alumnos activos para ${colegio.nombre} en período ${formatearPeriodo(
        periodo.anio,
        periodo.mes
      )}`
    );
    return;
  }

  const offsets = Array.from({ length: alumnoIds.length }, (_, index) => index);
  console.log(
    `Llenando alumnos_informes para ${colegio.nombre}, período ${formatearPeriodo(
      periodo.anio,
      periodo.mes
    )}, alumnos ${alumnoIds.length}, workers ${ALUMNOS_WORKERS}`
  );

  await procesarConcurrencia(offsets, ALUMNOS_WORKERS, async (offset) => {
    const { error } = await client.rpc("generar_informes_alumnos_por_periodo", {
      p_colegio_id: colegio.colegio_id,
      p_periodo_anio: periodo.anio,
      p_periodo_mes: periodo.mes,
      p_offset: offset,
      p_limit: ALUMNOS_RPC_LIMIT,
    });

    if (error) {
      console.error(
        `Error generando alumnos_informes para colegio ${colegio.colegio_id}, período ${formatearPeriodo(
          periodo.anio,
          periodo.mes
        )}, offset ${offset}:`,
        error
      );
    }
  });
}

export async function llenarTablaInformesGeneralesPorPeriodo(
  client: SupabaseClient,
  colegio: ColegioActivo,
  periodo: Periodo
) {
  const { error } = await client.rpc(
    "ejecutar_generacion_informes_por_colegios_por_periodo",
    {
      p_periodo_anio: periodo.anio,
      p_periodo_mes: periodo.mes,
    }
  );

  if (error) {
    console.error(
      `Error generando informes generales para ${colegio.nombre}, período ${formatearPeriodo(
        periodo.anio,
        periodo.mes
      )}:`,
      error
    );
    throw new Error("Error al llenar informes generales por período");
  }
}
