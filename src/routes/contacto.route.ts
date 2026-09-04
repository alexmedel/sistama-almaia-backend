import express from 'express';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { DocentesService } from '../infrestructure/server/docente/DocenteService';
import { CONTACTO_SERVICES } from '../infrestructure/server/contacto/CONTACTO.SERVICE';
import cors from 'cors';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Docentes
 *     description: Gestión de docentes del sistema
 *   - name: Docentes_Cursos
 *     description: Asignación de cursos a docentes
 */

/**
 * @swagger
 * /api/v1/docentes:
 *   get:
 *     summary: Obtener lista de docentes
 *     description: Retorna todos los docentes registrados en el sistema con sus datos asociados
 *     tags: [Docentes]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de docentes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Docente'
 *             example:
 *               - docente_id: 1
 *                 persona_id: 1
 *                 colegio_id: 1
 *                 especialidad: "Matemáticas"
 *                 estado: "Activo"
 *                 persona:
 *                   persona_id: 1
 *                   tipo_documento: "DNI"
 *                   numero_documento: "12345678"
 *                   nombres: "Juan"
 *                   apellidos: "Pérez"
 *                   genero_id: 1
 *                   estado_civil_id: 2
 *                 colegio:
 *                   colegio_id: 1
 *                   nombre: "Colegio San Juan"
 *                   nombre_fantasia: "San Juan"
 *                   tipo_colegio: "Privado"
 *                   direccion: "Calle Principal 123"
 *                   telefono_contacto: "+56912345678"
 *                   correo_electronico: "contacto@colegiosanjuan.cl"
 *                   comuna_id: 101
 *                   region_id: 13
 *                   pais_id: 1
 *       401:
 *         description: No autorizado - Sesión no válida o no proporcionada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/almaia', cors(), CONTACTO_SERVICES.contactoAlmaia);
router.post('/almaia/soporte', cors(), CONTACTO_SERVICES.contactoAlmaiaSoporte);

export default router;