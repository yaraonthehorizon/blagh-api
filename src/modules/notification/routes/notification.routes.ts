import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const notificationController = new NotificationController();

// POST /api/notification/send
router.post('/send', notificationController.send.bind(notificationController));

// POST /api/notification/send-welcome
router.post('/send-welcome', notificationController.sendWelcomeEmail.bind(notificationController));

export default router; 