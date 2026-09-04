 
import { DataService } from "../DataService";
import { AlertaPrioridad } from "../../../core/modelo/alerta/AlertaPrioridad";

const dataService: DataService<AlertaPrioridad> = new DataService(
  "alertas_prioridades"
);

export const AlertaPrioridadsService = {
  async obtener(where: any) {
    const alertaPrioridad = await dataService.getAll(["*"], where , "alerta_prioridad_id");
    return alertaPrioridad;
  },
  
  async guardar(alertaPrioridadData: AlertaPrioridad) {
    const savedAlertaPrioridad = await dataService.processData(
      alertaPrioridadData
    );
    return savedAlertaPrioridad;
  },
  
  async actualizar(id: number, alertaPrioridadData: AlertaPrioridad) {
    await dataService.updateById(id, alertaPrioridadData);
    return { message: "Alerta prioridad actualizada correctamente" };
  },
  
  async eliminar(id: number) {
    await dataService.deleteById(id);
    return { message: "Alerta prioridad eliminada correctamente" };
  },
};