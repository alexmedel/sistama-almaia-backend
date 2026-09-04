export type CategoriaPaleta =
  | "Emoci\u00f3n"
  | "Patolog\u00eda"
  | "Neurodivergencia";

export type FilaPaletaColor = {
  categoria: CategoriaPaleta;
  subcategoria: string;
  codigo: string;
  hex: string;
  color_hex: string;
};

type PaletaColorInput = Omit<FilaPaletaColor, "hex">;

const CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS_INPUT: PaletaColorInput[] = [
  { categoria: "Emoci\u00f3n", subcategoria: "Aceptaci\u00f3n", codigo: "ACP", color_hex: "#4CAF50" },
  { categoria: "Emoci\u00f3n", subcategoria: "Alegr\u00eda", codigo: "ALG", color_hex: "#FBC02D" },
  { categoria: "Emoci\u00f3n", subcategoria: "Balance A\u00f1o", codigo: "BAY", color_hex: "#607D8B" },
  { categoria: "Emoci\u00f3n", subcategoria: "Balance Mes", codigo: "BME", color_hex: "#26A69A" },
  { categoria: "Emoci\u00f3n", subcategoria: "Calma", codigo: "CAL", color_hex: "#64B5F6" },
  { categoria: "Emoci\u00f3n", subcategoria: "Enojo/Rabia", codigo: "ENR", color_hex: "#E53935" },
  { categoria: "Emoci\u00f3n", subcategoria: "Gratitud", codigo: "GRT", color_hex: "#8E24AA" },
  { categoria: "Emoci\u00f3n", subcategoria: "Tristeza", codigo: "TRI", color_hex: "#1E88E5" },

  { categoria: "Patolog\u00eda", subcategoria: "Adicciones", codigo: "ADI", color_hex: "#8D6E63" },
  { categoria: "Patolog\u00eda", subcategoria: "Ansiedad", codigo: "ANS", color_hex: "#FF8A65" },
  { categoria: "Patolog\u00eda", subcategoria: "Autocuidado", codigo: "AUT", color_hex: "#43A047" },
  { categoria: "Patolog\u00eda", subcategoria: "Bullying", codigo: "BUL", color_hex: "#D81B60" },
  { categoria: "Patolog\u00eda", subcategoria: "Depresi\u00f3n", codigo: "D", color_hex: "#546E7A" },
  { categoria: "Patolog\u00eda", subcategoria: "Riesgo Social", codigo: "RSO", color_hex: "#F4511E" },
  { categoria: "Patolog\u00eda", subcategoria: "Rumiaci\u00f3n", codigo: "RUM", color_hex: "#7E57C2" },
  { categoria: "Patolog\u00eda", subcategoria: "TCA (Aliment.)", codigo: "TCAA", color_hex: "#FFB300" },
  { categoria: "Patolog\u00eda", subcategoria: "TCA (Cuerpo)", codigo: "TCAC", color_hex: "#EC407A" },
  { categoria: "Patolog\u00eda", subcategoria: "Trauma", codigo: "TRA", color_hex: "#6D4C41" },

  { categoria: "Neurodivergencia", subcategoria: "Discalculia", codigo: "DCL", color_hex: "#3949AB" },
  { categoria: "Neurodivergencia", subcategoria: "Disgraf\u00eda", codigo: "DGF", color_hex: "#5E35B1" },
  { categoria: "Neurodivergencia", subcategoria: "Dislexia", codigo: "DSL", color_hex: "#00897B" },
  { categoria: "Neurodivergencia", subcategoria: "Dislexia (Lectura)", codigo: "DLC", color_hex: "#00ACC1" },
  { categoria: "Neurodivergencia", subcategoria: "Dispraxia", codigo: "DPX", color_hex: "#7CB342" },
  { categoria: "Neurodivergencia", subcategoria: "Fatiga Neuro", codigo: "FNE", color_hex: "#90A4AE" },
  { categoria: "Neurodivergencia", subcategoria: "Func. Ejecutiva", codigo: "FEJ", color_hex: "#1E88E5" },
  { categoria: "Neurodivergencia", subcategoria: "TDAH (Atenci\u00f3n)", codigo: "TDA", color_hex: "#FB8C00" },
  { categoria: "Neurodivergencia", subcategoria: "TDAH (Foco)", codigo: "TDF", color_hex: "#FDD835" },
  { categoria: "Neurodivergencia", subcategoria: "TDAH (Hiperact.)", codigo: "TDH", color_hex: "#E64A19" },
  { categoria: "Neurodivergencia", subcategoria: "TDAH (Impulsiv.)", codigo: "TDI", color_hex: "#C62828" },
  { categoria: "Neurodivergencia", subcategoria: "TEA (Rigidez)", codigo: "TER", color_hex: "#6A1B9A" },
  { categoria: "Neurodivergencia", subcategoria: "TEA (Sensorial)", codigo: "TES", color_hex: "#26C6DA" },
  { categoria: "Neurodivergencia", subcategoria: "TEA (Social)", codigo: "TSO", color_hex: "#AB47BC" },
  { categoria: "Neurodivergencia", subcategoria: "TEA (Lenguaje)", codigo: "TEL", color_hex: "#0097A7" },
];

export const CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS: FilaPaletaColor[] =
  CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS_INPUT.map((row) => ({
    ...row,
    hex: row.color_hex,
  }));

export const EXPECTED_CANONICAL_PALETTE_SIZE = 33;

export const CANONICAL_PALETTE_CODES = CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS.map(
  (item) => item.codigo
);
