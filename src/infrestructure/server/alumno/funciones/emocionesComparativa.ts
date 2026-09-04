export function mapEmotionsPromedioAgrupado(
  respuestas: any[] = [],
  emociones: any[] = [],
  alumnoId: string,
  colegioId?: string
) {
  const colegioIdNumber = colegioId === undefined || colegioId === "" ? null : Number(colegioId);
  const alumnoIdNumber = Number(alumnoId);
  const emocionesPorNombre = new Map(
    emociones.map((emocion) => [normalizarDiagnostico(emocion.nombre), emocion.conotacion])
  );
  const colegioFiltrado = respuestas.filter((respuesta) => {
    const respuestaColegioId = Number(respuesta.alumnos?.colegio_id);
    return colegioIdNumber === null || respuestaColegioId === colegioIdNumber;
  });
  const respuestasAlumno = colegioFiltrado.filter(
    (respuesta) => Number(respuesta.alumno_id) === alumnoIdNumber
  );
  const alumnoPorConotacion = contarPorConotacion(respuestasAlumno, emocionesPorNombre);
  const globalPorConotacion = contarPorConotacion(colegioFiltrado, emocionesPorNombre);
  const totalAlumno = sumarConteos(alumnoPorConotacion);
  const totalGlobal = sumarConteos(globalPorConotacion);

  return Array.from(new Set([...alumnoPorConotacion.keys(), ...globalPorConotacion.keys()]))
    .map((nombre) => {
      const cantidadAlumno = alumnoPorConotacion.get(nombre) ?? 0;
      const cantidadGlobal = globalPorConotacion.get(nombre) ?? 0;
      return {
        nombre,
        cantidad_alumno: cantidadAlumno,
        proporcion_alumno: redondearRatio(cantidadAlumno, totalAlumno),
        porcentaje_alumno: redondearPorcentaje(cantidadAlumno, totalAlumno),
        cantidad_global: cantidadGlobal,
        proporcion_global: redondearRatio(cantidadGlobal, totalGlobal),
        porcentaje_global: redondearPorcentaje(cantidadGlobal, totalGlobal),
      };
    })
    .sort((a, b) => b.cantidad_alumno - a.cantidad_alumno || a.nombre.localeCompare(b.nombre));
}

export function mapEmotionsAgrupado(
  respuestas: any[] = [],
  emociones: any[] = [],
  alumnoId: string,
  colegioId?: string
) {
  const colegioIdNumber = colegioId === undefined || colegioId === "" ? null : Number(colegioId);
  const alumnoIdNumber = Number(alumnoId);
  const emocionesPorNombre = new Map(
    emociones.map((emocion) => [normalizarDiagnostico(emocion.nombre), emocion.conotacion])
  );
  const alumnoPorConotacion = contarPorConotacion(
    respuestas.filter((respuesta) => {
      const respuestaColegioId = Number(respuesta.alumnos?.colegio_id);
      return (
        Number(respuesta.alumno_id) === alumnoIdNumber &&
        (colegioIdNumber === null || respuestaColegioId === colegioIdNumber)
      );
    }),
    emocionesPorNombre
  );

  return Array.from(alumnoPorConotacion.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
}

function contarPorConotacion(respuestas: any[], emocionesPorNombre: Map<string, string>): Map<string, number> {
  return respuestas.reduce((conteos, respuesta) => {
    const diagnostico = respuesta.preguntas?.diagnostico;
    const conotacion = emocionesPorNombre.get(normalizarDiagnostico(diagnostico));
    if (!conotacion) {
      return conteos;
    }
    conteos.set(conotacion, (conteos.get(conotacion) ?? 0) + 1);
    return conteos;
  }, new Map<string, number>());
}

function normalizarDiagnostico(valor: string = "") {
  const normalizado = valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^en\s+/, "")
    .replace(/\/rabia$/, "")
    .replace(/\s*\/\s*/g, "/")
    .trim();

  return normalizado === "calma" ? "tranquilidad" : normalizado;
}

function sumarConteos(conteos: Map<string, number>) {
  return Array.from(conteos.values()).reduce((total, cantidad) => total + cantidad, 0);
}

function redondearRatio(cantidad: number, total: number) {
  return total > 0 ? Number((cantidad / total).toFixed(4)) : 0;
}

function redondearPorcentaje(cantidad: number, total: number) {
  return total > 0 ? Number(((cantidad / total) * 100).toFixed(2)) : 0;
}
