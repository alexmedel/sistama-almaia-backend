import { DataService } from "../DataService";
import { AlertaOrigen } from "../../../core/modelo/alerta/AlertaOrigen";

const dataService: DataService<AlertaOrigen> = new DataService(
  "alertas_origenes"
);

export const AlertaOrigenesService = {
  async obtener() {
    const origenesAlertas = [
      {
        alerta_origen_id: 1,
        nombre: "Asistencia",
      },
      {
        alerta_origen_id: 2,
        nombre: "Rendimiento académico",
      },
      {
        alerta_origen_id: 3,
        nombre: "Conducta",
      },
      {
        alerta_origen_id: 4,
        nombre: "Tareas no entregadas",
      },
      {
        alerta_origen_id: 5,
        nombre: "Problemas de salud",
      },
      {
        alerta_origen_id: 6,
        nombre: "Situación familiar",
      },
      {
        alerta_origen_id: 7,
        nombre: "Uso de plataforma",
      },
      {
        alerta_origen_id: 8,
        nombre: "Otros",
      },
    ];
    return origenesAlertas;
  },
  
  async guardar(alertaOrigenData: AlertaOrigen) {
    return await dataService.processData(alertaOrigenData);
  },
  
  async actualizar(id: number, alertaOrigenData: AlertaOrigen) {
    await dataService.updateById(id, alertaOrigenData);
    return alertaOrigenData;
  },
  
  async eliminar(id: number) {
    await dataService.deleteById(id);
    return {
      message: "Alerta origen eliminada correctamente",
    };
  },
};