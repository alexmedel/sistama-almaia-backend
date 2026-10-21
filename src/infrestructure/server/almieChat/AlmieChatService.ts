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

 
// Proveedor de IA configurable por variables de entorno (formato compatible con OpenAI).
//   AI_API_KEY  -> key del proveedor (Gemini, DeepSeek, Groq, etc.)
//   AI_API_URL  -> endpoint de chat completions
//   AI_MODEL    -> modelo a usar
// Si no hay AI_API_KEY pero sí GROQ_API_KEY, se mantiene el comportamiento anterior (Groq).
import { Request, Response } from "express";
import axios from "axios";

// Proveedor de IA configurable por variables de entorno (formato compatible con OpenAI).
//   AI_API_KEY  -> key del proveedor principal (Gemini por defecto)
//   AI_API_URL  -> endpoint de chat completions (opcional)
//   AI_MODEL    -> modelo (opcional)
//   GROQ_API_KEY -> si existe, se usa como respaldo cuando el principal está saturado o falla
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Provider = { name: string; apiKey: string; url: string; model: string };

function getProviders(): Provider[] {
  const list: Provider[] = [];
  if (process.env.AI_API_KEY) {
    list.push({
      name: "principal",
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
  return axios.post(
    p.url,
    { ...body, model: p.model },
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
        res.status(500).json({ error: "Servicio de chat no configurado en el servidor (falta AI_API_KEY)." });
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