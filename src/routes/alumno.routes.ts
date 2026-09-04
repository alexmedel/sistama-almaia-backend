import express from 'express';
import { ActividadsService } from '../infrestructure/server/alumno/ActividadService';
import { AlumnoActividadService } from '../infrestructure/server/alumno/AlumnoActividadService';
import { AlumnoAlertaBitacoraService } from '../infrestructure/server/alumno/AlumnoAlertaBitacoraService';
import { AlumnoAlertaService } from '../infrestructure/server/alumno/AlumnoAlertaService';
import { AlumnoAntecedenteClinicosService } from '../infrestructure/server/alumno/AlumnoAntecedenteClinicoService';
import { AlumnoAntecedenteFamiliarsService } from '../infrestructure/server/alumno/AlumnoAntecedenteFamiliarService';
import { AlumnoCursoService } from '../infrestructure/server/alumno/AlumnoCursoService';
import { AlumnoDiarioService } from '../infrestructure/server/alumno/AlumnoDiarioService';
import { AlumnoDireccionService } from '../infrestructure/server/alumno/AlumnoDireccionService';
import { AlumnoMonitoreoService } from '../infrestructure/server/alumno/AlumnoMonitoreoService';
import { AlumnoNotificacionService } from '../infrestructure/server/alumno/AlumnoNotificacionService';
import { AlumnoPermisoAutorsService } from '../infrestructure/server/alumno/AlumnoPermisoAutorService';
import { AlumnosService } from '../infrestructure/server/alumno/AlumnoService';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { createSecureMemoryUpload } from '../helpers/secure-upload';

const router = express.Router();

const ruta_actividades = '/actividades';
const ruta_alumnos_alertas = '/alertas';
const ruta_alumnos_alertas_bitacoras = '/alertas_bitacoras';
const ruta_alumnos_antecedentes_clinicos = '/antecedentes_clinicos';
const ruta_alumnos_antecedentes_familiares = '/antecedentes_familiares';
const ruta_alumnos_cursos = '/cursos';
const ruta_alumnos_direcciones = '/direcciones';
const ruta_alumnos_monitoreos = '/monitoreos';
const ruta_alumnos_notificaciones = '/notificaciones';
const ruta_alumnos_actividades = '/alumnos_actividades';
const ruta_alumnos_permisos = '/permisos';
const ruta_alumnos_diarios = '/diarios';

const upload = createSecureMemoryUpload();
interface MulterRequest extends Request {
  file: Express.Multer.File;
}
/**
 * @swagger
 * tags:
 *   - name: Alumnos
 *     description: Gestión de datos de alumnos
 *   - name: Actividades
 *     description: Gestión de actividades de alumnos
 *   - name: Alertas
 *     description: Gestión de alertas de alumnos
 *   - name: Antecedentes
 *     description: Gestión de antecedentes médicos y familiares
 *   - name: Cursos
 *     description: Gestión de cursos de alumnos
 *   - name: Direcciones
 *     description: Gestión de direcciones de alumnos
 *   - name: Monitoreos
 *     description: Gestión de monitoreos de alumnos
 *   - name: Notificaciones
 *     description: Gestión de notificaciones de alumnos
 *   - name: AlumnoDiario
 *     description: Endpoints para gestionar los registros diarios de alumnos
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Actividad:
 *       type: object
 *       properties:
 *         actividad_id:
 *           type: integer
 *           description: ID único de la actividad
 *         nombre:
 *           type: string
 *           description: Nombre de la actividad
 *       required:
 *         - nombre
 * 
 *     Alumno:
 *       type: object
 *       properties:
 *         alumno_id:
 *           type: integer
 *           description: ID único del alumno
 *         colegio_id:
 *           type: integer
 *           description: ID del colegio asociado
 *         url_foto_perfil:
 *           type: string
 *           description: URL de la foto de perfil del alumno
 *         telefono_contacto1:
 *           type: string
 *           description: Teléfono de contacto principal
 *         email:
 *           type: string
 *           description: Email de contacto
 *         telefono_contacto2:
 *           type: string
 *           description: Teléfono de contacto secundario
 *       required:
 *         - colegio_id
 * 
 *     AlumnoActividad:
 *       type: object
 *       properties:
 *         alumno_actividad_id:
 *           type: integer
 *           description: ID único de la relación alumno-actividad
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno
 *         actividad_id:
 *           type: integer
 *           description: ID de la actividad
 *       required:
 *         - alumno_id
 *         - actividad_id
 * 
 *     AlumnoAlerta:
 *       type: object
 *       properties:
 *         alumno_alerta_id:
 *           type: integer
 *           description: ID único de la alerta
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         alerta_regla_id:
 *           type: integer
 *           description: ID de la regla que generó la alerta
 *         fecha_generada:
 *           type: string
 *           format: date-time
 *           description: Fecha de generación de la alerta
 *         fecha_resolucion:
 *           type: string
 *           format: date-time
 *           description: Fecha de resolución de la alerta
 *         alerta_origen_id:
 *           type: integer
 *           description: ID del origen de la alerta
 *         prioridad_id:
 *           type: integer
 *           description: ID de la prioridad de la alerta
 *         severidad_id:
 *           type: integer
 *           description: ID de la severidad de la alerta
 *         accion_tomada:
 *           type: string
 *           description: Acción tomada para resolver la alerta
 *         leida:
 *           type: boolean
 *           description: Indica si la alerta ha sido leída
 *         responsable_actual_id:
 *           type: integer
 *           description: ID del responsable actual de la alerta
 *         estado:
 *           type: string
 *           description: Estado actual de la alerta
 *         alertas_tipo_alerta_tipo_id:
 *           type: integer
 *           description: ID del tipo de alerta
 *       required:
 *         - alumno_id
 *         - alerta_regla_id
 *         - fecha_generada
 *         - alerta_origen_id
 *         - prioridad_id
 *         - severidad_id
 *         - leida
 *         - estado
 *         - alertas_tipo_alerta_tipo_id
 * 
 *     AlumnoAlertaBitacora:
 *       type: object
 *       properties:
 *         alumno_alerta_id:
 *           type: integer
 *           description: ID de la alerta asociada
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         plan_accion:
 *           type: string
 *           description: Plan de acción definido
 *         fecha_compromiso:
 *           type: string
 *           format: date-time
 *           description: Fecha de compromiso para la acción
 *         fecha_realizacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de realización de la acción
 *         url_archivo:
 *           type: string
 *           description: URL del archivo asociado
 *       required:
 *         - alumno_alerta_id
 *         - alumno_id
 *         - plan_accion
 * 
 *     AlumnoAntecedenteClinico:
 *       type: object
 *       properties:
 *         alumno_ant_clinico_id:
 *           type: integer
 *           description: ID único del antecedente clínico
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         historial_medico:
 *           type: string
 *           description: Historial médico del alumno
 *         alergias:
 *           type: string
 *           description: Alergias conocidas
 *         enfermedades_cronicas:
 *           type: string
 *           description: Enfermedades crónicas
 *         condiciones_medicas_relevantes:
 *           type: string
 *           description: Condiciones médicas relevantes
 *         medicamentos_actuales:
 *           type: string
 *           description: Medicamentos actuales
 *         diagnosticos_previos:
 *           type: string
 *           description: Diagnósticos previos
 *         terapias_tratamiento_curso:
 *           type: string
 *           description: Terapias o tratamientos en curso
 *       required:
 *         - alumno_id
 * 
 *     AlumnoAntecedenteFamiliar:
 *       type: object
 *       properties:
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         informacion_socio_economica:
 *           type: string
 *           description: Información socioeconómica
 *         composicion_familiar:
 *           type: string
 *           description: Composición familiar
 *         situacion_laboral_padres:
 *           type: string
 *           description: Situación laboral de los padres
 *         recursos_disponibles:
 *           type: string
 *           description: Recursos disponibles
 *         dinamica_familiar:
 *           type: string
 *           description: Dinámica familiar
 *         relaciones_familiares:
 *           type: string
 *           description: Relaciones familiares
 *         apoyo_emocional:
 *           type: string
 *           description: Apoyo emocional
 *         factores_riesgo:
 *           type: string
 *           description: Factores de riesgo
 *         observaciones_entrevistador:
 *           type: string
 *           description: Observaciones del entrevistador
 *         resumen_entrevista:
 *           type: string
 *           description: Resumen de la entrevista
 *         impresiones_recomendaciones:
 *           type: string
 *           description: Impresiones y recomendaciones
 *         procesos_pisicoteurapeuticos_adicionales:
 *           type: string
 *           description: Procesos psicoterapéuticos adicionales
 *         desarrollo_social:
 *           type: string
 *           description: Desarrollo social
 *         fecha_inicio_escolaridad:
 *           type: string
 *           format: date
 *           description: Fecha de inicio de escolaridad
 *         personas_apoya_aprendzaje_alumno:
 *           type: string
 *           description: Personas que apoyan el aprendizaje
 *         higiene_sueno:
 *           type: string
 *           description: Hábitos de higiene de sueño
 *         uso_plantillas:
 *           type: string
 *           description: Uso de plantillas
 *         otros_antecedentes_relevantes:
 *           type: string
 *           description: Otros antecedentes relevantes
 *       required:
 *         - alumno_id
 * 
 *     AlumnoCurso:
 *       type: object
 *       properties:
 *         alumno_curso_id:
 *           type: integer
 *           description: ID único de la relación alumno-curso
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno
 *         curso_id:
 *           type: integer
 *           description: ID del curso
 *         ano_escolar:
 *           type: integer
 *           description: Año escolar
 *         fecha_ingreso:
 *           type: string
 *           format: date
 *           description: Fecha de ingreso al curso
 *         fecha_egreso:
 *           type: string
 *           format: date
 *           description: Fecha de egreso del curso
 *       required:
 *         - alumno_id
 *         - curso_id
 *         - ano_escolar
 * 
 *     AlumnoDireccion:
 *       type: object
 *       properties:
 *         alumno_direccion_id:
 *           type: integer
 *           description: ID único de la dirección
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
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
 *         - alumno_id
 *         - descripcion
 *         - comuna_id
 *         - region_id
 *         - pais_id
 * 
 *     AlumnoInforme:
 *       type: object
 *       properties:
 *         alumno_informe_id:
 *           type: integer
 *           description: ID único del informe
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         fecha:
 *           type: string
 *           format: date
 *           description: Fecha del informe
 *         url_reporte:
 *           type: string
 *           description: URL del reporte
 *       required:
 *         - alumno_id
 *         - fecha
 * 
 *     AlumnoMonitoreo:
 *       type: object
 *       properties:
 *         alumno_monitoreo_id:
 *           type: integer
 *           description: ID único del monitoreo
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         fecha_accion:
 *           type: string
 *           format: date-time
 *           description: Fecha de la acción
 *         tipo_accion:
 *           type: string
 *           description: Tipo de acción realizada
 *         descripcion_accion:
 *           type: string
 *           description: Descripción de la acción
 *       required:
 *         - alumno_id
 *         - fecha_accion
 *         - tipo_accion
 * 
 *     AlumnoNotificacion:
 *       type: object
 *       properties:
 *         alumno_notificacion_id:
 *           type: integer
 *           description: ID único de la notificación
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         tipo:
 *           type: string
 *           description: Tipo de notificación
 *         asunto:
 *           type: string
 *           description: Asunto de la notificación
 *         cuerpo:
 *           type: string
 *           description: Cuerpo del mensaje
 *         enviada:
 *           type: boolean
 *           description: Indica si la notificación fue enviada
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *           description: Fecha de envío
 *       required:
 *         - alumno_id
 *         - tipo
 *         - asunto
 *         - cuerpo
 *         - enviada
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session
 */

// Rutas principales de Alumnos
/**
 * @swagger
 * /api/v1/alumnos:
 *   get:
 *     summary: Obtener lista de alumnos con información completa
 *     description: Retorna alumnos registrados en el sistema incluyendo datos personales, colegio y cursos asociados
 *     tags: [Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID específico de alumno
 *         example: 7
 *       - in: query
 *         name: colegio_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de colegio
 *         example: 1
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *         example: true
 *       - in: query
 *         name: curso_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de curso
 *         example: 9
 *     responses:
 *       200:
 *         description: Lista de alumnos obtenida correctamente con información completa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoCompleto'
 *             example:
 *               - alumno_id: 7
 *                 colegio_id: 1
 *                 url_foto_perfil: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *                 telefono_contacto1: "+56 9 1284 5678"
 *                 email: "alumno2.demo@colegio.cl"
 *                 telefono_contacto2: "+56 9 8765 4321"
 *                 creado_por: 0
 *                 actualizado_por: 1
 *                 fecha_creacion: "2025-05-10T19:37:38.661"
 *                 fecha_actualizacion: "2025-05-10T19:37:38.661"
 *                 activo: false
 *                 persona_id: 2
 *                 personas:
 *                   nombres: "Carlos"
 *                   apellidos: "Muñoz"
 *                   persona_id: 2
 *                   fecha_nacimiento: null
 *                 colegios:
 *                   nombre: "Colegio Bicentenario Santiago Centro"
 *                   colegio_id: 1
 *                 cursos:
 *                   - grados:
 *                       nombre: "Quinto Básico"
 *                       grado_id: 9
 *                     niveles_educativos:
 *                       nombre: "Educación Básica"
 *                       nivel_educativo_id: 1
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado - Sesión no válida
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AlumnoCompleto:
 *       type: object
 *       properties:
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         colegio_id:
 *           type: integer
 *           example: 1
 *         url_foto_perfil:
 *           type: string
 *           example: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *         telefono_contacto1:
 *           type: string
 *           example: "+56 9 1284 5678"
 *         email:
 *           type: string
 *           example: "alumno2.demo@colegio.cl"
 *         telefono_contacto2:
 *           type: string
 *           example: "+56 9 8765 4321"
 *         creado_por:
 *           type: integer
 *           example: 0
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-10T19:37:38.661"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-10T19:37:38.661"
 *         activo:
 *           type: boolean
 *           example: false
 *         persona_id:
 *           type: integer
 *           example: 2
 *         personas:
 *           type: object
 *           properties:
 *             nombres:
 *               type: string
 *               example: "Carlos"
 *             apellidos:
 *               type: string
 *               example: "Muñoz"
 *             persona_id:
 *               type: integer
 *               example: 2
 *             fecha_nacimiento:
 *               type: string
 *               format: date
 *               nullable: true
 *               example: null
 *         colegios:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Colegio Bicentenario Santiago Centro"
 *             colegio_id:
 *               type: integer
 *               example: 1
 *         cursos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               grados:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                     example: "Quinto Básico"
 *                   grado_id:
 *                     type: integer
 *                     example: 9
 *               niveles_educativos:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                     example: "Educación Básica"
 *                   nivel_educativo_id:
 *                     type: integer
 *                     example: 1
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session
 */
router.get('/', sessionAuth, sessionAuth, AlumnosService.obtener);
router.get('/get/:alumno_id', sessionAuth, sessionAuth, AlumnosService.obtenerUno);
router.put('/perfilOne', sessionAuth, sessionAuth, AlumnosService.actualizarAlumno);
/**
 * @swagger
 * /api/v1/alumnos/racha:
 *   get:
 *     summary: Obtiene estadísticas de racha y respuestas de un alumno
 *     description: Retorna información sobre las respuestas correctas y la mejor racha semanal de un alumno
 *     tags:
 *       - Alumnos
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         schema:
 *           type: string
 *         description: ID del alumno para obtener sus estadísticas
 *         required: true
 *     responses:
 *       200:
 *         description: Estadísticas de desempeño del alumno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_respuestas_correctas:
 *                   type: integer
 *                   example: 9
 *                   description: Total de respuestas correctas acumuladas
 *                 mejor_racha_semanal:
 *                   type: integer
 *                   example: 2
 *                   description: Máxima racha de respuestas correctas consecutivas en una semana
 *       400:
 *         description: Falta el parámetro alumno_id o es inválido
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error detallado
 */
router.get('/racha', sessionAuth, AlumnosService.obtenerRacha);

/**
 * @swagger
 * /api/v1/alumnos/logros:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Obtiene los logros de un alumno
 *     description: Retorna un objeto indicando qué actividades ha completado el alumno en el día actual
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno para consultar sus logros
 *     responses:
 *       200:
 *         description: Objeto con los logros del alumno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registro_tarea:
 *                   type: boolean
 *                   description: Indica si el alumno registró tarea hoy
 *                   example: false
 *                 respondio_pregunta:
 *                   type: boolean
 *                   description: Indica si el alumno respondió preguntas hoy
 *                   example: false
 *                 realizo_registro:
 *                   type: boolean
 *                   description: Indica si el alumno realizó algún registro hoy
 *                   example: false
 *       400:
 *         description: Falta el parámetro alumno_id o es inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Falta el parámetro alumno_id"
 *       500:
 *         description: Error interno del servidor al obtener los logros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error message from the server"
 */
router.get('/logros', sessionAuth, AlumnosService.obtenerLogros);
/**
 * @swagger
 * /api/v1/alumnos/registro_semanal:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Obtiene el registro semanal de un alumno
 *     description: Retorna un array con los días de la semana indicando cuáles fueron completados por el alumno
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno para consultar su registro semanal
 *     responses:
 *       200:
 *         description: Array con el estado de completado para cada día de la semana
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Identificador único del día
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: Nombre del día (hoy, ayer o abreviación)
 *                     example: "Hoy"
 *                   completed:
 *                     type: boolean
 *                     description: Indica si el alumno completó las actividades ese día
 *                     example: false
 *       400:
 *         description: Falta el parámetro alumno_id o es inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Falta el parámetro alumno_id"
 *       500:
 *         description: Error interno del servidor al obtener el registro semanal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error message from the server"
 */
router.get('/registro_semanal', sessionAuth, AlumnosService.obtenerRegistroSemanal);

/**
 * @swagger
 * /api/v1/alumnos/perfil:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Obtiene el perfil completo del alumno autenticado
 *     description: Retorna información detallada del usuario, persona, rol, funcionalidades y apoderados asociados
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Perfil completo del alumno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     usuario_id:
 *                       type: integer
 *                       example: 9
 *                     nombre_social:
 *                       type: string
 *                       example: "Diegito"
 *                     email:
 *                       type: string
 *                       example: "diego@almaia.cl"
 *                     telefono_contacto:
 *                       type: string
 *                       example: "5465464546"
 *                     ultimo_inicio_sesion:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-04T18:27:31.085"
 *                     estado_usuario:
 *                       type: string
 *                       example: ""
 *                     url_foto_perfil:
 *                       type: string
 *                       format: url
 *                       example: "https://example.com/profile.jpg"
 *                     persona_id:
 *                       type: integer
 *                       example: 6
 *                     rol_id:
 *                       type: integer
 *                       example: 2
 *                     idioma_id:
 *                       type: integer
 *                       example: 4
 *                     idioma:
 *                       type: object
 *                       properties:
 *                         activo:
 *                           type: boolean
 *                         nombre:
 *                           type: string
 *                           example: "Español"
 *                         idioma_id:
 *                           type: integer
 *                         creado_por:
 *                           type: integer
 *                         descripcion:
 *                           type: string
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                         actualizado_por:
 *                           type: integer
 *                         url_foto_bandera:
 *                           type: string
 *                           format: url
 *                         fecha_actualizacion:
 *                           type: string
 *                           format: date-time
 *                     colegio:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *                           example: "Colegio Bicentenario Santiago Centro"
 *                         colegio_id:
 *                           type: integer
 *                           example: 1
 *                 persona:
 *                   type: object
 *                   properties:
 *                     persona_id:
 *                       type: integer
 *                       example: 6
 *                     tipo_documento:
 *                       type: string
 *                       example: "RUN"
 *                     numero_documento:
 *                       type: string
 *                       example: "16738492"
 *                     nombres:
 *                       type: string
 *                       example: "Andrés"
 *                     apellidos:
 *                       type: string
 *                       example: "Gutiérrez"
 *                     genero_id:
 *                       type: integer
 *                       example: 1
 *                     estado_civil_id:
 *                       type: integer
 *                       example: 2
 *                     fecha_nacimiento:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                 rol:
 *                   type: object
 *                   properties:
 *                     rol_id:
 *                       type: integer
 *                       example: 2
 *                     nombre:
 *                       type: string
 *                       example: "Alumno"
 *                     descripcion:
 *                       type: string
 *                       example: "Acceso completo al sistema"
 *                 funcionalidades:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example: []
 *                 apoderados:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       activo:
 *                         type: boolean
 *                       alumno_id:
 *                         type: integer
 *                       apoderados:
 *                         type: object
 *                         properties:
 *                           activo:
 *                             type: boolean
 *                           personas:
 *                             type: object
 *                             properties:
 *                               nombres:
 *                                 type: string
 *                               apellidos:
 *                                 type: string
 *                               genero_id:
 *                                 type: integer
 *                               persona_id:
 *                                 type: integer
 *                               tipo_documento:
 *                                 type: string
 *                               estado_civil_id:
 *                                 type: integer
 *                               fecha_nacimiento:
 *                                 type: string
 *                                 format: date
 *                               numero_documento:
 *                                 type: string
 *                           colegio_id:
 *                             type: integer
 *                           creado_por:
 *                             type: integer
 *                           persona_id:
 *                             type: integer
 *                           apoderado_id:
 *                             type: integer
 *                           profesion_id:
 *                             type: integer
 *                             nullable: true
 *                           fecha_creacion:
 *                             type: string
 *                             format: date-time
 *                           tipo_oficio_id:
 *                             type: integer
 *                             nullable: true
 *                           actualizado_por:
 *                             type: integer
 *                           email_contacto1:
 *                             type: string
 *                           email_contacto2:
 *                             type: string
 *                             nullable: true
 *                           telefono_contacto1:
 *                             type: string
 *                           telefono_contacto2:
 *                             type: string
 *                             nullable: true
 *                           fecha_actualizacion:
 *                             type: string
 *                             format: date-time
 *                       creado_por:
 *                         type: integer
 *                       apoderado_id:
 *                         type: integer
 *                       observaciones:
 *                         type: string
 *                       estado_usuario:
 *                         type: string
 *                       fecha_creacion:
 *                         type: string
 *                         format: date-time
 *                       tipo_apoderado:
 *                         type: string
 *                       actualizado_por:
 *                         type: integer
 *                       alumno_apoderado_id:
 *                         type: integer
 *                       fecha_actualizacion:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autorizado (sesión no válida)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/perfil', sessionAuth, AlumnosService.obtenerPerfil);

/**
 * @swagger
 * /api/v1/alumnos/detalle/{alumnoId}:
 *   get:
 *     summary: Obtiene los detalles completos de un alumno
 *     description: Retorna información detallada del alumno incluyendo datos personales, ficha clínica, alertas, informes, emociones, datos comparativos y apoderados
 *     tags: [Alumnos]
 *     parameters:
 *       - in: path
 *         name: alumnoId
 *         required: true
 *         description: ID único del alumno
 *         schema:
 *           type: integer
 *           example: 7
 *     responses:
 *       200:
 *         description: Detalles del alumno obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alumno:
 *                   $ref: '#/components/schemas/AlumnoDetalle'
 *                 ficha:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FichaClinica'
 *                 alertas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlertaAlumno'
 *                 informes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InformeAlumno'
 *                 emociones:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmocionAlumno'
 *                 datosComparativa:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DatosComparativa'
 *                 apoderados:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApoderadoAlumno'
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AlumnoDetalle:
 *       type: object
 *       properties:
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         colegio_id:
 *           type: integer
 *           example: 1
 *         url_foto_perfil:
 *           type: string
 *           example: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *         telefono_contacto1:
 *           type: string
 *           example: "+56 9 1284 5678"
 *         email:
 *           type: string
 *           example: "alextest@colegio.cl"
 *         telefono_contacto2:
 *           type: string
 *           example: "+56 9 8765 4321"
 *         creado_por:
 *           type: integer
 *           example: 0
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-10T19:37:38.661"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-10T19:37:38.661"
 *         activo:
 *           type: boolean
 *           example: false
 *         persona_id:
 *           type: integer
 *           example: 2
 *         personas:
 *           type: object
 *           properties:
 *             generos:
 *               type: object
 *               properties:
 *                 nombre:
 *                   type: string
 *                   example: "Masculino"
 *                 genero_id:
 *                   type: integer
 *                   example: 1
 *             nombres:
 *               type: string
 *               example: "Carlos"
 *             apellidos:
 *               type: string
 *               example: "Muñoz"
 *             persona_id:
 *               type: integer
 *               example: 2
 *             fecha_nacimiento:
 *               type: string
 *               nullable: true
 *               example: null
 *         colegios:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Colegio Bicentenario Santiago Centro"
 *             colegio_id:
 *               type: integer
 *               example: 1
 *         cursos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               grados:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                     example: "Quinto Básico"
 *                   grado_id:
 *                     type: integer
 *                     example: 9
 *               niveles_educativos:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                     example: "Educación Básica"
 *                   nivel_educativo_id:
 *                     type: integer
 *                     example: 1
 * 
 *     FichaClinica:
 *       type: object
 *       properties:
 *         alumno_ant_clinico_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         historial_medico:
 *           type: string
 *           example: "prueba"
 *         alergias:
 *           type: string
 *           example: "generales"
 *         enfermedades_cronicas:
 *           type: string
 *           example: "ninguna"
 *         condiciones_medicas_relevantes:
 *           type: string
 *           example: "ninguna"
 *         medicamentos_actuales:
 *           type: string
 *           example: "nn"
 *         diagnosticos_previos:
 *           type: string
 *           example: " "
 *         terapias_tratamiento_curso:
 *           type: string
 *           example: "nn"
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T11:53:31.993"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T11:53:31.993"
 *         activo:
 *           type: boolean
 *           example: true
 * 
 *     AlertaAlumno:
 *       type: object
 *       properties:
 *         alumno_alerta_id:
 *           type: integer
 *           example: 20
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         alerta_regla_id:
 *           type: integer
 *           example: 3
 *         fecha_generada:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T23:19:15.916283"
 *         fecha_resolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         alerta_origen_id:
 *           type: integer
 *           example: 1
 *         prioridad_id:
 *           type: integer
 *           example: 3
 *         severidad_id:
 *           type: integer
 *           example: 2
 *         accion_tomada:
 *           type: string
 *           nullable: true
 *           example: null
 *         leida:
 *           type: boolean
 *           example: false
 *         responsable_actual_id:
 *           type: integer
 *           example: 5
 *         estado:
 *           type: string
 *           example: "pendiente"
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T23:19:15.916283"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T23:19:15.916283"
 *         activo:
 *           type: boolean
 *           example: true
 *         alertas_tipo_alerta_tipo_id:
 *           type: integer
 *           example: 3
 *         alertas_reglas:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Regla Orgullo Recurrente"
 *             alerta_regla_id:
 *               type: integer
 *               example: 3
 *         alertas_origenes:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Alumno"
 *             alerta_origen_id:
 *               type: integer
 *               example: 1
 *         alertas_severidades:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Media"
 *             alerta_severidad_id:
 *               type: integer
 *               example: 2
 * 
 *     InformeAlumno:
 *       type: object
 *       properties:
 *         alumno_informe_id:
 *           type: integer
 *           example: 0
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         fecha:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T00:00:00"
 *         url_reporte:
 *           type: string
 *           example: "https://storage.colegio.com/informes/801.pdf"
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T04:56:59.736"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T04:56:59.736"
 *         activo:
 *           type: boolean
 *           example: true
 * 
 *     EmocionAlumno:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Felicidad"
 *         valor:
 *           type: integer
 *           example: 3100
 * 
 *     DatosComparativa:
 *       type: object
 *       properties:
 *         emocion:
 *           type: string
 *           example: "Feliz"
 *         alumno:
 *           type: number
 *           example: 2
 *         promedio:
 *           type: number
 *           example: 1.5
 * 
 *     ApoderadoAlumno:
 *       type: object
 *       properties:
 *         alumno_apoderado_id:
 *           type: integer
 *           example: 11
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         apoderado_id:
 *           type: integer
 *           example: 1
 *         tipo_apoderado:
 *           type: string
 *           example: "titular"
 *         observaciones:
 *           type: string
 *           example: "Sin observaciones"
 *         estado_usuario:
 *           type: string
 *           example: "activo"
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-13T20:57:14.09499"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-13T20:57:14.09499"
 *         activo:
 *           type: boolean
 *           example: true
 *         apoderados:
 *           type: object
 *           properties:
 *             personas:
 *               type: object
 *               properties:
 *                 nombres:
 *                   type: string
 *                   example: "Camila"
 *                 apellidos:
 *                   type: string
 *                   example: "Gómez"
 *                 persona_id:
 *                   type: integer
 *                   example: 1
 *             apoderado_id:
 *               type: integer
 *               example: 1
 *             email_contacto1:
 *               type: string
 *               example: "apo1@mail.com"
 *             email_contacto2:
 *               type: string
 *               nullable: true
 *               example: null
 *             telefono_contacto1:
 *               type: string
 *               example: "987654321"
 *             telefono_contacto2:
 *               type: string
 *               nullable: true
 *               example: null
 */
router.get('/detalle/:alumnoId/emociones/top', sessionAuth, AlumnosService.getTopEmocionesAlumno);
router.get('/detalle/:alumnoId/emociones/top-negativas', sessionAuth, AlumnosService.getTopEmocionesAlumno);
router.get('/detalle/:alumnoId/emociones/comparativa', sessionAuth, AlumnosService.getComparativaEmocionesAlumno);
router.get('/detalle/:alumnoId/patologias/top', sessionAuth, AlumnosService.getTopPatologiasAlumno);
router.get('/detalle/:alumnoId/neurodivergencias/top', sessionAuth, AlumnosService.getTopNeurodivergenciasAlumno);
router.get('/detalle/:alumnoId', sessionAuth, AlumnosService.getAlumnoDetalle);

/**
 * @swagger
 * /api/v1/alumnos:
 *   post:
 *     summary: Crear un nuevo alumno
 *     description: Registra un nuevo alumno en el sistema
 *     tags: [Alumnos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Alumno'
 *     responses:
 *       201:
 *         description: Alumno creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alumno'
 *       400:
 *         description: Datos inválidos para crear el alumno
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', sessionAuth, AlumnosService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/{id}:
 *   put:
 *     summary: Actualizar datos de alumno
 *     description: Actualiza la información de un alumno existente
 *     tags: [Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Alumno'
 *     responses:
 *       200:
 *         description: Alumno actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alumno'
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', sessionAuth,  AlumnosService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/{id}:
 *   delete:
 *     summary: Eliminar alumno
 *     description: Elimina un alumno del sistema
 *     tags: [Alumnos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno a eliminar
 *     responses:
 *       204:
 *         description: Alumno eliminado exitosamente
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', sessionAuth, AlumnosService.eliminar);

// Rutas para Actividades
/**
 * @swagger
 * /api/v1/alumnos/actividades:
 *   get:
 *     summary: Obtener actividades de alumnos
 *     description: Retorna todas las actividades registradas
 *     tags: [Actividades]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de actividades obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Actividad'
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_actividades, sessionAuth, ActividadsService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/actividades:
 *   post:
 *     summary: Crear nueva actividad
 *     description: Registra una nueva actividad para alumnos
 *     tags: [Actividades]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actividad'
 *     responses:
 *       201:
 *         description: Actividad creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Actividad'
 *       400:
 *         description: Datos inválidos para crear la actividad
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_actividades, sessionAuth, ActividadsService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/actividades/{id}:
 *   put:
 *     summary: Actualizar actividad
 *     description: Actualiza una actividad existente
 *     tags: [Actividades]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la actividad a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Actividad'
 *     responses:
 *       200:
 *         description: Actividad actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Actividad'
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_actividades + '/:id', sessionAuth,  ActividadsService.actualizar);
/**
 * @swagger
 * /api/v1/alumnos/perfil/{id}:
 *   put:
 *     summary: Actualiza el perfil de un alumno
 *     description: Actualiza la información personal y de usuario de un alumno
 *     tags:
 *       - Alumnos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario/alumno a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_social
 *               - email
 *               - rol_id
 *               - telefono_contacto
 *               - url_foto_perfil
 *               - idioma_id
 *             properties:
 *               nombre_social:
 *                 type: string
 *                 maxLength: 50
 *                 description: Nombre social del usuario
 *               email:
 *                 type: string
 *                 maxLength: 150
 *                 description: Email del usuario
 *               encripted_password:
 *                 type: string
 *                 maxLength: 35
 *                 description: Contraseña encriptada (opcional)
 *               nombres:
 *                 type: string
 *                 maxLength: 35
 *                 description: Nombres de la persona (opcional)
 *               apellidos:
 *                 type: string
 *                 maxLength: 35
 *                 description: Apellidos de la persona (opcional)
 *               fecha_nacimiento:
 *                 type: string
 *                 description: Fecha de nacimiento (opcional)
 *               numero_documento:
 *                 type: string
 *                 description: Número de documento (opcional)
 *               rol_id:
 *                 type: integer
 *                 description: ID del rol del usuario
 *               telefono_contacto:
 *                 type: string
 *                 maxLength: 150
 *                 description: Teléfono de contacto
 *               url_foto_perfil:
 *                 type: string
 *                 maxLength: 255
 *                 description: URL de la foto de perfil
 *               idioma_id:
 *                 type: integer
 *                 description: ID del idioma preferido
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error de validación o datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de error
 *       404:
 *         description: Usuario, rol o idioma no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de error
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *         nombre_social:
 *           type: string
 *         email:
 *           type: string
 *         telefono_contacto:
 *           type: string
 *         url_foto_perfil:
 *           type: string
 *         idioma_id:
 *           type: integer
 *         rol_id:
 *           type: integer
 *         persona_id:
 *           type: integer
 *         creado_por:
 *           type: integer
 *         actualizado_por:
 *           type: integer
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

//actuliza perfil usuario
router.put('/perfil/update', sessionAuth, upload.single('url_foto_perfil'), AlumnosService.actualizarPerfil);

/**
 * @swagger
 * /api/v1/alumnos/actividades/{id}:
 *   delete:
 *     summary: Eliminar actividad
 *     description: Elimina una actividad del sistema
 *     tags: [Actividades]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la actividad a eliminar
 *     responses:
 *       204:
 *         description: Actividad eliminada exitosamente
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_actividades + '/:id', sessionAuth, ActividadsService.eliminar);

// Rutas para Alertas
/**
 * @swagger
 * /api/v1/alumnos/alertas:
 *   get:
 *     summary: Obtener alertas de alumnos con relaciones completas
 *     description: Retorna todas las alertas registradas con información detallada del alumno, prioridad, severidad y tipo de alerta
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas obtenida correctamente con todos sus objetos relacionados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoAlerta'
 *             example:
 *               - alumno_alerta_id: 201
 *                 alumno_id: 101
 *                 alerta_regla_id: 3
 *                 fecha_generada: "2023-06-15T14:30:00Z"
 *                 fecha_resolucion: null
 *                 estado: "Pendiente"
 *                 accion_tomada: null
 *                 leida: false
 *                 prioridad_id: 1
 *                 severidad_id: 2
 *                 alertas_tipo_alerta_tipo_id: 4
 *                 alumno:
 *                   alumno_id: 101
 *                   nombre: "Juan Pérez"
 *                   email: "juan.perez@colegio.com"
 *                   colegio:
 *                     colegio_id: 1
 *                     nombre: "Colegio Ejemplo"
 *                 prioridad:
 *                   alerta_prioridad_id: 1
 *                   nombre: "Alta"
 *                   color: "#FF0000"
 *                 severidad:
 *                   alerta_severidad_id: 2
 *                   nombre: "Media"
 *                   icono: "warning"
 *                 tipo_alerta:
 *                   alerta_tipo_id: 4
 *                   nombre: "Rendimiento Académico"
 *                   descripcion: "Alertas relacionadas con bajo rendimiento"
 *               - alumno_alerta_id: 202
 *                 alumno_id: 102
 *                 alerta_regla_id: 5
 *                 fecha_generada: "2023-06-16T09:15:00Z"
 *                 fecha_resolucion: "2023-06-16T16:45:00Z"
 *                 estado: "Resuelta"
 *                 accion_tomada: "Se contactó al apoderado"
 *                 leida: true
 *                 prioridad_id: 2
 *                 severidad_id: 1
 *                 alertas_tipo_alerta_tipo_id: 3
 *                 alumno:
 *                   alumno_id: 102
 *                   nombre: "María González"
 *                   email: "maria.gonzalez@colegio.com"
 *                 prioridad:
 *                   alerta_prioridad_id: 2
 *                   nombre: "Media"
 *                   color: "#FFA500"
 *                 severidad:
 *                   alerta_severidad_id: 1
 *                   nombre: "Baja"
 *                   icono: "info"
 *                 tipo_alerta:
 *                   alerta_tipo_id: 3
 *                   nombre: "Asistencia"
 *                   descripcion: "Alertas relacionadas con inasistencias"
 *       401:
 *         description: No autorizado - Token inválido o faltante
 *         content:
 *           application/json:
 *             example:
 *               error: "No autorizado"
 *               mensaje: "Token de autenticación inválido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error del servidor"
 *               mensaje: "Ocurrió un error al procesar la solicitud"
 *               detalles: "Error de conexión con la base de datos"
 */
router.get(ruta_alumnos_alertas, sessionAuth, AlumnoAlertaService.obtener);
/**
 * @swagger
 * /api/v1/alumnos/alertas/{id}:
 *   get:
 *     summary: Obtener el detalle completo de una alerta de alumno
 *     description: Retorna toda la información detallada de una alerta específica de alumno, incluyendo datos del alumno, reglas de alerta, prioridad, severidad y tipo.
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alerta de alumno a consultar
 *     responses:
 *       200:
 *         description: Detalle de la alerta de alumno obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaAlumnoDetallada'
 *       401:
 *         description: No autorizado, falta autenticación
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/v1/alumnos/alertas/conteo:
 *   get:
 *     tags:
 *       - "Alertas de Alumnos"
 *     summary: "Obtiene el conteo de alertas pendientes"
 *     description: |
 *       Cuenta alertas en estado 'pendiente'.
 *       - Filtra por `colegio_id` si se proporciona.
 *       - Sin parámetros: conteo total.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: colegio_id
 *         schema:
 *           type: integer
 *           example: 1
 *         description: "ID del colegio para filtrar (opcional)"
 *     responses:
 *       '200':
 *         description: "Conteo exitoso"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 15
 *       '400':
 *         description: "Error en parámetros"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "colegio_id debe ser un número"
 *       '500':
 *         description: "Error interno"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al contar alertas pendientes"
 */
router.get(ruta_alumnos_alertas + "/conteo", sessionAuth, AlumnoAlertaService.DistribucionAlertas);
/**
 * @swagger
 * /api/v1/alumnos/buscar:
 *   post:
 *     summary: Busca alumnos por término de búsqueda
 *     description: Realiza una búsqueda de alumnos basada en un término proporcionado
 *     tags:
 *       - Alumnos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termino
 *             properties:
 *               termino:
 *                 type: string
 *                 description: Término de búsqueda para encontrar alumnos
 *                 example: "Juan Pérez"
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   alumno_id:
 *                     type: integer
 *                     example: 123
 *                   nombres:
 *                     type: string
 *                     example: "Juan"
 *                   apellidos:
 *                     type: string
 *                     example: "Pérez"
 *                   url_foto_perfil:
 *                     type: string
 *                     example: "https://ejemplo.com/foto.jpg"
 *                   # Agrega aquí otras propiedades que devuelva tu función buscarAlumnos
 *       400:
 *         description: Solicitud incorrecta - falta el término de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Debe proporcionar un campo 'termino' en el cuerpo de la solicitud"
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
router.post("/buscar", sessionAuth, AlumnosService.buscar);


/**
 * @swagger
 * components:
 *   schemas:
 *     AlertaAlumnoDetallada:
 *       type: object
 *       properties:
 *         alumno_alerta_id:
 *           type: integer
 *           example: 14
 *           description: ID único de la alerta del alumno
 *         alumno_id:
 *           type: integer
 *           example: 7
 *           description: ID del alumno asociado
 *         alerta_regla_id:
 *           type: integer
 *           example: 2
 *           description: ID de la regla que generó la alerta
 *         fecha_generada:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T20:13:12.302209"
 *           description: Fecha y hora cuando se generó la alerta
 *         fecha_resolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *           description: Fecha y hora cuando se resolvió la alerta (null si no está resuelta)
 *         alerta_origen_id:
 *           type: integer
 *           example: 1
 *           description: ID del origen de la alerta
 *         prioridad_id:
 *           type: integer
 *           example: 2
 *           description: ID de la prioridad asignada
 *         severidad_id:
 *           type: integer
 *           example: 1
 *           description: ID de la severidad asignada
 *         accion_tomada:
 *           type: string
 *           nullable: true
 *           example: null
 *           description: Descripción de la acción tomada (null si no hay acción)
 *         leida:
 *           type: boolean
 *           example: false
 *           description: Indica si la alerta ha sido leída
 *         responsable_actual_id:
 *           type: integer
 *           example: 5
 *           description: ID del usuario responsable actual de la alerta
 *         estado:
 *           type: string
 *           example: "pendiente"
 *           enum: [pendiente, en_proceso, resuelta, descartada]
 *           description: Estado actual de la alerta
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
 *           example: "2025-05-12T20:13:12.302209"
 *           description: Fecha de creación del registro
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-12T20:13:12.302209"
 *           description: Fecha de última actualización del registro
 *         activo:
 *           type: boolean
 *           example: true
 *           description: Indica si el registro está activo
 *         alertas_tipo_alerta_tipo_id:
 *           type: integer
 *           example: 2
 *           description: ID del tipo de alerta
 *         alumnos:
 *           type: object
 *           properties:
 *             personas:
 *               type: object
 *               properties:
 *                 nombres:
 *                   type: string
 *                   example: "Carlos"
 *                 apellidos:
 *                   type: string
 *                   example: "Muñoz"
 *                 persona_id:
 *                   type: integer
 *                   example: 2
 *             alumno_id:
 *               type: integer
 *               example: 7
 *             url_foto_perfil:
 *               type: string
 *               example: "https://example.com/foto.jpg"
 *           description: Información detallada del alumno asociado
 *         alertas_reglas:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Regla Tranquilidad Constante"
 *             alerta_regla_id:
 *               type: integer
 *               example: 2
 *           description: Información de la regla que generó la alerta
 *         alertas_origenes:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "SOS"
 *             alerta_origen_id:
 *               type: integer
 *               example: 1
 *           description: Origen de la alerta
 *         alertas_severidades:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Baja"
 *             alerta_severidad_id:
 *               type: integer
 *               example: 1
 *           description: Nivel de severidad de la alerta
 *         alertas_prioridades:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "Media"
 *             alerta_prioridad_id:
 *               type: integer
 *               example: 2
 *           description: Nivel de prioridad de la alerta
 *         alertas_tipos:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *               example: "SOS ALMA"
 *             alerta_tipo_id:
 *               type: integer
 *               example: 2
 *           description: Tipo de alerta
 */
router.get(ruta_alumnos_alertas + "/:id", sessionAuth, AlumnoAlertaService.detalle);

/**
 * @swagger
 * /api/v1/alumnos/alertas:
 *   post:
 *     summary: Crear nueva alerta para un alumno
 *     description: Registra una nueva alerta en el sistema asociada a un alumno específico
 *     tags: [Alertas]
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
 *               - mensaje
 *               - fecha_generada
 *               - alerta_origen_id
 *               - prioridad_id
 *               - severidad_id
 *               - leida
 *               - estado
 *               - alertas_tipo_alerta_tipo_id
 *             properties:
 *               alumno_id:
 *                 type: integer
 *                 description: ID del alumno asociado a la alerta
 *               alerta_regla_id:
 *                 type: integer
 *                 description: ID de la regla que generó la alerta (opcional)
 *               mensaje:
 *                 type: string
 *                 maxLength: 100
 *                 description: Descripción del motivo de la alerta
 *               fecha_generada:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora cuando se generó la alerta
 *               fecha_resolucion:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora cuando se resolvió la alerta (opcional)
 *               alerta_origen_id:
 *                 type: integer
 *                 description: ID del origen de la alerta
 *               prioridad_id:
 *                 type: integer
 *                 description: ID del nivel de prioridad de la alerta
 *               severidad_id:
 *                 type: integer
 *                 description: ID del nivel de severidad de la alerta
 *               accion_tomada:
 *                 type: string
 *                 maxLength: 200
 *                 description: Descripción de la acción tomada (opcional)
 *               leida:
 *                 type: boolean
 *                 description: Indica si la alerta ha sido leída
 *               anonimo:
 *                 type: boolean
 *                 description: Indica si la alerta ha sido anonima
 *               estado:
 *                 type: string
 *                 maxLength: 20
 *                 description: Estado actual de la alerta
 *               alertas_tipo_alerta_tipo_id:
 *                 type: integer
 *                 description: ID del tipo de alerta
 *             example:
 *               alumno_id: 12345
 *               alerta_regla_id: 1
 *               mensaje: "El alumno muestra bajo rendimiento en matemáticas"
 *               fecha_generada: "2023-05-15T14:30:00Z"
 *               alerta_origen_id: 2
 *               prioridad_id: 1
 *               severidad_id: 3
 *               leida: false
 *               anonimo: false
 *               estado: "pendiente"
 *               alertas_tipo_alerta_tipo_id: 5
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAlerta'
 *       400:
 *         description: |
 *           Datos inválidos para crear la alerta. Posibles causas:
 *           - Faltan campos requeridos
 *           - Tipos de datos incorrectos
 *           - Valores fuera de los límites permitidos
 *       401:
 *         description: No autorizado (sesión no válida o expirada)
 *       500:
 *         description: Error interno del servidor
 */
const fileFields = [
  { name: 'url_image', maxCount: 1 },
  { name: 'url_audio', maxCount: 1 }
];
router.post(ruta_alumnos_alertas, sessionAuth, upload.fields(fileFields), AlumnoAlertaService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/alertas/{id}:
 *   put:
 *     summary: Actualizar alerta
 *     description: Actualiza una alerta existente
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alerta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAlerta'
 *     responses:
 *       200:
 *         description: Alerta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAlerta'
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_alertas + '/:id', sessionAuth,  AlumnoAlertaService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/alertas/{id}:
 *   delete:
 *     summary: Eliminar alerta
 *     description: Elimina una alerta del sistema
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alerta a eliminar
 *     responses:
 *       204:
 *         description: Alerta eliminada exitosamente
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_alertas + '/:id', sessionAuth, AlumnoAlertaService.eliminar);

// Rutas para Bitácoras de Alertas
/**
 * @swagger
 * /api/v1/alumnos/alertas_bitacoras:
 *   get:
 *     summary: Obtener bitácoras completas de alertas
 *     description: Retorna todas las bitácoras registradas con información detallada de la alerta, alumno y acciones realizadas
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado de la alerta (Pendiente, EnProceso, Resuelta)
 *         example: "EnProceso"
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar bitácoras desde esta fecha (YYYY-MM-DD)
 *         example: "2023-06-01"
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar bitácoras hasta esta fecha (YYYY-MM-DD)
 *         example: "2023-06-30"
 *     responses:
 *       200:
 *         description: Lista detallada de bitácoras con relaciones completas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoAlertaBitacora'
 *             example:
 *               - alumno_alerta_bitacora_id: 301
 *                 alumno_alerta_id: 201
 *                 alumno_id: 101
 *                 plan_accion: "Realizar evaluación psicológica"
 *                 fecha_compromiso: "2023-06-18T00:00:00Z"
 *                 fecha_realizacion: "2023-06-17T15:30:00Z"
 *                 url_archivo: "https://storage.com/informes/evaluacion-301.pdf"
 *                 observaciones: "El alumno mostró buena disposición"
 *                 estado_seguimiento: "Completado"
 *                 alumno:
 *                   alumno_id: 101
 *                   nombre: "Juan Pérez"
 *                   curso_actual: "4° Básico A"
 *                 alerta:
 *                   alumno_alerta_id: 201
 *                   tipo_alerta: "Comportamiento"
 *                   estado: "EnProceso"
 *                   severidad: "Media"
 *               - alumno_alerta_bitacora_id: 302
 *                 alumno_alerta_id: 202
 *                 alumno_id: 102
 *                 plan_accion: "Reunión con apoderados"
 *                 fecha_compromiso: "2023-06-20T00:00:00Z"
 *                 fecha_realizacion: null
 *                 url_archivo: null
 *                 observaciones: "Por coordinar con familia"
 *                 estado_seguimiento: "Pendiente"
 *                 alumno:
 *                   alumno_id: 102
 *                   nombre: "María González"
 *                   curso_actual: "3° Medio B"
 *                 alerta:
 *                   alumno_alerta_id: 202
 *                   tipo_alerta: "Rendimiento"
 *                   estado: "Pendiente"
 *                   severidad: "Alta"
 *       400:
 *         description: Parámetros de filtrado inválidos
 *         content:
 *           application/json:
 *             example:
 *               error: "Parámetros inválidos"
 *               detalles: "El formato de fecha debe ser YYYY-MM-DD"
 *       401:
 *         description: No autorizado - Token inválido o faltante
 *         content:
 *           application/json:
 *             example:
 *               error: "No autorizado"
 *               mensaje: "Se requiere autenticación"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error del servidor"
 *               mensaje: "No se pudo recuperar las bitácoras"
 *               detalles: "Timeout de conexión a la base de datos"
 */
router.get(ruta_alumnos_alertas_bitacoras, sessionAuth, AlumnoAlertaBitacoraService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/alertas_bitacoras:
 *   post:
 *     summary: Crear nueva bitácora de alerta
 *     description: Registra una nueva bitácora para una alerta de alumno
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAlertaBitacora'
 *     responses:
 *       201:
 *         description: Bitácora creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAlertaBitacora'
 *       400:
 *         description: Datos inválidos para crear la bitácora
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_alertas_bitacoras, sessionAuth, AlumnoAlertaBitacoraService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/alertas_bitacoras/{id}:
 *   put:
 *     summary: Actualizar bitácora de alerta
 *     description: Actualiza una bitácora de alerta existente
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la bitácora a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAlertaBitacora'
 *     responses:
 *       200:
 *         description: Bitácora actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAlertaBitacora'
 *       404:
 *         description: Bitácora no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_alertas_bitacoras + '/:id', sessionAuth, AlumnoAlertaBitacoraService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/alertas_bitacoras/{id}:
 *   delete:
 *     summary: Eliminar bitácora de alerta
 *     description: Elimina una bitácora de alerta del sistema
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la bitácora a eliminar
 *     responses:
 *       204:
 *         description: Bitácora eliminada exitosamente
 *       404:
 *         description: Bitácora no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_alertas_bitacoras + '/:id', sessionAuth, AlumnoAlertaBitacoraService.eliminar);

// Rutas para Antecedentes Clínicos
/**
 * @swagger
 * /api/v1/alumnos/antecedentes_familiares:
 *   get:
 *     summary: Obtener antecedentes familiares de alumnos
 *     description: Retorna los antecedentes familiares y socioeconómicos registrados para los alumnos
 *     tags: [AntecedentesFamiliares]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: alumno_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de alumno específico
 *         example: 7
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *         example: true
 *     responses:
 *       200:
 *         description: Antecedentes familiares obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AntecedenteFamiliarCompleto'
 *             example:
 *               - alumno_ent_familiar: 1
 *                 alumno_id: 7
 *                 informacion_socio_economica: "string"
 *                 composicion_familiar: "string"
 *                 situacion_laboral_padres: "string"
 *                 recursos_disponibles: "string"
 *                 dinamica_familiar: "string"
 *                 relaciones_familiares: "string"
 *                 apoyo_emocional: "string"
 *                 factores_riesgo: "string"
 *                 observaciones_entrevistador: "string"
 *                 resumen_entrevista: "string"
 *                 impresiones_recomendaciones: "string"
 *                 procesos_pisicoteurapeuticos_adicionales: "string"
 *                 desarrollo_social: ""
 *                 fecha_inicio_escolaridad: "2025-05-14T00:00:00"
 *                 personas_apoya_aprendzaje_alumno: "string"
 *                 higiene_sueno: "string"
 *                 uso_plantillas: "string"
 *                 otros_antecedentes_relevantes: "string"
 *                 creado_por: 1
 *                 actualizado_por: 1
 *                 fecha_creacion: "2025-05-14T12:49:57.479"
 *                 fecha_actualizacion: "2025-05-14T12:49:57.479"
 *                 activo: true
 *                 alumnos:
 *                   email: "alextest@colegio.cl"
 *                   personas:
 *                     nombres: "Carlos"
 *                     apellidos: "Muñoz"
 *                     persona_id: 2
 *                   alumno_id: 7
 *                   url_foto_perfil: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *                   telefono_contacto1: "+56 9 1284 5678"
 *                   telefono_contacto2: "+56 9 8765 4321"
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado - Sesión no válida
 *       404:
 *         description: No se encontraron registros
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_alumnos_antecedentes_clinicos, sessionAuth, AlumnoAntecedenteClinicosService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_clinicos:
 *   post:
 *     summary: Crear antecedentes clínicos
 *     description: Registra nuevos antecedentes clínicos para un alumno
 *     tags: [Antecedentes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAntecedenteClinico'
 *     responses:
 *       201:
 *         description: Antecedentes clínicos creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAntecedenteClinico'
 *       400:
 *         description: Datos inválidos para crear los antecedentes
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_antecedentes_clinicos, sessionAuth, AlumnoAntecedenteClinicosService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_clinicos/{id}:
 *   put:
 *     summary: Actualizar antecedentes clínicos
 *     description: Actualiza antecedentes clínicos existentes
 *     tags: [Antecedentes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de los antecedentes a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAntecedenteClinico'
 *     responses:
 *       200:
 *         description: Antecedentes clínicos actualizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAntecedenteClinico'
 *       404:
 *         description: Antecedentes no encontrados
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_antecedentes_clinicos + '/:id', sessionAuth, AlumnoAntecedenteClinicosService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_clinicos/{id}:
 *   delete:
 *     summary: Eliminar antecedentes clínicos
 *     description: Elimina antecedentes clínicos del sistema
 *     tags: [Antecedentes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de los antecedentes a eliminar
 *     responses:
 *       204:
 *         description: Antecedentes eliminados exitosamente
 *       404:
 *         description: Antecedentes no encontrados
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_antecedentes_clinicos + '/:id', sessionAuth, AlumnoAntecedenteClinicosService.eliminar);

// Rutas para Antecedentes Familiares

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_familiares:
 *   get:
 *     summary: Obtener antecedentes familiares completos
 *     description: Retorna todos los antecedentes familiares con información detallada del alumno y composición familiar
 *     tags: [Antecedentes]
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
 *         name: tiene_factores_riesgo
 *         schema:
 *           type: boolean
 *         description: Filtrar por alumnos con factores de riesgo identificados
 *         example: true
 *     responses:
 *       200:
 *         description: Lista detallada de antecedentes familiares
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoAntecedenteFamiliar'
 *             example:
 *               - alumno_ent_familiar: 501
 *                 alumno_id: 101
 *                 informacion_socio_economica: "Clase media, ambos padres trabajan"
 *                 composicion_familiar: "Padres casados, 2 hermanos (8 y 12 años)"
 *                 situacion_laboral_padres: "Padre ingeniero, madre profesora"
 *                 recursos_disponibles: "Casa propia, acceso a internet y computador"
 *                 dinamica_familiar: "Ambiente familiar estable"
 *                 relaciones_familiares: "Buena relación entre hermanos"
 *                 apoyo_emocional: "Fuerte apoyo de ambos padres"
 *                 factores_riesgo: "Antecedentes depresión materna"
 *                 observaciones_entrevistador: "Familia comprometida con educación"
 *                 resumen_entrevista: "Entrevista normal sin observaciones"
 *                 fecha_actualizacion: "2023-06-10T11:20:00Z"
 *                 alumno:
 *                   alumno_id: 101
 *                   nombre: "Juan Pérez"
 *                   curso_actual: "4°A"
 *                   colegio:
 *                     nombre: "Colegio Ejemplo"
 * 
 *               - alumno_ent_familiar: 502
 *                 alumno_id: 102
 *                 informacion_socio_economica: "Clase media-baja, madre soltera"
 *                 composicion_familiar: "Madre y abuela materna"
 *                 situacion_laboral_padres: "Madre trabaja medio tiempo"
 *                 recursos_disponibles: "Departamento arrendado, acceso internet limitado"
 *                 dinamica_familiar: "Relación cercana con abuela"
 *                 factores_riesgo: "Problemas económicos recurrentes"
 *                 procesos_pisicoteurapeuticos_adicionales: "Apoyo psicológico semanal"
 *                 fecha_actualizacion: "2023-05-15T09:45:00Z"
 *                 alumno:
 *                   alumno_id: 102
 *                   nombre: "María González"
 *                   curso_actual: "3° Medio B"
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             example:
 *               error: "Solicitud incorrecta"
 *               detalles: "El parámetro alumno_id debe ser un número"
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             example:
 *               error: "Acceso no autorizado"
 *               mensaje: "Se requiere autenticación"
 *       404:
 *         description: No se encontraron registros
 *         content:
 *           application/json:
 *             example:
 *               error: "No encontrado"
 *               mensaje: "No existen antecedentes familiares para los criterios especificados"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error del servidor"
 *               mensaje: "No se pudieron recuperar los antecedentes"
 *               detalles: "Error de conexión con la base de datos"
 */
router.get(ruta_alumnos_antecedentes_familiares, sessionAuth, AlumnoAntecedenteFamiliarsService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_familiares:
 *   post:
 *     summary: Crear antecedentes familiares
 *     description: Registra nuevos antecedentes familiares para un alumno
 *     tags: [Antecedentes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAntecedenteFamiliar'
 *     responses:
 *       201:
 *         description: Antecedentes familiares creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAntecedenteFamiliar'
 *       400:
 *         description: Datos inválidos para crear los antecedentes
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_antecedentes_familiares, sessionAuth, AlumnoAntecedenteFamiliarsService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_familiares/{id}:
 *   put:
 *     summary: Actualizar antecedentes familiares
 *     description: Actualiza antecedentes familiares existentes
 *     tags: [Antecedentes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de los antecedentes a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAntecedenteFamiliar'
 *     responses:
 *       200:
 *         description: Antecedentes familiares actualizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAntecedenteFamiliar'
 *       404:
 *         description: Antecedentes no encontrados
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_antecedentes_familiares + '/:id', sessionAuth, AlumnoAntecedenteFamiliarsService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/antecedentes_familiares/{id}:
 *   delete:
 *     summary: Eliminar antecedentes familiares
 *     description: Elimina antecedentes familiares del sistema
 *     tags: [Antecedentes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de los antecedentes a eliminar
 *     responses:
 *       204:
 *         description: Antecedentes eliminados exitosamente
 *       404:
 *         description: Antecedentes no encontrados
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_antecedentes_familiares + '/:id', sessionAuth, AlumnoAntecedenteFamiliarsService.eliminar);

// Rutas para Cursos
/**
 * @swagger
 * /api/v1/alumnos/cursos:
 *   get:
 *     summary: Obtener relaciones alumno-curso con información completa
 *     description: Retorna todas las matrículas de alumnos en cursos con detalles académicos completos
 *     tags: [Cursos]
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
 *         name: ano_escolar
 *         schema:
 *           type: integer
 *         description: Filtrar por año escolar específico
 *         example: 2023
 *       - in: query
 *         name: curso_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de curso específico
 *         example: 5
 *     responses:
 *       200:
 *         description: Lista detallada de matrículas alumno-curso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoCurso'
 *             example:
 *               - alumno_curso_id: 601
 *                 alumno_id: 101
 *                 curso_id: 5
 *                 ano_escolar: 2023
 *                 fecha_ingreso: "2023-03-01"
 *                 fecha_egreso: "2023-12-15"
 *                 estado_matricula: "Activa"
 *                 promedio_general: 6.2
 *                 alumno:
 *                   alumno_id: 101
 *                   nombre: "Juan Pérez"
 *                   url_foto_perfil: "https://ejemplo.com/fotos/alumno101.jpg"
 *                 curso:
 *                   curso_id: 5
 *                   nombre_curso: "4°"
 *                   nivel_educativo: "Básica"
 *                   profesor_jefe: "María González"
 *                   colegio:
 *                     colegio_id: 1
 *                     nombre: "Colegio Ejemplo"
 * 
 *               - alumno_curso_id: 602
 *                 alumno_id: 102
 *                 curso_id: 8
 *                 ano_escolar: 2023
 *                 fecha_ingreso: "2023-03-01"
 *                 fecha_egreso: null
 *                 estado_matricula: "Transferido"
 *                 promedio_general: 5.8
 *                 alumno:
 *                   alumno_id: 102
 *                   nombre: "Ana Sánchez"
 *                 curso:
 *                   curso_id: 8
 *                   nombre_curso: "7° B"
 *                   nivel_educativo: "Básica"
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             example:
 *               error: "Parámetros inválidos"
 *               detalles: "El año escolar debe ser un número de 4 dígitos"
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             example:
 *               error: "Acceso no autorizado"
 *               mensaje: "Se requiere autenticación válida"
 *       404:
 *         description: No se encontraron matrículas
 *         content:
 *           application/json:
 *             example:
 *               error: "No encontrado"
 *               mensaje: "No existen registros para los criterios especificados"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error del servidor"
 *               mensaje: "Error al consultar matrículas"
 *               detalles: "Error de conexión con la base de datos"
 */
router.get(ruta_alumnos_cursos, sessionAuth, AlumnoCursoService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/cursos:
 *   post:
 *     summary: Crear relación alumno-curso
 *     description: Registra una nueva relación entre un alumno y un curso
 *     tags: [Cursos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoCurso'
 *     responses:
 *       201:
 *         description: Relación alumno-curso creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoCurso'
 *       400:
 *         description: Datos inválidos para crear la relación
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_cursos, sessionAuth, AlumnoCursoService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/cursos/{id}:
 *   put:
 *     summary: Actualizar relación alumno-curso
 *     description: Actualiza una relación alumno-curso existente
 *     tags: [Cursos]
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
 *             $ref: '#/components/schemas/AlumnoCurso'
 *     responses:
 *       200:
 *         description: Relación alumno-curso actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoCurso'
 *       404:
 *         description: Relación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_cursos + '/:id', sessionAuth, AlumnoCursoService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/cursos/{id}:
 *   delete:
 *     summary: Eliminar relación alumno-curso
 *     description: Elimina una relación alumno-curso del sistema
 *     tags: [Cursos]
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
router.delete(ruta_alumnos_cursos + '/:id', sessionAuth, AlumnoCursoService.eliminar);

// Rutas para Direcciones
/**
 * @swagger
 * /api/v1/alumnos/direcciones:
 *   get:
 *     summary: Obtener direcciones completas de alumnos
 *     description: Retorna todas las direcciones registradas con información geográfica detallada
 *     tags: [Direcciones]
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
 *         name: comuna_id
 *         schema:
 *           type: integer
 *         description: Filtrar por comuna específica
 *         example: 125
 *       - in: query
 *         name: es_principal
 *         schema:
 *           type: boolean
 *         description: Filtrar por dirección principal (true/false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista completa de direcciones con datos geográficos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoDireccion'
 *             example:
 *               - alumno_direccion_id: 701
 *                 alumno_id: 101
 *                 descripcion: "Av. Principal 1234, Depto 501"
 *                 es_principal: true
 *                 ubicaciones_mapa: "-33.45694, -70.64827"
 *                 comuna_id: 125
 *                 region_id: 13
 *                 pais_id: 1
 *                 fecha_actualizacion: "2023-06-15T10:30:00Z"
 *                 alumno:
 *                   alumno_id: 101
 *                   nombre: "Juan Pérez"
 *                   curso_actual: "4° Básico A"
 *                 comuna:
 *                   comuna_id: 125
 *                   nombre: "Santiago"
 *                   region:
 *                     region_id: 13
 *                     nombre: "Metropolitana"
 *                     pais:
 *                       pais_id: 1
 *                       nombre: "Chile"
 * 
 *               - alumno_direccion_id: 702
 *                 alumno_id: 102
 *                 descripcion: "Calle Secundaria 567, Casa B"
 *                 es_principal: false
 *                 ubicaciones_mapa: "-33.45872, -70.65011"
 *                 comuna_id: 126
 *                 region_id: 13
 *                 pais_id: 1
 *                 alumno:
 *                   alumno_id: 102
 *                   nombre: "María González"
 *                 comuna:
 *                   comuna_id: 126
 *                   nombre: "Providencia"
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             example:
 *               error: "Parámetros inválidos"
 *               detalles: "El ID de alumno debe ser un número positivo"
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             example:
 *               error: "Acceso no autorizado"
 *               mensaje: "Token de autenticación requerido"
 *       404:
 *         description: No se encontraron direcciones
 *         content:
 *           application/json:
 *             example:
 *               error: "No encontrado"
 *               mensaje: "No existen direcciones para los criterios especificados"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error del servidor"
 *               mensaje: "No se pudieron recuperar las direcciones"
 *               detalles: "Error de conexión con el servicio de geolocalización"
 */
router.get(ruta_alumnos_direcciones, sessionAuth, AlumnoDireccionService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/direcciones:
 *   post:
 *     summary: Crear dirección de alumno
 *     description: Registra una nueva dirección para un alumno
 *     tags: [Direcciones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoDireccion'
 *     responses:
 *       201:
 *         description: Dirección creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoDireccion'
 *       400:
 *         description: Datos inválidos para crear la dirección
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_direcciones, sessionAuth, AlumnoDireccionService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/direcciones/{id}:
 *   put:
 *     summary: Actualizar dirección de alumno
 *     description: Actualiza una dirección existente de un alumno
 *     tags: [Direcciones]
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
 *             $ref: '#/components/schemas/AlumnoDireccion'
 *     responses:
 *       200:
 *         description: Dirección actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoDireccion'
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_direcciones + '/:id', sessionAuth, AlumnoDireccionService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/direcciones/{id}:
 *   delete:
 *     summary: Eliminar dirección de alumno
 *     description: Elimina una dirección de alumno del sistema
 *     tags: [Direcciones]
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
router.delete(ruta_alumnos_direcciones + '/:id', sessionAuth, AlumnoDireccionService.eliminar);


// Rutas para Monitoreos
/**
 * @swagger
 * /api/v1/alumnos/monitoreos:
 *   get:
 *     summary: Obtener monitoreos de alumnos
 *     description: Retorna todos los monitoreos registrados para alumnos, incluyendo información detallada del alumno y sus datos personales
 *     tags: [Monitoreos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de monitoreos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoMonitoreo'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 * 
 * @swagger
 * components:
 *   schemas:
 *     AlumnoMonitoreo:
 *       type: object
 *       properties:
 *         alumno_monitoreo_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         fecha_accion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T00:33:57.083"
 *         tipo_accion:
 *           type: string
 *           example: "string"
 *         descripcion_accion:
 *           type: string
 *           example: "string"
 *         alumnos:
 *           $ref: '#/components/schemas/AlumnoDetalle'
 * 
 *     AlumnoDetalle:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: "alextest@colegio.cl"
 *         personas:
 *           $ref: '#/components/schemas/PersonaInfo'
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         url_foto_perfil:
 *           type: string
 *           example: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *         telefono_contacto1:
 *           type: string
 *           example: "+56 9 1284 5678"
 *         telefono_contacto2:
 *           type: string
 *           example: "+56 9 8765 4321"
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
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: null
 */
router.get(ruta_alumnos_monitoreos, sessionAuth, AlumnoMonitoreoService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/monitoreos:
 *   post:
 *     summary: Crear monitoreo de alumno
 *     description: Registra un nuevo monitoreo para un alumno
 *     tags: [Monitoreos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoMonitoreo'
 *     responses:
 *       201:
 *         description: Monitoreo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoMonitoreo'
 *       400:
 *         description: Datos inválidos para crear el monitoreo
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_monitoreos, sessionAuth, AlumnoMonitoreoService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/monitoreos/{id}:
 *   put:
 *     summary: Actualizar monitoreo de alumno
 *     description: Actualiza un monitoreo existente de un alumno
 *     tags: [Monitoreos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del monitoreo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoMonitoreo'
 *     responses:
 *       200:
 *         description: Monitoreo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoMonitoreo'
 *       404:
 *         description: Monitoreo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_monitoreos + '/:id', sessionAuth, AlumnoMonitoreoService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/monitoreos/{id}:
 *   delete:
 *     summary: Eliminar monitoreo de alumno
 *     description: Elimina un monitoreo de alumno del sistema
 *     tags: [Monitoreos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del monitoreo a eliminar
 *     responses:
 *       204:
 *         description: Monitoreo eliminado exitosamente
 *       404:
 *         description: Monitoreo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_monitoreos + '/:id', sessionAuth, AlumnoMonitoreoService.eliminar);

// Rutas para Notificaciones
/**
 * @swagger
 * /api/v1/alumnos/notificaciones:
 *   get:
 *     summary: Obtener notificaciones de alumnos
 *     description: Retorna todas las notificaciones registradas para alumnos, incluyendo detalles del alumno y datos de creación/actualización
 *     tags: [Notificaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: enviada
 *         in: query
 *         description: Filtro por estado de envío (true/false)
 *         required: false
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: limit
 *         in: query
 *         description: Límite de resultados a devolver (para paginación)
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *       - name: offset
 *         in: query
 *         description: Desplazamiento para paginación
 *         required: false
 *         schema:
 *           type: integer
 *           example: 0
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoNotificacion'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       403:
 *         description: Acceso prohibido - El usuario no tiene permisos para ver estas notificaciones
 *       500:
 *         description: Error interno del servidor
 * 
 * @swagger
 * components:
 *   schemas:
 *     AlumnoNotificacion:
 *       type: object
 *       properties:
 *         alumno_notificacion_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         tipo:
 *           type: string
 *           example: "string"
 *         asunto:
 *           type: string
 *           example: "string"
 *         cuerpo:
 *           type: string
 *           example: "string"
 *         enviada:
 *           type: boolean
 *           example: true
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T02:25:18.132"
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T02:28:30.57"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T02:28:30.57"
 *         activo:
 *           type: boolean
 *           example: true
 *         alumnos:
 *           $ref: '#/components/schemas/AlumnoDetalle'
 * 
 *     AlumnoDetalle:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: "alextest@colegio.cl"
 *         personas:
 *           $ref: '#/components/schemas/PersonaInfo'
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         url_foto_perfil:
 *           type: string
 *           example: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *         telefono_contacto1:
 *           type: string
 *           example: "+56 9 1284 5678"
 *         telefono_contacto2:
 *           type: string
 *           example: "+56 9 8765 4321"
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
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: null
 */
router.get(ruta_alumnos_notificaciones, sessionAuth, AlumnoNotificacionService.obtener);

/**
 * @swagger
 * /api/v1/alumnos/notificaciones:
 *   post:
 *     summary: Crear notificación de alumno
 *     description: Registra una nueva notificación para un alumno
 *     tags: [Notificaciones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoNotificacion'
 *     responses:
 *       201:
 *         description: Notificación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoNotificacion'
 *       400:
 *         description: Datos inválidos para crear la notificación
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_notificaciones, sessionAuth, AlumnoNotificacionService.guardar);

/**
 * @swagger
 * /api/v1/alumnos/notificaciones/{id}:
 *   put:
 *     summary: Actualizar notificación de alumno
 *     description: Actualiza una notificación existente de un alumno
 *     tags: [Notificaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoNotificacion'
 *     responses:
 *       200:
 *         description: Notificación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoNotificacion'
 *       404:
 *         description: Notificación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_notificaciones + '/:id', sessionAuth, AlumnoNotificacionService.actualizar);

/**
 * @swagger
 * /api/v1/alumnos/notificaciones/{id}:
 *   delete:
 *     summary: Eliminar notificación de alumno
 *     description: Elimina una notificación de alumno del sistema
 *     tags: [Notificaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación a eliminar
 *     responses:
 *       204:
 *         description: Notificación eliminada exitosamente
 *       404:
 *         description: Notificación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_notificaciones + '/:id', sessionAuth, AlumnoNotificacionService.eliminar);

/**
 * @swagger
 * /api/v1/alumnos/alumnos_actividades:
 *   get:
 *     summary: Obtener todas las relaciones alumno-actividad
 *     description: Retorna todas las asociaciones entre alumnos y actividades
 *     tags: [AlumnoActividades]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de relaciones alumno-actividad obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoActividadCompleta'
 *             example:
 *               - alumno_actividad_id: 1
 *                 alumno_id: 5
 *                 actividad_id: 3
 *                 actividad:
 *                   actividad_id: 3
 *                   nombre: "Taller de Matemáticas"
 *                 fecha_creacion: "2023-05-10T14:30:00Z"
 *                 fecha_actualizacion: null
 *                 creado_por: 1
 *                 actualizado_por: null
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get(ruta_alumnos_actividades + '/', sessionAuth, AlumnoActividadService.obtener)
/**
 * @swagger
 * /api/v1/alumnos/alumnos_actividades:
 *   post:
 *     summary: Crear nueva relación alumno-actividad
 *     description: Asocia un alumno con una actividad específica
 *     tags: [AlumnoActividades]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoActividadInput'
 *           example:
 *             alumno_id: 5
 *             actividad_id: 3
 *             creado_por: 1
 *     responses:
 *       201:
 *         description: Relación alumno-actividad creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoActividadCompleta'
 *             example:
 *               alumno_actividad_id: 1
 *               alumno_id: 5
 *               actividad_id: 3
 *               actividad:
 *                 actividad_id: 3
 *                 nombre: "Taller de Matemáticas"
 *               fecha_creacion: "2023-05-10T14:30:00Z"
 *               fecha_actualizacion: null
 *               creado_por: 1
 *               actualizado_por: null
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             example:
 *               error: "El campo 'alumno_id' es requerido"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_actividades + '/', sessionAuth, AlumnoActividadService.guardar)
/**
 * @swagger
 * /api/v1/alumnos/alumnos_actividades:
 *   put:
 *     summary: Actualizar relación alumno-actividad
 *     description: Modifica una asociación existente entre alumno y actividad
 *     tags: [AlumnoActividades]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoActividadUpdate'
 *           example:
 *             alumno_actividad_id: 1
 *             alumno_id: 5
 *             actividad_id: 4
 *             actualizado_por: 2
 *     responses:
 *       200:
 *         description: Relación alumno-actividad actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoActividadCompleta'
 *             example:
 *               alumno_actividad_id: 1
 *               alumno_id: 5
 *               actividad_id: 4
 *               actividad:
 *                 actividad_id: 4
 *                 nombre: "Taller de Ciencias"
 *               fecha_creacion: "2023-05-10T14:30:00Z"
 *               fecha_actualizacion: "2023-05-15T10:15:00Z"
 *               creado_por: 1
 *               actualizado_por: 2
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Relación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_actividades + '/', sessionAuth, AlumnoActividadService.actualizar)
/**
 * @swagger
 * /api/v1/alumnos/alumnos_actividades:
 *   delete:
 *     summary: Eliminar relación alumno-actividad
 *     description: Elimina una asociación entre alumno y actividad
 *     tags: [AlumnoActividades]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoActividadDelete'
 *           example:
 *             alumno_actividad_id: 1
 *     responses:
 *       204:
 *         description: Relación eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Relación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(ruta_alumnos_actividades + '/', sessionAuth, AlumnoActividadService.eliminar)
/**
 * @swagger
 * /api/v1/alumnos/permisos:
 *   get:
 *     summary: Obtener todos los permisos/autorizaciones
 *     description: Retorna una lista de permisos/autorizaciones de alumnos con información relacionada
 *     tags: [Alumnos - Permisos/Autorizaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: estado
 *         in: query
 *         description: Filtrar por estado (pendiente/aprobado/rechazado)
 *         schema:
 *           type: string
 *           enum: [pendiente, aprobado, rechazado]
 *           example: "pendiente"
 *       - name: alumno_id
 *         in: query
 *         description: Filtrar por ID de alumno
 *         schema:
 *           type: integer
 *           example: 7
 *       - name: apoderado_id
 *         in: query
 *         description: Filtrar por ID de apoderado
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Lista de permisos/autorizaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoPermisoAutor'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(ruta_alumnos_permisos + '/', sessionAuth, AlumnoPermisoAutorsService.obtener)
/**
 * @swagger
 * /api/v1/alumnos/permisos:
 *   post:
 *     summary: Crear un nuevo permiso/autorización
 *     description: Registra un nuevo permiso/autorización para un alumno
 *     tags: [Alumnos - Permisos/Autorizaciones]
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
 *               - tipo
 *               - descripcion
 *             properties:
 *               alumno_id:
 *                 type: integer
 *                 example: 7
 *               apoderado_id:
 *                 type: integer
 *                 example: 3
 *               tipo:
 *                 type: string
 *                 enum: [salida, actividad, viaje, medicamento, otro]
 *                 example: "actividad"
 *               descripcion:
 *                 type: string
 *                 example: "Autorización para excursión al museo"
 *               fecha_autorizacion:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *               estado:
 *                 type: string
 *                 enum: [pendiente, aprobado, rechazado]
 *                 example: "pendiente"
 *     responses:
 *       201:
 *         description: Permiso/autorización creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoPermisoAutor'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post(ruta_alumnos_permisos + '/', sessionAuth, AlumnoPermisoAutorsService.guardar)
/**
 * @swagger
 * /api/v1/alumnos/permisos:
 *   put:
 *     summary: Actualizar un permiso/autorización
 *     description: Actualiza los datos de un permiso/autorización existente
 *     tags: [Alumnos - Permisos/Autorizaciones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alumno_permiso_autor_id
 *             properties:
 *               alumno_permiso_autor_id:
 *                 type: integer
 *                 example: 1
 *               alumno_id:
 *                 type: integer
 *                 example: 7
 *               apoderado_id:
 *                 type: integer
 *                 example: 3
 *               tipo:
 *                 type: string
 *                 enum: [salida, actividad, viaje, medicamento, otro]
 *                 example: "salida"
 *               descripcion:
 *                 type: string
 *                 example: "Permiso para salir temprano el viernes"
 *               fecha_autorizacion:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-05-16T11:00:00Z"
 *               estado:
 *                 type: string
 *                 enum: [pendiente, aprobado, rechazado]
 *                 example: "aprobado"
 *     responses:
 *       200:
 *         description: Permiso/autorización actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoPermisoAutor'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Permiso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(ruta_alumnos_permisos + '/:id', sessionAuth, AlumnoPermisoAutorsService.actualizar)


/**
 * @swagger
 * /api/v1/alumnos/diarios/:
 *   get:
 *     summary: Obtener todos los registros diarios de alumnos
 *     tags: [AlumnoDiario]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros diarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoDiario'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(ruta_alumnos_diarios + '/', sessionAuth, AlumnoDiarioService.obtener)
router.get(ruta_alumnos_diarios + '/todos', sessionAuth, AlumnoDiarioService.todosLosDiarios)

/**
 * @swagger
 * /api/v1/alumnos/diarios/:
 *   post:
 *     summary: Crear un nuevo registro diario para un alumno
 *     tags: [AlumnoDiario]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoDiario'
 *           example:
 *             alumno_id: 123
 *             titulo: "Seguimiento mensual"
 *             descripcion: "El alumno completó todos los ejercicios asignados"
 *             fecha: "2023-05-20T14:00:00Z"
 *     responses:
 *       201:
 *         description: Registro diario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoDiario'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
 
 
router.post(ruta_alumnos_diarios + '/', sessionAuth, upload.fields(fileFields), AlumnoDiarioService.guardar)
/**
 * @swagger
 * /api/v1/alumnos/diarios/{id}:
 *   put:
 *     summary: Actualizar un registro diario existente
 *     tags: [AlumnoDiario]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro diario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoDiario'
 *           example:
 *             titulo: "Seguimiento mensual actualizado"
 *             descripcion: "El alumno mostró mejoría significativa"
 *             fecha: "2023-05-20T15:30:00Z"
 *     responses:
 *       200:
 *         description: Registro diario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoDiario'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Registro diario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put(ruta_alumnos_diarios + '/:id', sessionAuth, upload.fields(fileFields), AlumnoDiarioService.actualizar)
/**
 * @swagger
 * /api/v1/alumnos/consentimiento/{id}:
 *   put:
 *     summary: Establecer consentimiento para un alumno (menor)
 *     tags:
 *       - Alumnos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alumno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consentimiento
 *             properties:
 *               consentimiento:
 *                 type: boolean
 *                 example: true
 *                 description: Valor booleano que indica si el alumno consiente
 *     responses:
 *       200:
 *         description: Consentimiento establecido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: se ha consentido usuario
 *       400:
 *         description: Solicitud inválida
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Alumno no encontrado
 */
router.put('/consentimiento/:id', sessionAuth, AlumnosService.establecer_consentimiento);
router.get('/consentimiento/:id/historial', sessionAuth, AlumnosService.obtener_historial_consentimiento);
router.post('/consentimiento/:id/revocar', sessionAuth, AlumnosService.revocar_consentimiento);

/**
 * @swagger
 * /api/v1/alumnos/diarios/{id}:
 *   delete:
 *     summary: Eliminar un registro diario
 *     tags: [AlumnoDiario]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro diario a eliminar
 *     responses:
 *       204:
 *         description: Registro diario eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Registro diario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete(ruta_alumnos_diarios + '/:id', sessionAuth, AlumnoDiarioService.eliminar)
/**
 * @swagger
 * /api/v1/alumnos/permisos:
 *   delete:
 *     summary: Eliminar un permiso/autorización
 *     description: Elimina un permiso/autorización del sistema (eliminación lógica)
 *     tags: [Alumnos - Permisos/Autorizaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: alumno_permiso_autor_id
 *         in: query
 *         description: ID del permiso/autorización a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Permiso/autorización eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Permiso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     AlumnoPermisoAutor:
 *       type: object
 *       properties:
 *         alumno_permiso_autor_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         apoderado_id:
 *           type: integer
 *           example: 3
 *         tipo:
 *           type: string
 *           enum: [salida, actividad, viaje, medicamento, otro]
 *           example: "salida"
 *         descripcion:
 *           type: string
 *           example: "Permiso para salir temprano el viernes"
 *         fecha_solicitud:
 *           type: string
 *           format: date-time
 *           example: "2025-05-15T10:30:00Z"
 *         fecha_autorizacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-05-15T11:15:00Z"
 *         estado:
 *           type: string
 *           enum: [pendiente, aprobado, rechazado]
 *           example: "pendiente"
 *         alumnos:
 *           $ref: '#/components/schemas/AlumnoInfo'
 *         apoderados:
 *           $ref: '#/components/schemas/ApoderadoInfo'
 * 
 *     AlumnoInfo:
 *       type: object
 *       properties:
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         personas:
 *           $ref: '#/components/schemas/PersonaInfo'
 *         url_foto_perfil:
 *           type: string
 *           example: "https://ejemplo.com/fotos/7.jpg"
 * 
 *     ApoderadoInfo:
 *       type: object
 *       properties:
 *         apoderado_id:
 *           type: integer
 *           example: 3
 *         personas:
 *           $ref: '#/components/schemas/PersonaInfo'
 *         telefono_contacto:
 *           type: string
 *           example: "+56987654321"
 * 
 *     PersonaInfo:
 *       type: object
 *       properties:
 *         persona_id:
 *           type: integer
 *           example: 2
 *         nombres:
 *           type: string
 *           example: "Carlos"
 *         apellidos:
 *           type: string
 *           example: "Muñoz"
 *         rut:
 *           type: string
 *           example: "12345678-9"
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Mensaje de error descriptivo"
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     AlumnoActividadInput:
 *       type: object
 *       required:
 *         - alumno_id
 *         - actividad_id
 *         - creado_por
 *       properties:
 *         alumno_id:
 *           type: integer
 *           example: 5
 *           description: ID del alumno
 *         actividad_id:
 *           type: integer
 *           example: 3
 *           description: ID de la actividad
 *         creado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que crea la relación
 * 
 *     AlumnoActividadUpdate:
 *       type: object
 *       required:
 *         - alumno_actividad_id
 *       properties:
 *         alumno_actividad_id:
 *           type: integer
 *           example: 1
 *           description: ID de la relación a actualizar
 *         alumno_id:
 *           type: integer
 *           example: 5
 *           description: Nuevo ID del alumno
 *         actividad_id:
 *           type: integer
 *           example: 4
 *           description: Nuevo ID de la actividad
 *         actualizado_por:
 *           type: integer
 *           example: 2
 *           description: ID del usuario que actualiza la relación
 * 
 *     AlumnoActividadDelete:
 *       type: object
 *       required:
 *         - alumno_actividad_id
 *       properties:
 *         alumno_actividad_id:
 *           type: integer
 *           example: 1
 *           description: ID de la relación a eliminar
 * 
 *     AlumnoActividadCompleta:
 *       type: object
 *       properties:
 *         alumno_actividad_id:
 *           type: integer
 *           example: 1
 *           description: ID único de la relación
 *         alumno_id:
 *           type: integer
 *           example: 5
 *           description: ID del alumno
 *         actividad_id:
 *           type: integer
 *           example: 3
 *           description: ID de la actividad
 *         actividad:
 *           type: object
 *           properties:
 *             actividad_id:
 *               type: integer
 *               example: 3
 *             nombre:
 *               type: string
 *               example: "Taller de Matemáticas"
 *           description: Información de la actividad asociada
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-10T14:30:00Z"
 *           description: Fecha de creación del registro
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *           description: Fecha de última actualización
 *         creado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que creó el registro
 *         actualizado_por:
 *           type: integer
 *           nullable: true
 *           example: null
 *           description: ID del usuario que actualizó el registro
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
 *     AntecedenteClinicoInput:
 *       type: object
 *       properties:
 *         historial_medico:
 *           type: string
 *           example: "Historial de asma infantil controlado con tratamiento"
 *         alergias:
 *           type: string
 *           example: "Alergia al maní y penicilina"
 *         enfermedades_cronicas:
 *           type: string
 *           example: "Asma"
 *         condiciones_medicas_relevantes:
 *           type: string
 *           example: "Antecedentes familiares de hipertensión"
 *         medicamentos_actuales:
 *           type: string
 *           example: "Salbutamol en inhalador"
 *         diagnosticos_previos:
 *           type: string
 *           example: "Crisis asmáticas moderadas durante la infancia"
 *         terapias_tratamiento_curso:
 *           type: string
 *           example: "Control mensual con neumólogo pediátrico"
 * 
 *     AntecedenteClinicoCompleto:
 *       type: object
 *       properties:
 *         creado_por:
 *           type: integer
 *           example: 3
 *         actualizado_por:
 *           type: integer
 *           example: 5
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T10:30:00.000Z"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T12:45:00.000Z"
 *         activo:
 *           type: boolean
 *           example: true
 *         alumno_id:
 *           type: integer
 *           example: 12
 *         historial_medico:
 *           type: string
 *           example: "Historial de asma infantil controlado con tratamiento"
 *         alergias:
 *           type: string
 *           example: "Alergia al maní y penicilina"
 *         enfermedades_cronicas:
 *           type: string
 *           example: "Asma"
 *         condiciones_medicas_relevantes:
 *           type: string
 *           example: "Antecedentes familiares de hipertensión"
 *         medicamentos_actuales:
 *           type: string
 *           example: "Salbutamol en inhalador"
 *         diagnosticos_previos:
 *           type: string
 *           example: "Crisis asmáticas moderadas durante la infancia"
 *         terapias_tratamiento_curso:
 *           type: string
 *           example: "Control mensual con neumólogo pediátrico"
 *         alumno:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "juanfelipe.mendez@escuela.edu"
 *             personas:
 *               type: object
 *               properties:
 *                 nombres:
 *                   type: string
 *                   example: "Juan Felipe"
 *                 apellidos:
 *                   type: string
 *                   example: "Méndez Castillo"
 *                 persona_id:
 *                   type: integer
 *                   example: 9
 *             alumno_id:
 *               type: integer
 *               example: 12
 *             url_foto_perfil:
 *               type: string
 *               example: "https://randomuser.me/api/portraits/men/52.jpg"
 *             telefono_contacto1:
 *               type: string
 *               example: "+56 9 3421 5678"
 *             telefono_contacto2:
 *               type: string
 *               example: "+56 9 8765 2345"
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
 *     AntecedenteFamiliarCompleto:
 *       type: object
 *       properties:
 *         alumno_ent_familiar:
 *           type: integer
 *           example: 1
 *           description: ID único del antecedente familiar
 *         alumno_id:
 *           type: integer
 *           example: 7
 *           description: ID del alumno asociado
 *         informacion_socio_economica:
 *           type: string
 *           example: "string"
 *           description: Información socioeconómica de la familia
 *         composicion_familiar:
 *           type: string
 *           example: "string"
 *           description: Composición del núcleo familiar
 *         situacion_laboral_padres:
 *           type: string
 *           example: "string"
 *           description: Situación laboral de los padres/tutores
 *         recursos_disponibles:
 *           type: string
 *           example: "string"
 *           description: Recursos económicos disponibles
 *         dinamica_familiar:
 *           type: string
 *           example: "string"
 *           description: Dinámica familiar y relaciones
 *         relaciones_familiares:
 *           type: string
 *           example: "string"
 *           description: Calidad de las relaciones familiares
 *         apoyo_emocional:
 *           type: string
 *           example: "string"
 *           description: Nivel de apoyo emocional en la familia
 *         factores_riesgo:
 *           type: string
 *           example: "string"
 *           description: Factores de riesgo identificados
 *         observaciones_entrevistador:
 *           type: string
 *           example: "string"
 *           description: Observaciones del entrevistador
 *         resumen_entrevista:
 *           type: string
 *           example: "string"
 *           description: Resumen de la entrevista familiar
 *         impresiones_recomendaciones:
 *           type: string
 *           example: "string"
 *           description: Impresiones y recomendaciones
 *         procesos_pisicoteurapeuticos_adicionales:
 *           type: string
 *           example: "string"
 *           description: Procesos psicoterapéuticos adicionales
 *         desarrollo_social:
 *           type: string
 *           example: ""
 *           description: Desarrollo social del alumno
 *         fecha_inicio_escolaridad:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T00:00:00"
 *           description: Fecha de inicio de la escolaridad
 *         personas_apoya_aprendzaje_alumno:
 *           type: string
 *           example: "string"
 *           description: Personas que apoyan el aprendizaje
 *         higiene_sueno:
 *           type: string
 *           example: "string"
 *           description: Hábitos de higiene del sueño
 *         uso_plantillas:
 *           type: string
 *           example: "string"
 *           description: Uso de plantillas o ayudas técnicas
 *         otros_antecedentes_relevantes:
 *           type: string
 *           example: "string"
 *           description: Otros antecedentes relevantes
 *         creado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que creó el registro
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que actualizó el registro
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T12:49:57.479"
 *           description: Fecha de creación del registro
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T12:49:57.479"
 *           description: Fecha de última actualización
 *         activo:
 *           type: boolean
 *           example: true
 *           description: Indica si el registro está activo
 *         alumnos:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "alextest@colegio.cl"
 *             personas:
 *               type: object
 *               properties:
 *                 nombres:
 *                   type: string
 *                   example: "Carlos"
 *                 apellidos:
 *                   type: string
 *                   example: "Muñoz"
 *                 persona_id:
 *                   type: integer
 *                   example: 2
 *             alumno_id:
 *               type: integer
 *               example: 7
 *             url_foto_perfil:
 *               type: string
 *               example: "https://www.rainbowschoolnellore.com/images/student-profile-1.jpg"
 *             telefono_contacto1:
 *               type: string
 *               example: "+56 9 1284 5678"
 *             telefono_contacto2:
 *               type: string
 *               example: "+56 9 8765 4321"
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
 *     AlumnoDiario:
 *       type: object
 *       properties:
 *         alumno_diario_id:
 *           type: integer
 *           description: ID único del registro diario
 *         alumno_id:
 *           type: integer
 *           description: ID del alumno asociado
 *         titulo:
 *           type: string
 *           description: Título del registro diario
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del registro
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha del registro (ISO 8601)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       required:
 *         - alumno_id
 *         - titulo
 *         - descripcion
 *         - fecha
 *       example:
 *         alumno_diario_id: 1
 *         alumno_id: 123
 *         titulo: "Progreso semanal"
 *         descripcion: "El alumno mostró mejoría en los ejercicios prácticos"
 *         fecha: "2023-05-15T10:30:00Z"
 */
/**
 * @swagger
 * /api/v1/alumnos/obtenerAlertasPorId:
 *   get:
 *     summary: Obtener alertas de alumnos filtradas por colegio y tipo de alerta
 *     description: |
 *       Retorna alertas de alumnos filtradas por colegio_id y opcionalmente por alerta_tipo_id.
 *       - Si solo se proporciona colegio_id: retorna todas las alertas del colegio
 *       - Si se proporcionan ambos parámetros: retorna alertas del colegio con el tipo específico
 *     tags: [Alertas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: colegio_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2
 *         description: ID del colegio para filtrar las alertas
 *       - in: query
 *         name: alerta_tipo_id
 *         required: false
 *         schema:
 *           type: integer
 *           example: 5
 *         description: ID del tipo de alerta para filtrar (opcional)
 *     responses:
 *       200:
 *         description: Lista de alertas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertaAlumnoCompleta'
 *             example:
 *               - alumno_alerta_id: 1344
 *                 alumno_id: 120
 *                 alerta_regla_id: 1
 *                 fecha_generada: "2025-08-23T14:52:00+00:00"
 *                 fecha_resolucion: null
 *                 alerta_origen_id: 1
 *                 prioridad_id: 3
 *                 severidad_id: 3
 *                 accion_tomada: null
 *                 leida: false
 *                 responsable_actual_id: null
 *                 estado: "Pendiente"
 *                 creado_por: 742
 *                 actualizado_por: 742
 *                 fecha_creacion: "2025-08-23T21:36:09.267+00:00"
 *                 fecha_actualizacion: "2025-08-23T21:36:09.267+00:00"
 *                 activo: true
 *                 alertas_tipo_alerta_tipo_id: 5
 *                 mensaje: "El buto luis rendimiento en Ciencias sociales"
 *                 anonimo: false
 *                 tipo_concepto: null
 *                 alumnos:
 *                   activo: true
 *                   personas:
 *                     nombres: "Bastián Ignacio"
 *                     apellidos: "Concha Paredes"
 *                     persona_id: 187
 *                   alumno_id: 120
 *                   colegio_id: 2
 *                   url_foto_perfil: "https://randomuser.me/api/portraits/men/46.jpg"
 *                 alertas_reglas:
 *                   nombre: "Regla Alegría Frecuente"
 *                   alerta_regla_id: 1
 *                 alertas_origenes:
 *                   nombre: "Alumno"
 *                   alerta_origen_id: 1
 *                 alertas_severidades:
 *                   nombre: "Alta"
 *                   alerta_severidad_id: 3
 *                 alertas_prioridades:
 *                   nombre: "Alta"
 *                   alerta_prioridad_id: 3
 *                 alertas_tipos:
 *                   nombre: "Roja"
 *                   alerta_tipo_id: 5
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "colegio_id debe ser un número válido"
 *       401:
 *         description: No autorizado - Sesión no válida
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
router.get("/obtenerAlertasPorId", sessionAuth, AlumnoAlertaService.obtenerAlertasPorId);

router.post('preferencias' + '/', sessionAuth, AlumnoActividadService.guardarPreferencias)
router.post('/completar-perfil' + '/', upload.single('url_foto_perfil') , AlumnoActividadService.completarPerfil)
export default router;
