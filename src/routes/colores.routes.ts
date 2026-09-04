import express, { Request, Response } from "express";
import { PaletaColoresService } from "../core/services/PaletaColoresService";
import { errorHandler } from "../helpers/ErrorResponse";
import { sessionAuth } from "../middleware/supabaseMidleware";

const router = express.Router();

/**
 * @swagger
 * /api/v1/colores:
 *   get:
 *     summary: Obtener paleta canónica de colores para gráficos
 *     description: Retorna colores para Emoción, Patología y Neurodivergencia sin hardcodear en frontend
 *     tags: [Colores]
 *     parameters:
 *       - in: query
 *         name: grouped
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Si es true, agrupa por categoría
 *     responses:
 *       200:
 *         description: Paleta de colores canónica
 *       500:
 *         description: Error de integridad en la paleta
 */
router.get("/", sessionAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { grouped } = _req.query;
    const withGrouping = grouped === "true" || grouped === "1";
    const palette = await PaletaColoresService.obtenerPaleta();
    res.json(PaletaColoresService.parseCatalogResponse(palette, withGrouping));
  } catch (error) {
    errorHandler.handleError(error, res, "PaletaColoresService.obtenerPaleta");
  }
});

export default router;
