import cron from "node-cron";
import { MotorAlertasService } from "../server/alertas/MotorAlertaService";
import { PreguntaService } from "../server/preguntas/PreguntaService";
import { SupabaseClientService } from "../../core/services/supabaseClient";
import { AvisosService } from "../server/avisosApps/MotorAvisoService";
import { MotorInformeService } from "../server/informes/MotorInformeService";

const supabaseService = new SupabaseClientService();
const client = supabaseService.getClient();

console.log(
  `Zona horaria actual: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
);
console.log(`Fecha y hora actual: ${new Date().toLocaleString()}`);

cron.schedule("0 0 * * *", () => {
  // PreguntaService.motor_pregunta();
});

cron.schedule("0 5 * * 1-6", () => {
  console.log("Ejecutando tarea programada a las 2 AM hora Chile");
  MotorAlertasService.ejecutarMotor();
});

cron.schedule("*/30 * * * 1-6", () => {
  console.log("Ejecución cada 30 min (Motor de Preguntas)");
  PreguntaService.motor_pregunta();
});

// Temporal para pruebas: ejecutar informes todos los días a las 19:43
cron.schedule("43 19 * * *", async () => {
  console.log(
    "--- Iniciando la ejecución programada de informes y documentos ---"
  );
  console.log(`Fecha de ejecución: ${new Date().toLocaleString()}`);

  await MotorInformeService.insertarAuditoria(
    "Inicio del proceso programado de llenado de tablas de informes",
    "motor_informes",
    "inicio_proceso"
  );

  await MotorInformeService.insertarAuditoria(
    "Inicio de ejecución del motor de informes por período",
    "motor_informes",
    "inicio_motor"
  );

  await MotorInformeService.ejecutarMotor();

  await MotorInformeService.insertarAuditoria(
    "Fin de ejecución del motor de informes por período",
    "motor_informes",
    "fin_motor"
  );

  await MotorInformeService.insertarAuditoria(
    "Proceso programado de llenado de tablas de informes completado",
    "motor_informes",
    "fin_proceso"
  );

  await MotorInformeService.insertarAuditoria(
    "Inicio de generación de informes PDF de alumnos",
    "motor_informes",
    "inicio_alumnos"
  );
  console.log("--- Iniciando generación PDF de alumnos ---");
  const inicioAlumnos = Date.now();
  await MotorInformeService.generarInformeAlumnos();
  const finAlumnos = Date.now();
  console.log(
    `--- Generación PDF de alumnos completada en ${
      (finAlumnos - inicioAlumnos) / 1000
    } segundos ---`
  );
  await MotorInformeService.insertarAuditoria(
    "Generación de informes PDF de alumnos completada",
    "motor_informes",
    "fin_alumnos"
  );

  const tipos: { tipo: 2 | 3 | 4; nombre: string }[] = [
    { tipo: 2, nombre: "Grados" },
    { tipo: 3, nombre: "Cursos" },
    { tipo: 4, nombre: "Colegios" },
  ];

  for (const { tipo, nombre } of tipos) {
    await MotorInformeService.insertarAuditoria(
      `Inicio de generación de informes PDF de ${nombre}`,
      "motor_informes",
      `inicio_${nombre.toLowerCase()}`
    );
    console.log(`--- Iniciando generación PDF de ${nombre} ---`);
    const inicioTipo = Date.now();
    await MotorInformeService.generarInformeGenerales(tipo);
    const finTipo = Date.now();
    console.log(
      `--- Generación PDF de ${nombre} completada en ${
        (finTipo - inicioTipo) / 1000
      } segundos ---`
    );
    await MotorInformeService.insertarAuditoria(
      `Generación de informes PDF de ${nombre} completada`,
      "motor_informes",
      `fin_${nombre.toLowerCase()}`
    );
  }

  try {
    console.log("--- Iniciando generación de avisos de informes ---");
    await AvisosService.generarAvisosInformesApoderados();
    console.log("--- Generación de avisos de informes completada ---");
    await MotorInformeService.insertarAuditoria(
      "Avisos de informes disponibles generados",
      "motor_informes",
      "avisos_generados"
    );
  } catch (error) {
    console.error("Error generando avisos de informes:", error);
  }

  console.log("--- Ejecución programada finalizada ---");
});

cron.schedule("*/30 7-19 * * *", async () => {
  console.log("[CRON] Envío de avisos programados (cada 30 min)...");
  await AvisosService.enviarAvisosProgramados();
});

cron.schedule("0 2 * * *", async () => {
  console.log("Ejecutando generación de respuestas desde eventos...");
  try {
    await PreguntaService.generar_respuestas_desde_eventos();
    console.log("Generación de respuestas desde eventos completada.");
  } catch (error) {
    console.error("Error ejecutando generar_respuestas_desde_eventos:", error);
  }
});

cron.schedule("0 8 * * *", async () => {
  console.log("Ejecutando generación de avisos de inactividad por colegios...");
  try {
    await AvisosService.generarAvisosInactividadPorColegios();
    console.log("Generación de avisos de inactividad completada.");
  } catch (error) {
    console.error("Error ejecutando generarAvisosInactividadPorColegios:", error);
  }
});

void client;
