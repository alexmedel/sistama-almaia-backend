import express from 'express';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { PerfilService } from '../infrestructure/server/auth/PerfilService';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Perfil
 *     description: Gestión de datos de perfiles
 */

/**
 * @swagger
 * /api/v1/perfil/obtener:
 *   get:
 *     summary: Obtener perfil completo del usuario autenticado
 *     description: Retorna toda la información del usuario logueado incluyendo datos personales, rol y funcionalidades asignadas
 *     tags: [Perfil]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerfilUsuarioCompleto'
 *             example:
 *               usuario:
 *                 usuario_id: 1
 *                 nombre_social: "Juan Pérez"
 *                 email: "juan.perez@example.com"
 *                 telefono_contacto: "+123456789"
 *                 ultimo_inicio_sesion: "2023-05-20T12:00:00.000Z"
 *                 estado_usuario: "ACTIVO"
 *                 url_foto_perfil: "https://example.com/perfil.jpg"
 *                 persona_id: 1
 *                 rol_id: 1
 *                 idioma_id: 1
 *               persona:
 *                 persona_id: 1
 *                 tipo_documento: "DNI"
 *                 numero_documento: "12345678"
 *                 nombres: "Juan"
 *                 apellidos: "Pérez"
 *                 genero_id: 1
 *                 estado_civil_id: 2
 *               rol:
 *                 rol_id: 1
 *                 nombre: "Administrador"
 *                 descripcion: "Acceso completo al sistema"
 *               funcionalidades:
 *                 - funcionalidad_id: 1
 *                   nombre: "Dashboard"
 *                   descripcion: "Acceso al panel principal"
 *                   creado_por: 22
 *                   actualizado_por: 2
 *                   fecha_creacion: "2023-05-20T12:00:00.000Z"
 *                   fecha_actualizacion: "2023-05-20T12:00:00.000Z"
 *                   activo: true
 *                 - funcionalidad_id: 2
 *                   nombre: "Gestión de Usuarios"
 *                   descripcion: "Administrar usuarios del sistema"
 *                   creado_por: 22
 *                   actualizado_por: 2
 *                   fecha_creacion: "2023-05-20T12:00:00.000Z"
 *                   fecha_actualizacion: "2023-05-20T12:00:00.000Z"
 *                   activo: true
 *       401:
 *         description: No autorizado - Sesión inválida o expirada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/obtener', sessionAuth,PerfilService.obtenerPerfil);
/**
 * @swagger
 * components:
 *   schemas:
 *     PerfilUsuarioCompleto:
 *       type: object
 *       properties:
 *         usuario:
 *           $ref: '#/components/schemas/Usuario'
 *         persona:
 *           $ref: '#/components/schemas/Persona'
 *         rol:
 *           $ref: '#/components/schemas/Rol'
 *         funcionalidades:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Funcionalidad'
 * 
 *     Usuario:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *           example: 1
 *         nombre_social:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           example: "juan.perez@example.com"
 *         telefono_contacto:
 *           type: string
 *           example: "+123456789"
 *         ultimo_inicio_sesion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-20T12:00:00.000Z"
 *         estado_usuario:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, SUSPENDIDO]
 *           example: "ACTIVO"
 *         url_foto_perfil:
 *           type: string
 *           example: "https://example.com/perfil.jpg"
 *         persona_id:
 *           type: integer
 *           example: 1
 *         rol_id:
 *           type: integer
 *           example: 1
 *         idioma_id:
 *           type: integer
 *           example: 1
 * 
 *     Persona:
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
 *         genero_id:
 *           type: integer
 *           example: 1
 *         estado_civil_id:
 *           type: integer
 *           example: 2
 * 
 *     Rol:
 *       type: object
 *       properties:
 *         rol_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Administrador"
 *         descripcion:
 *           type: string
 *           example: "Acceso completo al sistema"
 * 
 *     Funcionalidad:
 *       type: object
 *       properties:
 *         funcionalidad_id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Dashboard"
 *         descripcion:
 *           type: string
 *           example: "Acceso al panel principal"
 *         creado_por:
 *           type: integer
 *           example: 22
 *         actualizado_por:
 *           type: integer
 *           example: 2
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-20T12:00:00.000Z"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-20T12:00:00.000Z"
 *         activo:
 *           type: boolean
 *           example: true
 */

export default router;