import express from 'express';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { PaisService } from '../infrestructure/server/localidades/PaisService';

const router = express.Router();
const ruta_paises = '/paises';
const ruta_regiones = '/regiones';
const ruta_comunas = '/comunas';
const ruta_configuraciones_divisiones_paises = '/configuraciones_divisiones_paises';
const ruta_configuraciones_comunas = '/configuraciones_comunas';
const ruta_configuraciones_regiones = '/configuraciones_regiones';

/**
 * @swagger
 * tags:
 *   - name: Localidades
 *     description: Endpoints para gestión de ubicaciones geográficas
 *   - name: Países
 *     description: Operaciones CRUD para países
 *   - name: Regiones
 *     description: Operaciones CRUD para regiones
 *   - name: Comunas
 *     description: Operaciones CRUD para comunas
 *   - name: Configuraciones Divisiones
 *     description: Configuraciones de divisiones territoriales
 */

/**
 * @swagger
 * /api/v1/localidades/paises:
 *   get:
 *     summary: Obtener lista de países
 *     description: Retorna todos los países registrados en el sistema
 *     tags: [Países]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de países obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pais'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_paises + '/', sessionAuth, PaisService.obtener);

/**
 * @swagger
 * /api/v1/localidades/paises:
 *   post:
 *     summary: Crear un nuevo país
 *     description: Registra un nuevo país en el sistema
 *     tags: [Países]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pais'
 *     responses:
 *       201:
 *         description: País creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pais'
 *       400:
 *         description: Datos inválidos para crear el país
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_paises + '/', sessionAuth, PaisService.guardar);

/**
 * @swagger
 * /api/v1/localidades/paises/{id}:
 *   put:
 *     summary: Actualizar un país
 *     description: Actualiza la información de un país existente
 *     tags: [Países]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del país a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pais'
 *     responses:
 *       200:
 *         description: País actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pais'
 *       404:
 *         description: País no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_paises + '/:id', sessionAuth, PaisService.actualizar);

/**
 * @swagger
 * /api/v1/localidades/paises/{id}:
 *   delete:
 *     summary: Eliminar un país
 *     description: Elimina un país del sistema
 *     tags: [Países]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del país a eliminar
 *     responses:
 *       204:
 *         description: País eliminado exitosamente
 *       404:
 *         description: País no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_paises + '/:id', sessionAuth, PaisService.eliminar);

/**
 * @swagger
 * /api/v1/localidades/regiones:
 *   get:
 *     summary: Obtener lista de regiones
 *     description: Retorna todas las regiones registradas en el sistema
 *     tags: [Regiones]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de regiones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Region'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_regiones + '/', sessionAuth, PaisService.obtener);

/**
 * @swagger
 * /api/v1/localidades/regiones:
 *   post:
 *     summary: Crear una nueva región
 *     description: Registra una nueva región en el sistema
 *     tags: [Regiones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Region'
 *     responses:
 *       201:
 *         description: Región creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *       400:
 *         description: Datos inválidos para crear la región
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_regiones + '/', sessionAuth, PaisService.guardar);

/**
 * @swagger
 * /api/v1/localidades/regiones/{id}:
 *   put:
 *     summary: Actualizar una región
 *     description: Actualiza la información de una región existente
 *     tags: [Regiones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la región a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Region'
 *     responses:
 *       200:
 *         description: Región actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *       404:
 *         description: Región no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_regiones + '/:id', sessionAuth, PaisService.actualizar);

/**
 * @swagger
 * /api/v1/localidades/regiones/{id}:
 *   delete:
 *     summary: Eliminar una región
 *     description: Elimina una región del sistema
 *     tags: [Regiones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la región a eliminar
 *     responses:
 *       204:
 *         description: Región eliminada exitosamente
 *       404:
 *         description: Región no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_regiones + '/:id', sessionAuth, PaisService.eliminar);

/**
 * @swagger
 * /api/v1/localidades/comunas:
 *   get:
 *     summary: Obtener lista de comunas
 *     description: Retorna todas las comunas registradas en el sistema
 *     tags: [Comunas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de comunas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comuna'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_comunas + '/', sessionAuth, PaisService.obtener);

/**
 * @swagger
 * /api/v1/localidades/comunas:
 *   post:
 *     summary: Crear una nueva comuna
 *     description: Registra una nueva comuna en el sistema
 *     tags: [Comunas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comuna'
 *     responses:
 *       201:
 *         description: Comuna creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comuna'
 *       400:
 *         description: Datos inválidos para crear la comuna
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_comunas + '/', sessionAuth, PaisService.guardar);

/**
 * @swagger
 * /api/v1/localidades/comunas/{id}:
 *   put:
 *     summary: Actualizar una comuna
 *     description: Actualiza la información de una comuna existente
 *     tags: [Comunas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comuna a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comuna'
 *     responses:
 *       200:
 *         description: Comuna actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comuna'
 *       404:
 *         description: Comuna no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_comunas + '/:id', sessionAuth, PaisService.actualizar);

/**
 * @swagger
 * /api/v1/localidades/comunas/{id}:
 *   delete:
 *     summary: Eliminar una comuna
 *     description: Elimina una comuna del sistema
 *     tags: [Comunas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comuna a eliminar
 *     responses:
 *       204:
 *         description: Comuna eliminada exitosamente
 *       404:
 *         description: Comuna no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete( ruta_comunas + '/:id', sessionAuth, PaisService.eliminar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_divisiones_paises:
 *   get:
 *     summary: Obtener configuraciones de divisiones de países
 *     description: Retorna todas las configuraciones de divisiones territoriales por país
 *     tags: [Configuraciones Divisiones]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuraciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConfiguracionDivisionPais'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_configuraciones_divisiones_paises + '/', sessionAuth, PaisService.obtener);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_divisiones_paises:
 *   post:
 *     summary: Crear configuración de división de país
 *     description: Registra una nueva configuración de división territorial para un país
 *     tags: [Configuraciones Divisiones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracionDivisionPais'
 *     responses:
 *       201:
 *         description: Configuración creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionDivisionPais'
 *       400:
 *         description: Datos inválidos para crear la configuración
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_configuraciones_divisiones_paises + '/', sessionAuth, PaisService.guardar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_divisiones_paises/{id}:
 *   put:
 *     summary: Actualizar configuración de división de país
 *     description: Actualiza una configuración de división territorial existente
 *     tags: [Configuraciones Divisiones]
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
 *             $ref: '#/components/schemas/ConfiguracionDivisionPais'
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionDivisionPais'
 *       404:
 *         description: Configuración no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_configuraciones_divisiones_paises + '/:id', sessionAuth, PaisService.actualizar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_divisiones_paises/{id}:
 *   delete:
 *     summary: Eliminar configuración de división de país
 *     description: Elimina una configuración de división territorial
 *     tags: [Configuraciones Divisiones]
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
 *         description: Error interno del servidor
 */
router.delete( ruta_configuraciones_divisiones_paises + '/:id', sessionAuth, PaisService.eliminar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_comunas:
 *   get:
 *     summary: Obtener configuraciones de comunas
 *     description: Retorna todas las configuraciones de comunas registradas
 *     tags: [Configuraciones Divisiones]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuraciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConfiguracionComuna'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_configuraciones_comunas + '/', sessionAuth, PaisService.obtener);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_comunas:
 *   post:
 *     summary: Crear configuración de comuna
 *     description: Registra una nueva configuración para comunas
 *     tags: [Configuraciones Divisiones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracionComuna'
 *     responses:
 *       201:
 *         description: Configuración creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionComuna'
 *       400:
 *         description: Datos inválidos para crear la configuración
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_configuraciones_comunas + '/', sessionAuth, PaisService.guardar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_comunas/{id}:
 *   put:
 *     summary: Actualizar configuración de comuna
 *     description: Actualiza una configuración de comuna existente
 *     tags: [Configuraciones Divisiones]
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
 *             $ref: '#/components/schemas/ConfiguracionComuna'
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionComuna'
 *       404:
 *         description: Configuración no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_configuraciones_comunas + '/:id', sessionAuth, PaisService.actualizar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_comunas/{id}:
 *   delete:
 *     summary: Eliminar configuración de comuna
 *     description: Elimina una configuración de comuna
 *     tags: [Configuraciones Divisiones]
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
 *         description: Error interno del servidor
 */
router.delete( ruta_configuraciones_comunas + '/:id', sessionAuth, PaisService.eliminar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_regiones:
 *   get:
 *     summary: Obtener configuraciones de regiones
 *     description: Retorna todas las configuraciones de regiones registradas
 *     tags: [Configuraciones Divisiones]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuraciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConfiguracionRegion'
 *       500:
 *         description: Error interno del servidor
 */
router.get( ruta_configuraciones_regiones + '/', sessionAuth, PaisService.obtener);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_regiones:
 *   post:
 *     summary: Crear configuración de región
 *     description: Registra una nueva configuración para regiones
 *     tags: [Configuraciones Divisiones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracionRegion'
 *     responses:
 *       201:
 *         description: Configuración creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionRegion'
 *       400:
 *         description: Datos inválidos para crear la configuración
 *       500:
 *         description: Error interno del servidor
 */
router.post( ruta_configuraciones_regiones + '/', sessionAuth, PaisService.guardar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_regiones/{id}:
 *   put:
 *     summary: Actualizar configuración de región
 *     description: Actualiza una configuración de región existente
 *     tags: [Configuraciones Divisiones]
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
 *             $ref: '#/components/schemas/ConfiguracionRegion'
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionRegion'
 *       404:
 *         description: Configuración no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put( ruta_configuraciones_regiones + '/:id', sessionAuth, PaisService.actualizar);

/**
 * @swagger
 * /api/v1/localidades/configuraciones_regiones/{id}:
 *   delete:
 *     summary: Eliminar configuración de región
 *     description: Elimina una configuración de región
 *     tags: [Configuraciones Divisiones]
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
 *         description: Error interno del servidor
 */
router.delete( ruta_configuraciones_regiones + '/:id', sessionAuth, PaisService.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     Pais:
 *       type: object
 *       properties:
 *         pais_id:
 *           type: integer
 *           description: ID único del país
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del país
 *           example: "Chile"
 *       required:
 *         - nombre
 * 
 *     Region:
 *       type: object
 *       properties:
 *         region_id:
 *           type: integer
 *           description: ID único de la región
 *           example: 5
 *         nombre:
 *           type: string
 *           description: Nombre de la región
 *           example: "Valparaíso"
 *       required:
 *         - nombre
 * 
 *     Comuna:
 *       type: object
 *       properties:
 *         comuna_id:
 *           type: integer
 *           description: ID único de la comuna
 *           example: 23
 *         nombre:
 *           type: string
 *           description: Nombre de la comuna
 *           example: "Viña del Mar"
 *         region_id:
 *           type: integer
 *           description: ID de la región a la que pertenece
 *           example: 5
 *         pais_id:
 *           type: integer
 *           description: ID del país al que pertenece
 *           example: 1
 *       required:
 *         - nombre
 *         - region_id
 *         - pais_id
 * 
 *     ConfiguracionComuna:
 *       type: object
 *       properties:
 *         configuracion_comuna_id:
 *           type: integer
 *           description: ID único de la configuración
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre de la configuración
 *           example: "Comunas Metropolitanas"
 *       required:
 *         - nombre
 * 
 *     ConfiguracionDivisionPais:
 *       type: object
 *       properties:
 *         configuracion_division_pais_id:
 *           type: integer
 *           description: ID único de la configuración
 *           example: 1
 *         pais_id:
 *           type: integer
 *           description: ID del país asociado
 *           example: 1
 *         configuracion_region_id:
 *           type: integer
 *           description: ID de la configuración de región
 *           example: 1
 *         configuracion_comuna_id:
 *           type: integer
 *           description: ID de la configuración de comuna
 *           example: 1
 *       required:
 *         - pais_id
 * 
 *     ConfiguracionRegion:
 *       type: object
 *       properties:
 *         configuracion_region_id:
 *           type: integer
 *           description: ID único de la configuración
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre de la configuración
 *           example: "Regiones Zona Norte"
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