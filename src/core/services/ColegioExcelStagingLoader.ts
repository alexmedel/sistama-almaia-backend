import ExcelJS from "exceljs";
import postgres from "postgres";
import { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError, ValidationError } from "../../helpers/ErrorResponse";

type RawRow = Record<string, string | null>;

interface SheetLoadConfig {
  sheetName: string;
  tableName: string;
  mapRow: (row: RawRow) => Record<string, unknown>;
}

interface SheetLoadSummary {
  sheet: string;
  table: string;
  rows: number;
  status: "loaded" | "missing" | "empty";
}

interface EmailCell {
  email: string;
  sheet: string;
  table: string;
  column: string;
  logicalField: string;
  fila_excel: number;
}

interface LoadedSheet {
  config: SheetLoadConfig;
  rows: Array<{ fila_excel: number; row: RawRow }>;
  payload: Record<string, unknown>[];
}

type ExistingEmailMap = Map<string, string[]>;
type LoaderOptions = postgres.Sql | { sqlClient?: postgres.Sql; supabaseClient?: SupabaseClient };
type SupabaseQueryError = {
  code?: string;
  message?: string;
  details?: unknown;
  hint?: unknown;
};

export interface ColegioStagingLoadResult {
  proceso_id: string;
  estado: "STAGING_CARGADO";
  resumen: SheetLoadSummary[];
  warnings: string[];
}

const CONTROL_COLUMNS = {
  estado_fila: "PENDIENTE",
  excluido: false,
  observaciones: [],
};

function removeUndefinedValues(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value === undefined ? null : value])
  );
}

function toIntOrNull(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

function normalizeHeader(value: ExcelJS.CellValue): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function cellToText(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined && value.result !== null) {
      return String(value.result).trim();
    }

    if ("formula" in value) {
      return null;
    }

    if ("text" in value && value.text !== undefined && value.text !== null) {
      return String(value.text).trim();
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }

    if ("hyperlink" in value && value.hyperlink) {
      return String(value.hyperlink).trim();
    }

    return JSON.stringify(value);
  }

  return String(value).trim();
}

function isInstructionRow(row: RawRow): boolean {
  const values = Object.values(row)
    .filter((value): value is string => value !== null && value.trim() !== "")
    .map((value) => value.trim().toLowerCase());

  if (!values.length) {
    return true;
  }

  const firstValue = values[0];
  return (
    firstValue.startsWith("nota:") ||
    firstValue.startsWith("nota ") ||
    firstValue.startsWith("observacion:") ||
    firstValue.startsWith("observación:") ||
    values.every((value) => value.startsWith("nota:") || value.startsWith("nota "))
  );
}

function readWorksheetRows(worksheet: ExcelJS.Worksheet): Array<{ fila_excel: number; row: RawRow }> {
  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = normalizeHeader(cell.value);
  });

  const rows: Array<{ fila_excel: number; row: RawRow }> = [];

  worksheet.eachRow((excelRow, rowNumber) => {
    if (rowNumber === 1) return;

    const row: RawRow = {};
    let hasContent = false;

    excelRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;

      const value = cellToText(cell.value);
      if (row[header] === undefined || row[header] === null || row[header] === "") {
        row[header] = value;
      }
      if (value !== null && value !== "") {
        hasContent = true;
      }
    });

    if (hasContent && !isInstructionRow(row)) {
      rows.push({ fila_excel: rowNumber, row });
    }
  });

  return rows;
}

const sheetConfigs: SheetLoadConfig[] = [
  {
    sheetName: "Colegio",
    tableName: "stg_colegio",
    mapRow: (r) => ({
      colegio_id_raw: r.COLEGIO_ID,
      nombre_raw: r.NOMBRE,
      nombre_fantasia_raw: r.NOMBRE_FANTASIA,
      tipo_colegio_raw: r.TIPO_COLEGIO,
      tipo_religion_raw: r.TIPO_RELIGION,
      dependencia_raw: r.DEPENDENCIA,
      sitio_web_raw: r.SITIO_WEB,
      instagram_raw: r.instagram,
      direccion_raw: r.DIRECCION,
      telefono_contacto_raw: r.TELEFONO_CONTACTO,
      correo_electronico_raw: r.CORREO_ELECTRONICO,
      comuna_raw: r.COMUNA_ID,
      region_raw: r.REGION_ID,
      pais_raw: r.PAIS_ID,
      director_raw: r.DIRECTOR,
      nombre: r.NOMBRE,
      nombre_fantasia: r.NOMBRE_FANTASIA,
      tipo_colegio: r.TIPO_COLEGIO,
      dependencia: r.DEPENDENCIA,
      sitio_web: r.SITIO_WEB,
      direccion: r.DIRECCION,
      telefono_contacto: r.TELEFONO_CONTACTO,
      correo_electronico: r.CORREO_ELECTRONICO?.toLowerCase() ?? null,
    }),
  },
  {
    sheetName: "Año_Academico",
    tableName: "stg_ano_academico",
    mapRow: (r) => ({
      ano_escolar_raw: r.ANO_ESCOLAR,
      fecha_ingreso_raw: r.FECHA_INGRESO,
      fecha_egreso_raw: r.FECHA_EGRESO,
    }),
  },
  {
    sheetName: "Dias Festivos",
    tableName: "stg_dias_festivos",
    mapRow: (r) => ({
      fecha_raw: r.FECHA,
      descripcion_raw: r.DESCRIPCION,
      descripcion: r.DESCRIPCION,
    }),
  },
  {
    sheetName: "Fechas Importantes",
    tableName: "stg_fechas_importantes",
    mapRow: (r) => ({
      tipo_raw: r.TIPO,
      curso_raw: r.CURSO_ID ?? r.CURSO,
      fecha_raw: r.FECHA,
      titulo_raw: r.TITULO,
      descripcion_raw: r.DESCRIPCION,
      titulo: r.TITULO,
      descripcion: r.DESCRIPCION,
      tipo: r.TIPO,
    }),
  },
  {
    sheetName: "Cargos_Directivos",
    tableName: "stg_cargos_directivos",
    mapRow: (r) => ({
      cargo_raw: r.CARGO,
      descripcion_raw: r.DESCRIPCION,
      cargo: r.CARGO,
      descripcion: r.DESCRIPCION,
    }),
  },
  {
    sheetName: "Niveles_Educativos",
    tableName: "stg_niveles_educativos",
    mapRow: (r) => ({
      nivel_educativo_id_raw: r.NIVEL_EDUCATIVO_ID,
      nombre_raw: r.NOMBRE,
      nivel_educativo_id_origen: toIntOrNull(r.NIVEL_EDUCATIVO_ID),
      nombre: r.NOMBRE,
    }),
  },
  {
    sheetName: "Grados",
    tableName: "stg_grados",
    mapRow: (r) => ({
      grado_id_raw: r.GRADO_ID,
      nombre_raw: r.NOMBRE,
      grado_id_origen: toIntOrNull(r.GRADO_ID),
      nombre: r.NOMBRE,
    }),
  },
  {
    sheetName: "Materias",
    tableName: "stg_materias",
    mapRow: (r) => ({
      materia_id_raw: r.MATERIA_ID,
      nombre_raw: r.NOMBRE,
      codigo_raw: r.CODIGO ?? r.CODIGO_MATERIA,
      materia_id_origen: toIntOrNull(r.MATERIA_ID),
      nombre: r.NOMBRE,
      codigo: r.CODIGO ?? r.CODIGO_MATERIA,
    }),
  },
  {
    sheetName: "Cursos",
    tableName: "stg_cursos",
    mapRow: (r) => ({
      curso_id_raw: r.CURSO_ID,
      nombre_curso_raw: r.NOMBRE_CURSO,
      colegio_raw: r.colegio_id ?? r.COLEGIO_ID,
      grado_raw: r.GRADO_ID,
      nivel_educativo_raw: r.NIVEL_EDUCATIVO_ID,
      curso_id_origen: toIntOrNull(r.CURSO_ID),
      nombre_curso: r.NOMBRE_CURSO,
    }),
  },
  {
    sheetName: "Directivos",
    tableName: "stg_directivos",
    mapRow: (r) => ({
      directivos_id_raw: r.DIRECTIVOS_ID,
      rut_raw: r.RUT,
      nombre_raw: r.NOMBRE,
      apellidos_raw: r.APELLIDOS,
      fecha_nacimiento_raw: r.FECHA_NACIMIENTO,
      estado_civil_raw: r["ESTADO CIVIL"],
      genero_raw: r.GENERO,
      direccion_raw: r.DIRECCIÓN,
      comuna_raw: r.COMUNA,
      region_raw: r.REGION ?? r.REGIÓN,
      cargo_raw: r.CARGO,
      telefono_contacto1_raw: r.TELEFONO_CONTACTO1,
      telefono_contacto2_raw: r.TELEFONO_CONTACTO2,
      email_raw: r.EMAIL,
      tipo_documento: "RUT",
      numero_documento: r.RUT,
      nombres: r.NOMBRE,
      apellidos: r.APELLIDOS,
      email_final: r.EMAIL?.toLowerCase() ?? null,
      telefono_contacto: r.TELEFONO_CONTACTO1,
    }),
  },
  {
    sheetName: "Docentes",
    tableName: "stg_docentes",
    mapRow: (r) => ({
      docente_id_raw: r["DOCENTE_ID "] ?? r.DOCENTE_ID,
      rut_raw: r.RUT,
      nombre_raw: r.NOMBRE,
      apellidos_raw: r.APELLIDOS,
      fecha_nacimiento_raw: r.FECHA_NACIMIENTO,
      estado_civil_raw: r["ESTADO CIVIL"],
      genero_raw: r.GENERO,
      direccion_raw: r.DIRECCIÓN,
      comuna_raw: r.COMUNA,
      region_raw: r.REGIÓN ?? r.REGION,
      especialidad_raw: r.ESPECIALIDAD,
      curso_titular_raw: r.CURSO_TITULAR,
      email_raw: r.EMAIL,
      telefono_contacto_raw: r.TELEFONO_CONTACTO,
      tipo_documento: "RUT",
      numero_documento: r.RUT,
      nombres: r.NOMBRE,
      apellidos: r.APELLIDOS,
      email_final: r.EMAIL?.toLowerCase() ?? null,
      especialidad: r.ESPECIALIDAD,
    }),
  },
  {
    sheetName: "Alumnos",
    tableName: "stg_alumnos",
    mapRow: (r) => ({
      alumno_id_raw: r.ALUMNO_ID,
      rut_raw: r.RUT,
      nombre_raw: r.NOMBRE,
      apellidos_raw: r.APELLIDOS,
      nombre_social_raw: r.NOMBRE_SOCIAL,
      fecha_nacimiento_raw: r.FECHA_NACIMIENTO,
      curso_raw: r.CURSO,
      genero_raw: r.GENERO,
      direccion_raw: r.DIRECCIÓN,
      comuna_raw: r.COMUNA,
      region_raw: r.REGION,
      telefono_contacto1_raw: r.TELEFONO_CONTACTO1,
      telefono_contacto2_raw: r.TELEFONO_CONTACTO2,
      email_raw: r.EMAIL,
      rut_apoderado_1_raw: r.RUT_APODERADO_1,
      nombre_apoderado_1_raw: r.NOMBRE_APODERADO_1,
      apellido_apoderado_1_raw: r.APELLIDO_APODERADO_1,
      email_apoderado_1_raw: r.EMAIL_APODERADO_1,
      telefono_apoderado_1_raw: r.TELEFONO_APODERADO_1,
      genero_apoderado_1_raw: r.genero,
      rut_apoderado_2_raw: r.RUT_APODERADO_2,
      nombre_apoderado_2_raw: r.NOMBRE_APODERADO_2,
      apellido_apoderado_2_raw: r.APELLIDO_APODERADO_2,
      email_apoderado_2_raw: r.EMAIL_APODERADO_2,
      telefono_apoderado_2_raw: r.TELEFONO_APODERADO_2,
      antecedentes_medicos_raw: r["ANTECEDENTES MEDICOS"],
      tipo_documento: "RUT",
      numero_documento: r.RUT,
      nombres: r.NOMBRE,
      apellidos: r.APELLIDOS,
      nombre_social: r.NOMBRE_SOCIAL ?? [r.NOMBRE, r.APELLIDOS].filter(Boolean).join(" "),
      email_final: r.EMAIL?.toLowerCase() ?? null,
      telefono_contacto1: r.TELEFONO_CONTACTO1,
      telefono_contacto2: r.TELEFONO_CONTACTO2,
    }),
  },
  {
    sheetName: "Aulas",
    tableName: "stg_aulas",
    mapRow: (r) => ({
      aula_id_raw: r.AULA_ID,
      curso_raw: r.CURSO,
      materia_raw: r.MATERIA,
      docente_raw: r.DOCENTE,
      nombre_docente_raw: r["NOMBRE DOCENTE"],
      tipo_docente_raw: r.TPO_DOCENTE,
      aula_id_origen: toIntOrNull(r.AULA_ID),
      tipo_docente: r.TPO_DOCENTE,
    }),
  },
];

const emailFieldsByTable: Record<string, Array<{ column: string; logicalField: string }>> = {
  stg_colegio: [
    { column: "correo_electronico", logicalField: "correo_colegio" },
    { column: "correo_electronico_raw", logicalField: "correo_colegio" },
  ],
  stg_directivos: [
    { column: "email_final", logicalField: "email_directivo" },
    { column: "email_raw", logicalField: "email_directivo" },
  ],
  stg_docentes: [
    { column: "email_final", logicalField: "email_docente" },
    { column: "email_raw", logicalField: "email_docente" },
  ],
  stg_alumnos: [
    { column: "email_final", logicalField: "email_alumno" },
    { column: "email_raw", logicalField: "email_alumno" },
    { column: "email_apoderado_1_raw", logicalField: "email_apoderado_1" },
    { column: "email_apoderado_2_raw", logicalField: "email_apoderado_2" },
  ],
};

function throwSupabaseQueryError(error: SupabaseQueryError): never {
  throw new DatabaseError(error.message ?? "Error consultando Supabase", error);
}

export class ColegioExcelStagingLoader {
  private readonly sql?: postgres.Sql;
  private readonly supabase?: SupabaseClient;

  constructor(options?: LoaderOptions) {
    const sqlClient = typeof options === "function" ? options : options?.sqlClient;
    const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    this.supabase = typeof options === "function" ? undefined : options?.supabaseClient;

    this.sql = sqlClient;
    if (!this.supabase && !this.sql && connectionString) {
      this.sql = postgres(connectionString, {
        max: 4,
        ssl: "require",
      });
    }

    if (!this.supabase && !this.sql) {
      throw new Error("Falta cliente Supabase admin para cargar staging");
    }
  }

  async load(file: Express.Multer.File): Promise<ColegioStagingLoadResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const resumen: SheetLoadSummary[] = [];
    const warnings: string[] = [];
    const loadedSheets: LoadedSheet[] = [];

    for (const config of sheetConfigs) {
      const worksheet = workbook.getWorksheet(config.sheetName);
      if (!worksheet) {
        resumen.push({ sheet: config.sheetName, table: config.tableName, rows: 0, status: "missing" });
        warnings.push(`Hoja ${config.sheetName} no encontrada`);
        continue;
      }

      const rows = readWorksheetRows(worksheet);
      if (!rows.length) {
        resumen.push({ sheet: config.sheetName, table: config.tableName, rows: 0, status: "empty" });
        continue;
      }

      const payload = rows.map(({ fila_excel, row }) =>
        removeUndefinedValues({
          fila_excel,
          ...config.mapRow(row),
          ...CONTROL_COLUMNS,
        })
      );

      resumen.push({ sheet: config.sheetName, table: config.tableName, rows: payload.length, status: "loaded" });
      loadedSheets.push({ config, rows, payload });
    }

    const emailCells = this.collectEmailCells(loadedSheets);
    this.assertNoDuplicatedEmailsInExcel(emailCells);
    const existingEmails = await this.findExistingEmails(emailCells);
    this.annotateExistingEmails(loadedSheets, existingEmails);
    warnings.push(...this.buildExistingEmailWarnings(existingEmails));

    const proceso = await this.createProcess(file.originalname);
    const procesoId = proceso.proceso_id as string;

    for (const loadedSheet of loadedSheets) {
      const payload = loadedSheet.payload.map((row) => ({
        proceso_id: procesoId,
        ...row,
      }));

      await this.insertStagingRows(loadedSheet.config.tableName, payload);

      await this.upsertSummary(procesoId, loadedSheet.config.tableName, payload.length);
    }

    await this.updateProcessLoaded(procesoId, resumen);

    return {
      proceso_id: procesoId,
      estado: "STAGING_CARGADO",
      resumen,
      warnings,
    };
  }

  private collectEmailCells(loadedSheets: LoadedSheet[]): EmailCell[] {
    const cells: EmailCell[] = [];

    for (const loadedSheet of loadedSheets) {
      const emailFields = emailFieldsByTable[loadedSheet.config.tableName] ?? [];
      if (!emailFields.length) continue;

      for (const row of loadedSheet.payload) {
        for (const field of emailFields) {
          const email = normalizeEmail(row[field.column]);
          if (!email) continue;

          if (
            cells.some(
              (cell) =>
                cell.email === email &&
                cell.fila_excel === row.fila_excel &&
                cell.table === loadedSheet.config.tableName &&
                cell.logicalField === field.logicalField
            )
          ) {
            continue;
          }

          cells.push({
            email,
            sheet: loadedSheet.config.sheetName,
            table: loadedSheet.config.tableName,
            column: field.column,
            logicalField: field.logicalField,
            fila_excel: Number(row.fila_excel),
          });
        }
      }
    }

    return cells;
  }

  private assertNoDuplicatedEmailsInExcel(emailCells: EmailCell[]) {
    const byEmail = new Map<string, EmailCell[]>();

    for (const cell of emailCells) {
      const current = byEmail.get(cell.email) ?? [];
      current.push(cell);
      byEmail.set(cell.email, current);
    }

    const duplicados = Array.from(byEmail.entries())
      .filter(([, cells]) => cells.length > 1)
      .map(([email, cells]) => ({
        email,
        ocurrencias: cells.map((cell) => ({
          hoja: cell.sheet,
          tabla: cell.table,
          columna: cell.column,
          campo: cell.logicalField,
          fila_excel: cell.fila_excel,
        })),
      }));

    if (duplicados.length > 0) {
      throw new ValidationError("Excel contiene correos duplicados. Corrige el archivo antes de cargar staging.", {
        duplicados,
      });
    }
  }

  private async findExistingEmails(emailCells: EmailCell[]): Promise<ExistingEmailMap> {
    const emails = Array.from(new Set(emailCells.map((cell) => cell.email)));
    if (!emails.length) {
      return new Map();
    }

    if (this.supabase) {
      const existing = new Map<string, string[]>();
      const publicSources = [
        { table: "usuarios", column: "email", source: "public.usuarios" },
        { table: "alumnos", column: "email", source: "public.alumnos" },
        { table: "apoderados", column: "email_contacto1", source: "public.apoderados.email_contacto1" },
        { table: "apoderados", column: "email_contacto2", source: "public.apoderados.email_contacto2" },
      ];

      for (const publicSource of publicSources) {
        const { data, error } = await this.supabase
          .from(publicSource.table)
          .select(publicSource.column)
          .in(publicSource.column, emails);

        if (error) throwSupabaseQueryError(error);

        for (const row of data ?? []) {
          const email = normalizeEmail((row as unknown as Record<string, unknown>)[publicSource.column]);
          if (!email) continue;
          existing.set(email, [...(existing.get(email) ?? []), publicSource.source]);
        }
      }

      return new Map(
        Array.from(existing.entries()).map(([email, fuentes]) => [
          email,
          Array.from(new Set(fuentes)).sort(),
        ])
      );
    }

    const sql = this.requireSql();
    const existing = await sql<{ email: string; fuentes: string[] }[]>`
      with incoming(email) as (
        select unnest(${emails}::text[])
      ),
      db_emails as (
        select lower(email) as email, 'public.usuarios' as source
        from public.usuarios
        where nullif(trim(coalesce(email, '')), '') is not null
        union all
        select lower(email) as email, 'public.alumnos' as source
        from public.alumnos
        where nullif(trim(coalesce(email, '')), '') is not null
        union all
        select lower(email_contacto1) as email, 'public.apoderados.email_contacto1' as source
        from public.apoderados
        where nullif(trim(coalesce(email_contacto1, '')), '') is not null
        union all
        select lower(email_contacto2) as email, 'public.apoderados.email_contacto2' as source
        from public.apoderados
        where nullif(trim(coalesce(email_contacto2, '')), '') is not null
        union all
        select lower(email) as email, 'auth.users' as source
        from auth.users
        where nullif(trim(coalesce(email, '')), '') is not null
      )
      select incoming.email, array_agg(distinct db_emails.source order by db_emails.source) as fuentes
      from incoming
      join db_emails on db_emails.email = incoming.email
      group by incoming.email
      order by incoming.email
    `;

    return new Map(existing.map((row: { email: string; fuentes: string[] }) => [row.email, row.fuentes]));
  }

  private annotateExistingEmails(loadedSheets: LoadedSheet[], existingEmails: ExistingEmailMap) {
    if (!existingEmails.size) {
      return;
    }

    for (const loadedSheet of loadedSheets) {
      const emailFields = emailFieldsByTable[loadedSheet.config.tableName] ?? [];
      if (!emailFields.length) continue;

      for (const row of loadedSheet.payload) {
        const seenInRow = new Set<string>();

        for (const field of emailFields) {
          const email = normalizeEmail(row[field.column]);
          if (!email || !existingEmails.has(email)) continue;

          const key = `${email}:${field.logicalField}`;
          if (seenInRow.has(key)) continue;
          seenInRow.add(key);

          const observaciones = Array.isArray(row.observaciones) ? row.observaciones : [];
          row.estado_fila = "ALERTA";
          row.observaciones = [
            ...observaciones,
            {
              codigo: "EMAIL_EXISTE_DB",
              mensaje: "Correo ya existe en base de datos; migracion debe reutilizar/omitir usuario existente.",
              columna: field.column,
              campo: field.logicalField,
              email,
              fuentes: existingEmails.get(email),
            },
          ];
        }
      }
    }
  }

  private buildExistingEmailWarnings(existingEmails: ExistingEmailMap): string[] {
    return Array.from(existingEmails.entries()).map(
      (row) =>
        `Correo ${row[0]} ya existe en ${row[1].join(", ")}; fila staging queda en ALERTA para reutilizar/omitir en migracion.`
    );
  }

  private async createProcess(fileName: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase.rpc("carga_staging_crear_proceso", {
        p_nombre_archivo: fileName,
      });

      if (error) throwSupabaseQueryError(error);
      return { proceso_id: data };
    }

    const sql = this.requireSql();
    const [process] = await sql`
      insert into staging.carga_procesos ${sql(
        {
          nombre_archivo: fileName,
          estado: "INICIADO",
          etapa: "carga_excel",
        },
        "nombre_archivo",
        "estado",
        "etapa"
      )}
      returning proceso_id
    `;

    return process;
  }

  private async updateProcessLoaded(procesoId: string, resumen: SheetLoadSummary[]) {
    const totalRows = resumen.reduce((acc, item) => acc + item.rows, 0);
    if (this.supabase) {
      const { error } = await this.supabase.rpc("carga_staging_marcar_cargado", {
        p_proceso_id: procesoId,
        p_total_filas: totalRows,
        p_metadata: { resumen },
      });

      if (error) throwSupabaseQueryError(error);
      return;
    }

    const sql = this.requireSql();
    await sql`
      update staging.carga_procesos
      set
        estado = 'STAGING_CARGADO',
        etapa = 'staging_cargado',
        total_filas = ${totalRows},
        actualizado_en = ${new Date().toISOString()},
        metadata = ${JSON.stringify({ resumen })}::jsonb
      where proceso_id = ${procesoId}
    `;
  }

  private async upsertSummary(procesoId: string, tableName: string, rows: number) {
    if (this.supabase) {
      const { error } = await this.supabase.rpc("carga_staging_upsert_resumen", {
        p_proceso_id: procesoId,
        p_tabla_staging: tableName,
        p_filas_leidas: rows,
      });

      if (error) throwSupabaseQueryError(error);
      return;
    }

    const sql = this.requireSql();
    await sql`
      insert into staging.carga_resumen_tablas (
        proceso_id,
        tabla_staging,
        filas_leidas,
        actualizado_en
      )
      values (
        ${procesoId},
        ${tableName},
        ${rows},
        ${new Date().toISOString()}
      )
      on conflict (proceso_id, tabla_staging)
      do update set
        filas_leidas = excluded.filas_leidas,
        actualizado_en = excluded.actualizado_en
    `;
  }

  private async insertStagingRows(tableName: string, payload: Record<string, unknown>[]) {
    if (this.supabase) {
      const { error } = await this.supabase.rpc("carga_staging_insertar_filas", {
        p_tabla: tableName,
        p_payload: payload,
      });

      if (error) throwSupabaseQueryError(error);
      return;
    }

    const sql = this.requireSql();
    await sql`
      insert into ${sql.unsafe(`staging.${tableName}`)}
      ${sql(payload)}
    `;
  }

  private requireSql(): postgres.Sql {
    if (!this.sql) {
      throw new Error("Cliente SQL no disponible");
    }

    return this.sql;
  }
}
