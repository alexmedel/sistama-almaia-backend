import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import express, { Application, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit"; // ✅ Rate limiting
import helmet from "helmet";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import "./infrestructure/config/cronjobs";
import { mapHttpError } from "./helpers/http-error-response";
import { httpAccessLogger, requestPayloadLogger } from "./request-logging.middleware";
import auditoriaRoute from "./repos/auditoria/auditoria.route";
import routerNotifications from "./repos/notification_push/notification.route";
import validadorRoute from "./repos/rol_validador/validador.route";
import AlertaRouters from "./routes/alerta.routes";
import AlumnosRouters from "./routes/alumno.routes";
import ApoderadosRouters from "./routes/apoderado.routes";
import AuthRoutes from "./routes/auth.routes";
import AvisosRoutes from "./routes/aviso.routes";
import AvisosAppRoutes from "./routes/avisosApp.routes";
import { BeneficiosRouters } from "./routes/beneficios.routes";
import ChatGPTRoutes from "./routes/chatgpt.routes";
import AlmieChatRoutes from "./routes/almieChat.routes";
import ColegioRouters from "./routes/colegio.routes";
import ComparativaRoutes from "./routes/comparativa.routes";
import ContactoRouter from "./routes/contacto.route";
import DocentesRouters from "./routes/docente.routes";
import Encuestas from "./routes/encuesta.routes";
import { EvalucionAsistidaRouters } from "./routes/EvalucionAsistida.routes";
import HomeRouters from "./routes/home.routes";
import InformesRouters from "./routes/informes.routes";
import LocalidadesRoutes from "./routes/localidades.routes";
import MCPRoutes, { attachMCPTransport } from "./routes/mcp.routes";
import PatologiaRoutes from "./routes/patologia.routes";
import ColoresRoutes from "./routes/colores.routes";
import PerfilRouters from "./routes/perfil.routes";
import PersonaRouters from "./routes/persona.routes";
import PreguntasRouters from "./routes/preguntas.routes";
import PrivacidadRoutes from "./routes/privacidad.routes";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, "");

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Alma IA API",
      version: "1.0",
      description:
        "Esta es una API para gestionar la información de Alma IA. Cada get del CRUD posee parametros es decir api/v1/ruta?campo={valor}",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "Soporte AlmaIA",
        url: "https://almaia.cl",
        email: "soporte@almaia.cl",
      },
    },
    servers: [
      {
        url: "https://api-almaia.onrender.com/",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

// Límite general para toda la API
const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 100, // máximo 100 solicitudes por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes, inténtelo más tarde." },
});
app.use(apiLimiter);

// Límite más estricto para login y registro
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de autenticación, inténtelo más tarde.",
  },
});

// Rate limiting granular para endpoints críticos
const alertCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 alertas por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas alertas creadas, inténtelo más tarde." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo 3 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiados intentos de cambio de contraseña, inténtelo más tarde.",
  },
});

const bulkUserCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 cargas masivas por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas cargas masivas de usuarios, inténtelo más tarde.",
  },
});

const colegioModificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 modificaciones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas modificaciones de colegios, inténtelo más tarde.",
  },
});

// Habilitar la confianza en los proxies
app.set("trust proxy", 1);
app.use(express.json({ limit: "30mb" }));
app.use(helmet());
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(httpAccessLogger());
app.use(requestPayloadLogger());

// ✅ 1.4 Configuración CORS segura
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean)
  : []; // Sin wildcard "*"

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback) => {
    // 1. Permitir sin origen (ej. Postman, móvil)
    if (!origin) return callback(null, true); // 2. Origen en lista blanca

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      // 3. ¡CAMBIO CRUCIAL! Llama con `null` (sin error) y `false` (no permitido).
      // Esto hace que el servidor NO envíe la cabecera CORS.
      callback(null, false);

      // Opcional: registrar el origen bloqueado en los logs del servidor
      console.warn(`CORS: Origen bloqueado: ${origin}`);
    }
  },
  optionsSuccessStatus: 200,
  allowedHeaders: [
    "date-zone",
    "Date-Zone",
    "Content-Type",
    "Authorization",
    "x-almaia-access",
    "x-almaia-chatgpt-key",
  ],
};
app.use(cors(corsOptions));

app.get("/", (req: Request, res: Response) => {
  res.send("¡Hola mundo con CORS, seguridad y rate limiting!");
});

const specs = swaggerJsdoc(options);
app.use("/documentacion", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/v1/auth", authLimiter, AuthRoutes); // 🔒 Rate limit especial en Auth
app.use("/api/v1/avisos", AvisosRoutes); // listo
app.use("/api/v1/avisosApp", AvisosAppRoutes); // listo
app.use("/api/v1/localidades", LocalidadesRoutes); // listo
app.use("/api/v1/comparativa", ComparativaRoutes); // listo
app.use("/api/v1/home", HomeRouters); // listo
app.use("/api/v1/patologias", PatologiaRoutes); // listo
app.use("/api/v1/alumnos", AlumnosRouters); // listo
app.use("/api/v1/alertas", AlertaRouters); // listo
app.use("/api/v1/apoderados", ApoderadosRouters); //listo
app.use("/api/v1/perfil", PerfilRouters); //listo
app.use("/api/v1/informes", InformesRouters); //listo
app.use("/api/v1/preguntas", PreguntasRouters); //listo
app.use("/api/v1/docentes", DocentesRouters); // listo
app.use("/api/v1/colegios", ColegioRouters); //listo
app.use("/api/v1/personas", PersonaRouters); //listo
app.use("/api/v1/privacidad", PrivacidadRoutes);
app.use("/api/v1/contacto", ContactoRouter); //este aun no
app.use("/api/v1/evaluacion-asistida", EvalucionAsistidaRouters); //listo
app.use("/api/v1/beneficios", BeneficiosRouters); //listo
app.use("/api/v1/chatgpt", ChatGPTRoutes); // ChatGPT Apps SDK
app.use("/api/v1/almie-chat", AlmieChatRoutes);
app.use("/api/v1/mcp", MCPRoutes); // MCP Bridge
app.use("/api/v1/auditoria", auditoriaRoute);
app.use("/api/v1/rol_validador", validadorRoute);
app.use("/api/v1/encuestas", Encuestas);
app.use("/api/v1/colores", ColoresRoutes);
app.use("/api/v1/notificaciones", routerNotifications);
// Servir archivos estáticos de UI Components

app.use(
  "/public/components",
  express.static(path.join(process.cwd(), "ui-components/dist"))
);

// Conectar transporte MCP SSE
attachMCPTransport(app);

// Manejador de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log("se ha propagado un error al manejador de errores");
  console.error(err.stack);
  const mappedError = mapHttpError(err);
  res.status(mappedError.status).json(mappedError.body);
});

// En JavaScript o TypeScript

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
