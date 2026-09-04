import express from 'express';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { AvisosService } from '../infrestructure/server/avisos/AvisoService';
import { MotorAvisoService } from '../infrestructure/server/avisos/MotorAvisoService';

const router = express.Router();
const ruta_avisos = '/avisos';
const ruta_motor_avisos = '/motor_avisos';

/**
 * @swagger
 * api/v1/avisos/avisos:
 *   get:
 *     summary: Obtener todos los avisos
 *     description: Retorna una lista de todos los avisos registrados en el sistema
 *     tags:
 *       - Avisos
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de avisos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Aviso'
 *       500:
 *         description: Error en el servidor
 */
router.get(ruta_avisos+'/', sessionAuth, AvisosService.obtener);

/**
 * @swagger
 * api/v1/avisos/avisos:
 *   post:
 *     summary: Crear un nuevo aviso
 *     description: Registra un nuevo aviso en el sistema
 *     tags:
 *       - Avisos
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aviso'
 *     responses:
 *       201:
 *         description: Aviso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aviso'
 *       400:
 *         description: Datos del aviso inválidos
 *       500:
 *         description: Error en el servidor
 */
router.post(ruta_avisos+'/', sessionAuth, AvisosService.guardar);

/**
 * @swagger
 * /api/v1/avisos/avisos/{id}:
 *   put:
 *     summary: Actualizar un aviso existente
 *     description: Actualiza la información de un aviso específico
 *     tags:
 *       - Avisos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del aviso a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aviso'
 *     responses:
 *       200:
 *         description: Aviso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aviso'
 *       404:
 *         description: Aviso no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.put(ruta_avisos+'/:id', sessionAuth, AvisosService.actualizar);

/**
 * @swagger
 * /api/v1/avisos/avisos/{id}:
 *   delete:
 *     summary: Eliminar un aviso
 *     description: Elimina un aviso específico del sistema
 *     tags:
 *       - Avisos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del aviso a eliminar
 *     responses:
 *       204:
 *         description: Aviso eliminado exitosamente
 *       404:
 *         description: Aviso no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete(ruta_avisos+'/:id', sessionAuth, AvisosService.eliminar);

/**
 * @swagger
 * /api/v1/avisos/motor_avisos:
 *   get:
 *     summary: Obtener configuración del motor de avisos
 *     description: Retorna la configuración actual del motor de envío de avisos
 *     tags:
 *       - Motor de Avisos
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Configuración obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MotorAviso'
 *       500:
 *         description: Error en el servidor
 */
router.get(ruta_motor_avisos+'/', sessionAuth, MotorAvisoService.obtener);

/**
 * @swagger
 * /api/v1/avisos/motor_avisos:
 *   post:
 *     summary: Configurar motor de avisos
 *     description: Establece la configuración del motor de envío de avisos
 *     tags:
 *       - Motor de Avisos
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorAviso'
 *     responses:
 *       201:
 *         description: Configuración guardada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MotorAviso'
 *       400:
 *         description: Datos de configuración inválidos
 *       500:
 *         description: Error en el servidor
 */
router.post(ruta_motor_avisos+'/', sessionAuth, MotorAvisoService.guardar);

/**
 * @swagger
 * /api/v1/avisos/motor_avisos/{id}:
 *   put:
 *     summary: Actualizar configuración del motor de avisos
 *     description: Modifica la configuración existente del motor de envío de avisos
 *     tags:
 *       - Motor de Avisos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MotorAviso'
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MotorAviso'
 *       404:
 *         description: Configuración no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.put(ruta_motor_avisos+'/:id', sessionAuth, MotorAvisoService.actualizar);

/**
 * @swagger
 * /api/v1/avisos/motor_avisos/{id}:
 *   delete:
 *     summary: Eliminar configuración del motor de avisos
 *     description: Elimina la configuración del motor de envío de avisos
 *     tags:
 *       - Motor de Avisos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración a eliminar
 *     responses:
 *       204:
 *         description: Configuración eliminada exitosamente
 *       404:
 *         description: Configuración no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.delete(ruta_motor_avisos+'/:id', sessionAuth, MotorAvisoService.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     Aviso:
 *       type: object
 *       properties:
 *         aviso_id:
 *           type: integer
 *           description: ID único del aviso
 *           example: 1
 *         docente_id:
 *           type: integer
 *           description: ID del docente que crea el aviso
 *           example: 123
 *         mensaje:
 *           type: string
 *           description: Contenido del mensaje del aviso
 *           example: "Reunión de padres el próximo viernes"
 *         dirigido:
 *           type: string
 *           description: Destinatarios del aviso (ej. curso, nivel, todos)
 *           example: "3°A"
 *         fecha_programada:
 *           type: string
 *           format: date-time
 *           description: Fecha programada para el envío del aviso
 *           example: "2023-06-15T10:00:00Z"
 *         estado:
 *           type: string
 *           description: Estado actual del aviso (pendiente, enviado, cancelado)
 *           example: "pendiente"
 *       required:
 *         - docente_id
 *         - mensaje
 *         - dirigido
 *         - fecha_programada
 * 
 *     MotorAviso:
 *       type: object
 *       properties:
 *         motor_aviso:
 *           type: integer
 *           description: ID único de la configuración
 *           example: 1
 *         intervalo_min:
 *           type: integer
 *           description: Intervalo en minutos para el envío de avisos
 *           example: 30
 *       required:
 *         - intervalo_min
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: header
 *       name: Authorization
 *       description: Token de autenticación obtenido al iniciar sesión
 */

export default router;