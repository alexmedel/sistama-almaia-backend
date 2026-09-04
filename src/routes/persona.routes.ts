import express from 'express';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { PersonasService } from '../infrestructure/server/personas/PersonasService';
import { PersonaContactosService } from '../infrestructure/server/personas/PersonasContactoService';

const router = express.Router();
const rutas_personas_contactos = "/personas_contactos"

/**
 * @swagger
 * tags:
 *   - name: Personas
 *     description: Operaciones relacionadas con personas
 *   - name: Contactos
 *     description: Operaciones relacionadas con contactos de personas
 */

/**
 * @swagger
 * /api/v1/personas/:
 *   get:
 *     tags: [Personas]
 *     summary: Obtener todas las personas
 *     description: Retorna una lista de todas las personas registradas con sus relaciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de personas con objetos relacionados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PersonaResponse'
 */
router.get('/', sessionAuth, PersonasService.obtener)

/**
 * @swagger
 * /api/v1/personas/:
 *   post:
 *     tags: [Personas]
 *     summary: Crear una nueva persona
 *     description: Registra una nueva persona en el sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonaInput'
 *     responses:
 *       201:
 *         description: Persona creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaResponse'
 *       400:
 *         description: Datos de entrada inválidos
 */
router.post('/', sessionAuth, PersonasService.guardar)

/**
 * @swagger
 * /api/v1/personas/{id}:
 *   put:
 *     tags: [Personas]
 *     summary: Actualizar una persona existente
 *     description: Actualiza los datos de una persona por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la persona a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonaInput'
 *     responses:
 *       200:
 *         description: Persona actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaResponse'
 *       404:
 *         description: Persona no encontrada
 *       400:
 *         description: Datos de entrada inválidos
 */
router.put('/:id', sessionAuth, PersonasService.actualizar)

/**
 * @swagger
 * /api/v1/personas/{id}:
 *   delete:
 *     tags: [Personas]
 *     summary: Eliminar una persona
 *     description: Elimina una persona por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la persona a eliminar
 *     responses:
 *       204:
 *         description: Persona eliminada exitosamente
 *       404:
 *         description: Persona no encontrada
 */
router.delete('/:id', sessionAuth, PersonasService.eliminar)

/**
 * @swagger
 * /api/v1/personas/personas_contactos/:
 *   get:
 *     tags: [Contactos]
 *     summary: Obtener todos los contactos de personas
 *     description: Retorna una lista de todos los contactos registrados con información de persona relacionada
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contactos con relaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PersonaContactoResponse'
 */
router.get(rutas_personas_contactos+'/', sessionAuth, PersonaContactosService.obtener)

/**
 * @swagger
 * /api/v1/personas/personas_contactos/:
 *   post:
 *     tags: [Contactos]
 *     summary: Crear un nuevo contacto de persona
 *     description: Registra un nuevo contacto para una persona en el sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonaContactoInput'
 *     responses:
 *       201:
 *         description: Contacto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaContactoResponse'
 *       400:
 *         description: Datos de entrada inválidos
 */
router.post(rutas_personas_contactos+'/', sessionAuth, PersonaContactosService.guardar)

/**
 * @swagger
 * /api/v1/personas/personas_contactos/{id}:
 *   put:
 *     tags: [Contactos]
 *     summary: Actualizar un contacto existente
 *     description: Actualiza los datos de un contacto por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del contacto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonaContactoInput'
 *     responses:
 *       200:
 *         description: Contacto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaContactoResponse'
 *       404:
 *         description: Contacto no encontrado
 *       400:
 *         description: Datos de entrada inválidos
 */
router.put(rutas_personas_contactos+'/:id', sessionAuth, PersonaContactosService.actualizar)

/**
 * @swagger
 * /api/v1/personas/personas_contactos/{id}:
 *   delete:
 *     tags: [Contactos]
 *     summary: Eliminar un contacto
 *     description: Elimina un contacto por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del contacto a eliminar
 *     responses:
 *       204:
 *         description: Contacto eliminado exitosamente
 *       404:
 *         description: Contacto no encontrado
 */
router.delete(rutas_personas_contactos+'/:id', sessionAuth, PersonaContactosService.eliminar)

/**
 * @swagger
 * components:
 *   schemas:
 *     PersonaInput:
 *       type: object
 *       properties:
 *         tipo_documento:
 *           type: string
 *           example: "DNI"
 *         numero_documento:
 *           type: string
 *           example: "87654321"
 *         nombres:
 *           type: string
 *           example: "María"
 *         apellidos:
 *           type: string
 *           example: "González"
 *         genero_id:
 *           type: integer
 *           example: 2
 *         estado_civil_id:
 *           type: integer
 *           example: 3
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *           example: "1985-05-15"
 *       required:
 *         - tipo_documento
 *         - numero_documento
 *         - nombres
 *         - apellidos
 *         - genero_id
 *         - estado_civil_id
 *         - fecha_nacimiento
 * 
 *     PersonaResponse:
 *       type: object
 *       properties:
 *         persona_id:
 *           type: integer
 *           example: 1
 *         tipo_documento:
 *           type: string
 *           example: "DNI"
 *         numero_documento:
 *           type: string
 *           example: "12345678"
 *         nombres:
 *           type: string
 *           example: "Juan"
 *         apellidos:
 *           type: string
 *           example: "Pérez"
 *         genero:
 *           $ref: '#/components/schemas/Genero'
 *         estado_civil:
 *           $ref: '#/components/schemas/EstadoCivil'
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *           example: "1990-01-01"
 *         contactos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PersonaContacto'
 * 
 *     PersonaContactoInput:
 *       type: object
 *       properties:
 *         persona_id:
 *           type: integer
 *           example: 1
 *         telefono_contacto:
 *           type: string
 *           example: "+51987654321"
 *         direccion:
 *           type: string
 *           example: "Av. Los Olivos 456, Lima"
 *       required:
 *         - persona_id
 *         - direccion
 * 
 *     PersonaContactoResponse:
 *       type: object
 *       properties:
 *         persona_contacto_id:
 *           type: integer
 *           example: 1
 *         persona_id:
 *           type: integer
 *           example: 1
 *         telefono_contacto:
 *           type: string
 *           example: "+51987654321"
 *         direccion:
 *           type: string
 *           example: "Av. Principal 123"
 *         persona:
 *           $ref: '#/components/schemas/PersonaMinima'
 * 
 *     PersonaMinima:
 *       type: object
 *       properties:
 *         persona_id:
 *           type: integer
 *           example: 1
 *         nombres:
 *           type: string
 *           example: "Juan"
 *         apellidos:
 *           type: string
 *           example: "Pérez"
 *         numero_documento:
 *           type: string
 *           example: "12345678"
 * 
 *     Genero:
 *       type: object
 *       properties:
 *         genero_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Masculino"
 *         descripcion:
 *           type: string
 *           example: "Género masculino"
 * 
 *     EstadoCivil:
 *       type: object
 *       properties:
 *         estado_civil_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Soltero/a"
 *         descripcion:
 *           type: string
 *           example: "Persona no casada"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;