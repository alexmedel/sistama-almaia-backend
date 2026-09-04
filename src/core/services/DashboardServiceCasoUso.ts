 
import { ComparativaDato } from "../modelo/alumno/ComparativaDato";
import { AlertData } from "../modelo/dashboard/AlertData";
import { Emotion } from "../modelo/dashboard/Emotion";
import { CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS } from "../modelo/dashboard/PaletaColoresEmocionesPatologiasNeurodivergencias";
import { EstadisticaEmocionGrado, EstadisticaPatologiaGrado, OutputEstadisticaEmocionGrado } from "../modelo/dashboard/EstadisticaEmocionGrado";

const emotionPaletteByName = new Map(
  CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS.filter(
    (item) => item.categoria === "Emoción"
  ).map((item) => [item.subcategoria, item.color_hex])
);
const patologiaPaletteByName = new Map(
  CANONICAL_PALLETA_EMOCIONES_PATOLOGIAS_NEURODIVERGENCIAS.filter(
    (item) => item.categoria === "Patología" || item.categoria === "Neurodivergencia"
  ).map((item) => [item.subcategoria, item.color_hex])
);

export function mapEmotions(
  respuestas: { nombre: string; cantidad: number }[]
): Emotion[] {
  return respuestas.map((r) => ({
    name: r.nombre,
    value: r.cantidad,
    color: emotionPaletteByName.get(r.nombre) || "#000000",
  }));
}

export function mapEmotionsPromedio(
  respuestas: {
    nombre: string;
    cantidad_alumno: number;
    proporcion_alumno: number;
    porcentaje_alumno: number;
    cantidad_global: number;
    proporcion_global: number;
    porcentaje_global: number;
  }[]
): ComparativaDato[] {
  return respuestas.map((r) => ({
    name: r.nombre,
    alumno: r.proporcion_alumno,
    promedio: r.porcentaje_global, // color por defecto si no estÃ¡
  } as any));
}
export function mapPatologia(
  respuestas: {
    diagnostico: string;
    cantidad: number;
    cantidad_respuestas?: number;
    cantidad_positivas?: number;
    cantidad_negativas?: number;
    cantidad_neutras?: number;
    color?: string;
  }[]
): (Emotion & {
  cantidad_respuestas?: number;
  cantidad_positivas?: number;
  cantidad_negativas?: number;
  cantidad_neutras?: number;
})[] {
  return respuestas.map((r) => ({
    name: r.diagnostico,
    value: r.cantidad,
    cantidad_respuestas: r.cantidad_respuestas,
    cantidad_positivas: r.cantidad_positivas,
    cantidad_negativas: r.cantidad_negativas,
    cantidad_neutras: r.cantidad_neutras,
    color: r.color || patologiaPaletteByName.get(r.diagnostico) || "#000000",
  }));
}
const monthMap: { [key: string]: string } = {
  "01": "Ene",
  "02": "Feb",
  "03": "Mar",
  "04": "Abr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dic",
};
export function mapearGestorAlertasHoy(conteoAlertas:any){
  const data: AlertData[] = conteoAlertas.map((item: { mes: string; alertas_atendidas: any; alertas_vencidas: any; alertas_pendientes?: any; }) => {
    const [year, month] = item.mes.split('-');
    return {
      month: month && monthMap[month] ? `${monthMap[month]} ${year}` : item.mes,
      vencidas: Number(item.alertas_vencidas ?? 0),
      atendidas: Number(item.alertas_atendidas ?? 0),
      pendientes: Number(item.alertas_pendientes ?? 0),
    };
  });
  return data
}
export const mapearEmocionGrado = (input: EstadisticaEmocionGrado[]): OutputEstadisticaEmocionGrado[] => {
  const grouped: { [curso_nombre: string]: OutputEstadisticaEmocionGrado } = {};

  input.forEach((item) => {
    const key = item.curso_nombre;

    if (!grouped[key]) {
      grouped[key] = { name: item.curso_nombre };
    }

    grouped[key][item.respuesta_nombre] = item.cantidad;
  });

  return Object.values(grouped);
};
export const mapearPatologiaGrado = (input: EstadisticaPatologiaGrado[]): OutputEstadisticaEmocionGrado[] => {
  const grouped: { [curso_nombre: string]: OutputEstadisticaEmocionGrado } = {};

  input.forEach((item) => {
    const key = item.curso_nombre;

    if (!grouped[key]) {
      grouped[key] = { name: item.curso_nombre };
    }

    grouped[key][item.diagnostico] = item.cantidad;
  });

  return Object.values(grouped);
};
