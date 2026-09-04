import postgres from "postgres";
import {
  CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS,
  FilaPaletaColor,
} from "../modelo/dashboard/PaletaColoresEmocionesPatologiasNeurodivergencias";
import { ErrorHandler } from "../../helpers/ErrorResponse";

type CachedPalette = {
  data: FilaPaletaColor[];
  source: "db" | "fallback";
  loadedAt: number;
};

type PaletteDbRow = {
  categoria: string | null;
  subcategoria: string | null;
  codigo: string | null;
  hex: string | null;
};
type DbPaletteValue = { codigo: string; hex: string };

type PaletteValidationError = {
  code: string;
  categoria: string;
  subcategoria: string;
  esperado: string;
  actual?: { codigo: string; hex: string } | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CANONICAL_BY_KEY = new Map<
  string,
  {
    codigo: string;
    hex: string;
    categoria: string;
  }
>();

for (const item of CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS) {
  const key = `${item.categoria}::${item.subcategoria}`;
  CANONICAL_BY_KEY.set(key, {
    codigo: item.codigo,
    hex: item.color_hex.toUpperCase(),
    categoria: item.categoria,
  });
}

let paletteCache: CachedPalette | null = null;
let loadingPalette: Promise<CachedPalette> | null = null;

const CATEGORIA_EMOCION = "Emoción";
const CATEGORIA_PATOLOGIA = "Patología";
const CATEGORIA_NEURO = "Neurodivergencia";

const getConnectionString = (): string | null => {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
};

const getCanonicalPalette = (): FilaPaletaColor[] => {
  return [...CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS];
};

const normalizeText = (value: string): string => value.trim();
const normalizeHex = (value: string): string => {
  const normalized = value.trim().toUpperCase();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
};

const buildGroupedResponse = (palette: FilaPaletaColor[]) => {
  const grouped = {
    emociones: [] as FilaPaletaColor[],
    patologias: [] as FilaPaletaColor[],
    neurodivergencias: [] as FilaPaletaColor[],
  };

  for (const row of palette) {
    if (row.categoria === CATEGORIA_EMOCION) {
      grouped.emociones.push(row);
      continue;
    }
    if (row.categoria === CATEGORIA_PATOLOGIA) {
      grouped.patologias.push(row);
      continue;
    }
    if (row.categoria === CATEGORIA_NEURO) {
      grouped.neurodivergencias.push(row);
    }
  }

  return grouped;
};

const throwIntegrityError = (errors: PaletteValidationError[]) => {
  const missing = errors.filter((item) => item.actual === undefined);
  const mismatch = errors.filter((item) => item.actual !== undefined);
  ErrorHandler.throwCustomError(
    "PALLETA_INTEGRIDAD_ERROR",
    "Faltan entradas o hay diferencias en el conjunto canónico de la paleta",
    500,
    { missing, mismatch }
  );
};

const fallbackPalette = (): CachedPalette => ({
  data: getCanonicalPalette(),
  source: "fallback",
  loadedAt: Date.now(),
});

const fetchFromDatabase = async (): Promise<CachedPalette> => {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return fallbackPalette();
  }

  const sql = postgres(connectionString, { ssl: "require" });

  try {
    const exists = await sql`
      SELECT to_regclass('public.diagnostico')::text AS table_name
    `;

    if (!exists[0]?.table_name) {
      return fallbackPalette();
    }

    let rows: PaletteDbRow[] = [];
    try {
      rows = await sql`
        SELECT categoria, subcategoria, codigo, hex
        FROM diagnostico
        WHERE activo IS TRUE
      `;
    } catch (error) {
      return fallbackPalette();
    }

    const dbByKey = new Map<string, DbPaletteValue>();
    for (const row of rows) {
      if (!row.categoria || !row.subcategoria || !row.hex || !row.codigo) {
        continue;
      }
      const key = `${normalizeText(row.categoria)}::${normalizeText(row.subcategoria)}`;
      if (!CANONICAL_BY_KEY.has(key)) {
        continue;
      }
      dbByKey.set(key, {
        codigo: row.codigo.trim().toUpperCase(),
        hex: normalizeHex(row.hex),
      });
    }

    const errors: PaletteValidationError[] = [];
    const resolved: FilaPaletaColor[] = [];

    for (const canonical of CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS) {
      const key = `${canonical.categoria}::${canonical.subcategoria}`;
      const expected = CANONICAL_BY_KEY.get(key);
      if (!expected) {
        continue;
      }
      const actual = dbByKey.get(key);
      if (!actual) {
        errors.push({
          code: expected.codigo,
          categoria: canonical.categoria,
          subcategoria: canonical.subcategoria,
          esperado: expected.hex,
        });
        continue;
      }
      if (actual.codigo !== expected.codigo || actual.hex !== expected.hex) {
        errors.push({
          code: expected.codigo,
          categoria: canonical.categoria,
          subcategoria: canonical.subcategoria,
          esperado: expected.hex,
          actual: {
            codigo: actual.codigo,
            hex: actual.hex,
          },
        });
        continue;
      }

      resolved.push({
        categoria: canonical.categoria,
        subcategoria: canonical.subcategoria,
        codigo: canonical.codigo,
        hex: canonical.hex,
        color_hex: canonical.color_hex,
      });
    }

    if (
      errors.length > 0 ||
      resolved.length !== CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS.length
    ) {
      throwIntegrityError(errors);
    }

    return {
      data: resolved,
      source: "db",
      loadedAt: Date.now(),
    };
  } catch (error) {
    const typedError = error as { code?: string; message?: string };
    if (typedError?.code === "PALLETA_INTEGRIDAD_ERROR") {
      throw error;
    }
    return fallbackPalette();
  } finally {
    await sql.end({ timeout: 500 });
  }
};

const mapByCategoryAndSubcategory = (): Map<string, string> => {
  const map = new Map<string, string>();
  for (const row of CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS) {
    map.set(`${row.categoria}::${row.subcategoria}`, row.color_hex);
  }
  return map;
};

export const PaletaColoresService = {
  async obtenerPaleta() {
    if (paletteCache && Date.now() - paletteCache.loadedAt < CACHE_TTL_MS) {
      return paletteCache;
    }

    if (!loadingPalette) {
      loadingPalette = fetchFromDatabase().then((palette) => {
        paletteCache = palette;
        return palette;
      });
      loadingPalette.finally(() => {
        loadingPalette = null;
      });
    }

    return loadingPalette;
  },

  getCanonicalPalette() {
    return fallbackPalette();
  },

  getCanonicalByCategoryAndSubcategoryMap() {
    return mapByCategoryAndSubcategory();
  },

  getColorByCategoriaYSubcategoria(categoria: string, subcategoria: string): string | null {
    const map = mapByCategoryAndSubcategory();
    return map.get(`${categoria}::${subcategoria}`) ?? null;
  },

  parseCatalogResponse(raw: CachedPalette, grouped: boolean) {
    if (!grouped) {
      return raw.data;
    }
    return buildGroupedResponse(raw.data);
  },
};
