import express from 'express';
import { AlumnoInformeService } from '../infrestructure/server/informes/AlumnoInformeService';
import { InformeGeneralService } from '../infrestructure/server/informes/InformeGeneralService';
import { sessionAuth } from '../middleware/supabaseMidleware';
const router = express.Router();

const ruta_alumnos_informes = '/alumnos';
const ruta_informes_generales = '/generales';

/**
 * @swagger
 * tags:
 *   - name: Informes Alumnos
 *     description: Gestión de informes de alumnos
 *   - name: Informes Generales
 *     description: Gestión de informes generales
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AlumnoInforme:
 *       type: object
 *       properties:
 *         alumno_informe_id:
 *           type: integer
 *           example: 801
 *         alumno_id:
 *           type: integer
 *           example: 101
 *         tipo:
 *           type: string
 *           enum: [Académico, Conductual, Psicológico, Médico]
 *           example: "Académico"
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2023-06-15"
 *         periodo_evaluado:
 *           type: string
 *           example: "Primer Semestre 2023"
 *         url_reporte:
 *           type: string
 *           example: "https://storage.colegio.com/informes/801.pdf"
 *         url_anexos:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://storage.colegio.com/anexos/801-1.pdf"]
 *         observaciones:
 *           type: string
 *           example: "El alumno muestra mejora en matemáticas"
 *         creado_por:
 *           type: string
 *           example: "profesor.jimenez@colegio.com"
 *         estado:
 *           type: string
 *           example: "Activo"
 * 
 *     InformeGeneral:
 *       type: object
 *       properties:
 *         informe_id:
 *           type: integer
 *           example: 1
 *         tipo:
 *           type: string
 *           example: "Académico"
 *         nivel:
 *           type: string
 *           example: "Primaria"
 *         fecha_generacion:
 *           type: string
 *           format: date
 *           example: "2025-05-08"
 *         url_reporte:
 *           type: string
 *           example: "https://colegio.edu/reportes/123.pdf"
 *         colegio_id:
 *           type: integer
 *           example: 5
 */

// Rutas para Informes de Alumnos
/**
 * @swagger
 * /api/v1/informes/alumnos:
 *   get:
 *     summary: Obtener informes académicos completos
 *     description: Retorna todos los informes registrados con detalles del alumno, curso y documentos asociados
 *     tags: [Informes Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de alumno específico
 *         example: 101
 *       - in: query
 *         name: tipo_informe
 *         schema:
 *           type: string
 *           enum: [Académico, Conductual, Psicológico, Médico]
 *         description: Filtrar por tipo de informe
 *         example: "Académico"
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar informes desde esta fecha (formato YYYY-MM-DD)
 *         example: "2023-01-01"
 *     responses:
 *       200:
 *         description: Lista detallada de informes con documentos asociados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoInforme'
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No se encontraron informes
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_alumnos_informes, sessionAuth, AlumnoInformeService.obtener);

router.get(`${ruta_alumnos_informes}/generar`, sessionAuth, AlumnoInformeService.generarInformeManual);

router.get(`${ruta_alumnos_informes}/:id/pdf`, sessionAuth, AlumnoInformeService.generarPdfAlumno);

/**
 * @swagger
 * /api/v1/informes/alumnos:
 *   post:
 *     summary: Crear informe de alumno
 *     description: Registra un nuevo informe para un alumno
 *     tags: [Informes Alumnos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoInforme'
 *     responses:
 *       201:
 *         description: Informe creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoInforme'
 *       400:
 *         description: Datos inválidos para crear el informe
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_informes, sessionAuth, AlumnoInformeService.guardar);

/**
 * @swagger
 * /api/v1/informes/alumnos/{id}:
 *   put:
 *     summary: Actualizar informe de alumno
 *     description: Actualiza un informe existente de un alumno
 *     tags: [Informes Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del informe a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoInforme'
 *     responses:
 *       200:
 *         description: Informe actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoInforme'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Informe no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_informes + '/:id', sessionAuth, AlumnoInformeService.actualizar);

// Rutas para Informes Generales
/**
 * @swagger
 * /api/v1/informes/generale:
 *   get:
 *     summary: Obtener un informe general 
 *     tags: [Informes Generales]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del informe general
 *     responses:
 *       200:
 *         description: Informe general encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InformeGeneral'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Informe no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_informes_generales + '/', sessionAuth, InformeGeneralService.obtener);

router.get(ruta_informes_generales + '/generar', sessionAuth, InformeGeneralService.generarInformeManual);
router.get(`${ruta_informes_generales}/:id/pdf`, sessionAuth, InformeGeneralService.generarPdfGeneral);

/**
 * @swagger
 * /api/v1/informes/generales:
 *   post:
 *     summary: Crear un nuevo informe general
 *     description: Registra un nuevo informe general en el sistema
 *     tags: [Informes Generales]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - nivel
 *               - colegio_id
 *             properties:
 *               tipo:
 *                 type: string
 *                 description: Tipo de informe (académico, conductual, asistencia, etc.)
 *                 example: "académico"
 *               nivel:
 *                 type: string
 *                 description: Nivel educativo al que aplica el informe
 *                 example: "primaria"
 *               fecha_generacion:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de generación del informe (opcional, por defecto fecha actual)
 *                 example: "2025-05-20T10:30:00Z"
 *               url_reporte:
 *                 type: string
 *                 description: URL donde se almacena el reporte generado
 *                 example: "https://storage.colegio.com/informes/academico_primaria_20250520.pdf"
 *               colegio_id:
 *                 type: integer
 *                 description: ID del colegio al que pertenece el informe
 *                 example: 1
 *     responses:
 *       201:
 *         description: Informe creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InformeGeneral'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *         content:
 *           application/json:
 *             example:
 *               error: "El campo 'tipo' es requerido"
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error al guardar el informe en la base de datos"
 */
router.post(ruta_informes_generales + '/', sessionAuth, InformeGeneralService.guardar);

/**
 * @swagger
 * /api/v1/informes/generales/{id}:
 *   put:
 *     summary: Actualizar un informe general
 *     tags: [Informes Generales]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del informe general a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InformeGeneral'
 *     responses:
 *       200:
 *         description: Informe actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InformeGeneral'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Informe no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_informes_generales + '/:id', sessionAuth, InformeGeneralService.actualizar);

/**
 * @swagger
 * /api/v1/informes/generales/{id}:
 *   delete:
 *     summary: Eliminar un informe general
 *     tags: [Informes Generales]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del informe general a eliminar
 *     responses:
 *       200:
 *         description: Informe eliminado correctamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Informe no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_informes_generales + '/:id', sessionAuth, InformeGeneralService.eliminar);
/**
 * @swagger
 * components:
 *   schemas:
 *     InformeGeneral:
 *       type: object
 *       properties:
 *         informe_id:
 *           type: integer
 *           description: ID único del informe
 *           example: 1
 *         tipo:
 *           type: string
 *           description: Tipo de informe generado
 *           example: "académico"
 *         nivel:
 *           type: string
 *           description: Nivel educativo al que aplica
 *           example: "primaria"
 *         fecha_generacion:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de generación del informe
 *           example: "2025-05-20T10:30:00Z"
 *         url_reporte:
 *           type: string
 *           description: URL del informe generado
 *           example: "https://storage.colegio.com/informes/academico_primaria_20250520.pdf"
 *         colegio_id:
 *           type: integer
 *           description: ID del colegio relacionado
 *           example: 1
 *         colegio:
 *           $ref: '#/components/schemas/ColegioInfo'
 * 
 *     ColegioInfo:
 *       type: object
 *       properties:
 *         colegio_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Colegio Ejemplo"
 *         nombre_fantasia:
 *           type: string
 *           example: "Colegio Ejemplo S.A."
 *         direccion:
 *           type: string
 *           example: "Calle Principal 123"
 */
export default router;
