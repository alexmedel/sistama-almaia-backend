 
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseClientService } from "./supabaseClient";
import { ColegioExcel } from "../modelo/import/ColegioExcel";
import { Colegio } from "../modelo/colegio/Colegio";
import { CalendarioEscolarExcel } from "../modelo/import/CalendarioEscolarExcel";
import { CalendarioEscolar } from "../modelo/colegio/CalendarioEscolar";
import { DiaFestivoExcel } from "../modelo/import/DiaFestivoExcel";
import { CalendarioDiaFestivo } from "../modelo/colegio/CalendarioDiaFestivo";
import { FechaImportanteExcel } from "../modelo/import/FechaImportanteExcel";
import { CalendarioFechaImportante } from "../modelo/colegio/CalendarioFechaImportante";
import { NivelEducativoExcel } from "../modelo/import/NivelEducativoExcel";
import { NivelEducativo } from "../modelo/colegio/NivelEducativo";
import { GradoExcel } from "../modelo/import/GradoExcel";
import { Grado } from "../modelo/colegio/Grado";
import { MateriaExcel } from "../modelo/import/MateriaExcel";
import { Materia } from "../modelo/colegio/Materia";
import { CursoExcel } from "../modelo/import/CursoExcel";
import { Curso } from "../modelo/colegio/Curso";
import { DirectivoExcel } from "../modelo/import/DirectivoExcel";
import { Persona } from "../modelo/Persona";
import { Usuario } from "../modelo/auth/Usuario";
import { DocenteExcel } from "../modelo/import/DocenteExcel";
import { Docente } from "../modelo/colegio/Docente";
import { UsuarioColegio } from "../modelo/colegio/UsuarioColegio";
import { AlumnoExcel } from "../modelo/import/AlumnoExcel";
import { Apoderado } from "../modelo/apoderado/Apoderado";
import { Alumno } from "../modelo/alumno/Alumno";
import { AulaExcel } from "../modelo/import/AulaExcel";
import { Aula } from "../modelo/colegio/Aula";

export class Fileservice {
  private client: SupabaseClient;
  private comunasCache: any[] | null = null;
  private regionesCache: any[] | null = null;
  private paisesCache: any[] | null = null;
  private cursosCache: any[] | null = null;
  private gradosCache: any[] | null = null;
  private nivelesCache: any[] | null = null;
  private materiasCache: any[] | null = null;
  private colegio_id: number = 0;
  private calendario_escolar_id: number = 0;

  constructor() {
    const supabaseService = new SupabaseClientService();
    this.client = supabaseService.getClient();
    this.initializeComunasCache();
    this.initializeRegionCache();
    this.initializePaisCache();
    this.initializeCursoCache();
    this.initializeGradoCache();
    this.initializeNivelCache();
    this.initializeMateriaCache();
  }
  setColegio(colegio_id: any) {
    this.colegio_id = colegio_id;
  }
  private async initializeComunasCache() {
    if (!this.comunasCache) {
      const { data: comunas, error } = await this.client
        .from("comunas")
        .select("*");
      if (error) throw new Error(`Error obteniendo comunas: ${error.message}`);
      this.comunasCache = comunas;
    }
  }
  private async initializeRegionCache() {
    if (!this.regionesCache) {
      const { data: regiones, error } = await this.client
        .from("regiones")
        .select("*");
      if (error) throw new Error(`Error obteniendo regiones: ${error.message}`);
      this.regionesCache = regiones;
    }
  }
  private async initializePaisCache() {
    if (!this.paisesCache) {
      const { data: paises, error } = await this.client
        .from("paises")
        .select("*");
      if (error) throw new Error(`Error obteniendo paises: ${error.message}`);
      this.paisesCache = paises;
    }
  }
  private async initializeCursoCache() {
    if (!this.cursosCache) {
      const { data: cursos, error } = await this.client
        .from("cursos")
        .select("*");
      if (error) throw new Error(`Error obteniendo cursos: ${error.message}`);
      this.cursosCache = cursos;
    }
  }
  private async initializeGradoCache() {
    if (!this.gradosCache) {
      const { data: grados, error } = await this.client
        .from("grados")
        .select("*");
      if (error) throw new Error(`Error obteniendo grados: ${error.message}`);
      this.gradosCache = grados;
    }
  }
  private async initializeNivelCache() {
    if (!this.gradosCache) {
      const { data: niveles, error } = await this.client
        .from("niveles_educativos")
        .select("*");
      if (error) throw new Error(`Error obteniendo niveles: ${error.message}`);
      this.nivelesCache = niveles;
    }
  }
  private async initializeMateriaCache() {
    if (!this.materiasCache) {
      const { data: materias, error } = await this.client
        .from("materias")
        .select("*");
      if (error) throw new Error(`Error obteniendo materias: ${error.message}`);
      this.materiasCache = materias;
    }
  }
  public async obtenerIdRegionPorNombre(
    nombreRegion: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.regionesCache) {
        const regionEncontrada = this.regionesCache.find((region) =>
          region.nombre.toLowerCase().includes(nombreRegion.toLowerCase())
        );
        if (regionEncontrada) return regionEncontrada.comuna_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("regiones")
        .select("region_id")
        .ilike("nombre", `%${nombreRegion}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].region_id;
    } catch (error) {
      console.error("Error al buscar region por nombre:", error);
      return null;
    }
  }
  public async obtenerIdComunaPorNombre(
    nombreComuna: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.comunasCache) {
        const comunaEncontrada = this.comunasCache.find((comuna) =>
          comuna.nombre.toLowerCase().includes(nombreComuna.toLowerCase())
        );
        if (comunaEncontrada) return comunaEncontrada.comuna_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("comunas")
        .select("comuna_id")
        .ilike("nombre", `%${nombreComuna}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].comuna_id;
    } catch (error) {
      console.error("Error al buscar comuna por nombre:", error);
      return null;
    }
  }
  public async obtenerIdPaisPorNombre(
    nombrepais: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.paisesCache) {
        const paisEncontrada = this.paisesCache.find((pais) =>
          pais.nombre.toLowerCase().includes(nombrepais.toLowerCase())
        );
        if (paisEncontrada) return paisEncontrada.pais_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("paises")
        .select("pais_id")
        .ilike("nombre", `%${nombrepais}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].pais_id;
    } catch (error) {
      console.error("Error al buscar pais por nombre:", error);
      return 0;
    }
  }
  public async obtenerIdCursoPorNombre(
    nombrecurso: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.cursosCache) {
        const cursoEncontrada = this.cursosCache.find((curso) =>
          curso.nombre.toLowerCase().includes(nombrecurso.toLowerCase())
        );
        if (cursoEncontrada) return cursoEncontrada.curso_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("cursos")
        .select("curso_id")
        .ilike("nombre", `%${nombrecurso}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].curso_id;
    } catch (error) {
      console.error("Error al buscar curso por nombre:", error);
      return 0;
    }
  }
  public async obtenerIdNivelEducativoPorNombre(
    nombrenivel_educativo: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.nivelesCache) {
        const nivel_educativoEncontrada = this.nivelesCache.find(
          (nivel_educativo) =>
            nivel_educativo.nombre
              .toLowerCase()
              .includes(nombrenivel_educativo.toLowerCase())
        );
        if (nivel_educativoEncontrada)
          return nivel_educativoEncontrada.nivel_educativo_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("niveles_educativos")
        .select("nivel_educativo_id")
        .ilike("nombre", `%${nombrenivel_educativo}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].nivel_educativo_id;
    } catch (error) {
      console.error("Error al buscar nivel_educativo por nombre:", error);
      return 0;
    }
  }
  public async obtenerIdGradoPorNombre(
    nombregrado: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.gradosCache) {
        const gradoEncontrada = this.gradosCache.find((grado) =>
          grado.nombre.toLowerCase().includes(nombregrado.toLowerCase())
        );
        if (gradoEncontrada) return gradoEncontrada.grado_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("grados")
        .select("grado_id")
        .ilike("nombre", `%${nombregrado}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].grado_id;
    } catch (error) {
      console.error("Error al buscar grado por nombre:", error);
      return 0;
    }
  }
  public async obtenerIdMateriaPorNombre(
    nombremateria: string
  ): Promise<number | null> {
    try {
      // Primero intenta buscar en la caché
      if (this.materiasCache) {
        const materiaEncontrada = this.materiasCache.find((materia) =>
          materia.nombre.toLowerCase().includes(nombremateria.toLowerCase())
        );
        if (materiaEncontrada) return materiaEncontrada.materia_id;
      }

      // Si no está en caché, busca directamente en Supabase
      const { data, error } = await this.client
        .from("materias")
        .select("materia_id")
        .ilike("nombre", `%${nombremateria}%`) // Búsqueda insensible a mayúsculas
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].materia_id;
    } catch (error) {
      console.error("Error al buscar materia por nombre:", error);
      return 0;
    }
  }

  async procesarColegio({ data }: { data: ColegioExcel[] }) {
    try {
      // Mapeamos async para obtener los IDs necesarios
      const datosMapeadosPromises = data.map(async (item) => {
        // Resolvemos todas las promesas en paralelo
        const [comuna_id, region_id, pais_id] = await Promise.all([
          this.obtenerIdComunaPorNombre(item.COMUNA_ID),
          this.obtenerIdRegionPorNombre(item.REGION_ID),
          this.obtenerIdPaisPorNombre(item.PAIS_ID),
        ]);

        return {
          nombre: item.NOMBRE?.trim() || "",
          nombre_fantasia: item.NOMBRE_FANTASIA?.trim() || "",
          tipo_colegio: item.TIPO_COLEGIO?.trim() || "",
          dependencia: item.DEPENDENCIA?.trim() || "",
          sitio_web: item.SITIO_WEB?.trim() || " ",
          direccion: item.DIRECCION?.trim() || "",
          telefono_contacto: item.TELEFONO_CONTACTO.toString().trim() || " ",
          correo_electronico: item.CORREO_ELECTRONICO?.trim() || " ",
          comuna_id: comuna_id || 0, // Valor por defecto si no se encuentra
          region_id: region_id || 0,
          pais_id: pais_id || 0,
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        } as Colegio;
      });

      // Esperamos a que todas las promesas se resuelvan
      const datosMapeados = await Promise.all(datosMapeadosPromises);

      // Validamos que al menos algunos IDs sean válidos
      const datosValidos = datosMapeados.filter(
        (item) => item.comuna_id > 0 && item.region_id > 0 && item.pais_id > 0
      );

      if (datosValidos.length === 0) {
        throw new Error(
          "No se encontraron IDs válidos para comuna, región o país"
        );
      }

      const { data: inserted, error } = await this.client
        .from("colegios")
        .insert(datosValidos)
        .select("colegio_id")
        .single(); // Retornamos todos los campos insertados
      this.colegio_id = inserted?.colegio_id;
      if (error) throw error;
    } catch (error) {
      console.error("Error en procesarColegio:", error);
      return null;
    }
  }

  async procesarAnioAcademico({
    data,
  }: {
    data: CalendarioEscolarExcel[];
  }): Promise<CalendarioEscolar | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de años académicos");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Mapeamos los datos
      const datosMapeados = data.map((item) => {
        // Convertimos fechas numéricas de Excel a fechas JavaScript
        const fechaInicio = this.excelDateToJSDate(item.FECHA_INGRESO);
        const fechaFin = this.excelDateToJSDate(item.FECHA_EGRESO);

        // Validamos fechas
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
          throw new Error(
            `Fechas inválidas para año escolar ${item.ANO_ESCOLAR}`
          );
        }

        // Validamos que la fecha de fin sea posterior a la de inicio
        if (fechaFin <= fechaInicio) {
          throw new Error(
            `La fecha de egreso debe ser posterior a la de ingreso para el año ${item.ANO_ESCOLAR}`
          );
        }

        // Calculamos días hábiles (opcional)
        const diasHabiles = this.calcularDiasHabiles(fechaInicio, fechaFin);

        return {
          colegio_id: this.colegio_id,
          ano_escolar: Number(item.ANO_ESCOLAR) || new Date().getFullYear(),
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          dias_habiles: diasHabiles,
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        } as CalendarioEscolar;
      });

      // Insertamos en la base de datos
      const { data: inserted, error } = await this.client
        .from("calendarios_escolares")
        .insert(datosMapeados)
        .select("*,calendario_escolar_id")
        .single();

      if (error) throw new Error(error.message);

      this.calendario_escolar_id = inserted?.inserted;
      return inserted;
    } catch (error) {
      console.error(
        "Error en procesarAnioAcademico:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  async procesarDiasFestivos({
    data,
  }: {
    data: DiaFestivoExcel[];
  }): Promise<CalendarioDiaFestivo[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de días festivos");
      }

      // Mapeamos los datos
      const datosMapeados = data.map((item) => {
        // Convertimos fecha numérica de Excel a Date
        const fechaFestivo = this.excelDateToJSDate(item.FECHA);

        // Validamos fecha
        if (isNaN(fechaFestivo.getTime())) {
          throw new Error(`Fecha inválida para día festivo: ${item.FECHA}`);
        }

        return {
          dia_festivo: fechaFestivo.toISOString(),
          descripcion: item.DESCRIPCION?.trim() || "Día festivo",
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
          calendario_escolar_id: this.calendario_escolar_id,
        } as CalendarioDiaFestivo;
      });

      // Insertamos en la base de datos (todos los días festivos en una sola operación)
      const { data: inserted, error } = await this.client
        .from("calendarios_dias_festivos")
        .insert(datosMapeados)
        .select("*");

      if (error) throw error;
      return inserted;
    } catch (error) {
      console.error(
        "Error en procesarDiasFestivos:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  async procesarFechasImportantes({
    data,
  }: {
    data: FechaImportanteExcel[];
  }): Promise<CalendarioFechaImportante[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de fechas importantes");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }
      if (!this.calendario_escolar_id || this.calendario_escolar_id <= 0) {
        throw new Error("ID de calendario escolar inválido");
      }

      // Mapeamos los datos
      const datosMapeados = data.map(async (item) => {
        // Convertimos fecha numérica de Excel a Date
        const fechaImportante = this.excelDateToJSDate(item.FECHA);

        // Validamos fecha
        if (isNaN(fechaImportante.getTime())) {
          throw new Error(`Fecha inválida para evento: ${item.FECHA}`);
        }
        const [curso_id] = await Promise.all([
          this.obtenerIdCursoPorNombre(item.CURSO_ID),
        ]);
        return {
          colegio_id: this.colegio_id,
          curso_id: curso_id,
          calendario_escolar_id: this.calendario_escolar_id,
          titulo: item.TITULO?.trim() || "Evento importante",
          descripcion: item.DESCRIPCION?.trim() || "",
          fecha: fechaImportante.toISOString(),
          tipo: item.TIPO,
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        } as CalendarioFechaImportante;
      });

      // Insertamos en la base de datos (todas las fechas en una sola operación)
      const { data: inserted, error } = await this.client
        .from("calendarios_fechas_importantes")
        .insert(datosMapeados)
        .select("*");

      if (error) throw error;
      return inserted;
    } catch (error) {
      console.error(
        "Error en procesarFechasImportantes:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  procesarCargosDirectivos({ data }: { data: any }) {
  }
  async procesarDirectivos({
    data,
  }: {
    data: DirectivoExcel[];
  }): Promise<{ personas: Persona[]; usuarios: Usuario[] } | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de directivos");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Mapeamos los datos para personas y usuarios
      const personasData: Partial<Persona>[] = [];
      const usuariosData: Partial<Usuario>[] = [];

      for (const item of data) {
        // 1. Primero procesamos la persona
        const personaId = item.DIRECTIVOS_ID || undefined;
        const generoId = await this.obtenerGeneroId(item.GENERO);
        const estadoCivilId = await this.obtenerEstadoCivilId(
          item["ESTADO CIVIL"]
        );
        personasData.push({
          persona_id: personaId,
          tipo_documento: "RUT",
          numero_documento: item.RUT?.trim() || "",
          nombres: item.NOMBRE?.trim() || "",
          apellidos: item.APELLIDOS?.trim() || "",
          genero_id: generoId || 0,
          estado_civil_id: estadoCivilId || 0,
          fecha_nacimiento: new Date(), // Puedes ajustar esto si tienes la fecha
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });

        // 2. Luego procesamos el usuario asociado
        usuariosData.push({
          email: item.EMAIL?.trim() || "",
          nombre_social: `${item.NOMBRE} ${item.APELLIDOS}`.trim(),
          telefono_contacto: item.TELEFONO_CONTACTO1?.trim() || "",
          rol_id: 2, // Asumiendo que 2 es el ID para roles de directivo
          persona_id: personaId, // Se actualizará después de insertar la persona
          estado_usuario: "activo",
          ultimo_inicio_sesion: new Date().toISOString(),
          intentos_inicio_sesion: 0,
          idioma_id: 1, // Asumiendo español como predeterminado
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });
      }

      // Insertamos personas primero
      const { data: personasInsertadas, error: errorPersonas } =
        await this.client
          .from("personas")
          .upsert(personasData, { onConflict: "persona_id" })
          .select("persona_id, numero_documento");

      if (errorPersonas) throw errorPersonas;

      // Actualizamos los IDs de persona en los usuarios
      const usuariosParaInsertar = usuariosData.map((usuario, index) => ({
        ...usuario,
        persona_id: personasInsertadas?.[index]?.persona_id,
      }));

      // Insertamos usuarios
      const { data: usuariosInsertados, error: errorUsuarios } =
        await this.client
          .from("usuarios")
          .upsert(usuariosParaInsertar, { onConflict: "email" })
          .select("usuario_id, email");
      if (errorUsuarios) throw errorUsuarios;
      return {
        personas: personasInsertadas as Persona[],
        usuarios: usuariosInsertados as Usuario[],
      };
    } catch (error) {
      console.error(
        "Error en procesarDirectivos:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  async procesarDocentes({ data }: { data: DocenteExcel[] }): Promise<{
    personas: Persona[];
    docentes: Docente[];
    usuarios: Usuario[];
  } | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de docentes");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Normalizar nombres de campos (eliminar espacios)
      const normalizedData = data.map((item) => ({
        DOCENTE_ID: item["DOCENTE_ID "],
        RUT: item["RUT"],
        NOMBRE: item["NOMBRE"],
        APELLIDOS: item["APELLIDOS"],
        ESTADO_CIVIL: item["ESTADO CIVIL"],
        GENERO: item["GENERO"],
        DIRECCION: item["DIRECCIÓN"],
        COMUNA: item["COMUNA"],
        REGION: item["REGIÓN"],
        ESPECIALIDAD: item["ESPECIALIDAD"],
        CURSO_TITULAR: item["CURSO_TITULAR"],
      }));

      // Mapeamos los datos para personas, docentes y usuarios
      const personasData: Partial<Persona>[] = [];
      const docentesData: Partial<Docente>[] = [];
      const usuariosData: Partial<Usuario>[] = [];
      const usuariosColegioData: Partial<UsuarioColegio>[] = [];

      for (const item of normalizedData) {
        // 1. Procesamos la persona
        const personaId = item.DOCENTE_ID || undefined;
        const generoId = await this.obtenerGeneroId(item.GENERO);
        const estadoCivilId = await this.obtenerEstadoCivilId(
          item.ESTADO_CIVIL
        );

        personasData.push({
          persona_id: personaId,
          tipo_documento: "RUT",
          numero_documento: item.RUT?.trim() || "",
          nombres: item.NOMBRE?.trim() || "",
          apellidos: item.APELLIDOS?.trim() || "",
          genero_id: generoId || 0,
          estado_civil_id: estadoCivilId || 0,
          fecha_nacimiento: new Date(), // Ajustar si tienes la fecha real
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });

        // 2. Procesamos el docente
        docentesData.push({
          docente_id: personaId, // Mismo ID que persona
          persona_id: personaId, // Se actualizará después
          colegio_id: this.colegio_id,
          especialidad: item.ESPECIALIDAD?.trim() || "General",
          estado: "activo",
          tipo_documento: "RUT",
          numero_documento: item.RUT?.trim() || "",
          nombres: item.NOMBRE?.trim() || "",
          apellidos: item.APELLIDOS?.trim() || "",
          genero_id: generoId || 0,
          estado_civil_id: estadoCivilId || 0,
          fecha_nacimiento: new Date(),
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });

        // 3. Procesamos el usuario (si tiene email)
        if (item.RUT) {
          // Usamos RUT para generar email si no hay
          const email = `${item.RUT.replace(
            /\D/g,
            ""
          )}@colegio.com`.toLowerCase();

          usuariosData.push({
            nombre_social: `${item.NOMBRE} ${item.APELLIDOS}`.trim(),
            email: email,
            encripted_password: "", // Puedes generar una temporal
            rol_id: 3, // Asumiendo que 3 es el ID para rol docente
            persona_id: personaId, // Se actualizará después
            telefono_contacto: "", // Puedes agregar si tienes el dato
            estado_usuario: "activo",
            ultimo_inicio_sesion: new Date().toISOString(),
            intentos_inicio_sesion: 0,
            idioma_id: 1, // Asumiendo español como predeterminado
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });

          // 4. Relación usuario-colegio
          usuariosColegioData.push({
            usuario_id: 0, // Se actualizará después
            colegio_id: this.colegio_id,
            rol_id: 3, // Rol docente
            fecha_asignacion: new Date().toISOString(),
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });
        }
      }

      // 1. Insertamos personas primero
      const { data: personasInsertadas, error: errorPersonas } =
        await this.client
          .from("personas")
          .upsert(personasData, { onConflict: "persona_id" })
          .select("persona_id, numero_documento");

      if (errorPersonas) throw errorPersonas;

      // 2. Actualizamos docentes con los IDs de persona
      const docentesParaInsertar = docentesData.map((docente, index) => ({
        ...docente,
        persona_id: personasInsertadas?.[index]?.persona_id,
        docente_id: personasInsertadas?.[index]?.persona_id,
      }));

      const { data: docentesInsertados, error: errorDocentes } =
        await this.client
          .from("docentes")
          .upsert(docentesParaInsertar, { onConflict: "docente_id,colegio_id" })
          .select("docente_id, persona_id");

      if (errorDocentes) throw errorDocentes;

      // 3. Insertamos usuarios (solo para docentes con RUT)
      const usuariosParaInsertar = usuariosData
        .map((usuario, index) => ({
          ...usuario,
          persona_id: personasInsertadas?.[index]?.persona_id,
        }))
        .filter((u) => u.persona_id); // Filtramos solo los que tienen persona_id

      let usuariosInsertados: Usuario[] = [];
      if (usuariosParaInsertar.length > 0) {
        const { data: usuarios, error: errorUsuarios } = await this.client
          .from("usuarios")
          .upsert(usuariosParaInsertar, { onConflict: "email" })
          .select("*,usuario_id, persona_id");

        if (errorUsuarios) throw errorUsuarios;
        usuariosInsertados = usuarios || [];
      }

      // 4. Insertamos relaciones usuario-colegio
      if (usuariosInsertados.length > 0) {
        const relacionesParaInsertar = usuariosColegioData
          .map((relacion, index) => ({
            ...relacion,
            usuario_id: usuariosInsertados?.[index]?.usuario_id,
          }))
          .filter((r) => r.usuario_id); // Filtramos solo los que tienen usuario_id

        if (relacionesParaInsertar.length > 0) {
          const { error: errorRelaciones } = await this.client
            .from("usuarios_colegio")
            .upsert(relacionesParaInsertar, {
              onConflict: "usuario_id,colegio_id",
            });

          if (errorRelaciones) throw errorRelaciones;
        }
      }

      // 5. Procesar curso titular si existe
      for (let i = 0; i < normalizedData.length; i++) {
        const item = normalizedData[i];
        const docenteId = docentesInsertados?.[i]?.docente_id;

        if (docenteId && item.CURSO_TITULAR) {
          await this.asignarCursoTitular({
            docente_id: docenteId,
            nombre_curso: item.CURSO_TITULAR,
            colegio_id: this.colegio_id,
          });
        }
      }

      return {
        personas: personasInsertadas as Persona[],
        docentes: docentesInsertados as Docente[],
        usuarios: usuariosInsertados as Usuario[],
      };
    } catch (error) {
      console.error(
        "Error en procesarDocentes:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  // Métodos auxiliares (deben estar implementados en tu clase)
  private async obtenerGeneroId(generoNombre: string): Promise<number | null> {
    const { data } = await this.client
      .from("generos")
      .select("genero_id")
      .ilike("nombre", generoNombre)
      .single();
    return data?.genero_id || null;
  }

  private async obtenerEstadoCivilId(
    estadoCivil: string
  ): Promise<number | null> {
    const { data } = await this.client
      .from("estados_civiles")
      .select("estado_civil_id")
      .ilike("nombre", estadoCivil)
      .single();
    return data?.estado_civil_id || null;
  }

  private async asignarCursoTitular({
    docente_id,
    nombre_curso,
    colegio_id,
  }: {
    docente_id: number;
    nombre_curso: string;
    colegio_id: number;
  }): Promise<void> {
    try {
      // Buscar el curso por nombre
      const { data: curso } = await this.client
        .from("cursos")
        .select("curso_id")
        .ilike("nombre_curso", nombre_curso)
        .eq("colegio_id", colegio_id)
        .single();

      if (curso?.curso_id) {
        // Asignar docente como titular
        await this.client
          .from("cursos")
          .update({ docente_titular_id: docente_id })
          .eq("curso_id", curso.curso_id);
      }
    } catch (error) {
      console.error(
        `Error asignando curso titular a docente ${docente_id}:`,
        error
      );
    }
  }

  async procesarNivelesEducativos({
    data,
  }: {
    data: NivelEducativoExcel[];
  }): Promise<NivelEducativo[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de niveles educativos");
      }

      // Mapeamos los datos
      const datosMapeados = data.map((item) => ({
        nivel_educativo_id: item.NIVEL_EDUCATIVO_ID || undefined, // Si es 0, Supabase generará automáticamente el ID
        nombre: item.NOMBRE?.trim() || "Nivel sin nombre",
        colegio_id: this.colegio_id,
        creado_por: 0,
        actualizado_por: 0,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        activo: true,
      }));

      // Upsert (insertar o actualizar si ya existe)
      const { data: niveles, error } = await this.client
        .from("niveles_educativos")
        .upsert(datosMapeados, {
          onConflict: "nivel_educativo_id", // Actualiza si el ID ya existe
          ignoreDuplicates: false,
        })
        .select("*");

      if (error) throw error;
      return niveles;
    } catch (error) {
      console.error(
        "Error en procesarNivelesEducativos:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  async procesarGrados({
    data,
  }: {
    data: GradoExcel[];
  }): Promise<Grado[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de grados");
      }

      // Mapeamos los datos
      const datosMapeados: Grado[] = await Promise.all(
        data.map(async (item) => ({
          nombre: item.NOMBRE?.trim() || "Grado sin nombre",
          creado_por: 0,
          actualizado_por: 0,
          colegio_id: this.colegio_id,
          nivel_educativo_id:
            (await this.obtenerIdGradoPorNombre(
              this.transformarNivelEducativo(item.NOMBRE)
            )) || 1,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        }))
      );

      // Upsert (insertar o actualizar si ya existe)
      const { data: grados, error } = await this.client
        .from("grados")
        .upsert(datosMapeados, {
          onConflict: "grado_id", // Actualiza si el ID ya existe
          ignoreDuplicates: false,
        })
        .select("*");

      if (error) throw error;
      return grados;
    } catch (error) {
      console.error(
        "Error en procesarGrados:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  async procesarMaterias({
    data,
  }: {
    data: MateriaExcel[];
  }): Promise<Materia[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de materias");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Mapeamos los datos
      const datosMapeados = data.map((item) => ({
        materia_id: item.MATERIA_ID || undefined, // Si es 0, Supabase generará automáticamente el ID
        colegio_id: this.colegio_id,
        nombre: item.NOMBRE?.trim() || "Materia sin nombre",
        codigo: item.CODIGO?.trim() || "",
        creado_por: 0,
        actualizado_por: 0,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        activo: true,
      })) as Materia[];

      // Upsert (insertar o actualizar si ya existe)
      const { data: materias, error } = await this.client
        .from("materias")
        .upsert(datosMapeados, {
          onConflict: "materia_id", // Actualiza si el ID ya existe
          ignoreDuplicates: false,
        })
        .select("*");

      if (error) throw error;
      return materias;
    } catch (error) {
      console.error(
        "Error en procesarMaterias:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  async procesarCursos({
    data,
  }: {
    data: CursoExcel[];
  }): Promise<Curso[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de cursos");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Mapeamos los datos
      const datosMapeados = data.map(async (item) => {
        // Convertimos IDs de string a number
        const [grado_id, nivel_educativo_id] = await Promise.all([
          this.obtenerIdGradoPorNombre(item.GRADO_ID),
          this.obtenerIdNivelEducativoPorNombre(item.NIVEL_EDUCATIVO_ID),
        ]);
        return {
          nombre_curso: item.NOMBRE_CURSO?.trim() || "Curso sin nombre",
          colegio_id: this.colegio_id,
          grado_id: grado_id,
          nivel_educativo_id: nivel_educativo_id,
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        } as Curso;
      });

      // Upsert (insertar o actualizar si ya existe)
      const { data: cursos, error } = await this.client
        .from("cursos")
        .upsert(datosMapeados, {
          onConflict: "curso_id", // Actualiza si el ID ya existe
          ignoreDuplicates: false,
        })
        .select("*");

      if (error) throw error;
      return cursos;
    } catch (error) {
      console.error(
        "Error en procesarCursos:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  async procesarAlumnos({ data }: { data: AlumnoExcel[] }): Promise<{
    personas: Persona[];
    alumnos: Alumno[];
    usuarios: Usuario[];
    apoderados: Apoderado[];
  } | null> {
    try {

      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de alumnos");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Normalizar nombres de campos (eliminar espacios extra)
      const normalizedData = data.map((item) => ({
        ALUMNO_ID: item.ALUMNO_ID,
        RUT: item.RUT?.trim(),
        NOMBRE: item.NOMBRE?.trim(),
        APELLIDOS: item.APELLIDOS?.trim(),
        NOMBRE_SOCIAL: item.NOMBRE_SOCIAL?.trim(),
        CURSO: item.CURSO?.trim(),
        GENERO: item.GENERO?.trim(),
        DIRECCION: item["DIRECCIÓN"]?.trim(),
        COMUNA: item.COMUNA?.trim(),
        REGION: item.REGION?.trim(),
        TELEFONO_CONTACTO1: item.TELEFONO_CONTACTO1,
        TELEFONO_CONTACTO2: item.TELEFONO_CONTACTO2,
        EMAIL: item.EMAIL?.trim(),
        RUT_APODERADO_1: item.RUT_APODERADO_1?.trim(),
        NOMBRE_APODERADO_1: item.NOMBRE_APODERADO_1?.trim(),
        APELLIDO_APODERADO_1: item.APELLIDO_APODERADO_1?.trim(),
        EMAIL_APODERADO_1: item.EMAIL_APODERADO_1?.trim(),
        TELEFONO_APODERADO_1: item.TELEFONO_APODERADO_1,
        RUT_APODERADO_2: item.RUT_APODERADO_2?.trim(),
        NOMBRE_APODERADO_2: item.NOMBRE_APODERADO_2?.trim(),
        APELLIDO_APODERADO_2: item.APELLIDO_APODERADO_2?.trim(),
        EMAIL_APODERADO_2: item.EMAIL_APODERADO_2?.trim(),
        TELEFONO_APODERADO_2: item.TELEFONO_APODERADO_2,
        ANTECEDENTES_MEDICOS: item["ANTECEDENTES MEDICOS"]?.trim(),
      }));

      // Arrays para almacenar los datos procesados
      const personasData: Partial<Persona>[] = [];
      const alumnosData: Partial<Alumno>[] = [];
      const usuariosData: Partial<Usuario>[] = [];
      const usuariosColegioData: Partial<UsuarioColegio>[] = [];
      const apoderadosData: Partial<Apoderado>[] = [];
      const personasApoderadosData: Partial<Persona>[] = [];

      for (const item of normalizedData) {
        const alumnoId = item.ALUMNO_ID || undefined;
        const generoId = await this.obtenerGeneroId(item.GENERO);

        // 1. Procesamos la persona del alumno
        personasData.push({
          persona_id: alumnoId,
          tipo_documento: "RUT",
          numero_documento: item.RUT || "",
          nombres: item.NOMBRE || "",
          apellidos: item.APELLIDOS || "",
          genero_id: generoId || 0,
          estado_civil_id: 1, // Asumiendo soltero para alumnos
          fecha_nacimiento: new Date(), // Ajustar si tienes la fecha real
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });

        // 2. Procesamos el alumno
        alumnosData.push({
          alumno_id: alumnoId,
          persona_id: alumnoId,
          colegio_id: this.colegio_id,
          telefono_contacto1: item.TELEFONO_CONTACTO1?.toString() || "",
          telefono_contacto2: item.TELEFONO_CONTACTO2?.toString() || "",
          email: item.EMAIL || "",
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });

        // 3. Procesamos el usuario del alumno (si tiene email)
        if (item.EMAIL) {
          usuariosData.push({
            nombre_social:
              item.NOMBRE_SOCIAL || `${item.NOMBRE} ${item.APELLIDOS}`.trim(),
            email: item.EMAIL.toLowerCase(),
            encripted_password: "", // Generar una temporal
            rol_id: 4, // Asumiendo que 4 es el ID para rol alumno
            persona_id: alumnoId,
            telefono_contacto: item.TELEFONO_CONTACTO1?.toString() || "",
            estado_usuario: "activo",
            ultimo_inicio_sesion: new Date().toISOString(),
            intentos_inicio_sesion: 0,
            idioma_id: 1,
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });

          // Relación usuario-colegio para alumno
          usuariosColegioData.push({
            usuario_id: 0, // Se actualizará después
            colegio_id: this.colegio_id,
            rol_id: 4, // Rol alumno
            fecha_asignacion: new Date().toISOString(),
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });
        }

        // 4. Procesamos apoderado 1 si existe

        if (item.RUT_APODERADO_1) {
          const apoderado1Id = Math.floor(Math.random() * 1000000); // Generar ID temporal
          const generoApoderado1Id = await this.obtenerGeneroId(""); // Obtener género si es necesario

          personasApoderadosData.push({
            persona_id: apoderado1Id,
            tipo_documento: "RUT",
            numero_documento: item.RUT_APODERADO_1,
            nombres: item.NOMBRE_APODERADO_1 || "",
            apellidos: item.APELLIDO_APODERADO_1 || "",
            genero_id: generoApoderado1Id || 0,
            estado_civil_id: 0, // Puede ajustarse según sea necesario
            fecha_nacimiento: new Date(),
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });

          apoderadosData.push({
            apoderado_id: apoderado1Id,
            persona_id: apoderado1Id,
            colegio_id: this.colegio_id,
            telefono_contacto1: item.TELEFONO_APODERADO_1?.toString() || "",
            telefono_contacto2: "",
            email_contacto1: item.EMAIL_APODERADO_1 || "",
            email_contacto2: "",
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });
        }

        // 5. Procesamos apoderado 2 si existe

        if (item.RUT_APODERADO_2) {
          const apoderado2Id = Math.floor(Math.random() * 1000000); // Generar ID temporal
          const generoApoderado2Id = await this.obtenerGeneroId(""); // Obtener género si es necesario

          personasApoderadosData.push({
            persona_id: apoderado2Id,
            tipo_documento: "RUT",
            numero_documento: item.RUT_APODERADO_2,
            nombres: item.NOMBRE_APODERADO_2 || "",
            apellidos: item.APELLIDO_APODERADO_2 || "",
            genero_id: generoApoderado2Id || 0,
            estado_civil_id: 0,
            fecha_nacimiento: new Date(),
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });

          apoderadosData.push({
            apoderado_id: apoderado2Id,
            persona_id: apoderado2Id,
            colegio_id: this.colegio_id,
            telefono_contacto1: item.TELEFONO_APODERADO_2?.toString() || "",
            telefono_contacto2: "",
            email_contacto1: item.EMAIL_APODERADO_2 || "",
            email_contacto2: "",
            creado_por: 0,
            actualizado_por: 0,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            activo: true,
          });
        }
      }

      // Combinar todas las personas (alumnos y apoderados)
      const todasLasPersonas = [...personasData, ...personasApoderadosData];

      // 1. Insertamos todas las personas primero

      const { data: personasInsertadas, error: errorPersonas } =
        await this.client
          .from("personas")
          .upsert(todasLasPersonas, { onConflict: "persona_id" })
          .select("persona_id, numero_documento");

      if (errorPersonas) throw errorPersonas;

      // 2. Insertamos alumnos

      const alumnosParaInsertar = alumnosData.map((alumno, index) => ({
        ...alumno,
        persona_id: personasInsertadas?.[index]?.persona_id,
        alumno_id: personasInsertadas?.[index]?.persona_id,
      }));

      const { data: alumnosInsertados, error: errorAlumnos } = await this.client
        .from("alumnos")
        .upsert(alumnosParaInsertar, { onConflict: "alumno_id,colegio_id" })
        .select("alumno_id, persona_id");

      if (errorAlumnos) throw errorAlumnos;

      // 3. Insertamos usuarios de alumnos

      const usuariosParaInsertar = usuariosData
        .map((usuario, index) => ({
          ...usuario,
          persona_id: personasInsertadas?.[index]?.persona_id,
        }))
        .filter((u) => u.persona_id && u.email);

      let usuariosInsertados: Usuario[] = [];
      if (usuariosParaInsertar.length > 0) {
        const { data: usuarios, error: errorUsuarios } = await this.client
          .from("usuarios")
          .upsert(usuariosParaInsertar, { onConflict: "email" })
          .select("*,usuario_id, persona_id");

        if (errorUsuarios) throw errorUsuarios;
        usuariosInsertados = usuarios || [];
      }

      // 4. Insertamos relaciones usuario-colegio

      if (usuariosInsertados.length > 0) {
        const relacionesParaInsertar = usuariosColegioData
          .map((relacion, index) => ({
            ...relacion,
            usuario_id: usuariosInsertados?.[index]?.usuario_id,
          }))
          .filter((r) => r.usuario_id);

        if (relacionesParaInsertar.length > 0) {
          const { error: errorRelaciones } = await this.client
            .from("usuarios_colegio")
            .upsert(relacionesParaInsertar, {
              onConflict: "usuario_id,colegio_id",
            });

          if (errorRelaciones) throw errorRelaciones;
        }
      }

      // 5. Insertamos apoderados

      const apoderadosParaInsertar = apoderadosData
        .map((apoderado) => {
          const personaApoderado = personasInsertadas?.find(
            (p) => p.persona_id === apoderado.persona_id
          );
          return {
            ...apoderado,
            persona_id: personaApoderado?.persona_id,
          };
        })
        .filter((a) => a.persona_id);

      let apoderadosInsertados: Apoderado[] = [];
      if (apoderadosParaInsertar.length > 0) {
        const { data: apoderados, error: errorApoderados } = await this.client
          .from("apoderados")
          .upsert(apoderadosParaInsertar, {
            onConflict: "apoderado_id,colegio_id",
          })
          .select("*");

        if (errorApoderados) throw errorApoderados;
        apoderadosInsertados = apoderados || [];
      }

      return {
        personas: personasInsertadas as Persona[],
        alumnos: alumnosInsertados as Alumno[],
        usuarios: usuariosInsertados as Usuario[],
        apoderados: apoderadosInsertados as Apoderado[],
      };
    } catch (error) {
      console.error(
        "Error en procesarAlumnos:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  async procesarAulas({ data }: { data: AulaExcel[] }): Promise<Aula[] | null> {
    try {
      // Validación básica
      if (!data || data.length === 0) {
        throw new Error("No se proporcionaron datos de aulas");
      }
      if (!this.colegio_id || this.colegio_id <= 0) {
        throw new Error("ID de colegio inválido");
      }

      // Normalizar nombres de campos (eliminar espacios extra)
      const normalizedData = data.map((item) => ({
        AULA_ID: item.AULA_ID,
        CURSO: item.CURSO?.trim(),
        MATERIA: item.MATERIA?.trim(),
        DOCENTE: item.DOCENTE,
        NOMBRE_DOCENTE: item["NOMBRE DOCENTE"]?.trim(),
        TPO_DOCENTE: item.TPO_DOCENTE?.trim(),
      }));

      // Array para almacenar los datos procesados
      const aulasData: Partial<Aula>[] = [];

      for (const item of normalizedData) {
        // Obtener IDs necesarios
        const cursoId = await this.obtenerIdCursoPorNombre(item.CURSO);
        const materiaId = await this.obtenerIdMateriaPorNombre(item.MATERIA);
        const docenteId = item.DOCENTE;

        // Validar que existan los IDs necesarios
        if (!cursoId) {
          console.warn(`No se encontró el curso: ${item.CURSO}`);
          continue;
        }
        if (!materiaId) {
          console.warn(`No se encontró la materia: ${item.MATERIA}`);
          continue;
        }
        if (!docenteId) {
          console.warn(
            `No se proporcionó docente para el aula: ${item.AULA_ID}`
          );
          continue;
        }

        // Verificar que el docente existe en la base de datos
        const docenteExiste = await this.verificarDocenteExiste(docenteId);
        if (!docenteExiste) {
          console.warn(`No se encontró el docente con ID: ${docenteId}`);
          continue;
        }

        // Procesar el aula
        aulasData.push({
          aula_id: item.AULA_ID || undefined,
          curso_id: cursoId,
          colegio_id: this.colegio_id,
          materia_id: materiaId,
          docente_id: docenteId,
          tipo_docente: item.TPO_DOCENTE || "titular",
          creado_por: 0,
          actualizado_por: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          activo: true,
        });
      }

      // Validar que hay aulas para procesar
      if (aulasData.length === 0) {
        throw new Error(
          "No se pudieron procesar las aulas. Verifique los datos de entrada."
        );
      }

      // Insertar las aulas en la base de datos
      const { data: aulasInsertadas, error: errorAulas } = await this.client
        .from("aulas")
        .upsert(aulasData, { onConflict: "aula_id,colegio_id" })
        .select("*");

      if (errorAulas) throw errorAulas;

      return (aulasInsertadas as Aula[]) || [];
    } catch (error) {
      console.error(
        "Error en procesarAulas:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  // Método reutilizable para conversión de fechas Excel (debe estar en la misma clase)
  private excelDateToJSDate(excelDate: number): Date {
    // Excel cuenta desde 01/01/1900 (con el error de 1900 como bisiesto)
    const jsDate = new Date(1900, 0, excelDate - 1);

    // Ajuste para el error de Excel (1900 no fue bisiesto)
    if (excelDate > 60) {
      jsDate.setDate(jsDate.getDate() - 1);
    }

    return jsDate;
  }
  // Método auxiliar para calcular días hábiles (opcional)
  private calcularDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
    // Implementación básica - puedes mejorarla
    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  // Métodos auxiliares que necesitarás implementar o que ya podrías tener
  private async verificarDocenteExiste(docenteId: number): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from("docentes")
        .select("docente_id")
        .eq("docente_id", docenteId)
        .eq("colegio_id", this.colegio_id)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.warn(`Error al verificar docente ${docenteId}:`, error);
      return false;
    }
  }
  transformarNivelEducativo(input: string): string {
    const palabras = input.trim().split(/\s+/);
    const ultimaPalabra = palabras[palabras.length - 1].toLowerCase();

    if (ultimaPalabra === "básico" || ultimaPalabra === "basico") {
      return "Educación Básica";
    }

    if (ultimaPalabra === "medio") {
      return "Educación Media";
    }

    return input; // si no coincide, devuelve el original
  }
}
