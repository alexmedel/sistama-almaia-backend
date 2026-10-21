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

// Proveedores de IA por variables de entorno. Se prueban en este orden:
//   1) OPENAI_API_KEY (+ OPENAI_MODEL, por defecto gpt-4o-mini)
//   2) AI_API_KEY     (Gemini por defecto; AI_API_URL / AI_MODEL opcionales)
//   3) GROQ_API_KEY   (+ GROQ_MODEL)
// Si uno está saturado o falla, pasa automáticamente al siguiente.
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Provider = { name: string; apiKey: string; url: string; model: string; openai?: boolean };

function getProviders(): Provider[] {
  const list: Provider[] = [];
  if (process.env.OPENAI_API_KEY) {
    list.push({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      url: OPENAI_URL,
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

const RETRYABLE = [429, 500, 502, 503, 504];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callProvider(p: Provider, body: any) {
  const { max_tokens, temperature, ...rest } = body;
  const payload: any = { ...rest, model: p.model };
  if (p.openai) {
    // OpenAI usa max_completion_tokens; los modelos nuevos solo aceptan la temperatura por defecto
    payload.max_completion_tokens = max_tokens;
    if (/^gpt-4/.test(p.model)) payload.temperature = temperature;
  } else {
    payload.max_tokens = max_tokens;
    payload.temperature = temperature;
  }
  return axios.post(
    p.url,
    payload,
    {
      headers: {
        Authorization: `Bearer ${p.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );
}

export class AlmieChatService {
  static getResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messages, temperature, max_tokens } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "El campo 'messages' es requerido y debe ser un arreglo." });
        return;
      }

      const providers = getProviders();
      if (providers.length === 0) {
        res.status(500).json({ error: "Servicio de chat no configurado en el servidor (falta OPENAI_API_KEY)." });
        return;
      }

      const body = {
        messages,
        temperature: temperature !== undefined ? temperature : 0.7,
        // tope para que un cliente no pueda disparar el costo
        max_tokens: Math.min(Number(max_tokens) || 350, 800),
      };

      let lastError: any;
      for (const provider of providers) {
        // hasta 2 intentos por proveedor (el segundo tras una pausa corta)
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await callProvider(provider, body);
            res.status(200).json(response.data);
            return;
          } catch (err: any) {
            lastError = err;
            const status = err?.response?.status;
            console.error(
              `[Almie] ${provider.name} intento ${attempt} falló:`,
              status,
              err?.response?.data || err?.message
            );
            if (!status || !RETRYABLE.includes(status)) break; // error no recuperable: pasa al siguiente proveedor
            if (attempt === 1) await sleep(1000);
          }
        }
      }

      if (axios.isAxiosError(lastError) && lastError.response) {
        res.status(lastError.response.status).json(lastError.response.data);
      } else {
        res.status(500).json({ error: "Error al comunicarse con el proveedor de IA." });
      }
    } catch (error: any) {
      console.error("Error en AlmieChatService:", error?.message || error);
      res.status(500).json({ error: "Error al comunicarse con el proveedor de IA." });
    }
  };
}