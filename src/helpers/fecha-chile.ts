const TZ_COLEGIO = "America/Santiago";

/** Fecha de hoy (YYYY-MM-DD) en hora de Chile. */
export function hoyEnChile(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_COLEGIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // en-CA devuelve YYYY-MM-DD
}