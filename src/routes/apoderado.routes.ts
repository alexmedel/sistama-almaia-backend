import express from "express";
import { sessionAuth } from "../middleware/supabaseMidleware";
const router = express.Router();

import { ApoderadoDireccionService } from "../infrestructure/server/apoderado/ApoderadoDireccionService";

import { ApoderadoController } from "../infrestructure/server/apoderado/controller/ApoderadoController";
import { ApoderadoRespuestaController } from "../infrestructure/server/apoderado/controller/ApoderadoRespuestaController";
import { AlumnoApoderadoController } from "../infrestructure/server/apoderado/controller/AlumnoApoderadoController";
import 
{ConfiguracionAsistidaApoderadoAlumnosController}
from '../core/controller/configuracion-alumno-evalucion-asistida/configuracion-asistida-apoderado-alumnos.controller';

const ruta_apoderados = "/apoderados";
const ruta_alumnos_apoderados = "/alumnos_apoderados";
const ruta_apoderados_direcciones = "/apoderados_direcciones";
const ruta_apoderados_respuestas = "/apoderados_respuestas";

const controller = new ConfiguracionAsistidaApoderadoAlumnosController();

/**
 * @swagger
 * tags:
 *   - name: Apoderados
 *     description: Gestión de datos de apoderados
 *   - name: Relaciones Alumno-Apoderado
 *     description: Gestión de relaciones entre alumnos y apoderados
 *   - name: Direcciones de Apoderados
 *     description: Gestión de direcciones de apoderados
 *   - name: ApoderadoRespuestas
 *     description: Gestión de respuestas de apoderados
 */

/**
 * @swagger
 * /api/v1/apoderados/apoderados:
 *   get:
 *     summary: Obtener lista de apoderados
 *     description: Retorna todos los apoderados registrados en el sistema
 *     tags: [Apoderados]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de apoderados obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Apoderado'
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_apoderados + "/", sessionAuth, ApoderadoController.obtener);

router.get("/perfil", sessionAuth, ApoderadoController.obtenerPerfil);

/**
 * @swagger
 * /api/v1/apoderados/responder_preguntas:
 *   post:
 *     tags: [Apoderado]
 *     summary: Permite a un apoderado responder una pregunta
 *     description: Actualiza la respuesta de un apoderado a una pregunta específica para un alumno
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alumno_id
 *               - apoderado_id
 *               - pregunta_id
 *               - respuesta_posible_id
 *             properties:
 *               alumno_id:
 *                 type: integer
 *                 description: ID del alumno relacionado
 *               apoderado_id:
 *                 type: integer
 *                 description: ID del apoderado que responde
 *               pregunta_id:
 *                 type: integer
 *                 description: ID de la pregunta a responder
 *               respuesta_posible_id:
 *                 type: integer
 *                 description: ID de la respuesta seleccionada
 *     responses:
 *       200:
 *         description: Respuesta actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Respuesta actualizada correctamente."
 *       400:
 *         description: Faltan datos obligatorios o son inválidos
 *       500:
 *         description: Error interno del servidor al actualizar la respuesta
 */

router.post(
  "/responder_preguntas",
  sessionAuth,
  ApoderadoController.responderPreguntas
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados:
 *   post:
 *     summary: Crear un nuevo apoderado
 *     description: Registra un nuevo apoderado en el sistema
 *     tags: [Apoderados]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apoderado'
 *     responses:
 *       201:
 *         description: Apoderado creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Apoderado'
 *       400:
 *         description: Datos inválidos para crear el apoderado
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_apoderados + "/", sessionAuth, ApoderadoController.guardar);

/**
 * @swagger
 * /api/v1/apoderados/apoderados/{id}:
 *   put:
 *     summary: Actualizar datos de apoderado
 *     description: Actualiza la información de un apoderado existente
 *     tags: [Apoderados]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del apoderado a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apoderado'
 *     responses:
 *       200:
 *         description: Apoderado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Apoderado'
 *       404:
 *         description: Apoderado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_apoderados + "/:id",
  sessionAuth,
  ApoderadoController.actualizar
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados/{id}:
 *   delete:
 *     summary: Eliminar apoderado
 *     description: Elimina un apoderado del sistema
 *     tags: [Apoderados]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del apoderado a eliminar
 *     responses:
 *       204:
 *         description: Apoderado eliminado exitosamente
 *       404:
 *         description: Apoderado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_apoderados + "/:id",
  sessionAuth,
  ApoderadoController.eliminar
);

/**
 * @swagger
 * /api/v1/apoderados/alumnos_apoderados:
 *   get:
 *     summary: Obtener relaciones alumno-apoderado
 *     description: Retorna todas las relaciones entre alumnos y apoderados registradas
 *     tags: [Relaciones Alumno-Apoderado]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de relaciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoApoderado'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_alumnos_apoderados + "/",
  sessionAuth,
  AlumnoApoderadoController.obtener
);

/**
 * @swagger
 * /api/v1/apoderados/alumnos_apoderados:
 *   post:
 *     summary: Crear nueva relación alumno-apoderado
 *     description: Registra una nueva relación entre un alumno y un apoderado
 *     tags: [Relaciones Alumno-Apoderado]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoApoderado'
 *     responses:
 *       201:
 *         description: Relación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoApoderado'
 *       400:
 *         description: Datos inválidos para crear la relación
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_alumnos_apoderados + "/",
  sessionAuth,
  AlumnoApoderadoController.guardar
);

/**
 * @swagger
 * /api/v1/apoderados/alumnos_apoderados/{id}:
 *   put:
 *     summary: Actualizar relación alumno-apoderado
 *     description: Actualiza una relación alumno-apoderado existente
 *     tags: [Relaciones Alumno-Apoderado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoApoderado'
 *     responses:
 *       200:
 *         description: Relación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoApoderado'
 *       404:
 *         description: Relación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_alumnos_apoderados + "/:id",
  sessionAuth,
  AlumnoApoderadoController.actualizar
);

/**
 * @swagger
 * /api/v1/apoderados/alumnos_apoderados/{id}:
 *   delete:
 *     summary: Eliminar relación alumno-apoderado
 *     description: Elimina una relación alumno-apoderado del sistema
 *     tags: [Relaciones Alumno-Apoderado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación a eliminar
 *     responses:
 *       204:
 *         description: Relación eliminada exitosamente
 *       404:
 *         description: Relación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_alumnos_apoderados + "/:id",
  sessionAuth,
  AlumnoApoderadoController.eliminar
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados_direcciones:
 *   get:
 *     summary: Obtener direcciones de apoderados
 *     description: Retorna todas las direcciones registradas para apoderados
 *     tags: [Direcciones de Apoderados]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de direcciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApoderadoDireccion'
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  ruta_apoderados_direcciones + "/",
  sessionAuth,
  ApoderadoDireccionService.obtener
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados_direcciones:
 *   post:
 *     summary: Crear dirección de apoderado
 *     description: Registra una nueva dirección para un apoderado
 *     tags: [Direcciones de Apoderados]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApoderadoDireccion'
 *     responses:
 *       201:
 *         description: Dirección creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApoderadoDireccion'
 *       400:
 *         description: Datos inválidos para crear la dirección
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_apoderados_direcciones + "/",
  sessionAuth,
  ApoderadoDireccionService.guardar
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados_direcciones/{id}:
 *   put:
 *     summary: Actualizar dirección de apoderado
 *     description: Actualiza una dirección existente de un apoderado
 *     tags: [Direcciones de Apoderados]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la dirección a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApoderadoDireccion'
 *     responses:
 *       200:
 *         description: Dirección actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApoderadoDireccion'
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_apoderados_direcciones + "/:id",
  sessionAuth,
  ApoderadoDireccionService.actualizar
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados_direcciones/{id}:
 *   delete:
 *     summary: Eliminar dirección de apoderado
 *     description: Elimina una dirección de apoderado del sistema
 *     tags: [Direcciones de Apoderados]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la dirección a eliminar
 *     responses:
 *       204:
 *         description: Dirección eliminada exitosamente
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_apoderados_direcciones + "/:id",
  sessionAuth,
  ApoderadoDireccionService.eliminar
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ApoderadoRespuesta:
 *       type: object
 *       properties:
 *         apoderado_respuesta_id:
 *           type: integer
 *           description: ID único de la respuesta
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno relacionado
 *         apoderado_id:
 *           type: integer
 *           description: ID del apoderado que responde
 *         pregunta_id:
 *           type: integer
 *           description: ID de la pregunta respondida
 *         respuesta_id:
 *           type: string
 *           nullable: true
 *           description: ID de la respuesta seleccionada (si aplica)
 *         texto_respuesta:
 *           type: string
 *           description: Texto de la respuesta
 *         estado_respuesta:
 *           type: string
 *           description: Estado de la respuesta (ej. "completado", "pendiente")
 *         alumnos:
 *           type: object
 *           properties:
 *             alumno_id:
 *               type: integer
 *             url_foto_perfil:
 *               type: string
 *             personas:
 *               type: object
 *               properties:
 *                 persona_id:
 *                   type: integer
 *                 nombres:
 *                   type: string
 *                 apellidos:
 *                   type: string
 *         preguntas:
 *           type: object
 *           properties:
 *             pregunta_id:
 *               type: integer
 *             nombre:
 *               type: string
 *             respuestas_posibles:
 *               type: object
 *               properties:
 *                 respuesta_posible_id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *         apoderados:
 *           type: object
 *           properties:
 *             apoderado_id:
 *               type: integer
 *             personas:
 *               type: object
 *               properties:
 *                 persona_id:
 *                   type: integer
 *                 nombres:
 *                   type: string
 *                 apellidos:
 *                   type: string
 *             telefono_contacto1:
 *               type: string
 *             telefono_contacto2:
 *               type: string
 *             email_contacto1:
 *               type: string
 *             email_contacto2:
 *               type: string
 *         respuestas_posibles:
 *           type: object
 *           properties:
 *             respuesta_posible_id:
 *               type: integer
 *             nombre:
 *               type: string
 */

/**
 * @swagger
 * /api/v1/apoderados/apoderados_respuestas:
 *   get:
 *     summary: Obtiene todas las respuestas de apoderados
 *     description: Retorna una lista de respuestas de apoderados con información relacionada de alumnos, preguntas y apoderados
 *     tags: [ApoderadoRespuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de alumno
 *       - in: query
 *         name: apoderado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de apoderado
 *       - in: query
 *         name: pregunta_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de pregunta
 *       - in: query
 *         name: estado_respuesta
 *         schema:
 *           type: string
 *         description: Filtrar por estado de respuesta
 *     responses:
 *       200:
 *         description: Lista de respuestas de apoderados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApoderadoRespuesta'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error interno del servidor
 */
router.get(
  ruta_apoderados_respuestas + "/",
  sessionAuth,
  ApoderadoRespuestaController.obtener
);
/**
 * @swagger
 * /api/v1/apoderados/apoderados_respuestas:
 *   post:
 *     summary: Crea una nueva respuesta de apoderado
 *     description: Guarda una nueva respuesta de apoderado en el sistema
 *     tags: [ApoderadoRespuestas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pregunta_id
 *               - apoderado_id
 *               - alumno_id
 *               - estado_respuesta
 *             properties:
 *               pregunta_id:
 *                 type: integer
 *                 description: ID de la pregunta respondida
 *               respuesta_posible_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID de la respuesta posible seleccionada (opcional)
 *               apoderado_id:
 *                 type: integer
 *                 description: ID del apoderado que responde
 *               alumno_id:
 *                 type: integer
 *                 description: ID del alumno relacionado
 *               texto_respuesta:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 description: Texto de la respuesta (opcional, máximo 50 caracteres)
 *               estado_respuesta:
 *                 type: string
 *                 maxLength: 20
 *                 description: Estado de la respuesta (ej. "completado", "pendiente")
 *     responses:
 *       201:
 *         description: Respuesta de apoderado creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApoderadoRespuesta'
 *       400:
 *         description: Datos de entrada inválidos o faltan campos requeridos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "pregunta_id es requerido"
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  ruta_apoderados_respuestas + "/:id",
  sessionAuth,
  ApoderadoRespuestaController.guardar
);
/**
 * @swagger
 * /api/v1/apoderados/apoderados_respuestas/{id}:
 *   put:
 *     summary: Actualiza una respuesta de apoderado existente
 *     description: Modifica los datos de una respuesta de apoderado
 *     tags: [ApoderadoRespuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la respuesta de apoderado a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pregunta_id:
 *                 type: integer
 *                 description: ID de la pregunta respondida
 *               respuesta_posible_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID de la respuesta posible seleccionada (opcional)
 *               apoderado_id:
 *                 type: integer
 *                 description: ID del apoderado que responde
 *               alumno_id:
 *                 type: integer
 *                 description: ID del alumno relacionado
 *               texto_respuesta:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 description: Texto de la respuesta (opcional, máximo 50 caracteres)
 *               estado_respuesta:
 *                 type: string
 *                 maxLength: 20
 *                 description: Estado de la respuesta (ej. "completado", "pendiente")
 *     responses:
 *       200:
 *         description: Respuesta de apoderado actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApoderadoRespuesta'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "texto_respuesta excede el máximo de 50 caracteres"
 *       404:
 *         description: Respuesta de apoderado no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  ruta_apoderados_respuestas + "/:id",
  sessionAuth,
  ApoderadoRespuestaController.actualizar
);
/**
 * @swagger
 * /api/v1/apoderados/apoderados_respuestas/{id}:
 *   delete:
 *     summary: Elimina una respuesta de apoderado
 *     description: Elimina permanentemente una respuesta de apoderado del sistema
 *     tags: [ApoderadoRespuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la respuesta de apoderado a eliminar
 *     responses:
 *       204:
 *         description: Respuesta de apoderado eliminada exitosamente
 *       404:
 *         description: Respuesta de apoderado no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  ruta_apoderados_respuestas + "/:id",
  sessionAuth,
  ApoderadoRespuestaController.eliminar
);

/**
 * @swagger
 * /api/v1/apoderados/apoderados_respuestas/responder_preguntas/:
 *   put:
 *     summary: Registrar las distintas respuestas, ya sean de seleccion o respuesta abierta del apoderado
 *     description: Permite que un apoderado registre sus respuestas para una pregunta (preguntas de selección unica, múltiple o respuesta abierta)
 *     tags:
 *       - Respuestas de apoderados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_registro
 *               - tipo_pregunta_id
 *               - respuesta_posible_id
 *               - respuestas_posibles
 *             properties:
 *               id_registro:
 *                 type: integer
 *                 description: ID del registro de la pregunta a responder
 *                 example: 123
 *               respuesta_posible_id:
 *                 type: integer
 *                 description: ID del registro de la respuesta posible a responder
 *                 example: 123
 *               tipo_pregunta_id:
 *                 type: integer
 *                 description: ID del tipo de pregunta
 *                 example: 456
 *               respuestas_posibles:
 *                 type: array
 *                 description: Array de IDs de respuestas seleccionadas
 *                 items:
 *                   type: object
 *                   properties:
 *                    respuesta_posible_id:
 *                    type: integer
 *                    description: ID de la respuesta posible seleccionada
 *                 example: [
 *                    { "respuesta_posible_id": 789 },
 *                    { "respuesta_posible_id": 790 },
 *                    { "respuesta_posible_id": 791 }
 *                  ]
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Respuestas procesadas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Respuestas procesadas correctamente."
 *       400:
 *         description: Datos inválidos o incompletos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Datos inválidos o incompletos."
 *       401:
 *         description: No autorizado - Token inválido
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error interno del servidor"
 */
router.put(
  ruta_apoderados_respuestas + "/responder_preguntas/",
  sessionAuth,
  ApoderadoRespuestaController.responderpregunta
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Apoderado:
 *       type: object
 *       properties:
 *         apoderado_id:
 *           type: integer
 *           description: ID único del apoderado
 *         persona_id:
 *           type: integer
 *           description: ID de la persona asociada
 *         colegio_id:
 *           type: integer
 *           description: ID del colegio asociado
 *         telefono_contacto1:
 *           type: string
 *           description: Teléfono de contacto principal
 *         telefono_contacto2:
 *           type: string
 *           description: Teléfono de contacto secundario
 *         email_contacto1:
 *           type: string
 *           description: Email de contacto principal
 *         email_contacto2:
 *           type: string
 *           description: Email de contacto secundario
 *         profesion_id:
 *           type: integer
 *           description: ID de la profesión del apoderado
 *         tipo_oficio_id:
 *           type: integer
 *           description: ID del tipo de oficio del apoderado
 *       required:
 *         - persona_id
 *         - colegio_id
 *         - telefono_contacto1
 *         - email_contacto1
 *
 *     AlumnoApoderado:
 *       type: object
 *       properties:
 *         alumno_apoderado_id:
 *           type: integer
 *           description: ID único de la relación
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno
 *         apoderado_id:
 *           type: integer
 *           description: ID del apoderado
 *         tipo_apoderado:
 *           type: string
 *           description: Tipo de apoderado (padre, madre, tutor, etc.)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre la relación
 *         estado_usuario:
 *           type: string
 *           description: Estado del usuario en el sistema
 *       required:
 *         - alumno_id
 *         - apoderado_id
 *         - tipo_apoderado
 *
 *     ApoderadoDireccion:
 *       type: object
 *       properties:
 *         apoderado_direccion_id:
 *           type: integer
 *           description: ID único de la dirección
 *         apoderado_id:
 *           type: integer
 *           description: ID del apoderado asociado
 *         descripcion:
 *           type: string
 *           description: Descripción de la dirección
 *         ubicaciones_mapa:
 *           type: string
 *           description: Coordenadas o ubicación en mapa
 *         comuna_id:
 *           type: integer
 *           description: ID de la comuna
 *         region_id:
 *           type: integer
 *           description: ID de la región
 *         pais_id:
 *           type: integer
 *           description: ID del país
 *       required:
 *         - apoderado_id
 *         - descripcion
 *         - comuna_id
 *         - region_id
 *         - pais_id
 *
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session
 */

/**
 * esta ruta es para configurar si el alumno puede o no precentar la evalucion asistida
 */
router.use(
  "/configuracion_asistida",
  sessionAuth,
  controller.configuracionAlumno.bind(
    controller
  )
);

router.post(
  "/completar-perfil",
  
  ApoderadoController.completarPerfil
);
export default router;
