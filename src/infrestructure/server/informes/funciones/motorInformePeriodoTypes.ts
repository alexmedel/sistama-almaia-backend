export type ColegioActivo = {
  colegio_id: number;
  nombre: string;
};

export type Periodo = {
  anio: number;
  mes: number;
};

export type PeriodoPendiente = Periodo & {
  alumnosPendientes: boolean;
  generalesPendientes: boolean;
};

export const crearClavePeriodo = (anio: number, mes: number) => `${anio}-${mes}`;

export const formatearPeriodo = (anio: number, mes: number) =>
  `${String(mes).padStart(2, "0")}/${anio}`;

export const chunk = <T>(items: T[], size: number) => {
  const parts: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    parts.push(items.slice(index, index + size));
  }
  return parts;
};

export async function procesarConcurrencia<T>(
  items: T[],
  concurrencia: number,
  handler: (item: T, index: number) => Promise<void>
) {
  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= items.length) {
        return;
      }

      await handler(items[index], index);
    }
  };

  const totalWorkers = Math.min(concurrencia, items.length);
  await Promise.all(Array.from({ length: totalWorkers }, () => worker()));
}
