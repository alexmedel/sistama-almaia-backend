import { Request, Response, RequestHandler } from 'express';

/**
 * Servicio para integración con ChatGPT Apps SDK
 * Proporciona endpoints de salud y bienestar protegidos por API key
 */
export class ChatGPTService {
  
  /**
   * Triage de síntomas - Orientación básica NO diagnóstico médico
   */
  static triageSymptom: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { symptom, age, duration, fever_c, red_flags = [] } = req.body;

      // Validación básica
      if (!symptom) {
        res.status(400).json({ 
          error: 'El campo "symptom" es obligatorio' 
        });
        return;
      }

      // Lógica de banderas rojas
      const dangerousSymptoms = [
        'dolor torácico', 'dificultad para respirar', 'desmayo',
        'confusión', 'rigidez de cuello', 'debilidad en un lado',
        'sangrado abundante', 'dolor intenso', 'vómito persistente'
      ];

      const hasDangerFlag = red_flags.some((flag: string) =>
        dangerousSymptoms.some(ds => flag.toLowerCase().includes(ds))
      );

      const highFever = fever_c && fever_c >= 39.5;
      const danger = hasDangerFlag || highFever;

      // Construir respuesta
      const data = {
        title: danger ? '⚠️ Atención Urgente Requerida' : 'Orientación General',
        symptom,
        age: age || 'No especificada',
        duration: duration || 'No especificada',
        fever_c: fever_c || 'No registrada',
        danger,
        summary: danger
          ? 'Los síntomas descritos requieren evaluación médica inmediata. Por favor, acude a urgencias o contacta a un profesional de salud.'
          : 'Síntomas registrados. Si los síntomas empeoran o persisten más de 48 horas, consulta con un profesional de salud.',
        actions: danger
          ? ['Acudir a urgencias inmediatamente', 'Llamar al servicio de emergencias si es necesario', 'No conducir si te sientes mal']
          : ['Monitorear síntomas', 'Descansar adecuadamente', 'Mantenerse hidratado', 'Consultar si empeora o persiste']
      };

      const html = renderCard(
        data.title,
        `<p><strong>Síntoma:</strong> ${symptom}</p>
         <p><strong>Duración:</strong> ${data.duration}</p>
         <p><strong>Temperatura:</strong> ${data.fever_c}°C</p>
         <p>${data.summary}</p>`,
        data.actions
      );

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol;
      const componentUrl = `${protocol}://${host}/api/v1/chatgpt/ui/triage?data=${encodeURIComponent(JSON.stringify(data))}`;

      res.status(200).json({ data, html, componentUrl });

    } catch (error) {
      console.error('Error en triageSymptom:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Plan de hidratación personalizado
   */
  static hydrationPlan: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { 
        weightKg = 70, 
        activityLevel = 'moderate', 
        climate = 'temperate' 
      } = req.body;

      // Cálculo de hidratación
      let total_ml = weightKg * 32;
      if (activityLevel === 'high') total_ml += weightKg * 5;
      if (climate === 'hot') total_ml += weightKg * 4;
      total_ml = Math.round(total_ml);

      const schedule = [
        'Al despertar — 300 ml',
        'Media mañana — 300 ml',
        'Almuerzo — 400 ml',
        'Media tarde — 300 ml',
        'Cena — 400 ml',
        'Antes de dormir — 200 ml'
      ];

      const data = {
        total_ml,
        schedule,
        activityLevel,
        climate,
        weightKg
      };

      const html = renderList(
        `Plan de Hidratación: ${total_ml} ml/día`,
        schedule
      );

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol;
      const componentUrl = `${protocol}://${host}/api/v1/chatgpt/ui/hydration?data=${encodeURIComponent(JSON.stringify(data))}`;

      res.status(200).json({ data, html, componentUrl });

    } catch (error) {
      console.error('Error en hydrationPlan:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Pausas de postura y descanso visual
   */
  static postureBreaks: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { workPattern = 'desk8h' } = req.body;

      const checklist = [
        'Cada 30–45 min: levántate 2–3 min',
        'Regla 20–20–20: cada 20 min mira 20s a 6 m',
        'Pantalla a la altura de los ojos',
        'Apoya zona lumbar y planta de los pies',
        'Respiración profunda para relajar hombros',
        'Evita encorvar la espalda',
        'Mantén muñecas en posición neutra al escribir'
      ];

      const data = { workPattern, checklist };

      const html = renderList(
        'Pausas de Postura Recomendadas',
        checklist
      );

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol;
      const componentUrl = `${protocol}://${host}/api/v1/chatgpt/ui/posture?data=${encodeURIComponent(JSON.stringify(data))}`;

      res.status(200).json({ data, html, componentUrl });

    } catch (error) {
      console.error('Error en postureBreaks:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Rutina de estiramientos de 5 minutos
   */
  static stretches5min: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { target = 'full' } = req.body;

      const steps = [
        { name: 'Rotación de cuello (suave)', duration: 40 },
        { name: 'Estiramiento de hombros hacia atrás', duration: 40 },
        { name: 'Extensión de brazos al frente', duration: 40 },
        { name: 'Rotación de muñecas', duration: 40 },
        { name: 'Estiramiento de espalda alta', duration: 40 },
        { name: 'Flexión lateral del tronco', duration: 40 },
        { name: 'Estiramiento de piernas (gemelos)', duration: 40 },
        { name: 'Respiración profunda y relajación', duration: 20 }
      ];

      const total_seconds = steps.reduce((sum, s) => sum + s.duration, 0);

      const data = { target, total_seconds, steps };

      const html = renderTimer(
        `Rutina de Estiramientos (${total_seconds}s)`,
        steps
      );

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol;
      const componentUrl = `${protocol}://${host}/api/v1/chatgpt/ui/stretches?data=${encodeURIComponent(JSON.stringify(data))}`;

      res.status(200).json({ data, html, componentUrl });

    } catch (error) {
      console.error('Error en stretches5min:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}

// ============================================
// Helpers de renderizado HTML
// ============================================

function renderCard(title: string, body: string, actions: string[]): string {
  const actionsList = actions.map(a => `<li>${a}</li>`).join('');
  return `
    <div style="border:1px solid #ddd;border-radius:8px;padding:16px;max-width:500px;font-family:sans-serif;">
      <h3 style="margin-top:0;color:#333;">${title}</h3>
      <div style="margin:12px 0;">${body}</div>
      <ul style="margin:12px 0;padding-left:20px;">${actionsList}</ul>
      <p style="font-size:12px;color:#666;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
        ⚠️ <em>Esta información es orientativa, no constituye diagnóstico médico. 
        Si hay señales de alerta o los síntomas empeoran, consulta a un profesional de salud.</em>
      </p>
    </div>
  `;
}

function renderList(title: string, items: string[]): string {
  const itemsList = items.map(i => `<li>${i}</li>`).join('');
  return `
    <div style="border:1px solid #ddd;border-radius:8px;padding:16px;max-width:500px;font-family:sans-serif;">
      <h3 style="margin-top:0;color:#333;">${title}</h3>
      <ul style="margin:12px 0;padding-left:20px;">${itemsList}</ul>
      <p style="font-size:12px;color:#666;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
        ⚠️ <em>Esta información es orientativa. Si tienes dudas o molestias, consulta a un profesional.</em>
      </p>
    </div>
  `;
}

function renderTimer(title: string, steps: Array<{name: string, duration: number}>): string {
  const stepsList = steps.map((s, i) => 
    `<li><strong>${i + 1}.</strong> ${s.name} — ${s.duration}s</li>`
  ).join('');
  return `
    <div style="border:1px solid #ddd;border-radius:8px;padding:16px;max-width:500px;font-family:sans-serif;">
      <h3 style="margin-top:0;color:#333;">${title}</h3>
      <ol style="margin:12px 0;padding-left:20px;">${stepsList}</ol>
      <p style="font-size:12px;color:#666;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
        ⚠️ <em>Realiza los ejercicios con cuidado. Si sientes dolor, detente y consulta a un profesional.</em>
      </p>
    </div>
  `;
}
