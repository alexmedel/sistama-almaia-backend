import express from 'express';
import { PreguntaService } from '../infrestructure/server/preguntas/PreguntaService';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { AlumnoRespuestaService } from '../infrestructure/server/preguntas/AlumnoRespuestaService';
import { GeneradorInformeService } from '../infrestructure/server/preguntas/GeneradorInformeService';
import { RespuestaPosibleService } from '../infrestructure/server/preguntas/RespuestaPosibleService';
import { RespuestaPosiblePreguntaService } from '../infrestructure/server/preguntas/RespuestaPosibllePreguntaService';
import { TipoOficioService } from '../infrestructure/server/preguntas/TipoOficioService';
import { TipoPreguntaService } from '../infrestructure/server/preguntas/TipoPreguntaService';
import { AlumnoRespuestaSeleccionService } from '../infrestructure/server/alumno/AlumnoRespuestaSeleccionService';

const router = express.Router();

const ruta_alumno_respuesta = '/alumnos_respuestas';
const ruta_generador_informe = '/generadores_informes';
const ruta_respuestas_posibles = '/respuestas_posibles';
const ruta_respuestas_posibles_preguntas = '/respuestas_posibles_preguntas';
const ruta_respuestas_seleccion = '/respuestas_selecccion';
const ruta_tipos_oficios = '/tipos_oficios';
const ruta_tipos_preguntas = '/tipos_preguntas';
// const ruta_respuestas = '/respuestas';

/**
 * @swagger
 * tags:
 *   - name: Preguntas
 *     description: Endpoints para gestión de preguntas
 *   - name: Respuestas Alumnos
 *     description: Endpoints para respuestas de alumnos
 *   - name: Generadores Informes
 *     description: Endpoints para generadores de informes
 *   - name: Respuestas Posibles
 *     description: Endpoints para respuestas predefinidas
 *   - name: Tipos
 *     description: Endpoints para tipos de preguntas y oficios
 *   - name: RespuestasSeleccion
 *     description: Endpoints para gestionar respuestas de selección de alumnos
 */

// Preguntas
/**
 * @swagger
 * /api/v1/preguntas:
 *   get:
 *     summary: Obtener lista de preguntas
 *     description: Retorna todas las preguntas registradas en el sistema
 *     tags: [Preguntas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de preguntas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pregunta'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', sessionAuth, PreguntaService.obtener);
/**
 * @swagger
 * /api/v1/preguntas/ddetalle/{id}:
 *   get:
 *     summary: Obtener detalle completo de una pregunta con respuestas posibles
 *     description: Retorna toda la información de una pregunta específica incluyendo su tipo, nivel educativo, detalles de diagnóstico y respuestas posibles asociadas con sus nombres
 *     tags: [Preguntas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID de la pregunta a consultar
 *     responses:
 *       200:
 *         description: Detalle de pregunta obtenido correctamente con respuestas asociadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreguntaDetallada'
 *             example:
 *               pregunta_id: 1
 *               tipo_pregunta:
 *                 tipo_pregunta_id: 2
 *                 nombre: "Opción múltiple"
 *               nivel_educativo:
 *                 nivel_educativo_id: 3
 *                 nombre: "Secundaria"
 *               diagnostico: "Problemas de atención"
 *               sintomas: "Falta de concentración, hiperactividad"
 *               grupo_preguntas: "Evaluación inicial"
 *               palabra_clave: "atención"
 *               horario: "am"
 *               texto_pregunta: "¿Con qué frecuencia tiene dificultad para concentrarse en sus tareas?"
 *               respuestas_posibles_has_preguntas:
 *                 - respuesta_posible_id: 1
 *                   pregunta_id: 1
 *                   nombre: "Nunca"
 *                 - respuesta_posible_id: 2
 *                   pregunta_id: 1
 *                   nombre: "Ocasionalmente"
 *                 - respuesta_posible_id: 3
 *                   pregunta_id: 1
 *                   nombre: "Frecuentemente"
 *       401:
 *         description: No autorizado - Sesión no válida
 *       404:
 *         description: Pregunta no encontrada
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PreguntaDetallada:
 *       type: object
 *       properties:
 *         pregunta_id:
 *           type: integer
 *           example: 1
 *           description: ID único de la pregunta
 *         tipo_pregunta:
 *           type: object
 *           properties:
 *             tipo_pregunta_id:
 *               type: integer
 *               example: 2
 *             nombre:
 *               type: string
 *               example: "Opción múltiple"
 *           description: Tipo de pregunta
 *         nivel_educativo:
 *           type: object
 *           properties:
 *             nivel_educativo_id:
 *               type: integer
 *               example: 3
 *             nombre:
 *               type: string
 *               example: "Secundaria"
 *           description: Nivel educativo asociado
 *         diagnostico:
 *           type: string
 *           example: "Problemas de atención"
 *           description: Área de diagnóstico relacionada
 *         sintomas:
 *           type: string
 *           example: "Falta de concentración, hiperactividad"
 *           description: Síntomas asociados
 *         grupo_preguntas:
 *           type: string
 *           example: "Evaluación inicial"
 *           description: Grupo al que pertenece la pregunta
 *         palabra_clave:
 *           type: string
 *           example: "atención"
 *           description: Palabra clave para búsquedas
 *         horario:
 *           type: string
 *           example: "am"
 *           enum: [am, pm]
 *           description: Horario sugerido para aplicar la pregunta
 *         texto_pregunta:
 *           type: string
 *           example: "¿Con qué frecuencia tiene dificultad para concentrarse en sus tareas?"
 *           description: Texto completo de la pregunta
 *         respuestas_posibles_has_preguntas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RespuestaPosible'
 *           description: Lista de respuestas posibles asociadas a la pregunta
 * 
 *     RespuestaPosible:
 *       type: object
 *       properties:
 *         respuesta_posible_id:
 *           type: integer
 *           example: 1
 *           description: ID único de la respuesta posible
 *         pregunta_id:
 *           type: integer
 *           example: 1
 *           description: ID de la pregunta asociada
 *         nombre:
 *           type: string
 *           example: "Nunca"
 *           description: Texto de la respuesta posible
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RespuestaPosibleModelo:
 *       type: object
 *       description: Modelo de datos para RespuestaPosible
 *       properties:
 *         respuesta_posible_id:
 *           type: integer
 *           example: 1
 *           description: ID único de la respuesta posible
 *         nombre:
 *           type: string
 *           example: "Nunca"
 *           description: Texto de la respuesta posible
 */
router.get('/detalle/:id', sessionAuth, PreguntaService.detalle);

/**
 * @swagger
 * /api/v1/preguntas:
 *   post:
 *     summary: Crear una nueva pregunta
 *     description: Registra una nueva pregunta en el sistema
 *     tags: [Preguntas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pregunta'
 *     responses:
 *       201:
 *         description: Pregunta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pregunta'
 *       400:
 *         description: Datos inválidos para crear la pregunta
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', sessionAuth, PreguntaService.guardar);

/**
 * @swagger
 * /api/v1/preguntas/{id}:
 *   put:
 *     summary: Actualizar una pregunta
 *     description: Actualiza la información de una pregunta existente
 *     tags: [Preguntas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pregunta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pregunta'
 *     responses:
 *       200:
 *         description: Pregunta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pregunta'
 *       404:
 *         description: Pregunta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( '/:id', sessionAuth, PreguntaService.actualizar);

/**
 * @swagger
 * /api/v1/preguntas/{id}:
 *   delete:
 *     summary: Eliminar una pregunta
 *     description: Elimina una pregunta del sistema
 *     tags: [Preguntas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pregunta a eliminar
 *     responses:
 *       204:
 *         description: Pregunta eliminada exitosamente
 *       404:
 *         description: Pregunta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete( '/:id', sessionAuth, PreguntaService.eliminar);

// Respuestas de Alumnos
/**
 * @swagger
 * /api/v1/preguntas/alumnos_respuestas:
 *   get:
 *     summary: Obtener respuestas de alumnos
 *     description: Retorna todas las respuestas de alumnos registradas
 *     tags: [Respuestas Alumnos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de respuestas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoRespuesta'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_alumno_respuesta, sessionAuth, AlumnoRespuestaService.obtener);

/**
 * @swagger
 * /api/v1/preguntas/alumnos_respuestas:
 *   post:
 *     summary: Registrar respuesta de alumno
 *     description: Crea un nuevo registro de respuesta de alumno
 *     tags: [Respuestas Alumnos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoRespuesta'
 *     responses:
 *       201:
 *         description: Respuesta registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoRespuesta'
 *       400:
 *         description: Datos inválidos para registrar la respuesta
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_alumno_respuesta, sessionAuth, AlumnoRespuestaService.guardar);
/**  
 * @swagger  
 * /preguntas/responder:  
 *   post:  
 *     summary: Registrar respuesta individual de alumno  
 *     description: Permite que un alumno registre su respuesta a una pregunta específica  
 *     tags:  
 *       - Respuestas de Alumnos  
 *     security:  
 *       - bearerAuth: []  
 *     requestBody:  
 *       required: true  
 *       content:  
 *         application/json:  
 *           schema:  
 *             type: object  
 *             required:  
 *               - alumno_id  
 *               - pregunta_id  
 *               - respuesta_posible_id  
 *             properties:  
 *               alumno_id:  
 *                 type: integer  
 *                 description: ID del alumno que responde  
 *                 example: 123  
 *               pregunta_id:  
 *                 type: integer  
 *                 description: ID de la pregunta a responder  
 *                 example: 456  
 *               respuesta_posible_id:  
 *                 type: integer  
 *                 description: ID de la respuesta seleccionada  
 *                 example: 789  
 *     responses:  
 *       200:  
 *         description: Respuesta registrada correctamente  
 *         content:  
 *           application/json:  
 *             schema:  
 *               type: object  
 *               properties:  
 *                 message:  
 *                   type: string  
 *                   example: "Respuesta actualizada correctamente."  
 *       400:  
 *         description: Faltan datos obligatorios  
 *         content:  
 *           application/json:  
 *             schema:  
 *               type: object  
 *               properties:  
 *                 message:  
 *                   type: string  
 *                   example: "Faltan datos obligatorios."  
 *       401:  
 *         description: No autorizado - Token inválido  
 *       500:  
 *         description: Error interno del servidor  
 */  
router.post( '/responder', sessionAuth, AlumnoRespuestaSeleccionService.responder);

/**  
 * @swagger  
 * /preguntas/responder_multiple:  
 *   post:  
 *     summary: Registrar respuestas múltiples de alumno  
 *     description: Permite que un alumno registre múltiples respuestas para una pregunta (preguntas de selección múltiple)  
 *     tags:  
 *       - Respuestas de Alumnos  
 *     security:  
 *       - bearerAuth: []  
 *     requestBody:  
 *       required: true  
 *       content:  
 *         application/json:  
 *           schema:  
 *             type: object  
 *             required:  
 *               - alumno_id  
 *               - pregunta_id  
 *               - respuestas_posibles  
 *             properties:  
 *               alumno_id:  
 *                 type: integer  
 *                 description: ID del alumno que responde  
 *                 example: 123  
 *               pregunta_id:  
 *                 type: integer  
 *                 description: ID de la pregunta a responder  
 *                 example: 456  
 *               respuestas_posibles:  
 *                 type: array  
 *                 description: Array de IDs de respuestas seleccionadas  
 *                 items:  
 *                   type: integer  
 *                 example: [789, 790, 791]  
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
router.post( '/responder_multiple', sessionAuth, AlumnoRespuestaSeleccionService.responderMultiple);

/**  
 * @swagger  
 * /api/v1/preguntas/responder_preguntas/omniresponder/:  
 *   put:  
 *     summary: Registrar las distintas respuestas, ya sean de seleccion o respuesta abierta del alumno  
 *     description: Permite que un alumno registre sus respuestas para una pregunta (preguntas de selección unica, múltiple o respuesta abierta)  
 *     tags:  
 *       - Respuestas de Alumnos  
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
router.put('/responder_preguntas/omniresponder/', sessionAuth, AlumnoRespuestaSeleccionService.omniresponder);


router.post('/cambiar-estado', sessionAuth, AlumnoRespuestaSeleccionService.cambiarEstadoRespuesta);
router.post('/cambiar-estado-multiple', sessionAuth, AlumnoRespuestaSeleccionService.cambiarEstadoRespuestaMultiple);

router.put('/responder_preguntas/omni_cambiar_estado', sessionAuth, AlumnoRespuestaSeleccionService.omniCambiarEstadoPreguntas);

/**
 * @swagger
 * /api/v1/preguntas/alumnos_respuestas/{id}:
 *   put:
 *     summary: Actualizar respuesta de alumno
 *     description: Actualiza una respuesta de alumno existente
 *     tags: [Respuestas Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoRespuesta'
 *     responses:
 *       200:
 *         description: Respuesta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoRespuesta'
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_alumno_respuesta + '/:id', sessionAuth, AlumnoRespuestaService.actualizar);

/**
 * @swagger
 * /api/v1/preguntas/alumnos_respuestas/{id}:
 *   delete:
 *     summary: Eliminar respuesta de alumno
 *     description: Elimina una respuesta de alumno del sistema
 *     tags: [Respuestas Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta a eliminar
 *     responses:
 *       204:
 *         description: Respuesta eliminada exitosamente
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_alumno_respuesta + '/:id', sessionAuth, AlumnoRespuestaService.eliminar);

// Generadores de Informes
/**
 * @swagger
 * /api/v1/preguntas/generadores_informes:
 *   get:
 *     summary: Obtener generadores de informes
 *     description: Retorna todos los generadores de informes registrados
 *     tags: [Generadores Informes]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de generadores obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GeneradorInforme'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_generador_informe, sessionAuth, GeneradorInformeService.obtener);

/**
 * @swagger
 * /api/v1/preguntas/generadores_informes:
 *   post:
 *     summary: Crear generador de informe
 *     description: Registra un nuevo generador de informe en el sistema
 *     tags: [Generadores Informes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneradorInforme'
 *     responses:
 *       201:
 *         description: Generador creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneradorInforme'
 *       400:
 *         description: Datos inválidos para crear el generador
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_generador_informe, sessionAuth, GeneradorInformeService.guardar);

/**
 * @swagger
 * /api/v1/preguntas/generadores_informes/{id}:
 *   put:
 *     summary: Actualizar generador de informe
 *     description: Actualiza un generador de informe existente
 *     tags: [Generadores Informes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del generador a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneradorInforme'
 *     responses:
 *       200:
 *         description: Generador actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneradorInforme'
 *       404:
 *         description: Generador no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_generador_informe + '/:id', sessionAuth, GeneradorInformeService.actualizar);

/**
 * @swagger
 * /api/v1/preguntas/generadores_informes/{id}:
 *   delete:
 *     summary: Eliminar generador de informe
 *     description: Elimina un generador de informe del sistema
 *     tags: [Generadores Informes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del generador a eliminar
 *     responses:
 *       204:
 *         description: Generador eliminado exitosamente
 *       404:
 *         description: Generador no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_generador_informe + '/:id', sessionAuth, GeneradorInformeService.eliminar);

// Respuestas Posibles
/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles:
 *   get:
 *     summary: Obtener respuestas posibles
 *     description: Retorna todas las respuestas predefinidas disponibles
 *     tags: [Respuestas Posibles]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de respuestas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RespuestaPosible'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_respuestas_posibles, sessionAuth, RespuestaPosibleService.obtener);

/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles:
 *   post:
 *     summary: Crear respuesta posible
 *     description: Registra una nueva respuesta predefinida en el sistema
 *     tags: [Respuestas Posibles]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RespuestaPosible'
 *     responses:
 *       201:
 *         description: Respuesta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaPosible'
 *       400:
 *         description: Datos inválidos para crear la respuesta
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_respuestas_posibles, sessionAuth, RespuestaPosibleService.guardar);

/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles/{id}:
 *   put:
 *     summary: Actualizar respuesta posible
 *     description: Actualiza una respuesta predefinida existente
 *     tags: [Respuestas Posibles]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RespuestaPosible'
 *     responses:
 *       200:
 *         description: Respuesta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaPosible'
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_respuestas_posibles + '/:id', sessionAuth, RespuestaPosibleService.actualizar);

/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles/{id}:
 *   delete:
 *     summary: Eliminar respuesta posible
 *     description: Elimina una respuesta predefinida del sistema
 *     tags: [Respuestas Posibles]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta a eliminar
 *     responses:
 *       204:
 *         description: Respuesta eliminada exitosamente
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_respuestas_posibles + '/:id', sessionAuth, RespuestaPosibleService.eliminar);

// Respuestas Posibles - Preguntas
/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles_preguntas:
 *   get:
 *     summary: Obtener relaciones respuestas-preguntas
 *     description: Retorna todas las relaciones entre respuestas posibles y preguntas
 *     tags: [Respuestas Posibles]
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
 *                 $ref: '#/components/schemas/RespuestaPosiblePregunta'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_respuestas_posibles_preguntas, sessionAuth, RespuestaPosiblePreguntaService.obtener);

/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles_preguntas:
 *   post:
 *     summary: Crear relación respuesta-pregunta
 *     description: Establece una relación entre una respuesta posible y una pregunta
 *     tags: [Respuestas Posibles]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RespuestaPosiblePregunta'
 *     responses:
 *       201:
 *         description: Relación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaPosiblePregunta'
 *       400:
 *         description: Datos inválidos para crear la relación
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_respuestas_posibles_preguntas, sessionAuth, RespuestaPosiblePreguntaService.guardar);

/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles_preguntas/{id}:
 *   put:
 *     summary: Actualizar relación respuesta-pregunta
 *     description: Actualiza una relación entre respuesta posible y pregunta
 *     tags: [Respuestas Posibles]
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
 *             $ref: '#/components/schemas/RespuestaPosiblePregunta'
 *     responses:
 *       200:
 *         description: Relación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaPosiblePregunta'
 *       404:
 *         description: Relación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_respuestas_posibles_preguntas + '/:id', sessionAuth, RespuestaPosiblePreguntaService.actualizar);

/**
 * @swagger
 * /api/v1/preguntas/respuestas_posibles_preguntas/{id}:
 *   delete:
 *     summary: Eliminar relación respuesta-pregunta
 *     description: Elimina una relación entre respuesta posible y pregunta
 *     tags: [Respuestas Posibles]
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
router.delete( ruta_respuestas_posibles_preguntas + '/:id', sessionAuth, RespuestaPosiblePreguntaService.eliminar);

// Tipos de Oficios
/**
 * @swagger
 * /api/v1/preguntas/tipos_oficios:
 *   get:
 *     summary: Obtener tipos de oficios
 *     description: Retorna todos los tipos de oficios registrados
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de oficios obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TipoOficio'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_tipos_oficios, sessionAuth, TipoOficioService.obtener);

/**
 * @swagger
 * /api/v1/preguntas/tipos_oficios:
 *   post:
 *     summary: Crear tipo de oficio
 *     description: Registra un nuevo tipo de oficio en el sistema
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoOficio'
 *     responses:
 *       201:
 *         description: Tipo de oficio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoOficio'
 *       400:
 *         description: Datos inválidos para crear el tipo
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_tipos_oficios, sessionAuth, TipoOficioService.guardar);

/**
 * @swagger
 * /api/v1/preguntas/tipos_oficios/{id}:
 *   put:
 *     summary: Actualizar tipo de oficio
 *     description: Actualiza un tipo de oficio existente
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de oficio a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoOficio'
 *     responses:
 *       200:
 *         description: Tipo de oficio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoOficio'
 *       404:
 *         description: Tipo de oficio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_tipos_oficios + '/:id', sessionAuth, TipoOficioService.actualizar);

/**
 * @swagger
 * /api/v1/preguntas/tipos_oficios/{id}:
 *   delete:
 *     summary: Eliminar tipo de oficio
 *     description: Elimina un tipo de oficio del sistema
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de oficio a eliminar
 *     responses:
 *       204:
 *         description: Tipo de oficio eliminado exitosamente
 *       404:
 *         description: Tipo de oficio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_tipos_oficios + '/:id', sessionAuth, TipoOficioService.eliminar);

// Tipos de Preguntas
/**
 * @swagger
 * /api/v1/preguntas/tipos_preguntas:
 *   get:
 *     summary: Obtener tipos de preguntas
 *     description: Retorna todos los tipos de preguntas registrados
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de preguntas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TipoPregunta'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_tipos_preguntas, sessionAuth, TipoPreguntaService.obtener);

/**
 * @swagger
 * /api/v1/preguntas/tipos_preguntas:
 *   post:
 *     summary: Crear tipo de pregunta
 *     description: Registra un nuevo tipo de pregunta en el sistema
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoPregunta'
 *     responses:
 *       201:
 *         description: Tipo de pregunta creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoPregunta'
 *       400:
 *         description: Datos inválidos para crear el tipo
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_tipos_preguntas, sessionAuth, TipoPreguntaService.guardar);

/**
 * @swagger
 * /api/v1/preguntas/tipos_preguntas/{id}:
 *   put:
 *     summary: Actualizar tipo de pregunta
 *     description: Actualiza un tipo de pregunta existente
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de pregunta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoPregunta'
 *     responses:
 *       200:
 *         description: Tipo de pregunta actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoPregunta'
 *       404:
 *         description: Tipo de pregunta no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_tipos_preguntas + '/:id', sessionAuth, TipoPreguntaService.actualizar);
/**
 * @swagger
 * components:
 *   schemas:
 *     RespuestaSeleccion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID de la respuesta de selección
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno que respondió
 *         pregunta_id:
 *           type: integer
 *           description: ID de la pregunta respondida
 *         respuesta_posible_id:
 *           type: integer
 *           description: ID de la respuesta posible seleccionada
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *         alumnos:
 *           type: object
 *           properties:
 *             alumno_id:
 *               type: integer
 *             url_foto_perfil:
 *               type: string
 *             telefono_contacto1:
 *               type: string
 *             telefono_contacto2:
 *               type: string
 *             email:
 *               type: string
 *         preguntas:
 *           type: object
 *           properties:
 *             pregunta_id:
 *               type: integer
 *             texto_pregunta:
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
 * /api/v1/preguntas/respuestas_seleccion/:
 *   get:
 *     summary: Obtener todas las respuestas de selección
 *     tags: [RespuestasSeleccion]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de respuestas de selección
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RespuestaSeleccion'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get( ruta_respuestas_seleccion + '/', sessionAuth, AlumnoRespuestaSeleccionService.obtener);
/**
 * @swagger
 * /api/v1/preguntas/respuestas_seleccion/:
 *   post:
 *     summary: Crear una nueva respuesta de selección
 *     tags: [RespuestasSeleccion]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alumno_id:
 *                 type: integer
 *                 description: ID del alumno
 *               pregunta_id:
 *                 type: integer
 *                 description: ID de la pregunta
 *               respuesta_posible_id:
 *                 type: integer
 *                 description: ID de la respuesta posible seleccionada
 *             required:
 *               - alumno_id
 *               - pregunta_id
 *               - respuesta_posible_id
 *     responses:
 *       201:
 *         description: Respuesta de selección creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaSeleccion'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post( ruta_respuestas_seleccion + '/', sessionAuth, AlumnoRespuestaSeleccionService.guardar);
/**
 * @swagger
 * /api/v1/preguntas/respuestas_seleccion/{id}:
 *   put:
 *     summary: Actualizar una respuesta de selección existente
 *     tags: [RespuestasSeleccion]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta de selección a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alumno_id:
 *                 type: integer
 *                 description: ID del alumno
 *               pregunta_id:
 *                 type: integer
 *                 description: ID de la pregunta
 *               respuesta_posible_id:
 *                 type: integer
 *                 description: ID de la respuesta posible seleccionada
 *     responses:
 *       200:
 *         description: Respuesta de selección actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaSeleccion'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Respuesta de selección no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put( ruta_respuestas_seleccion + '/:id', sessionAuth, AlumnoRespuestaSeleccionService.actualizar);
/**
 * @swagger
 * /api/v1/preguntas/respuestas_seleccion/{id}:
 *   delete:
 *     summary: Eliminar una respuesta de selección
 *     tags: [RespuestasSeleccion]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta de selección a eliminar
 *     responses:
 *       204:
 *         description: Respuesta de selección eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Respuesta de selección no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete( ruta_respuestas_seleccion + '/:id', sessionAuth, AlumnoRespuestaSeleccionService.eliminar);

/**
 * @swagger
 * /api/v1/preguntas/tipos_preguntas/{id}:
 *   delete:
 *     summary: Eliminar tipo de pregunta
 *     description: Elimina un tipo de pregunta del sistema
 *     tags: [Tipos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de pregunta a eliminar
 *     responses:
 *       204:
 *         description: Tipo de pregunta eliminado exitosamente
 *       404:
 *         description: Tipo de pregunta no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_tipos_preguntas + '/:id', sessionAuth, TipoPreguntaService.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     Pregunta:
 *       type: object
 *       properties:
 *         pregunta_id:
 *           type: integer
 *           description: ID único de la pregunta
 *           example: 1
 *         tipo_pregunta_id:
 *           type: integer
 *           description: ID del tipo de pregunta
 *           example: 2
 *         nivel_educativo_id:
 *           type: integer
 *           description: ID del nivel educativo asociado
 *           example: 3
 *         diagnostico:
 *           type: string
 *           description: Diagnóstico asociado a la pregunta
 *           example: "Problemas de atención"
 *         tipo_respuesta:
 *           type: string
 *           description: Tipo de respuesta esperada
 *           example: "multiple"
 *         sintomas:
 *           type: string
 *           description: Síntomas relacionados
 *           example: "Falta de concentración, hiperactividad"
 *         grupo_preguntas:
 *           type: string
 *           description: Grupo al que pertenece la pregunta
 *           example: "Evaluación inicial"
 *         palabra_clave:
 *           type: string
 *           description: Palabra clave para búsquedas
 *           example: "atención"
 *         horario:
 *           type: string
 *           description: Horario sugerido para la pregunta
 *           example: "mañana"
 *         texto_pregunta:
 *           type: string
 *           description: Texto completo de la pregunta
 *           example: "¿Con qué frecuencia tiene dificultad para concentrarse en sus tareas?"
 *       required:
 *         - texto_pregunta
 *         - tipo_pregunta_id
 * 
 *     AlumnoRespuesta:
 *       type: object
 *       properties:
 *         alumno_respuesta:
 *           type: integer
 *           description: ID único de la respuesta
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno que respondió
 *           example: 45
 *         pregunta_id:
 *           type: integer
 *           description: ID de la pregunta respondida
 *           example: 12
 *         respuesta:
 *           type: string
 *           description: Texto de la respuesta
 *           example: "Siempre tengo dificultad"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la respuesta
 *           example: "2023-05-15T10:30:00Z"
 *       required:
 *         - alumno_id
 *         - pregunta_id
 *         - respuesta
 * 
 *     GeneradorInforme:
 *       type: object
 *       properties:
 *         generador_informe_id:
 *           type: integer
 *           description: ID único del generador
 *           example: 1
 *         pregunta:
 *           type: string
 *           description: Pregunta asociada al informe
 *           example: "¿Cómo ha sido el comportamiento del alumno?"
 *         tiene_respuesta:
 *           type: boolean
 *           description: Indica si requiere respuesta
 *           example: true
 *         texto:
 *           type: string
 *           description: Texto base del informe
 *           example: "El alumno ha mostrado..."
 *         freq_dias:
 *           type: integer
 *           description: Frecuencia en días para generar
 *           example: 30
 *         generador_imforme_ambito_id:
 *           type: integer
 *           description: ID del ámbito del informe
 *           example: 2
 *       required:
 *         - texto
 *         - generador_imforme_ambito_id
 * 
 *     GeneradorInformeAmbito:
 *       type: object
 *       properties:
 *         generador_imforme_ambito_id:
 *           type: integer
 *           description: ID único del ámbito
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del ámbito
 *           example: "Conductual"
 *       required:
 *         - nombre
 * 
 *     RespuestaPosible:
 *       type: object
 *       properties:
 *         respuesta_posible_id:
 *           type: integer
 *           description: ID único de la respuesta
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Texto de la respuesta
 *           example: "Siempre"
 *       required:
 *         - nombre
 * 
 *     RespuestaPosiblePregunta:
 *       type: object
 *       properties:
 *         respuesta_posible_id:
 *           type: integer
 *           description: ID de la respuesta posible
 *           example: 1
 *         pregunta_id:
 *           type: integer
 *           description: ID de la pregunta
 *           example: 5
 *       required:
 *         - respuesta_posible_id
 *         - pregunta_id
 * 
 *     TipoOficio:
 *       type: object
 *       properties:
 *         tipo_oficio_id:
 *           type: integer
 *           description: ID único del tipo
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del tipo de oficio
 *           example: "Citación"
 *       required:
 *         - nombre
 * 
 *     TipoPregunta:
 *       type: object
 *       properties:
 *         tipo_pregunta_id:
 *           type: integer
 *           description: ID único del tipo
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del tipo de pregunta
 *           example: "Evaluación inicial"
 *       required:
 *         - nombre
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: header
 *       name: Authorization
 *       description: Token de autenticación obtenido al iniciar sesión
 */

export default router;
