import express from "express";
import { sessionAuth } from "../middleware/supabaseMidleware";
import { ColegiosService } from "../infrestructure/server/colegio/ColegioService";
import { GradosService } from "../infrestructure/server/colegio/GradoService";
import { NivelEducativosService } from "../infrestructure/server/colegio/NivelEducativoService";
import { AlumnoAsistenciasService } from "../infrestructure/server/colegio/AlumnoAsistenciaService";
import { AlumnoTareasService } from "../infrestructure/server/colegio/AlumnoTareaService";
import { AulasService } from "../infrestructure/server/colegio/AulaService";
import { CalendarioDiaFestivosService } from "../infrestructure/server/colegio/CalendarioDiaFestivoService";
import { CalendarioEscolarsService } from "../infrestructure/server/colegio/CalendarioEscolarService";
import { CalendarioFechaImportantesService } from "../infrestructure/server/colegio/FechaImportanteService";
import { CursosService } from "../infrestructure/server/colegio/CursoService";
import { HistorialComunicacionsService } from "../infrestructure/server/colegio/HistorialComunicacionService";
import { UsuarioColegiosService } from "../infrestructure/server/colegio/UsuarioColegioService";
import { UsuarioCursosService } from "../infrestructure/server/colegio/UsuarioCursoService";
import { MateriasService } from "../infrestructure/server/colegio/MateriaService";
import { AlumnosApoderadosColegioController } from "../infrestructure/server/colegio/controller/AlumnosApoderadosColegioController";
import { createSecureMemoryUpload } from "../helpers/secure-upload";

const router = express.Router();
const rutas_grados = "/grados";
const rutas_nivel_educativo = "/niveles_educativos";
const rutas_alumnos_asistencias = "/alumnos_asistencias";
const rutas_alumnos_tareas = "/alumnos_tareas";
const rutas_aulas = "/aulas";
const rutas_materias = "/materias";
const rutas_dias_festivos = "/dias_festivos";
const rutas_calendarios_escolares = "/calendarios_escolares";
const rutas_calendarios_fechas_importantes = "/calendarios_fechas_importantes";
const rutas_cursos = "/cursos";
const rutas_historiales_comunicaciones = "/historiales_comunicaciones";
const rutas_usuarios_colegios = "/usuarios_colegios";
const rutas_usuarios_cursos = "/usuarios_cursos";
const upload = createSecureMemoryUpload();
/**
 * @swagger
 * tags:
 *   - name: Colegios
 *     description: Gestión de colegios
 *   - name: Grados
 *     description: Gestión de grados educativos
 *   - name: Niveles Educativos
 *     description: Gestión de niveles educativos
 *   - name: Asistencias
 *     description: Gestión de asistencias de alumnos
 *   - name: Tareas
 *     description: Gestión de tareas de alumnos
 *   - name: Aulas
 *     description: Gestión de aulas
 *   - name: Días Festivos
 *     description: Gestión de días festivos
 *   - name: Calendarios Escolares
 *     description: Gestión de calendarios escolares
 *   - name: Fechas Importantes
 *     description: Gestión de fechas importantes
 *   - name: Cursos
 *     description: Gestión de cursos
 *   - name: Comunicaciones
 *     description: Gestión de historial de comunicaciones
 */

/**
 * @swagger
 * /api/v1/colegios:
 *   get:
 *     summary: Obtener lista de colegios
 *     description: Retorna todos los colegios registrados en el sistema
 *     tags: [Colegios]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de colegios obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Colegio'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", sessionAuth, ColegiosService.obtener);

/**
 * @swagger
 * /api/v1/colegios/{colegio_id}/alumnos-apoderados:
 *   get:
 *     summary: Obtener alumnos y apoderados de un colegio
 *     tags: [Colegios]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: colegio_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alumnos del colegio con sus apoderados relacionados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metricas:
 *                   type: object
 *                   properties:
 *                     cantidad_alumnos_cargados:
 *                       type: integer
 *                     alumnos_por_grado:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           grado_id:
 *                             type: integer
 *                           grado:
 *                             type: string
 *                           cantidad_alumnos:
 *                             type: integer
 *                     alumnos_sin_apoderado:
 *                       type: array
 *                       items:
 *                         type: integer
 *                 alumnos:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: ID de colegio inválido
 *       401:
 *         description: Sesión no válida
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/:colegio_id/alumnos-apoderados",
  sessionAuth,
  AlumnosApoderadosColegioController.obtener
);

/**
 * @swagger
 * /api/v1/colegios:
 *   post:
 *     summary: Crear un nuevo colegio
 *     description: Registra un nuevo colegio en el sistema
 *     tags: [Colegios]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *             $ref: '#/components/schemas/Colegio'
 *           example:
 *             nombre: "Colegio Ejemplo"
 *             nombre_fantasia: "Ejemplo"
 *             tipo_colegio: "Privado"
 *             direccion: "Calle Principal 123"
 *             telefono_contacto: "+56912345678"
 *             correo_electronico: "contacto@colegioejemplo.cl"
 *             comuna_id: 101
 *             region_id: 13
 *             pais_id: 1
 *             correo_sos: "sos@colegio.cl"
 *             correo_denuncia: "denuncia@colegio.cl"
 *     responses:
 *       201:
 *         description: Colegio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Colegio'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", sessionAuth, ColegiosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/{id}:
 *   put:
 *     summary: Actualizar un colegio existente
 *     description: Modifica los datos de un colegio registrado
 *     tags: [Colegios]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del colegio a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Colegio'
 *           example:
 *             nombre: "Colegio Ejemplo Actualizado"
 *             telefono_contacto: "+56987654321"
 *             correo_sos: "sos@colegio.cl"
 *             correo_denuncia: "denuncia@colegio.cl"
 *     responses:
 *       200:
 *         description: Colegio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Colegio'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Colegio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put("/:id", sessionAuth, ColegiosService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/{id}:
 *   delete:
 *     summary: Eliminar un colegio
 *     description: Elimina un colegio del sistema (lógico o físico según configuración)
 *     tags: [Colegios]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del colegio a eliminar
 *     responses:
 *       204:
 *         description: Colegio eliminado exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Colegio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id", sessionAuth, ColegiosService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/grados:
 *   get:
 *     summary: Obtener lista de grados
 *     description: Retorna todos los grados educativos registrados
 *     tags: [Grados]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de grados obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grado'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_grados, sessionAuth, GradosService.obtener);

/**
 * @swagger
 * /api/v1/colegios/grados:
 *   post:
 *     summary: Crear un nuevo grado
 *     description: Registra un nuevo grado educativo en el sistema
 *     tags: [Grados]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grado'
 *           example:
 *             nombre: "Primero Básico"
 *     responses:
 *       201:
 *         description: Grado creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Grado'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_grados, sessionAuth, GradosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/grados/{id}:
 *   put:
 *     summary: Actualizar un grado existente
 *     description: Modifica los datos de un grado educativo registrado
 *     tags: [Grados]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del grado a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grado'
 *           example:
 *             nombre: "Primero Básico A"
 *     responses:
 *       200:
 *         description: Grado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Grado'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Grado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_grados}/:id`, sessionAuth, GradosService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/grados/{id}:
 *   delete:
 *     summary: Eliminar un grado
 *     description: Elimina un grado educativo del sistema
 *     tags: [Grados]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del grado a eliminar
 *     responses:
 *       204:
 *         description: Grado eliminado exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Grado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_grados}/:id`, sessionAuth, GradosService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/niveles_educativos:
 *   get:
 *     summary: Obtener lista de niveles educativos
 *     description: Retorna todos los niveles educativos registrados
 *     tags: [Niveles Educativos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de niveles educativos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NivelEducativo'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_nivel_educativo, sessionAuth, NivelEducativosService.obtener);

/**
 * @swagger
 * /api/v1/colegios/niveles_educativos:
 *   post:
 *     summary: Crear un nuevo nivel educativo
 *     description: Registra un nuevo nivel educativo en el sistema
 *     tags: [Niveles Educativos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NivelEducativo'
 *           example:
 *             nombre: "Educación Básica"
 *     responses:
 *       201:
 *         description: Nivel educativo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NivelEducativo'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_nivel_educativo, sessionAuth, NivelEducativosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/niveles_educativos/{id}:
 *   put:
 *     summary: Actualizar un nivel educativo existente
 *     description: Modifica los datos de un nivel educativo registrado
 *     tags: [Niveles Educativos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del nivel educativo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NivelEducativo'
 *           example:
 *             nombre: "Educación Básica Completa"
 *     responses:
 *       200:
 *         description: Nivel educativo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NivelEducativo'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Nivel educativo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  `${rutas_nivel_educativo}/:id`,
  sessionAuth,
  NivelEducativosService.actualizar
);

/**
 * @swagger
 * /api/v1/colegios/niveles_educativos/{id}:
 *   delete:
 *     summary: Eliminar un nivel educativo
 *     description: Elimina un nivel educativo del sistema
 *     tags: [Niveles Educativos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del nivel educativo a eliminar
 *     responses:
 *       204:
 *         description: Nivel educativo eliminado exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Nivel educativo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  `${rutas_nivel_educativo}/:id`,
  sessionAuth,
  NivelEducativosService.eliminar
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Persona:
 *       type: object
 *       properties:
 *         persona_id:
 *           type: integer
 *         nombres:
 *           type: string
 *         apellidos:
 *           type: string
 *     Alumno:
 *       type: object
 *       properties:
 *         alumno_id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         url_foto_perfil:
 *           type: string
 *           format: uri
 *         telefono_contacto1:
 *           type: string
 *         telefono_contacto2:
 *           type: string
 *         personas:
 *           $ref: '#/components/schemas/Persona'
 *     AlumnoAsistencia:
 *       type: object
 *       properties:
 *         alumno_asistencia_id:
 *           type: integer
 *         alumno_id:
 *           type: integer
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [Presente, Ausente, Justificado]
 *         justificacion:
 *           type: string
 *         usuario_justifica:
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
 *         activo:
 *           type: boolean
 *         alumnos:
 *           $ref: '#/components/schemas/Alumno'
 *
 * /api/v1/colegios/alumnos_asistencias:
 *   get:
 *     summary: Obtener lista de asistencias de alumnos
 *     description: Retorna todos los registros de asistencia de alumnos, incluyendo información del alumno y su persona relacionada.
 *     tags: [Asistencias]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de asistencias obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoAsistencia'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  rutas_alumnos_asistencias,
  sessionAuth,
  AlumnoAsistenciasService.obtener
);

/**
 * @swagger
 * /api/v1/colegios/alumnos_asistencias:
 *   post:
 *     summary: Registrar asistencia de alumno
 *     description: Crea un nuevo registro de asistencia para un alumno.
 *     tags: [Asistencias]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAsistencia'
 *           example:
 *             alumno_id: 7
 *             fecha_hora: "2023-10-15T08:00:00Z"
 *             estado: "Presente"
 *             justificacion: ""
 *             usuario_justifica: 1
 *     responses:
 *       201:
 *         description: Asistencia registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAsistencia'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  rutas_alumnos_asistencias,
  sessionAuth,
  AlumnoAsistenciasService.guardar
);

/**
 * @swagger
 * /api/v1/colegios/alumnos_asistencias/{id}:
 *   put:
 *     summary: Actualizar registro de asistencia
 *     description: Modifica un registro existente de asistencia de alumno.
 *     tags: [Asistencias]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de asistencia a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoAsistencia'
 *           example:
 *             estado: "Justificado"
 *             justificacion: "Enfermedad"
 *             usuario_justifica: 2
 *             actualizado_por: 1
 *     responses:
 *       200:
 *         description: Asistencia actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoAsistencia'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Registro de asistencia no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  `${rutas_alumnos_asistencias}/:id`,
  sessionAuth,
  AlumnoAsistenciasService.actualizar
);

/**
 * @swagger
 * /api/v1/colegios/alumnos_asistencias/{id}:
 *   delete:
 *     summary: Eliminar registro de asistencia
 *     description: Elimina un registro de asistencia de alumno.
 *     tags: [Asistencias]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de asistencia a eliminar
 *     responses:
 *       204:
 *         description: Asistencia eliminada exitosamente (sin contenido)
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Registro de asistencia no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  `${rutas_alumnos_asistencias}/:id`,
  sessionAuth,
  AlumnoAsistenciasService.eliminar
);

/**
 * @swagger
 * /api/v1/colegios/alumnos_tareas:
 *   get:
 *     summary: Obtener lista de tareas de alumnos
 *     description: Retorna todos los registros de tareas asignadas a alumnos con información detallada de alumnos y materias
 *     tags: [Tareas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de tareas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlumnoTarea'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 * 
 * @swagger
 * components:
 *   schemas:
 *     AlumnoTarea:
 *       type: object
 *       properties:
 *         alumno_tarea:
 *           type: integer
 *           example: 0
 *         alumno_id:
 *           type: integer
 *           example: 7
 *         fecha_programacion:
 *           type: string
 *           format: date-time
 *           example: "2023-10-20T00:00:00"
 *         materia_id:
 *           type: integer
 *           example: 3
 *         color:
 *           type: string
 *           example: "#FF5733"
 *         tipo_tarea:
 *           type: string
 *           example: "Proyecto"
 *         descripcion_tarea:
 *           type: string
 *           example: "Investigación sobre ecosistemas"
 *         estado_tarea:
 *           type: string
 *           example: "Pendiente"
 *         creado_por:
 *           type: integer
 *           example: 1
 *         actualizado_por:
 *           type: integer
 *           example: 1
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T22:15:14.763"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2025-05-14T22:15:14.763"
 *         activo:
 *           type: boolean
 *           example: true
 *         alumnos:
 *           $ref: '#/components/schemas/AlumnoInfo'
 *         materias:
 *           $ref: '#/components/schemas/MateriaInfo'
 * 
 *     AlumnoInfo:
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
 * 
 *     MateriaInfo:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Ciencias Naturales"
 *         materia_id:
 *           type: integer
 *           example: 3
 */
router.get(rutas_alumnos_tareas, sessionAuth, AlumnoTareasService.obtener);

/**
 * @swagger
 * /api/v1/colegios/alumnos_tareas:
 *   post:
 *     summary: Asignar tarea a alumno
 *     description: Crea un nuevo registro de tarea asignada a un alumno
 *     tags: [Tareas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoTarea'
 *           example:
 *             alumno_id: 1
 *             materia_id: 3
 *             fecha_programacion: "2023-10-20"
 *             tipo_tarea: "Proyecto"
 *             descripcion_tarea: "Investigación sobre ecosistemas"
 *             estado_tarea: "Pendiente"
 *             color: "#FF5733"
 *     responses:
 *       201:
 *         description: Tarea asignada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoTarea'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_alumnos_tareas, sessionAuth, AlumnoTareasService.guardar);

/**
 * @swagger
 * /api/v1/colegios/alumnos_tareas/{id}:
 *   put:
 *     summary: Actualizar tarea de alumno
 *     description: Modifica un registro existente de tarea asignada a alumno
 *     tags: [Tareas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de tarea a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlumnoTarea'
 *           example:
 *             estado_tarea: "Completada"
 *             descripcion_tarea: "Investigación sobre ecosistemas (entregada)"
 *     responses:
 *       200:
 *         description: Tarea actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumnoTarea'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Registro de tarea no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  `${rutas_alumnos_tareas}/:id`,
  sessionAuth,
  AlumnoTareasService.actualizar
);

/**
 * @swagger
 * /api/v1/colegios/alumnos_tareas/{id}:
 *   delete:
 *     summary: Eliminar tarea de alumno
 *     description: Elimina un registro de tarea asignada a alumno
 *     tags: [Tareas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de tarea a eliminar
 *     responses:
 *       204:
 *         description: Tarea eliminada exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Registro de tarea no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  `${rutas_alumnos_tareas}/:id`,
  sessionAuth,
  AlumnoTareasService.eliminar
);

/**
 * @swagger
 * /api/v1/colegios/aulas:
 *   get:
 *     summary: Obtener lista de aulas con información completa
 *     description: Retorna todas las aulas registradas con sus relaciones (colegio, grado, nivel educativo)
 *     tags: [Aulas]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de aulas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AulaCompleta'
 *             example:
 *               - aula_id: 1
 *                 nombre: "Aula 101"
 *                 capacidad: 30
 *                 colegio_id: 1
 *                 grado_id: 5
 *                 activo: true
 *                 colegio:
 *                   colegio_id: 1
 *                   nombre: "Colegio Ejemplo"
 *                 grado:
 *                   grado_id: 5
 *                   nombre: "Quinto Grado"
 *                   nivel_educativo:
 *                     nivel_educativo_id: 2
 *                     nombre: "Primaria"
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_aulas, sessionAuth, AulasService.obtener);

/**
 * @swagger
 * /api/v1/colegios/aulas:
 *   post:
 *     summary: Crear una nueva aula
 *     description: Registra una nueva relación aula-curso-docente-materia en el sistema
 *     tags: [Aulas]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AulaInput'
 *           example:
 *             curso_id: 5
 *             colegio_id: 1
 *             materia_id: 3
 *             docente_id: 7
 *             tipo_docente: "Titular"
 *     responses:
 *       201:
 *         description: Aula creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aula'
 *             example:
 *               aula_id: 1
 *               curso_id: 5
 *               colegio_id: 1
 *               materia_id: 3
 *               docente_id: 7
 *               tipo_docente: "Titular"
 *               fecha_creacion: "2023-05-10T14:30:00Z"
 *               fecha_actualizacion: null
 *               creado_por: 1
 *               actualizado_por: null
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             example:
 *               error: "El campo 'curso_id' es requerido"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_aulas, sessionAuth, AulasService.guardar);

/**
 * @swagger
 * /api/v1/colegios/aulas/{id}:
 *   put:
 *     summary: Actualizar un aula existente
 *     description: Modifica los datos de una relación aula-curso-docente-materia
 *     tags: [Aulas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del aula a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AulaUpdate'
 *           example:
 *             curso_id: 6
 *             materia_id: 4
 *             docente_id: 8
 *             tipo_docente: "Suplente"
 *             actualizado_por: 2
 *     responses:
 *       200:
 *         description: Aula actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aula'
 *             example:
 *               aula_id: 1
 *               curso_id: 6
 *               colegio_id: 1
 *               materia_id: 4
 *               docente_id: 8
 *               tipo_docente: "Suplente"
 *               fecha_creacion: "2023-05-10T14:30:00Z"
 *               fecha_actualizacion: "2023-05-15T10:15:00Z"
 *               creado_por: 1
 *               actualizado_por: 2
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Aula no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_aulas}/:id`, sessionAuth, AulasService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/aulas/{id}:
 *   delete:
 *     summary: Eliminar un aula (desactivar)
 *     description: Realiza una eliminación lógica (desactivación) de un aula del sistema
 *     tags: [Aulas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del aula a desactivar
 *     responses:
 *       204:
 *         description: Aula desactivada exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Aula no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_aulas}/:id`, sessionAuth, AulasService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/dias_festivos:
 *   get:
 *     summary: Obtener lista de días festivos
 *     description: Retorna todos los días festivos registrados
 *     tags: [Días Festivos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de días festivos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DiaFestivo'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_dias_festivos, sessionAuth, CalendarioDiaFestivosService.obtener);

/**
 * @swagger
 * /api/v1/colegios/dias_festivos:
 *   post:
 *     summary: Crear un nuevo día festivo
 *     description: Registra un nuevo día festivo en el sistema
 *     tags: [Días Festivos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiaFestivo'
 *           example:
 *             calendario_escolar_id: 1
 *             dia_festivo: "2023-12-25"
 *             descripcion: "Navidad"
 *     responses:
 *       201:
 *         description: Día festivo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiaFestivo'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_dias_festivos, sessionAuth, CalendarioDiaFestivosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/dias_festivos/{id}:
 *   put:
 *     summary: Actualizar un día festivo existente
 *     description: Modifica los datos de un día festivo registrado
 *     tags: [Días Festivos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del día festivo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiaFestivo'
 *           example:
 *             descripcion: "Navidad (actualizado)"
 *     responses:
 *       200:
 *         description: Día festivo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiaFestivo'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Día festivo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_dias_festivos}/:id`, sessionAuth, CalendarioDiaFestivosService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/dias_festivos/{id}:
 *   delete:
 *     summary: Eliminar un día festivo
 *     description: Elimina un día festivo del sistema
 *     tags: [Días Festivos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del día festivo a eliminar
 *     responses:
 *       204:
 *         description: Día festivo eliminado exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Día festivo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_dias_festivos}/:id`, sessionAuth, CalendarioDiaFestivosService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/calendarios_escolares:
 *   get:
 *     summary: Obtener lista de calendarios escolares
 *     description: Retorna todos los calendarios escolares registrados
 *     tags: [Calendarios Escolares]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de calendarios escolares obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CalendarioEscolar'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_calendarios_escolares, sessionAuth, CalendarioEscolarsService.obtener);

/**
 * @swagger
 * /api/v1/colegios/calendarios_escolares:
 *   post:
 *     summary: Crear un nuevo calendario escolar
 *     description: Registra un nuevo calendario escolar en el sistema
 *     tags: [Calendarios Escolares]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalendarioEscolar'
 *           example:
 *             nombre: "Calendario 2023-2024"
 *             año: 2023
 *     responses:
 *       201:
 *         description: Calendario escolar creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarioEscolar'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_calendarios_escolares, sessionAuth, CalendarioEscolarsService.guardar);

/**
 * @swagger
 * /api/v1/colegios/calendarios_escolares/{id}:
 *   put:
 *     summary: Actualizar un calendario escolar existente
 *     description: Modifica los datos de un calendario escolar registrado
 *     tags: [Calendarios Escolares]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del calendario escolar a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalendarioEscolar'
 *           example:
 *             nombre: "Calendario Académico 2023-2024"
 *     responses:
 *       200:
 *         description: Calendario escolar actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarioEscolar'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Calendario escolar no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_calendarios_escolares}/:id`, sessionAuth, CalendarioEscolarsService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/calendarios_escolares/{id}:
 *   delete:
 *     summary: Eliminar un calendario escolar
 *     description: Elimina un calendario escolar del sistema
 *     tags: [Calendarios Escolares]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del calendario escolar a eliminar
 *     responses:
 *       204:
 *         description: Calendario escolar eliminado exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Calendario escolar no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_calendarios_escolares}/:id`, sessionAuth, CalendarioEscolarsService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/calendarios_fechas_importantes:
 *   get:
 *     summary: Obtener lista de fechas importantes
 *     description: Retorna todas las fechas importantes registradas
 *     tags: [Fechas Importantes]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de fechas importantes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CalendarioFechaImportante'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_calendarios_fechas_importantes, sessionAuth, CalendarioFechaImportantesService.obtener);

/**
 * @swagger
 * /api/v1/colegios/calendarios_fechas_importantes:
 *   post:
 *     summary: Crear una nueva fecha importante
 *     description: Registra una nueva fecha importante en el sistema
 *     tags: [Fechas Importantes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalendarioFechaImportante'
 *           example:
 *             calendario_escolar_id: 1
 *             fecha_importante: "2023-12-25"
 *             descripcion: "Navidad"
 *     responses:
 *       201:
 *         description: Fecha importante creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarioFechaImportante'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_calendarios_fechas_importantes, sessionAuth, CalendarioFechaImportantesService.guardar);

/**
 * @swagger
 * /api/v1/colegios/calendarios_fechas_importantes/{id}:
 *   put:
 *     summary: Actualizar una fecha importante existente
 *     description: Modifica los datos de una fecha importante registrada
 *     tags: [Fechas Importantes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la fecha importante a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalendarioFechaImportante'
 *           example:
 *             descripcion: "Navidad (actualizado)"
 *     responses:
 *       200:
 *         description: Fecha importante actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarioFechaImportante'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Fecha importante no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_calendarios_fechas_importantes}/:id`, sessionAuth, CalendarioFechaImportantesService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/calendarios_fechas_importantes/{id}:
 *   delete:
 *     summary: Eliminar una fecha importante
 *     description: Elimina una fecha importante del sistema
 *     tags: [Fechas Importantes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la fecha importante a eliminar
 *     responses:
 *       204:
 *         description: Fecha importante eliminada exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Fecha importante no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_calendarios_fechas_importantes}/:id`, sessionAuth, CalendarioFechaImportantesService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/cursos:
 *   get:
 *     summary: Obtener lista de cursos
 *     description: Retorna todos los cursos registrados
 *     tags: [Cursos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de cursos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Curso'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_cursos, sessionAuth, CursosService.obtener);

/**
 * @swagger
 * /api/v1/colegios/cursos:
 *   post:
 *     summary: Crear un nuevo curso
 *     description: Registra un nuevo curso en el sistema
 *     tags: [Cursos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Curso'
 *           example:
 *             nombre: "Matemáticas Avanzadas"
 *             descripcion: "Curso de matemáticas para nivel avanzado"
 *     responses:
 *       201:
 *         description: Curso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Curso'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_cursos, sessionAuth, CursosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/cursos/{id}:
 *   put:
 *     summary: Actualizar un curso existente
 *     description: Modifica los datos de un curso registrado
 *     tags: [Cursos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Curso'
 *           example:
 *             descripcion: "Curso avanzado de matemáticas (actualizado)"
 *     responses:
 *       200:
 *         description: Curso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Curso'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Curso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_cursos}/:id`, sessionAuth, CursosService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/cursos/{id}:
 *   delete:
 *     summary: Eliminar un curso
 *     description: Elimina un curso del sistema
 *     tags: [Cursos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso a eliminar
 *     responses:
 *       204:
 *         description: Curso eliminado exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Curso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_cursos}/:id`, sessionAuth, CursosService.eliminar);

/**
 * @swagger
 * /api/v1/colegios/historiales_comunicaciones:
 *   get:
 *     summary: Obtener historial de comunicaciones
 *     description: Retorna el historial de comunicaciones registrado
 *     tags: [Comunicaciones]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Historial de comunicaciones obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistorialComunicacion'
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.get(rutas_historiales_comunicaciones, sessionAuth, HistorialComunicacionsService.obtener);

/**
 * @swagger
 * /api/v1/colegios/historiales_comunicaciones:
 *   post:
 *     summary: Registrar nueva comunicación
 *     description: Crea un nuevo registro en el historial de comunicaciones
 *     tags: [Comunicaciones]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HistorialComunicacion'
 *           example:
 *             alumno_id: 1
 *             apoderado_id: 1
 *             usuario_id: 1
 *             asunto: "Informe de rendimiento"
 *             descripcion: "Reunión para discutir el rendimiento académico"
 *             acciones_acuerdos_tomados: "Programar tutorías semanales"
 *     responses:
 *       201:
 *         description: Comunicación registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistorialComunicacion'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post(rutas_historiales_comunicaciones, sessionAuth, HistorialComunicacionsService.guardar);

/**
 * @swagger
 * /api/v1/colegios/historiales_comunicaciones/{id}:
 *   put:
 *     summary: Actualizar comunicación existente
 *     description: Modifica un registro existente en el historial de comunicaciones
 *     tags: [Comunicaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comunicación a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HistorialComunicacion'
 *           example:
 *             descripcion: "Reunión para discutir el rendimiento académico (actualizado)"
 *             acciones_acuerdos_tomados: "Programar tutorías semanales y seguimiento mensual"
 *     responses:
 *       200:
 *         description: Comunicación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistorialComunicacion'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Comunicación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_historiales_comunicaciones}/:id`, sessionAuth, HistorialComunicacionsService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/historiales_comunicaciones/{id}:
 *   delete:
 *     summary: Eliminar comunicación
 *     description: Elimina un registro del historial de comunicaciones
 *     tags: [Comunicaciones]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comunicación a eliminar
 *     responses:
 *       204:
 *         description: Comunicación eliminada exitosamente
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       404:
 *         description: Comunicación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_historiales_comunicaciones}/:id`, sessionAuth, HistorialComunicacionsService.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     Colegio:
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
 *           example: "Ejemplo"
 *         tipo_colegio:
 *           type: string
 *           example: "Privado"
 *         dependencia:
 *           type: string
 *           example: "Particular"
 *         sitio_web:
 *           type: string
 *           example: "www.colegioejemplo.cl"
 *         direccion:
 *           type: string
 *           example: "Calle Principal 123"
 *         telefono_contacto:
 *           type: string
 *           example: "+56912345678"
 *         correo_electronico:
 *           type: string
 *           example: "contacto@colegioejemplo.cl"
 *         comuna_id:
 *           type: integer
 *           example: 101
 *         region_id:
 *           type: integer
 *           example: 13
 *         pais_id:
 *           type: integer
 *           example: 1
 * 
 *     Grado:
 *       type: object
 *       properties:
 *         grado_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Primero Básico"
 * 
 *     NivelEducativo:
 *       type: object
 *       properties:
 *         nivel_educativo_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Educación Básica"
 * 
 *     AlumnoAsistencia:
 *       type: object
 *       properties:
 *         alumno_asistencia_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 1
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           example: "2023-10-15T08:00:00Z"
 *         estado:
 *           type: string
 *           example: "Presente"
 *         justificacion:
 *           type: string
 *           example: "Enfermedad"
 *         usuario_justifica:
 *           type: integer
 *           example: 2
 * 
 *     AlumnoTarea:
 *       type: object
 *       properties:
 *         alumno_tarea_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 1
 *         fecha_programacion:
 *           type: string
 *           format: date
 *           example: "2023-10-20"
 *         materia_id:
 *           type: integer
 *           example: 3
 *         color:
 *           type: string
 *           example: "#FF5733"
 *         tipo_tarea:
 *           type: string
 *           example: "Proyecto"
 *         descripcion_tarea:
 *           type: string
 *           example: "Investigación sobre ecosistemas"
 *         estado_tarea:
 *           type: string
 *           example: "Pendiente"
 * 
 *     Aula:
 *       type: object
 *       properties:
 *         aula_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Aula 101"
 *         capacidad:
 *           type: integer
 *           example: 30
 *         grado_id:
 *           type: integer
 *           example: 1
 * 
 *     DiaFestivo:
 *       type: object
 *       properties:
 *         dia_festivo_id:
 *           type: integer
 *           example: 1
 *         calendario_escolar_id:
 *           type: integer
 *           example: 1
 *         dia_festivo:
 *           type: string
 *           format: date
 *           example: "2023-12-25"
 *         descripcion:
 *           type: string
 *           example: "Navidad"
 * 
 *     CalendarioEscolar:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Calendario 2023"
 *         año:
 *           type: integer
 *           example: 2023
 * 
 *     CalendarioFechaImportante:
 *       type: object
 *       properties:
 *         calendario_escolar_id:
 *           type: integer
 *           example: 1
 *         fecha_importante:
 *           type: string
 *           format: date
 *           example: "2023-12-25"
 *         descripcion:
 *           type: string
 *           example: "Navidad"
 * 
 *     Curso:
 *       type: object
 *       properties:
 *         curso_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Matemáticas Avanzadas"
 *         descripcion:
 *           type: string
 *           example: "Curso de matemáticas para nivel avanzado"
 * 
 *     HistorialComunicacion:
 *       type: object
 *       properties:
 *         historial_comunicacion_id:
 *           type: integer
 *           example: 1
 *         alumno_id:
 *           type: integer
 *           example: 1
 *         apoderado_id:
 *           type: integer
 *           example: 1
 *         usuario_id:
 *           type: integer
 *           example: 1
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           example: "2023-10-15T14:30:00Z"
 *         asunto:
 *           type: string
 *           example: "Informe de rendimiento"
 *         descripcion:
 *           type: string
 *           example: "Reunión para discutir el rendimiento académico"
 *         acciones_acuerdos_tomados:
 *           type: string
 *           example: "Programar tutorías semanales"
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: header
 *       name: Authorization
 *       description: Token de autenticación obtenido al iniciar sesión
 */
/**
 * @swagger
 * tags:
 *   - name: UsuarioColegios
 *     description: Gestión de relaciones entre usuarios y colegios
 */

/**
 * @swagger
 * /api/v1/colegios/usuarios_colegios:
 *   get:
 *     tags: [UsuarioColegios]
 *     summary: Obtener todas las relaciones usuario-colegio
 *     description: Retorna una lista de todas las asignaciones de usuarios a colegios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de relaciones usuario-colegio obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UsuarioColegioResponse'
 *       401:
 *         description: No autorizado, token inválido o faltante
 *       500:
 *         description: Error interno del servidor
 */
router.get(`${rutas_usuarios_colegios}/`, sessionAuth, UsuarioColegiosService.obtener);

/**
 * @swagger
 * /api/v1/colegios/usuarios_colegios:
 *   post:
 *     tags: [UsuarioColegios]
 *     summary: Crear una nueva relación usuario-colegio
 *     description: Asigna un usuario a un colegio con un rol específico
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioColegioInput'
 *     responses:
 *       201:
 *         description: Relación usuario-colegio creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioColegioResponse'
 *       400:
 *         description: Datos de entrada inválidos o faltantes
 *       401:
 *         description: No autorizado, token inválido o faltante
 *       409:
 *         description: La relación usuario-colegio ya existe
 *       500:
 *         description: Error interno del servidor
 */
router.post(`${rutas_usuarios_colegios}/`, sessionAuth, UsuarioColegiosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/usuarios_colegios/{id}:
 *   put:
 *     tags: [UsuarioColegios]
 *     summary: Actualizar una relación usuario-colegio
 *     description: Actualiza los datos de una relación usuario-colegio por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación usuario-colegio a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioColegioInput'
 *     responses:
 *       200:
 *         description: Relación usuario-colegio actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioColegioResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado, token inválido o faltante
 *       404:
 *         description: Relación usuario-colegio no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_usuarios_colegios}/:id`, sessionAuth, UsuarioColegiosService.actualizar);

/**
 * @swagger
 * /api/v1/colegio/usuarios_colegios/{id}:
 *   delete:
 *     tags: [UsuarioColegios]
 *     summary: Eliminar una relación usuario-colegio
 *     description: Elimina una relación usuario-colegio por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación usuario-colegio a eliminar
 *     responses:
 *       204:
 *         description: Relación usuario-colegio eliminada exitosamente
 *       401:
 *         description: No autorizado, token inválido o faltante
 *       404:
 *         description: Relación usuario-colegio no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_usuarios_colegios}/:id`, sessionAuth, UsuarioColegiosService.eliminar);

/**
 * @swagger
 * tags:
 *   name: UsuarioCursos
 *   description: Endpoints para gestionar la relación entre usuarios y cursos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioCurso:
 *       type: object
 *       properties:
 *         usuario_curso_id:
 *           type: integer
 *           description: ID único de la relación usuario-curso
 *         usuarios_colegio_id:
 *           type: integer
 *           description: ID de la relación usuario-colegio
 *         curso_id:
 *           type: integer
 *           description: ID del curso asignado
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de asignación del curso al usuario
 *       required:
 *         - usuarios_colegio_id
 *         - curso_id
 * 
 *     UsuarioColegio:
 *       type: object
 *       properties:
 *         usuarios_colegio_id:
 *           type: integer
 *           description: ID único de la relación usuario-colegio
 *         usuario_id:
 *           type: integer
 *           description: ID del usuario
 *         colegio_id:
 *           type: integer
 *           description: ID del colegio
 *         rol_id:
 *           type: integer
 *           description: ID del rol del usuario en el colegio
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de asignación del usuario al colegio
 *       required:
 *         - usuario_id
 *         - colegio_id
 *         - rol_id
 * 
 *     Curso:
 *       type: object
 *       properties:
 *         curso_id:
 *           type: integer
 *           description: ID único del curso
 *         nombre_curso:
 *           type: string
 *           description: Nombre del curso
 *         colegio_id:
 *           type: integer
 *           description: ID del colegio al que pertenece el curso
 *         grado_id:
 *           type: integer
 *           description: ID del grado asociado al curso
 *         nivel_educativo_id:
 *           type: integer
 *           description: ID del nivel educativo asociado al curso
 *       required:
 *         - nombre_curso
 *         - colegio_id
 *         - grado_id
 *         - nivel_educativo_id
 */

/**
 * @swagger
 * /api/v1/colegios/usuarios_cursos/:
 *   get:
 *     summary: Obtener todas las relaciones usuario-curso con información extendida
 *     tags: [UsuarioCursos]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de relaciones usuario-curso con datos extendidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   usuario_curso_id:
 *                     type: integer
 *                     example: 0
 *                   usuarios_colegio_id:
 *                     type: integer
 *                     example: 1
 *                   curso_id:
 *                     type: integer
 *                     example: 2
 *                   fecha_asignacion:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-05-12T00:00:00"
 *                   creado_por:
 *                     type: integer
 *                     example: 1
 *                   actualizado_por:
 *                     type: integer
 *                     example: 1
 *                   fecha_creacion:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-05-15T22:22:37.135"
 *                   fecha_actualizacion:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-05-15T22:22:37.135"
 *                   activo:
 *                     type: boolean
 *                     example: true
 *                   usuarios_colegios:
 *                     type: object
 *                     properties:
 *                       usuarios:
 *                         type: object
 *                         properties:
 *                           usuario_id:
 *                             type: integer
 *                             example: 1
 *                           nombre_social:
 *                             type: string
 *                             example: "prueba"
 *                       fecha_asignacion:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-15T17:17:32"
 *                       usuarios_colegio_id:
 *                         type: integer
 *                         example: 1
 *                   cursos:
 *                     type: object
 *                     properties:
 *                       curso_id:
 *                         type: integer
 *                         example: 2
 *                       nombre_curso:
 *                         type: string
 *                         example: "1° Medio - Jornada Tarde - Colegio 1"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(`${rutas_usuarios_cursos}/`, sessionAuth, UsuarioCursosService.obtener);
/**
 * @swagger
 * /api/v1/colegios/usuarios_cursos/:
 *   post:
 *     summary: Crear una nueva relación usuario-curso
 *     tags: [UsuarioCursos]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCurso'
 *     responses:
 *       201:
 *         description: Relación usuario-curso creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioCurso'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post(`${rutas_usuarios_cursos}/`, sessionAuth, UsuarioCursosService.guardar);

/**
 * @swagger
 * /api/v1/colegios/usuarios_cursos/{id}:
 *   put:
 *     summary: Actualizar una relación usuario-curso existente
 *     tags: [UsuarioCursos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación usuario-curso a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCurso'
 *     responses:
 *       200:
 *         description: Relación usuario-curso actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioCurso'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Relación usuario-curso no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put(`${rutas_usuarios_cursos}/:id`, sessionAuth, UsuarioCursosService.actualizar);

/**
 * @swagger
 * /api/v1/colegios/usuarios_cursos/{id}:
 *   delete:
 *     summary: Eliminar una relación usuario-curso
 *     tags: [UsuarioCursos]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación usuario-curso a eliminar
 *     responses:
 *       204:
 *         description: Relación usuario-curso eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Relación usuario-curso no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete(`${rutas_usuarios_cursos}/:id`, sessionAuth, UsuarioCursosService.eliminar);


/**
 * @swagger
 * /api/v1/materias/:
 *   get:
 *     summary: Obtiene todas las materias
 *     description: Retorna una lista de todas las materias registradas en el sistema
 *     tags: [Materias]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de materias obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Materia'
 *       401:
 *         description: No autorizado, sesión inválida
 *       500:
 *         description: Error interno del servidor
 */
router.get(`${rutas_materias}/`, sessionAuth, MateriasService.obtener);

/**
 * @swagger
 * /api/v1/materias/:
 *   post:
 *     summary: Crea una nueva materia
 *     description: Registra una nueva materia en el sistema
 *     tags: [Materias]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Materia'
 *     responses:
 *       201:
 *         description: Materia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Materia'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado, sesión inválida
 *       500:
 *         description: Error interno del servidor
 */
router.post(`${rutas_materias}/`, sessionAuth, MateriasService.guardar);

/**
 * @swagger
 * /api/v1/materias/{id}:
 *   put:
 *     summary: Actualiza una materia existente
 *     description: Modifica los datos de una materia específica
 *     tags: [Materias]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la materia a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Materia'
 *     responses:
 *       200:
 *         description: Materia actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Materia'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado, sesión inválida
 *       404:
 *         description: Materia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(`${rutas_materias}/:id`, sessionAuth, MateriasService.actualizar);

/**
 * @swagger
 * /api/v1/materias/{id}:
 *   delete:
 *     summary: Elimina una materia
 *     description: Elimina una materia específica del sistema
 *     tags: [Materias]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la materia a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Materia eliminada exitosamente
 *       401:
 *         description: No autorizado, sesión inválida
 *       404:
 *         description: Materia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(`${rutas_materias}/:id`, sessionAuth, MateriasService.eliminar);

router.post('/insercion-data', sessionAuth, upload.single('file'), ColegiosService.importarExcelColegio);
router.post('/carga-staging', sessionAuth, upload.any(), ColegiosService.cargarExcelStaging);


/**
 * @swagger
 * components:
 *   schemas:
 *     Materia:
 *       type: object
 *       properties:
 *         materia_id:
 *           type: integer
 *           description: ID único de la materia
 *           example: 1
 *           readOnly: true
 *         colegio_id:
 *           type: integer
 *           description: ID del colegio al que pertenece la materia
 *           example: 5
 *           required: true
 *         nombre:
 *           type: string
 *           description: Nombre de la materia
 *           example: "Matemáticas Avanzadas"
 *           required: true
 *         codigo:
 *           type: string
 *           description: Código único identificador de la materia
 *           example: "MAT-202"
 *           required: true
 *       required:
 *         - colegio_id
 *         - nombre
 *         - codigo
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioColegioInput:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *           example: 1
 *           description: ID del usuario a asignar
 *         colegio_id:
 *           type: integer
 *           example: 5
 *           description: ID del colegio al que se asigna el usuario
 *         rol_id:
 *           type: integer
 *           example: 3
 *           description: ID del rol que tendrá el usuario en el colegio
 *       required:
 *         - usuario_id
 *         - colegio_id
 *         - rol_id
 * 
 *     UsuarioColegioResponse:
 *       type: object
 *       properties:
 *         usuarios_colegio_id:
 *           type: integer
 *           example: 10
 *           readOnly: true
 *         usuario_id:
 *           type: integer
 *           example: 1
 *         colegio_id:
 *           type: integer
 *           example: 5
 *         rol_id:
 *           type: integer
 *           example: 3
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T14:30:00Z"
 *         usuario:
 *           $ref: '#/components/schemas/UsuarioMinimo'
 *         colegio:
 *           $ref: '#/components/schemas/ColegioMinimo'
 *         rol:
 *           $ref: '#/components/schemas/RolMinimo'
 * 
 *     UsuarioMinimo:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *           example: 1
 *         nombre_social:
 *           type: string
 *           example: "Profesor Carlos"
 *         email:
 *           type: string
 *           example: "carlos@colegio.edu"
 * 
 *     ColegioMinimo:
 *       type: object
 *       properties:
 *         colegio_id:
 *           type: integer
 *           example: 5
 *         nombre:
 *           type: string
 *           example: "Colegio San Marcos"
 *         codigo:
 *           type: string
 *           example: "CSM-2023"
 * 
 *     RolMinimo:
 *       type: object
 *       properties:
 *         rol_id:
 *           type: integer
 *           example: 3
 *         nombre:
 *           type: string
 *           example: "Docente"
 *         descripcion:
 *           type: string
 *           example: "Rol para profesores del colegio"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AulaInput:
 *       type: object
 *       required:
 *         - curso_id
 *         - colegio_id
 *         - materia_id
 *         - docente_id
 *         - tipo_docente
 *       properties:
 *         curso_id:
 *           type: integer
 *           example: 5
 *           description: ID del curso asociado
 *         colegio_id:
 *           type: integer
 *           example: 1
 *           description: ID del colegio
 *         materia_id:
 *           type: integer
 *           example: 3
 *           description: ID de la materia
 *         docente_id:
 *           type: integer
 *           example: 7
 *           description: ID del docente asignado
 *         tipo_docente:
 *           type: string
 *           example: "Titular"
 *           enum: [Titular, Suplente, Reemplazante]
 *           description: Tipo de asignación del docente
 *         creado_por:
 *           type: integer
 *           example: 1
 *           description: ID del usuario que crea el registro
 * 
 *     AulaUpdate:
 *       type: object
 *       properties:
 *         curso_id:
 *           type: integer
 *           example: 6
 *           description: ID del curso asociado
 *         materia_id:
 *           type: integer
 *           example: 4
 *           description: ID de la materia
 *         docente_id:
 *           type: integer
 *           example: 8
 *           description: ID del docente asignado
 *         tipo_docente:
 *           type: string
 *           example: "Suplente"
 *           enum: [Titular, Suplente, Reemplazante]
 *           description: Tipo de asignación del docente
 *         actualizado_por:
 *           type: integer
 *           example: 2
 *           description: ID del usuario que actualiza el registro
 * 
 *     Aula:
 *       type: object
 *       properties:
 *         aula_id:
 *           type: integer
 *           example: 1
 *           description: ID único del aula
 *         curso_id:
 *           type: integer
 *           example: 5
 *           description: ID del curso asociado
 *         colegio_id:
 *           type: integer
 *           example: 1
 *           description: ID del colegio
 *         materia_id:
 *           type: integer
 *           example: 3
 *           description: ID de la materia
 *         docente_id:
 *           type: integer
 *           example: 7
 *           description: ID del docente asignado
 *         tipo_docente:
 *           type: string
 *           example: "Titular"
 *           enum: [Titular, Suplente, Reemplazante]
 *           description: Tipo de asignación del docente
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
 */
export default router;
