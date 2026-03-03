import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private notificationService = new NotificationService();

  /**
   * @openapi
   * /api/notification/send:
   *   post:
   *     summary: Send a notification
   *     tags:
   *       - Notification
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               type:
   *                 type: string
   *               message:
   *                 type: string
   *     responses:
   *       200:
   *         description: Notification sent successfully
   */
  async send(req: Request, res: Response) {
    const { userId, type, message } = req.body;
    try {
      const result = await this.notificationService.sendNotification({ userId, type, message });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/notification/send-welcome:
   *   post:
   *     summary: Send welcome email
   *     tags:
   *       - Notification
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               email:
   *                 type: string
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: Welcome email sent successfully
   */
  async sendWelcomeEmail(req: Request, res: Response) {
    const { userId, email, name } = req.body;
    try {
      const result = await this.notificationService.sendWelcomeEmail({ userId, email, name });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
} 