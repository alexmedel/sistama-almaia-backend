import express from "express";
import { sessionAuth } from "../middleware/supabaseMidleware";
import { DashboardHomeService } from "../infrestructure/server/dashboard/DashboardHomeService";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Home
 *     description: Endpoints para datos del panel de control
 */
/**
 * @swagger
 * /api/v1/home/cards/emociones:
 *   get:
 *     summary: Obtener estadísticas generales del sistema
 *     description: Retorna datos estadísticos sobre alumnos, alertas SOS, denuncias y alertas Alma
 *     tags: [Home]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alumnos:
 *                   type: object
 *                   properties:
 *                     activos:
 *                       type: integer
 *                       example: 637
 *                     inactivos:
 *                       type: integer
 *                       example: 10
 *                     frecuentes:
 *                       type: integer
 *                       example: 510
 *                     totales:
 *                       type: integer
 *                       example: 733
 *                 sos_alma:
 *                   type: object
 *                   properties:
 *                     activos:
 *                       type: integer
 *                       example: 5
 *                     vencidos:
 *                       type: integer
 *                       example: 0
 *                     por_vencer:
 *                       type: integer
 *                       example: 2
 *                     totales:
 *                       type: integer
 *                       example: 13
 *                 denuncias:
 *                   type: object
 *                   properties:
 *                     activos:
 *                       type: integer
 *                       example: 19
 *                     vencidos:
 *                       type: integer
 *                       example: 0
 *                     por_vencer:
 *                       type: integer
 *                       example: 3
 *                     totales:
 *                       type: integer
 *                       example: 24
 *                 alertas_alma:
 *                   type: object
 *                   properties:
 *                     activos:
 *                       type: integer
 *                       example: 57
 *                     vencidos:
 *                       type: integer
 *                       example: 0
 *                     por_vencer:
 *                       type: integer
 *                       example: 6
 *                     totales:
 *                       type: integer
 *                       example: 82
 *             example:
 *               alumnos:
 *                 activos: 637
 *                 inactivos: 10
 *                 frecuentes: 510
 *                 totales: 733
 *               sos_alma:
 *                 activos: 5
 *                 vencidos: 0
 *                 por_vencer: 2
 *                 totales: 13
 *               denuncias:
 *                 activos: 19
 *                 vencidos: 0
 *                 por_vencer: 3
 *                 totales: 24
 *               alertas_alma:
 *                 activos: 57
 *                 vencidos: 0
 *                 por_vencer: 6
 *                 totales: 82
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error al recuperar estadísticas del home"
 */
router.get("/cards/emociones", sessionAuth, DashboardHomeService.getStatsCards);
/**
 * @swagger
 * api/v1/home/barra/emociones:
 *   get:
 *     summary: Obtener datos estadísticos de emociones
 *     description: Retorna un listado de emociones registradas con sus valores cuantitativos y colores asociados
 *     tags: [Home]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Datos de emociones obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Nombre de la emoción
 *                     example: "Tristeza"
 *                   value:
 *                     type: integer
 *                     description: Cantidad de registros para esta emoción
 *                     example: 1500
 *                   color:
 *                     type: string
 *                     description: Código hexadecimal del color asociado a la emoción
 *                     example: "#29B6F6"
 *             example:
 *               - name: "Tristeza"
 *                 value: 1500
 *                 color: "#29B6F6"
 *               - name: "Felicidad"
 *                 value: 3100
 *                 color: "#FFCA28"
 *               - name: "Estrés"
 *                 value: 950
 *                 color: "#757575"
 *               - name: "Ansiedad"
 *                 value: 2600
 *                 color: "#FFA726"
 *               - name: "Enojo"
 *                 value: 750
 *                 color: "#F44336"
 *               - name: "Otros"
 *                 value: 1900
 *                 color: "#BA68C8"
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *         content:
 *           application/json:
 *             example:
 *               error: "Token de autenticación inválido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error al recuperar los datos de emociones"
 */
router.get("/barra/emociones", sessionAuth, DashboardHomeService.getEmotionsData);
/**
 * @swagger
 * /api/v1/home/barra/patologias:
 *   get:
 *     tags: [Home]
 *     summary: Obtiene datos de emociones/patologías para un colegio específico
 *     description: Retorna estadísticas de patologías emocionales detectadas en formato para gráfico de barras
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: colegio_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID del colegio para filtrar los datos
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *         required: false
 *         description: Fecha hasta para filtrar los datos
 *     responses:
 *       200:
 *         description: Datos de patologías emocionales obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Nombre de la patología/trastorno emocional
 *                     example: "Trastorno del Ánimo"
 *                   value:
 *                     type: integer
 *                     description: Cantidad de casos detectados
 *                     example: 6
 *                   color:
 *                     type: string
 *                     description: Código hexadecimal del color para representar en el gráfico
 *                     example: "#fde68a"
 *       400:
 *         description: Parámetro colegio_id faltante o inválido
 *       401:
 *         description: No autorizado (sesión no válida)
 *       500:
 *         description: Error interno del servidor
 */
router.get("/barra/patologias", sessionAuth, DashboardHomeService.getEmotionDataPatologia);
/**
 * @swagger
 * /api/v1/home/barra/neurodivergencias:
 *   get:
 *     tags: [Home]
 *     summary: Obtiene datos de emociones/neurodivergencia para un colegio específico
 *     description: Retorna estadísticas de neurodivergencia emocionales detectadas en formato para gráfico de barras
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: colegio_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID del colegio para filtrar los datos
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *         required: false
 *         description: Fecha hasta para filtrar los datos
 *     responses:
 *       200:
 *         description: Datos de neurodivergencia emocionales obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Nombre de la neurodivergencia/trastorno emocional
 *                     example: "Trastorno del Psicologico"
 *                   value:
 *                     type: integer
 *                     description: Cantidad de casos detectados
 *                     example: 6
 *                   color:
 *                     type: string
 *                     description: Código hexadecimal del color para representar en el gráfico
 *                     example: "#fde68a"
 *       400:
 *         description: Parámetro colegio_id faltante o inválido
 *       401:
 *         description: No autorizado (sesión no válida)
 *       500:
 *         description: Error interno del servidor
 */
router.get("/barra/neurodivergencias", sessionAuth, DashboardHomeService.getEmotionDataNeurodivergencia);
/**
 * @swagger
 * /api/v1/home/emotions/general:
 *   get:
 *     summary: Obtener datos generales de emociones
 *     description: Retorna datos estadísticos generales sobre las emociones registradas
 *     tags: [Home]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: colegio_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID del colegio para filtrar los datos
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *         required: false
 *         description: Fecha hasta para filtrar los datos
 *     responses:
 *       200:
 *         description: Datos generales de emociones obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Emotion'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/emotions/general",
  sessionAuth,
  DashboardHomeService.getEmotionDataGeneral
);
/**
 * @swagger
 * /api/v1/home/alertas/totales:
 *   get:
 *     summary: Obtener datos para gráfico de donut
 *     description: Retorna datos para visualización en gráfico circular (donut chart)
 *     tags: [Home]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Datos para gráfico donut obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DonutData'
 *       500:
 *         description: Error interno del servidor
 */
router.get("/alertas/totales", sessionAuth, DashboardHomeService.getDonutData);
/**
 * @swagger
 * /api/v1/home/fechas/importantes:
 *   get:
 *     summary: Obtener fechas importantes del calendario escolar
 *     description: Retorna un listado completo de fechas relevantes para el home con toda la información relacionada (colegio, curso, calendario escolar)
 *     tags: [Home]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de fechas importantes obtenida correctamente con todos sus datos relacionados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FechaImportanteDetallada'
 *       401:
 *         description: No autorizado, falta autenticación
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FechaImportanteDetallada:
 *       type: object
 *       properties:
 *         calendario_fecha_importante_id:
 *           type: integer
 *           example: 1
 *           description: ID único de la fecha importante
 *         colegio_id:
 *           type: integer
 *           example: 1
 *           description: ID del colegio asociado
 *         curso_id:
 *           type: integer
 *           example: 1
 *           description: ID del curso asociado
 *         calendario_escolar_id:
 *           type: integer
 *           example: 1
 *           description: ID del calendario escolar
 *         titulo:
 *           type: string
 *           example: "Inicio de clases"
 *           description: Título del evento
 *         descripcion:
 *           type: string
 *           example: "Primer día del año escolar"
 *           description: Descripción detallada del evento
 *         fecha:
 *           type: string
 *           format: date-time
 *           example: "2025-02-28T00:00:00"
 *           description: Fecha y hora del evento
 *         tipo:
 *           type: string
 *           example: "académico"
 *           enum: [académico, festivo, receso, conmemoración]
 *           description: Tipo de fecha importante
 *         creado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que creó el registro
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que actualizó por última vez el registro
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T17:36:28.764228"
 *           description: Fecha de creación del registro
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T17:36:28.764228"
 *           description: Fecha de última actualización del registro
 *         activo:
 *           type: boolean
 *           example: true
 *           description: Indica si el registro está activo
 *         colegios:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Colegio Bicentenario Santiago Centro"
 *             colegio_id:
 *               type: integer
 *               example: 1
 *           description: Información básica del colegio asociado
 *         cursos:
 *           type: object
 *           properties:
 *             grados:
 *               type: object
 *               properties:
 *                 nombre:
 *                   type: string
 *                   example: "Quinto Básico"
 *                 grado_id:
 *                   type: integer
 *                   example: 9
 *             nombre_curso:
 *               type: string
 *               example: "1° Medio - Jornada Mañana - Colegio 1"
 *             niveles_educativos:
 *               type: object
 *               properties:
 *                 nombre:
 *                   type: string
 *                   example: "Educación Básica"
 *                 nivel_educativo_id:
 *                   type: integer
 *                   example: 1
 *           description: Información detallada del curso asociado
 *         calendarios_escolares:
 *           type: object
 *           properties:
 *             fecha_fin:
 *               type: string
 *               format: date-time
 *               example: "2025-12-12T00:00:00"
 *             ano_escolar:
 *               type: integer
 *               example: 2025
 *             dias_habiles:
 *               type: integer
 *               example: 190
 *             fecha_inicio:
 *               type: string
 *               format: date-time
 *               example: "2025-02-28T00:00:00"
 *             calendario_escolar_id:
 *               type: integer
 *               example: 1
 *           description: Información del calendario escolar asociado
 */
router.get("/fechas/importantes", sessionAuth, DashboardHomeService.getImportantDates);
/**
 * @swagger
 * /api/v1/home/alertas/recientes:
 *   get:
 *     summary: Obtener alertas recientes
 *     description: Retorna las alertas más recientes registradas en el sistema
 *     tags: [Home]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas recientes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecentAlert'
 *       500:
 *         description: Error interno del servidor
 */
router.get("/alertas/recientes", sessionAuth, DashboardHomeService.getRecentAlerts);
export default router;