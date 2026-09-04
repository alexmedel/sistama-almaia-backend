import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import { z } from 'zod';
import { sessionAuth } from '../middleware/supabaseMidleware';

const router = express.Router();

// ==== 1) Definición de tools (schemas) ====
const triageSchema = z.object({
  symptom: z.string(),
  age: z.number().optional(),
  duration: z.string().optional(),
  fever_c: z.number().optional(),
  red_flags: z.array(z.string()).optional()
});

const hydrationSchema = z.object({
  weightKg: z.number().optional(),
  activityLevel: z.enum(['low', 'moderate', 'high']).optional(),
  climate: z.enum(['cold', 'temperate', 'hot']).optional()
});

const postureSchema = z.object({
  workPattern: z.string().optional()
});

const stretchesSchema = z.object({
  target: z.enum(['full', 'neck', 'back', 'hands']).optional()
});

// ==== 2) Helper para llamar endpoints HTTP ====
async function callJSON(url: string, body: any) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {})
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return await r.json(); // { data, html, componentUrl }
}

const BASE = process.env.ALMAIA_BASE_URL || 'http://localhost:3000/api/v1/chatgpt';

// ==== 3) Endpoint SSE para MCP ====
router.get('/sse', sessionAuth, async (req: Request, res: Response) => {
  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Enviar mensaje inicial de conexión
  res.write('event: connected\n');
  res.write('data: {"type":"connected","server":{"name":"almaia-mcp-bridge","version":"1.0.0"}}\n\n');

  // Mantener conexión abierta
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    res.end();
  });
});

// ==== 4) Endpoint POST para recibir mensajes MCP ====
router.post('/message', sessionAuth, express.json(), async (req: Request, res: Response) => {
  try {
    const { method, params } = req.body;

    // Lista de tools disponibles
    if (method === 'tools/list') {
      res.json({
        tools: [
          {
            name: 'triage_symptom',
            description: 'Orientación inicial NO clínica para síntomas leves (con banderas rojas).',
            inputSchema: {
              type: 'object',
              properties: {
                symptom: { type: 'string', description: 'Descripción del síntoma' },
                age: { type: 'number', description: 'Edad del paciente' },
                duration: { type: 'string', description: 'Duración del síntoma (ej: "6h")' },
                fever_c: { type: 'number', description: 'Temperatura en °C' },
                red_flags: { type: 'array', items: { type: 'string' }, description: 'Señales de alerta' }
              },
              required: ['symptom']
            }
          },
          {
            name: 'hydration_plan',
            description: 'Plan de hidratación diario (ml/día) según peso/actividad/clima.',
            inputSchema: {
              type: 'object',
              properties: {
                weightKg: { type: 'number', description: 'Peso en kilogramos' },
                activityLevel: { type: 'string', enum: ['low', 'moderate', 'high'], description: 'Nivel de actividad' },
                climate: { type: 'string', enum: ['cold', 'temperate', 'hot'], description: 'Clima del entorno' }
              }
            }
          },
          {
            name: 'posture_breaks',
            description: 'Pausas ergonómicas y regla 20-20-20 para trabajo de escritorio.',
            inputSchema: {
              type: 'object',
              properties: {
                workPattern: { type: 'string', description: 'Patrón de trabajo (ej: "desk8h")' }
              }
            }
          },
          {
            name: 'stretches_5min',
            description: 'Rutina de estiramientos guiada de 5 minutos (300s).',
            inputSchema: {
              type: 'object',
              properties: {
                target: { type: 'string', enum: ['full', 'neck', 'back', 'hands'], description: 'Área objetivo' }
              }
            }
          }
        ]
      });
      return;
    }

    // Ejecutar tool
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      let result: any;

      switch (name) {
        case 'triage_symptom':
          triageSchema.parse(args);
          result = await callJSON(`${BASE}/triage_symptom`, args);
          break;

        case 'hydration_plan':
          hydrationSchema.parse(args);
          result = await callJSON(`${BASE}/hydration_plan`, args);
          break;

        case 'posture_breaks':
          postureSchema.parse(args);
          result = await callJSON(`${BASE}/posture_breaks`, args);
          break;

        case 'stretches_5min':
          stretchesSchema.parse(args);
          result = await callJSON(`${BASE}/stretches_5min`, args);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      res.json({
        content: [
          {
            type: 'text',
            text: result.html || 'Respuesta generada'
          }
        ],
        isError: false
      });
      return;
    }

    // Método no soportado
    res.status(400).json({ error: `Unsupported method: ${method}` });
  } catch (error: any) {
    res.status(500).json({
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    });
  }
});

// Healthcheck
router.get('/health', sessionAuth, (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'MCP Bridge',
    endpoint: '/api/v1/mcp/sse',
    tools: ['triage_symptom', 'hydration_plan', 'posture_breaks', 'stretches_5min']
  });
});

// Función vacía para compatibilidad
export function attachMCPTransport(_app: express.Application) {
  // No se necesita nada adicional, las rutas ya están montadas
}

export default router;
