 
import { DataService } from "../DataService";
import { AlertaSeveridad } from "../../../core/modelo/alerta/AlertaSeveridad";

const dataService: DataService<AlertaSeveridad> = new DataService("alertas_severidades");

export const AlertaSeveridadesService = {
  async obtener(where: any) {
    const alertaSeveridad = await dataService.getAll(["*"], where);
    return alertaSeveridad;
  },

  async guardar(alertaSeveridadData: AlertaSeveridad) {
    const savedAlertaSeveridad = await dataService.processData(alertaSeveridadData);
    return savedAlertaSeveridad;
  },

  async actualizar(id: number, alertaSeveridadData: AlertaSeveridad) {
    await dataService.updateById(id, alertaSeveridadData);
    return { message: "Alerta severidad actualizada correctamente" };
  },

  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Alerta severidad eliminada correctamente" };
  },
};