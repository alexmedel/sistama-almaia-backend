import express from 'express';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { PatologiaService } from '../infrestructure/server/patologia/PatologiaService';

const router = express.Router();
const basePath = 'patologias';

/**
 * @swagger
 * tags:
 *   - name: Patologías
 *     description: Endpoints para gestión de patologías médicas
 */

/**
 * @swagger
 * /api/v1/patologias:
 *   get:
 *     summary: Obtener lista de patologías
 *     description: Retorna todas las patologías registradas en el sistema
 *     tags: [Patologías]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de patologías obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patologia'
 *       500:
 *         description: Error interno del servidor
 */
router.get(basePath, sessionAuth, PatologiaService.obtener);

/**
 * @swagger
 * /api/v1/patologias:
 *   post:
 *     summary: Crear una nueva patología
 *     description: Registra una nueva patología en el sistema
 *     tags: [Patologías]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patologia'
 *     responses:
 *       201:
 *         description: Patología creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patologia'
 *       400:
 *         description: Datos inválidos para crear la patología
 *       500:
 *         description: Error interno del servidor
 */
router.post(basePath, sessionAuth, PatologiaService.guardar);

/**
 * @swagger
 * /api/v1/patologias/{id}:
 *   put:
 *     summary: Actualizar una patología
 *     description: Actualiza la información de una patología existente
 *     tags: [Patologías]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la patología a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patologia'
 *     responses:
 *       200:
 *         description: Patología actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patologia'
 *       404:
 *         description: Patología no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(basePath + '/:id', sessionAuth, PatologiaService.actualizar);

/**
 * @swagger
 * /api/v1/patologias/{id}:
 *   delete:
 *     summary: Eliminar una patología
 *     description: Elimina una patología del sistema
 *     tags: [Patologías]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la patología a eliminar
 *     responses:
 *       204:
 *         description: Patología eliminada exitosamente
 *       404:
 *         description: Patología no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(basePath + '/:id', sessionAuth, PatologiaService.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     Patologia:
 *       type: object
 *       properties:
 *         patologia_id:
 *           type: integer
 *           description: ID único de la patología
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre de la patología
 *           example: "Diabetes Mellitus"
 *         descripcion:
 *           type: string
 *           description: Descripción detallada de la patología
 *           example: "Enfermedad metabólica caracterizada por niveles elevados de glucosa en sangre"
 *       required:
 *         - nombre
 *         - descripcion
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: header
 *       name: Authorization
 *       description: Token de autenticación obtenido al iniciar sesión
 */

export default router;