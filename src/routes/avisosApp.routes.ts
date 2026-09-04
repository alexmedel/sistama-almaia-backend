import express from 'express';
import { AvisosService } from '../infrestructure/server/avisosApps/MotorAvisoService';
import { sessionAuth } from '../middleware/supabaseMidleware';
import { createSecureMemoryUpload } from '../helpers/secure-upload';

const router = express.Router();
const ruta_avisos = '/avisos';

const upload = createSecureMemoryUpload();

router.post(ruta_avisos + '/crear', sessionAuth, upload.single("archivo"), AvisosService.crear);

router.patch(ruta_avisos + '/actualizar/:id', sessionAuth, upload.single("archivo"), AvisosService.actualizar);

router.post(ruta_avisos + '/enviar-programados', sessionAuth,    AvisosService.enviarAvisosProgramados);

router.get(ruta_avisos + '/listar', sessionAuth, AvisosService.listar);

router.get(ruta_avisos + '/resumen', sessionAuth, AvisosService.resumen);

router.get(ruta_avisos + '/usuario/:usuarioId', sessionAuth, AvisosService.listarPorUsuario);

router.delete(ruta_avisos + '/eliminar/:id', sessionAuth, AvisosService.eliminar);
router.post(ruta_avisos + '/test-push', sessionAuth, AvisosService.testEnvio);

router.get(ruta_avisos + '/mis-notificaciones/:usuarioId', sessionAuth, AvisosService.listarMisNotificaciones);

router.patch(ruta_avisos + '/leido/:id', sessionAuth, AvisosService.marcarLeido);

export default router;
