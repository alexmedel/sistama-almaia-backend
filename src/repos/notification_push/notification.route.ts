// routes/notifications.ts
import { Router } from 'express';
import NotificationPushController from './notification_push.controller';
import { sessionAuth } from '../../middleware/supabaseMidleware';
 
const routerNotifications = Router();
const controller = new NotificationPushController();

// Gestión de tokens
routerNotifications.post('/save-push-token', controller.saveToken);
routerNotifications.post('/push-token', sessionAuth, controller.saveAuthenticatedToken);
 
// Envío de notificaciones
routerNotifications.post('/send-to-user', controller.sendToUser);
routerNotifications.post('/send-to-multiple', controller.sendToMultiple);
routerNotifications.post('/send-to-all', controller.sendToAll);

//avisos
routerNotifications.get('/obtener-notificaciones-pendientes', controller.obtenerNotificacionesPendientes.bind(controller));
routerNotifications.post('/marcar-notificaciones' , controller.marcarNotificacion.bind(controller));
routerNotifications.post('/actulizar-entregable' , controller.marcarEntregable.bind(controller));
export default routerNotifications;
