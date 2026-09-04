import express from "express";
import { AlmieChatService } from "../infrestructure/server/almieChat/AlmieChatService";
import { sessionAuth } from "../middleware/supabaseMidleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AlmieChat
 *     description: Endpoints para interactuar con la asistente virtual Almie de forma segura
 */

/**
 * @swagger
 * /api/v1/almie-chat/respond:
 *   post:
 *     summary: Obtener respuesta de Almie (Proxy a Groq)
 *     description: Envía el historial de chat para obtener una respuesta del modelo de IA configurado de forma segura.
 *     tags: [AlmieChat]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - content
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *                 example: "llama-3.3-70b-versatile"
 *               temperature:
 *                 type: number
 *                 example: 0.7
 *               max_tokens:
 *                 type: integer
 *                 example: 350
 *     responses:
 *       200:
 *         description: Respuesta del modelo generada correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor o del proveedor de IA
 */
router.post("/respond", sessionAuth, AlmieChatService.getResponse);

export default router;
