import express from 'express';
import { ChatGPTService } from '../infrestructure/server/chatgpt/ChatGPTService';
import { chatgptApiKeyAuth } from '../middleware/chatgptAuth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: ChatGPT
 *     description: Endpoints para integración con ChatGPT Apps SDK
 */

/**
 * @swagger
 * /api/v1/chatgpt/triage_symptom:
 *   post:
 *     summary: Triage de síntomas - Orientación básica
 *     description: Evalúa síntomas y proporciona orientación general. NO es diagnóstico médico.
 *     tags: [ChatGPT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symptom
 *             properties:
 *               symptom:
 *                 type: string
 *                 example: "dolor de cabeza"
 *                 description: Descripción del síntoma
 *               age:
 *                 type: integer
 *                 example: 25
 *                 description: Edad del paciente
 *               duration:
 *                 type: string
 *                 example: "6h"
 *                 description: Duración del síntoma
 *               fever_c:
 *                 type: number
 *                 example: 37.8
 *                 description: Temperatura en grados Celsius
 *               red_flags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *                 description: Señales de alerta
 *     responses:
 *       200:
 *         description: Orientación generada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     symptom:
 *                       type: string
 *                     danger:
 *                       type: boolean
 *                     summary:
 *                       type: string
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 html:
 *                   type: string
 *                   description: HTML renderizado para mostrar en ChatGPT
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/triage_symptom', chatgptApiKeyAuth, ChatGPTService.triageSymptom);

/**
 * @swagger
 * /api/v1/chatgpt/hydration_plan:
 *   post:
 *     summary: Plan de hidratación personalizado
 *     description: Calcula plan de hidratación basado en peso, actividad y clima
 *     tags: [ChatGPT]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weightKg:
 *                 type: number
 *                 example: 72
 *                 description: Peso en kilogramos
 *               activityLevel:
 *                 type: string
 *                 enum: [low, moderate, high]
 *                 example: "moderate"
 *                 description: Nivel de actividad física
 *               climate:
 *                 type: string
 *                 enum: [cold, temperate, hot]
 *                 example: "hot"
 *                 description: Clima del entorno
 *     responses:
 *       200:
 *         description: Plan de hidratación generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_ml:
 *                       type: integer
 *                     schedule:
 *                       type: array
 *                       items:
 *                         type: string
 *                 html:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.post('/hydration_plan', chatgptApiKeyAuth, ChatGPTService.hydrationPlan);

/**
 * @swagger
 * /api/v1/chatgpt/posture_breaks:
 *   post:
 *     summary: Pausas de postura y descanso visual
 *     description: Proporciona checklist de pausas ergonómicas para trabajo de escritorio
 *     tags: [ChatGPT]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workPattern:
 *                 type: string
 *                 example: "desk8h"
 *                 description: Patrón de trabajo
 *     responses:
 *       200:
 *         description: Checklist de pausas generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     workPattern:
 *                       type: string
 *                     checklist:
 *                       type: array
 *                       items:
 *                         type: string
 *                 html:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.post('/posture_breaks', chatgptApiKeyAuth, ChatGPTService.postureBreaks);

/**
 * @swagger
 * /api/v1/chatgpt/stretches_5min:
 *   post:
 *     summary: Rutina de estiramientos de 5 minutos
 *     description: Proporciona rutina guiada de estiramientos (300 segundos total)
 *     tags: [ChatGPT]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target:
 *                 type: string
 *                 enum: [full, neck, back, hands]
 *                 example: "neck"
 *                 description: Área objetivo de estiramiento
 *     responses:
 *       200:
 *         description: Rutina de estiramientos generada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     target:
 *                       type: string
 *                     total_seconds:
 *                       type: integer
 *                       example: 300
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           duration:
 *                             type: integer
 *                 html:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.post('/stretches_5min', chatgptApiKeyAuth, ChatGPTService.stretches5min);

// Rutas GET para servir los componentes UI
import path from 'path';

router.get('/ui/triage', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ui-components/dist/triage.html'));
});

router.get('/ui/hydration', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ui-components/dist/hydration.html'));
});

router.get('/ui/posture', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ui-components/dist/posture.html'));
});

router.get('/ui/stretches', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ui-components/dist/stretches.html'));
});

export default router;
