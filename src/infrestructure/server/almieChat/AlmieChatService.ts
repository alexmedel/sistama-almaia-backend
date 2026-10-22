// import { Request, Response } from "express";
// import axios from "axios";

// const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// export class AlmieChatService {
//   static getResponse = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { messages, model, temperature, max_tokens } = req.body;

//       if (!messages || !Array.isArray(messages)) {
//         res.status(400).json({ error: "El campo 'messages' es requerido y debe ser un arreglo." });
//         return;
//       }

//       const apiKey = process.env.GROQ_API_KEY;
//       if (!apiKey) {
//         res.status(500).json({ error: "Servicio de chat no configurado en el servidor (falta GROQ_API_KEY)." });
//         return;
//       }

//       const response = await axios.post(
//         GROQ_API_URL,
//         {
//           model: model || "llama-3.3-70b-versatile",
//           messages,
//           temperature: temperature !== undefined ? temperature : 0.7,
//           max_tokens: max_tokens !== undefined ? max_tokens : 350,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${apiKey}`,
//             "Content-Type": "application/json",
//           },
//           timeout: 15000, // 15s timeout
//         }
//       );

//       res.status(200).json(response.data);
//     } catch (error: any) {
//       console.error("Error calling Groq API on backend:", error?.response?.data || error?.message || error);
//       if (axios.isAxiosError(error) && error.response) {
//         res.status(error.response.status).json(error.response.data);
//       } else {
//         res.status(500).json({ error: "Error al comunicarse con el proveedor de IA." });
//       }
//     }
//   };
// }

 
import { Request, Response } from "express";
import axios from "axios";

/**
 * Chatbot ALMAIA (estudiantes y apoderados).
 *
 * MODO 1 (principal): OpenAI Responses API + file_search sobre la base documental oficial.
 *   Variables de entorno (solo en el backend, nunca en el frontend ni en el repo):
 *     OPENAI_API_KEY            key del proyecto "ALMA – Chatbot Producción"
 *     OPENAI_VECTOR_STORE_ID    vs_6ad920ee64ec8191b080ae525b6ef92f
 *     OPENAI_MODEL              (opcional) por defecto gpt-4o-mini
 *     OPENAI_PROMPT_ID          (opcional) id de un Prompt guardado en OpenAI (pmpt_...)
 *     OPENAI_PROMPT_VERSION     (opcional) versión del Prompt
 *     ALMIE_SYSTEM_PROMPT       (opcional) instrucciones propias; si no, se usan las de abajo
 *     ALMIE_DEBUG_FILE_SEARCH   (opcional) "true" para ver qué documentos recuperó file_search
 *
 *   En este modo NO hay respaldo en otros proveedores: Gemini/Groq no tienen la base documental
 *   y podrían inventar funciones de ALMAIA. Se reintenta solo contra OpenAI.
 *
 * MODO 2 (compatibilidad): si no hay OPENAI_VECTOR_STORE_ID, funciona como antes
 *   (Chat Completions con OpenAI → Gemini → Groq).
 */

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_INSTRUCTIONS = `Eres ALMAIA, el asistente virtual de la plataforma ALMAIA, orientado exclusivamente a estudiantes y apoderados.
- Antes de responder consultas sobre ALMAIA, consulta la base documental oficial (file_search) y responde solo con lo que ahí aparece.
- Si la información no está en la base documental, dilo con honestidad y no inventes funciones, pasos ni pantallas.
- No diagnostiques, no sancionas ni emitas juicios sobre personas.
- Respeta la privacidad del estudiante: no pidas ni expongas datos personales innecesarios.
- Si la persona describe una situación crítica (riesgo, violencia, autolesión, abuso, urgencia), indica que debe contactar de inmediato a una persona del colegio o a los servicios de emergencia, y no intentes resolverla tú.
- Para problemas técnicos, indica escribir a soporte@almaia.cl.
- Responde en español, de forma clara, breve y amable.
- No uses búsqueda web ni información externa como fuente.`;

const MAX_HISTORY = 12; // mensajes previos que se envían al modelo
const MAX_CONTENT_CHARS = 2000; // por mensaje
const RETRYABLE = [429, 500, 502, 503, 504];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ChatMsg = { role: "user" | "assistant"; content: string };

/** El cliente solo puede mandar user/assistant. Los "system" se descartan: las instrucciones viven en el servidor. */
function sanitizeMessages(messages: any[]): ChatMsg[] {
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, MAX_CONTENT_CHARS),
    }));
}

// ---------------------------------------------------------------------------
// MODO 1: Responses API + file_search
// ---------------------------------------------------------------------------
async function callResponsesApi(history: ChatMsg[], maxTokens: number) {
  const debug = process.env.ALMIE_DEBUG_FILE_SEARCH === "true";

  const body: any = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: history,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID],
        max_num_results: 5,
      },
    ],
    max_output_tokens: Math.max(16, maxTokens),
    store: false, // no guardar las conversaciones en OpenAI
  };

  if (process.env.OPENAI_PROMPT_ID) {
    body.prompt = {
      id: process.env.OPENAI_PROMPT_ID,
      ...(process.env.OPENAI_PROMPT_VERSION
        ? { version: process.env.OPENAI_PROMPT_VERSION }
        : {}),
    };
  }
  body.instructions = process.env.ALMIE_SYSTEM_PROMPT || DEFAULT_INSTRUCTIONS;

  if (debug) body.include = ["file_search_call.results"];

  const { data } = await axios.post(OPENAI_RESPONSES_URL, body, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 45000,
  });

  const output: any[] = Array.isArray(data?.output) ? data.output : [];
  const message = output.find((o) => o.type === "message");
  const text: string = (message?.content ?? [])
    .filter((c: any) => c.type === "output_text")
    .map((c: any) => c.text)
    .join("")
    .trim();

  const fileSearchCalls = output.filter((o) => o.type === "file_search_call");

  // Misma forma que Chat Completions, para no tener que tocar la app.
  const result: any = {
    id: data?.id,
    model: data?.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content:
            text ||
            "No pude generar una respuesta en este momento. Si el problema continúa, escribe a soporte@almaia.cl.",
        },
        finish_reason: data?.status === "incomplete" ? "length" : "stop",
      },
    ],
    usage: data?.usage,
  };

  if (debug) {
    result.debug = {
      file_search_usado: fileSearchCalls.length > 0,
      consultas: fileSearchCalls.map((c) => c.queries),
      documentos: fileSearchCalls.flatMap((c) =>
        (c.results ?? []).map((r: any) => ({
          archivo: r.filename,
          score: r.score,
        }))
      ),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// MODO 2: Chat Completions (compatibilidad)
// ---------------------------------------------------------------------------
type Provider = {
  name: string;
  apiKey: string;
  url: string;
  model: string;
  openai?: boolean;
};

function getLegacyProviders(): Provider[] {
  const list: Provider[] = [];
  if (process.env.OPENAI_API_KEY) {
    list.push({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      url: OPENAI_CHAT_URL,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      openai: true,
    });
  }
  if (process.env.AI_API_KEY) {
    list.push({
      name: "gemini",
      apiKey: process.env.AI_API_KEY,
      url: process.env.AI_API_URL || GEMINI_URL,
      model: process.env.AI_MODEL || "gemini-3.8-flash",
    });
  }
  if (process.env.GROQ_API_KEY) {
    list.push({
      name: "groq",
      apiKey: process.env.GROQ_API_KEY,
      url: GROQ_URL,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });
  }
  return list;
}

async function callChatCompletions(p: Provider, body: any) {
  const { max_tokens, temperature, ...rest } = body;
  const payload: any = { ...rest, model: p.model };
  if (p.openai) {
    payload.max_completion_tokens = max_tokens;
    if (/^gpt-4/.test(p.model)) payload.temperature = temperature;
  } else {
    payload.max_tokens = max_tokens;
    payload.temperature = temperature;
  }
  const { data } = await axios.post(p.url, payload, {
    headers: {
      Authorization: `Bearer ${p.apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
  return data;
}

function sendError(res: Response, lastError: any) {
  if (axios.isAxiosError(lastError) && lastError.response) {
    res.status(lastError.response.status).json(lastError.response.data);
  } else {
    res
      .status(500)
      .json({ error: "Error al comunicarse con el proveedor de IA." });
  }
}

export class AlmieChatService {
  static getResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messages, temperature, max_tokens } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({
          error: "El campo 'messages' es requerido y debe ser un arreglo.",
        });
        return;
      }

      // tope para que un cliente no pueda disparar el costo
      const maxTokens = Math.min(Number(max_tokens) || 350, 800);

      // ---------------- MODO 1: Responses API + file_search ----------------
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_VECTOR_STORE_ID) {
        const history = sanitizeMessages(messages);
        if (history.length === 0) {
          res.status(400).json({
            error: "Debe enviar al menos un mensaje de usuario con contenido.",
          });
          return;
        }

        let lastError: any;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const result = await callResponsesApi(history, maxTokens);
            res.status(200).json(result);
            return;
          } catch (err: any) {
            lastError = err;
            const status = err?.response?.status;
            console.error(
              `[Almie] responses+file_search intento ${attempt} falló:`,
              status,
              err?.response?.data || err?.message
            );
            if (!status || !RETRYABLE.includes(status)) break;
            if (attempt === 1) await sleep(1000);
          }
        }
        sendError(res, lastError);
        return;
      }

      // ---------------- MODO 2: compatibilidad ----------------
      const providers = getLegacyProviders();
      if (providers.length === 0) {
        res.status(500).json({
          error:
            "Servicio de chat no configurado en el servidor (falta OPENAI_API_KEY).",
        });
        return;
      }

      const body = {
        messages,
        temperature: temperature !== undefined ? temperature : 0.7,
        max_tokens: maxTokens,
      };

      let lastError: any;
      for (const provider of providers) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const data = await callChatCompletions(provider, body);
            res.status(200).json(data);
            return;
          } catch (err: any) {
            lastError = err;
            const status = err?.response?.status;
            console.error(
              `[Almie] ${provider.name} intento ${attempt} falló:`,
              status,
              err?.response?.data || err?.message
            );
            if (!status || !RETRYABLE.includes(status)) break;
            if (attempt === 1) await sleep(1000);
          }
        }
      }
      sendError(res, lastError);
    } catch (error: any) {
      console.error("Error en AlmieChatService:", error?.message || error);
      res
        .status(500)
        .json({ error: "Error al comunicarse con el proveedor de IA." });
    }
  };
}