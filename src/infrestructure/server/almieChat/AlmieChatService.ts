import { Request, Response } from "express";
import axios from "axios";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class AlmieChatService {
  static getResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messages, model, temperature, max_tokens } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "El campo 'messages' es requerido y debe ser un arreglo." });
        return;
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "Servicio de chat no configurado en el servidor (falta GROQ_API_KEY)." });
        return;
      }

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: model || "llama-3.3-70b-versatile",
          messages,
          temperature: temperature !== undefined ? temperature : 0.7,
          max_tokens: max_tokens !== undefined ? max_tokens : 350,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15s timeout
        }
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error calling Groq API on backend:", error?.response?.data || error?.message || error);
      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Error al comunicarse con el proveedor de IA." });
      }
    }
  };
}
