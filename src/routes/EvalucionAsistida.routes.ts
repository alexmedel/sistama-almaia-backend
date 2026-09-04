import { Router } from 'express';
import { EvalAsistidaController } from '../core/controller/evalucion-asistenda/evalucion-asistida.controller';
import { sessionAuth } from '../middleware/supabaseMidleware';

export const EvalucionAsistidaRouters = Router();
const evelucionAsistidaController = new EvalAsistidaController();

// Aquí usamos .bind(this) para que el método get se ejecute en el contexto de la instancia
EvalucionAsistidaRouters.get('/alumno', evelucionAsistidaController.evaluncionAsistidad.bind(evelucionAsistidaController));
EvalucionAsistidaRouters.get('/catalogos', evelucionAsistidaController.catalogos.bind(evelucionAsistidaController));
EvalucionAsistidaRouters.post('/guardarRespuesta',sessionAuth, evelucionAsistidaController.guardarRespuesta.bind(evelucionAsistidaController));
EvalucionAsistidaRouters.post('/guardar',sessionAuth, evelucionAsistidaController.guardar.bind(evelucionAsistidaController));
EvalucionAsistidaRouters.get('/evento_informacion_evento', evelucionAsistidaController.eventoAlumnoInformacion.bind(evelucionAsistidaController));
 