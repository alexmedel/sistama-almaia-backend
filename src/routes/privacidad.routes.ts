import express from "express";
import { PrivacidadService } from "../infrestructure/server/privacidad/PrivacidadService";
import { sessionAuth } from "../middleware/supabaseMidleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Privacidad
 *     description: Ejercicio de derechos ARCOP+B del titular
 */

router.get("/consentimiento/actual", PrivacidadService.obtenerConsentimientoActual);
router.get("/solicitar-acceso", sessionAuth, PrivacidadService.solicitarAcceso);
router.post(
  "/solicitar-rectificacion",
  sessionAuth,
  PrivacidadService.solicitarRectificacion
);
router.post(
  "/solicitar-cancelacion",
  sessionAuth,
  PrivacidadService.solicitarCancelacion
);
router.post(
  "/solicitar-oposicion",
  sessionAuth,
  PrivacidadService.solicitarOposicion
);
router.get(
  "/solicitar-portabilidad",
  sessionAuth,
  PrivacidadService.solicitarPortabilidad
);
router.post(
  "/solicitar-bloqueo",
  sessionAuth,
  PrivacidadService.solicitarBloqueo
);

export default router;
