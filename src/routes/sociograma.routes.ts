import express from 'express';
import { SociogramaService } from '../infrestructure/server/sociogramas/sociogramaService';
import { sessionAuth } from '../middleware/supabaseMidleware';

const Sociogramas = express.Router();

const ruta_listar_respuestas = "/listar-respuestas";

Sociogramas.get(ruta_listar_respuestas, sessionAuth, SociogramaService.listarRespuestasSociograma);

export default Sociogramas;