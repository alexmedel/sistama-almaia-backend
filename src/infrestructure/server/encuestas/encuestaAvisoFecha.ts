export function buildEncuestaAvisoFechaProgramacion(programacion: {
  fecha_inicio: string;
  hora_ejecucion: string;
}) {
  const fecha = String(programacion.fecha_inicio).split("T")[0];
  const hora = String(programacion.hora_ejecucion || "00:00:00").split(".")[0];

  return `${fecha}T${hora}.000`;
}
