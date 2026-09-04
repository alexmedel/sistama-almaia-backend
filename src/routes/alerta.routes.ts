import express from "express";
import { sessionAuth } from "../middleware/supabaseMidleware";
import { AlertaTiposService } from "../infrestructure/server/alertas/AlertaTipoService";
import { MotorInformesService } from "../infrestructure/server/alertas/MotorInformeService";
import { MotorPreguntasService } from "../infrestructure/server/alertas/MotorPreguntaService";
import { AlertaEvidenciasController } from "../infrestructure/server/alertas/controller/AlertaEvidenciasController";
import { AlertaEstadosController } from "../infrestructure/server/alertas/controller/AlertaEstadosController";
import { AlertaOrigenesController } from "../infrestructure/server/alertas/controller/AlertaOrigenesController";
import { AlertaPrioridadsController } from "../infrestructure/server/alertas/controller/AlertaPrioridadsController";
import { AlertaReglasController } from "../infrestructure/server/alertas/controller/AlertaReglasController";
import { AlertaSeveridadesController } from "../infrestructure/server/alertas/controller/AlertaSeveridadesController";
import { MotorAlertasController } from "../infrestructure/server/alertas/controller/MotorAlertasController";
import { MotorInformesController } from "../infrestructure/server/alertas/controller/MotorInformesController";
import { MotorPreguntasController } from "../infrestructure/server/alertas/controller/MotorPreguntasController";

const router = express.Router();

const ruta_alertas_evidencias = "/alertas_evidencias";
const ruta_alertas_origenes = "/alertas_origenes";
const ruta_alertas_prioridades = "/alertas_prioridades";
const ruta_alertas_reglas = "/alertas_reglas";
const ruta_alertas_severidades = "/alertas_severidades";
const ruta_alertas_tipos = "/alertas_tipos";
const ruta_alertas_estado = "/alertas_estado";
const ruta_motores_alertas = "/motores_alertas";
const ruta_motores_informes = "/motores_informes";
const ruta_motores_preguntas = "/motores_preguntas";

/**
 * @swagger
 * tags:
 *   - name: Alertas - Evidencias
 *     description: Endpoints para gestionar evidencias de alertas
 *   - name: Alertas - Orígenes
 *     description: Endpoints para gestionar orígenes de alertas
 *   - name: Alertas - Prioridades
 *     description: Endpoints para gestionar prioridades de alertas
 *   - name: Alertas - Reglas
 *     description: Endpoints para gestionar reglas de alertas
 *   - name: Alertas - Severidades
 *     description: Endpoints para gestionar severidades de alertas
 *   - name: Alertas - Tipos
 *     description: Endpoints para gestionar tipos de alertas
 *   - name: Motores - Alertas
 *     description: Endpoints para gestionar motores de alertas
 *   - name: Motores - Informes
 *     description: Endpoints para gestionar motores de informes
 *   - name: Motores - Preguntas
 *     description: Endpoints para gestionar motores de preguntas
 */

/**
 * @swagger
 * /api/v1/alertas/alertas_evidencias:
 *   get:
 *     summary: Obtener todas las evidencias de alertas
 *     description: Retorna una lista detallada de todas las evidencias de alertas registradas, incluyendo información relacionada de alumnos, tipos de alerta y estados
 *     tags: [Alertas - Evidencias]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de evidencias obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaEvidencia'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 *
 * @swagger
 * components:
 *   schemas:
 *     AlertaEvidencia:
 *       type: object
 *       properties:
 *         alerta_evidencia_id:
 *           type: integer
 *           example: 1
 *         url_evidencia:
 *           type: string
 *           example: "string"
 *         alumno_alerta_id:
 *           type: integer
 *           example: 14
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T23:05:09.438"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T23:05:09.438"
 *         activo:
 *           type: boolean
 *           example: true
 *         alumnos_alertas:
 *           $ref: '#/components/schemas/AlumnoAlerta'
 *
 *     AlumnoAlerta:
 *       type: object
 *       properties:
 *         alumnos:
 *           $ref: '#/components/schemas/AlumnoInfo'
 *         accion_tomada:
 *           type: string
 *           nullable: true
 *           example: null
 *         alertas_tipos:
 *           $ref: '#/components/schemas/AlertaTipo'
 *         alertas_reglas:
 *           $ref: '#/components/schemas/AlertaRegla'
 *         fecha_generada:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T20:13:12.302209"
 *         alertas_origenes:
 *           $ref: '#/components/schemas/AlertaOrigen'
 *         alumno_alerta_id:
 *           type: integer
 *           example: 14
 *         fecha_resolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         alertas_prioridades:
 *           $ref: '#/components/schemas/AlertaPrioridad'
 *         alertas_severidades:
 *           $ref: '#/components/schemas/AlertaSeveridad'
 *
 *     AlumnoInfo:
 *       type: object
 *       properties:
 *         personas:
 *           $ref: '#/components/schemas/PersonaInfo'
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         url_foto_perfil:
 *           type: string
 *           example: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *
 *     PersonaInfo:
 *       type: object
 *       properties:
 *         nombres:
 *           type: string
 *           example: "Carlos"
 *         apellidos:
 *           type: string
 *           example: "Muñoz"
 *         persona_id:
 *           type: integer
 *           example: 2
 *
 *     AlertaTipo:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "SOS Alma"
 *         alerta_tipo_id:
 *           type: integer
 *           example: 1
 *
 *     AlertaRegla:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Regla Tranquilidad Constante"
 *         alerta_regla_id:
 *           type: integer
 *           example: 2
 *
 *     AlertaOrigen:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Alumno"
 *         alerta_origen_id:
 *           type: integer
 *           example: 1
 *
 *     AlertaPrioridad:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Baja"
 *         alerta_prioridad_id:
 *           type: integer
 *           example: 1
 *
 *     AlertaSeveridad:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Baja"
 *         alerta_severidad_id:
 *           type: integer
 *           example: 1
 */
router.get(
  ruta_alertas_evidencias + "/",
  sessionAuth,
  AlertaEvidenciasController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/alertas_evidencias:
 *   post:
 *     summary: Crear una nueva evidencia de alerta
 *     description: Registra una nueva evidencia de alerta en el sistema
 *     tags: [Alertas - Evidencias]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaEvidencia'
 *     responses:
 *       201:
 *         description: Evidencia creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alertas_evidencias + "/",
  sessionAuth,
  AlertaEvidenciasController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_evidencias/{id}:
 *   put:
 *     summary: Actualizar una evidencia de alerta
 *     description: Actualiza los datos de una evidencia de alerta existente
 *     tags: [Alertas - Evidencias]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evidencia a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaEvidencia'
 *     responses:
 *       200:
 *         description: Evidencia actualizada exitosamente
 *       404:
 *         description: Evidencia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_evidencias + "/:id",
  sessionAuth,
  AlertaEvidenciasController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_evidencias/{id}:
 *   delete:
 *     summary: Eliminar una evidencia de alerta
 *     description: Elimina una evidencia de alerta del sistema
 *     tags: [Alertas - Evidencias]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la evidencia a eliminar
 *     responses:
 *       200:
 *         description: Evidencia eliminada exitosamente
 *       404:
 *         description: Evidencia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_evidencias + "/:id",
  sessionAuth,
  AlertaEvidenciasController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_origenes:
 *   get:
 *     summary: Obtener todos los orígenes de alertas
 *     description: Retorna una lista de todos los orígenes de alertas registrados
 *     tags: [Alertas - Orígenes]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de orígenes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaOrigen'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_alertas_origenes + "/",
  sessionAuth,
  AlertaOrigenesController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/alertas_origenes:
 *   post:
 *     summary: Crear un nuevo origen de alerta
 *     description: Registra un nuevo origen de alerta en el sistema
 *     tags: [Alertas - Orígenes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaOrigen'
 *     responses:
 *       201:
 *         description: Origen creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alertas_origenes + "/",
  sessionAuth,
  AlertaOrigenesController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_origenes/{id}:
 *   put:
 *     summary: Actualizar un origen de alerta
 *     description: Actualiza los datos de un origen de alerta existente
 *     tags: [Alertas - Orígenes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del origen a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaOrigen'
 *     responses:
 *       200:
 *         description: Origen actualizado exitosamente
 *       404:
 *         description: Origen no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_origenes + "/:id",
  sessionAuth,
  AlertaOrigenesController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_origenes/{id}:
 *   delete:
 *     summary: Eliminar un origen de alerta
 *     description: Elimina un origen de alerta del sistema
 *     tags: [Alertas - Orígenes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del origen a eliminar
 *     responses:
 *       200:
 *         description: Origen eliminado exitosamente
 *       404:
 *         description: Origen no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_origenes + "/:id",
  sessionAuth,
  AlertaOrigenesController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_prioridades:
 *   get:
 *     summary: Obtener todas las prioridades de alertas
 *     description: Retorna una lista de todas las prioridades de alertas registradas
 *     tags: [Alertas - Prioridades]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de prioridades obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaPrioridad'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_alertas_prioridades + "/",
  sessionAuth,
  AlertaPrioridadsController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/alertas_prioridades:
 *   post:
 *     summary: Crear una nueva prioridad de alerta
 *     description: Registra una nueva prioridad de alerta en el sistema
 *     tags: [Alertas - Prioridades]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaPrioridad'
 *     responses:
 *       201:
 *         description: Prioridad creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alertas_prioridades + "/",
  sessionAuth,
  AlertaPrioridadsController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_prioridades/{id}:
 *   put:
 *     summary: Actualizar una prioridad de alerta
 *     description: Actualiza los datos de una prioridad de alerta existente
 *     tags: [Alertas - Prioridades]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la prioridad a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaPrioridad'
 *     responses:
 *       200:
 *         description: Prioridad actualizada exitosamente
 *       404:
 *         description: Prioridad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_prioridades + "/:id",
  sessionAuth,
  AlertaPrioridadsController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_prioridades/{id}:
 *   delete:
 *     summary: Eliminar una prioridad de alerta
 *     description: Elimina una prioridad de alerta del sistema
 *     tags: [Alertas - Prioridades]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la prioridad a eliminar
 *     responses:
 *       200:
 *         description: Prioridad eliminada exitosamente
 *       404:
 *         description: Prioridad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_prioridades + "/:id",
  sessionAuth,
  AlertaPrioridadsController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_reglas:
 *   get:
 *     summary: Obtener todas las reglas de alertas
 *     description: Retorna una lista de todas las reglas de alertas registradas
 *     tags: [Alertas - Reglas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de reglas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaRegla'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_alertas_reglas + "/",
  sessionAuth,
  AlertaReglasController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/alertas_reglas:
 *   post:
 *     summary: Crear una nueva regla de alerta
 *     description: Registra una nueva regla de alerta en el sistema
 *     tags: [Alertas - Reglas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaRegla'
 *     responses:
 *       201:
 *         description: Regla creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alertas_reglas + "/",
  sessionAuth,
  AlertaReglasController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_reglas/{id}:
 *   put:
 *     summary: Actualizar una regla de alerta
 *     description: Actualiza los datos de una regla de alerta existente
 *     tags: [Alertas - Reglas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la regla a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaRegla'
 *     responses:
 *       200:
 *         description: Regla actualizada exitosamente
 *       404:
 *         description: Regla no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_reglas + "/:id",
  sessionAuth,
  AlertaReglasController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_reglas/{id}:
 *   delete:
 *     summary: Eliminar una regla de alerta
 *     description: Elimina una regla de alerta del sistema
 *     tags: [Alertas - Reglas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la regla a eliminar
 *     responses:
 *       200:
 *         description: Regla eliminada exitosamente
 *       404:
 *         description: Regla no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_reglas + "/:id",
  sessionAuth,
  AlertaReglasController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_severidades:
 *   get:
 *     summary: Obtener todas las severidades de alertas
 *     description: Retorna una lista de todas las severidades de alertas registradas
 *     tags: [Alertas - Severidades]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de severidades obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaSeveridad'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_alertas_severidades + "/",
  sessionAuth,
  AlertaSeveridadesController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/alertas_severidades:
 *   post:
 *     summary: Crear una nueva severidad de alerta
 *     description: Registra una nueva severidad de alerta en el sistema
 *     tags: [Alertas - Severidades]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaSeveridad'
 *     responses:
 *       201:
 *         description: Severidad creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alertas_severidades + "/",
  sessionAuth,
  AlertaSeveridadesController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_severidades/{id}:
 *   put:
 *     summary: Actualizar una severidad de alerta
 *     description: Actualiza los datos de una severidad de alerta existente
 *     tags: [Alertas - Severidades]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la severidad a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaSeveridad'
 *     responses:
 *       200:
 *         description: Severidad actualizada exitosamente
 *       404:
 *         description: Severidad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_severidades + "/:id",
  sessionAuth,
  AlertaSeveridadesController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_severidades/{id}:
 *   delete:
 *     summary: Eliminar una severidad de alerta
 *     description: Elimina una severidad de alerta del sistema
 *     tags: [Alertas - Severidades]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la severidad a eliminar
 *     responses:
 *       200:
 *         description: Severidad eliminada exitosamente
 *       404:
 *         description: Severidad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_severidades + "/:id",
  sessionAuth,
  AlertaSeveridadesController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_tipos:
 *   get:
 *     summary: Obtener todos los tipos de alertas
 *     description: Retorna una lista de todos los tipos de alertas registrados
 *     tags: [Alertas - Tipos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaTipo'
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_alertas_tipos + "/", sessionAuth, AlertaTiposService.obtener);

/**
 * @swagger
 * /api/v1/alertas/alertas_tipos:
 *   post:
 *     summary: Crear un nuevo tipo de alerta
 *     description: Registra un nuevo tipo de alerta en el sistema
 *     tags: [Alertas - Tipos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaTipo'
 *     responses:
 *       201:
 *         description: Tipo creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alertas_tipos + "/", sessionAuth, AlertaTiposService.guardar);

/**
 * @swagger
 * /api/v1/alertas/alertas_tipos/{id}:
 *   put:
 *     summary: Actualizar un tipo de alerta
 *     description: Actualiza los datos de un tipo de alerta existente
 *     tags: [Alertas - Tipos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaTipo'
 *     responses:
 *       200:
 *         description: Tipo actualizado exitosamente
 *       404:
 *         description: Tipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_tipos + "/:id",
  sessionAuth,
  AlertaTiposService.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_tipos/{id}:
 *   delete:
 *     summary: Eliminar un tipo de alerta
 *     description: Elimina un tipo de alerta del sistema
 *     tags: [Alertas - Tipos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo a eliminar
 *     responses:
 *       200:
 *         description: Tipo eliminado exitosamente
 *       404:
 *         description: Tipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_tipos + "/:id",
  sessionAuth,
  AlertaTiposService.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_estado:
 *   get:
 *     summary: Obtener todos los estado de alertas
 *     description: Retorna una lista de todos los estado de alertas registrados
 *     tags: [Alertas - Estado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: alerta_estado_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID del estado a buscar
 *       - in: path
 *         name: nombre_alerta_estado
 *         required: false
 *         schema:
 *           type: string
 *         description: nombre del estado a buscar
 *     responses:
 *       200:
 *         description: Lista de estado obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaEstado'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_alertas_estado + "/",
  sessionAuth,
  AlertaEstadosController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/alertas_estado:
 *   post:
 *     summary: Crear un nuevo estado de alerta
 *     description: Registra un nuevo estado de alerta en el sistema
 *     tags: [Alertas - Estado]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaEstado'
 *           example:
 *             nombre_alerta_estado: "Pendiente"
 *     responses:
 *       201:
 *         description: Estado creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alertas_estado + "/",
  sessionAuth,
  AlertaEstadosController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_estado/{id}:
 *   put:
 *     summary: Actualizar un estado de alerta
 *     description: Actualiza los datos de un estado de alerta existente
 *     tags: [Alertas - Estado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estado a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertaEstado'
 *           example:
 *             nombre_alerta_estado: "Pendiente"
 *             activo: true
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Estado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alertas_estado + "/:id",
  sessionAuth,
  AlertaEstadosController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/alertas_estado/{id}:
 *   delete:
 *     summary: Eliminar un estado de alerta
 *     description: Elimina un estado de alerta del sistema
 *     tags: [Alertas - Estado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estado a eliminar
 *     responses:
 *       200:
 *         description: Estado eliminado exitosamente
 *       404:
 *         description: Estado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alertas_estado + "/:id",
  sessionAuth,
  AlertaEstadosController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/motores_alertas:
 *   get:
 *     summary: Obtener todos los motores de alertas
 *     description: Retorna una lista de todos los motores de alertas registrados
 *     tags: [Motores - Alertas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de motores obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MotorAlerta'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_motores_alertas + "/",
  sessionAuth,
  MotorAlertasController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/motores_alertas:
 *   post:
 *     summary: Crear un nuevo motor de alerta
 *     description: Registra un nuevo motor de alerta en el sistema
 *     tags: [Motores - Alertas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorAlerta'
 *     responses:
 *       201:
 *         description: Motor creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_motores_alertas + "/",
  sessionAuth,
  MotorAlertasController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/motores_alertas/{id}:
 *   put:
 *     summary: Actualizar un motor de alerta
 *     description: Actualiza los datos de un motor de alerta existente
 *     tags: [Motores - Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del motor a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorAlerta'
 *     responses:
 *       200:
 *         description: Motor actualizado exitosamente
 *       404:
 *         description: Motor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_motores_alertas + "/:id",
  sessionAuth,
  MotorAlertasController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/motores_alertas/{id}:
 *   delete:
 *     summary: Eliminar un motor de alerta
 *     description: Elimina un motor de alerta del sistema
 *     tags: [Motores - Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del motor a eliminar
 *     responses:
 *       200:
 *         description: Motor eliminado exitosamente
 *       404:
 *         description: Motor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_motores_alertas + "/:id",
  sessionAuth,
  MotorAlertasController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/motores_informes:
 *   get:
 *     summary: Obtener todos los motores de informes
 *     description: Retorna una lista de todos los motores de informes registrados
 *     tags: [Motores - Informes]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de motores obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MotorInforme'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_motores_informes + "/",
  sessionAuth,
  MotorInformesController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/motores_informes:
 *   post:
 *     summary: Crear un nuevo motor de informe
 *     description: Registra un nuevo motor de informe en el sistema
 *     tags: [Motores - Informes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorInforme'
 *     responses:
 *       201:
 *         description: Motor creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_motores_informes + "/",
  sessionAuth,
  MotorInformesController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/motores_informes/{id}:
 *   put:
 *     summary: Actualizar un motor de informe
 *     description: Actualiza los datos de un motor de informe existente
 *     tags: [Motores - Informes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del motor a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorInforme'
 *     responses:
 *       200:
 *         description: Motor actualizado exitosamente
 *       404:
 *         description: Motor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_motores_informes + "/:id",
  sessionAuth,
  MotorInformesController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/motores_informes/{id}:
 *   delete:
 *     summary: Eliminar un motor de informe
 *     description: Elimina un motor de informe del sistema
 *     tags: [Motores - Informes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del motor a eliminar
 *     responses:
 *       200:
 *         description: Motor eliminado exitosamente
 *       404:
 *         description: Motor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_motores_informes + "/:id",
  sessionAuth,
  MotorInformesController.eliminar
);

/**
 * @swagger
 * /api/v1/alertas/motores_preguntas:
 *   get:
 *     summary: Obtener todos los motores de preguntas
 *     description: Retorna una lista de todos los motores de preguntas registrados
 *     tags: [Motores - Preguntas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de motores obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MotorPregunta'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_motores_preguntas + "/",
  sessionAuth,
  MotorPreguntasController.obtener
);

/**
 * @swagger
 * /api/v1/alertas/motores_preguntas:
 *   post:
 *     summary: Crear un nuevo motor de pregunta
 *     description: Registra un nuevo motor de pregunta en el sistema
 *     tags: [Motores - Preguntas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorPregunta'
 *     responses:
 *       201:
 *         description: Motor creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_motores_preguntas + "/",
  sessionAuth,
  MotorPreguntasController.guardar
);

/**
 * @swagger
 * /api/v1/alertas/motores_preguntas/{id}:
 *   put:
 *     summary: Actualizar un motor de pregunta
 *     description: Actualiza los datos de un motor de pregunta existente
 *     tags: [Motores - Preguntas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del motor a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorPregunta'
 *     responses:
 *       200:
 *         description: Motor actualizado exitosamente
 *       404:
 *         description: Motor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_motores_preguntas + "/:id",
  sessionAuth,
  MotorPreguntasController.actualizar
);

/**
 * @swagger
 * /api/v1/alertas/motores_preguntas/{id}:
 *   delete:
 *     summary: Eliminar un motor de pregunta
 *     description: Elimina un motor de pregunta del sistema
 *     tags: [Motores - Preguntas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del motor a eliminar
 *     responses:
 *       200:
 *         description: Motor eliminado exitosamente
 *       404:
 *         description: Motor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_motores_preguntas + "/:id",
  sessionAuth,
  MotorPreguntasController.eliminar
);

/**
 * @swagger
 * components:
 *   schemas:
 *     AlertaEvidencia:
 *       type: object
 *       properties:
 *         url_evidencia:
 *           type: string
 *           description: URL de la evidencia
 *         alumno_alerta_id:
 *           type: integer
 *           description: ID de la alerta del alumno asociada
 *       required:
 *         - url_evidencia
 *         - alumno_alerta_id
 *
 *     AlertaOrigen:
 *       type: object
 *       properties:
 *         alerta_origen_id:
 *           type: integer
 *           description: ID único del origen
 *         nombre:
 *           type: string
 *           description: Nombre del origen
 *       required:
 *         - nombre
 *
 *     AlertaPrioridad:
 *       type: object
 *       properties:
 *         alerta_prioridad_id:
 *           type: integer
 *           description: ID único de la prioridad
 *         nombre:
 *           type: string
 *           description: Nombre de la prioridad
 *       required:
 *         - nombre
 *
 *     AlertaRegla:
 *       type: object
 *       properties:
 *         alerta_regla_id:
 *           type: integer
 *           description: ID único de la regla
 *         nombre:
 *           type: string
 *           description: Nombre de la regla
 *         tipo_emocion:
 *           type: string
 *           description: Tipo de emoción asociada a la regla
 *         umbral:
 *           type: string
 *           description: Umbral para activar la regla
 *         descripcion:
 *           type: string
 *           description: Descripción de la regla
 *       required:
 *         - nombre
 *         - tipo_emocion
 *         - umbral
 *
 *     AlertaSeveridad:
 *       type: object
 *       properties:
 *         alerta_severidad_id:
 *           type: integer
 *           description: ID único de la severidad
 *         nombre:
 *           type: string
 *           description: Nombre de la severidad
 *       required:
 *         - nombre
 *
 *     AlertaTipo:
 *       type: object
 *       properties:
 *         alerta_tipo_id:
 *           type: integer
 *           description: ID único del tipo
 *         nombre:
 *           type: string
 *           description: Nombre del tipo
 *       required:
 *         - nombre
 *
 *     AlertaEstado:
 *       type: object
 *       properties:
 *         alerta_estado_id:
 *           type: integer
 *           description: ID único del estado
 *         nombre_alerta_estado:
 *           type: string
 *           description: Nombre del estado
 *         activo:
 *           type: boolean
 *           description: Estatus del estado
 *       required:
 *         - nombre_alerta_estado
 *
 *     MotorAlerta:
 *       type: object
 *       properties:
 *         motor_alerta_id:
 *           type: integer
 *           description: ID único del motor
 *         hr_ejecucion:
 *           type: string
 *           description: Hora de ejecución del motor
 *         tipo:
 *           type: string
 *           description: Tipo de motor
 *       required:
 *         - hr_ejecucion
 *         - tipo
 *
 *     MotorInforme:
 *       type: object
 *       properties:
 *         motor_informe_id:
 *           type: integer
 *           description: ID único del motor
 *         freq_meses:
 *           type: integer
 *           description: Frecuencia en meses de ejecución
 *         dia_ejecucion:
 *           type: integer
 *           description: Día de ejecución del motor
 *       required:
 *         - freq_meses
 *         - dia_ejecucion
 *
 *     MotorPregunta:
 *       type: object
 *       properties:
 *         motor_pregunta_id:
 *           type: integer
 *           description: ID único del motor
 *         dia_ejecucion:
 *           type: string
 *           format: date
 *           description: Fecha de ejecución del motor
 *       required:
 *         - dia_ejecucion
 *
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session
 */
export default router;
