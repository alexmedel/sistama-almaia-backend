import express from 'express';
import { CatalogoService } from "../infrestructure/server/encuestas/catalagoService";
import { EncuestaPlantillaService } from '../infrestructure/server/encuestas/encuestaPlantilla';
import { EncuestaRespuestaService } from '../infrestructure/server/encuestas/encuestaRespuestaService';
import { EncuestaService } from '../infrestructure/server/encuestas/encuestaService';
import { SociogramaService } from '../infrestructure/server/sociogramas/sociogramaService';
import { sessionAuth } from '../middleware/supabaseMidleware';

const Encuestas = express.Router();

const ruta_catalogos = "/catalogos";
const ruta_crear = "/crear-encuesta";
const ruta_actualizar = "/actualizar-encuesta/:id";
const ruta_eliminar = "/eliminar-encuesta/:id";
const ruta_listar = "/listar";
// const ruta_listar_rpc = "/listar-rpc";
const ruta_responder = "/responder-encuesta";
const ruta_obtener_respuestas = "/obtener-respuestas";

Encuestas.get(ruta_catalogos, sessionAuth, CatalogoService.getAllCatalogos);
Encuestas.post(ruta_crear,sessionAuth, EncuestaService.crearEncuesta);
Encuestas.patch(ruta_actualizar, sessionAuth, EncuestaService.actualizarEncuesta);
// Encuestas.get(ruta_listar, sessionAuth, EncuestaService.listarEncuestas);
Encuestas.get(ruta_listar, sessionAuth, EncuestaService.listarEncuestasRPC);
Encuestas.delete(ruta_eliminar, sessionAuth, EncuestaService.eliminarEncuesta);
Encuestas.get("/:id/preguntas", sessionAuth, EncuestaService.listarPreguntas);

Encuestas.get("/tipos/:id/plantillas", sessionAuth, EncuestaPlantillaService.tipoEncuestaPlantillas);
Encuestas.get("/plantillas/:id/preguntas", sessionAuth, EncuestaPlantillaService.plantillaPreguntas);

Encuestas.post(ruta_responder, sessionAuth, EncuestaRespuestaService.crearRespuesta);
Encuestas.get(ruta_obtener_respuestas, sessionAuth, EncuestaRespuestaService.obtenerRespuestas);
Encuestas.get('/:id/sociograma', sessionAuth, SociogramaService.listarRespuestasSociograma);

export default Encuestas;