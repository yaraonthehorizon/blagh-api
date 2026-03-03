import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { EmailConfigService } from '../services/email-config.service';

export class EmailController {
  private emailService = new EmailService();
  private configService = new EmailConfigService();

  /**
   * @openapi
   * /api/email/send:
   *   post:
   *     summary: Send an email using the configured provider
   *     tags:
   *       - Email
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               code:
   *                 type: string
   *               to:
   *                 type: string
   *               subject:
   *                 type: string
   *               body:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email sent successfully
   */
  async send(req: Request, res: Response) {
    const { userId, code, to, subject, body } = req.body;
    try {
      await this.emailService.sendEmail(userId, code, to, subject, body);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/email/configs:
   *   get:
   *     summary: List all email configs for a user
   *     tags:
   *       - Email
   *     responses:
   *       200:
   *         description: List of configs
   */
  async listConfigs(req: Request, res: Response) {
    try {
      // For now, allow listing all configs or filter by userId if provided
      const userId = (req as any).user?.id || req.query.userId || req.body.userId;
      const configs = await this.configService.list(userId);
      res.status(200).json({ data: configs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/email/configs/{id}:
   *   get:
   *     summary: Get a specific email config
   *     tags:
   *       - Email
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email config
   *       404:
   *         description: Not found
   */
  async getConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId || req.body.userId;
      const config = await this.configService.get(userId, req.params.id);
      if (!config) return res.status(404).json({ error: 'Not found' });
      res.status(200).json({ data: config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/email/configs:
   *   post:
   *     summary: Create a new email config
   *     tags:
   *       - Email
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               provider:
   *                 type: string
   *               credentials:
   *                 type: object
   *               code:
   *                 type: string
   *               fromName:
   *                 type: string
   *               fromEmail:
   *                 type: string
   *     responses:
   *       201:
   *         description: Created
   */
  async createConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const config = await this.configService.create(userId, req.body);
      res.status(201).json({ data: config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/email/configs/{id}:
   *   put:
   *     summary: Update an email config
   *     tags:
   *       - Email
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               provider:
   *                 type: string
   *               credentials:
   *                 type: object
   *               code:
   *                 type: string
   *               fromName:
   *                 type: string
   *               fromEmail:
   *                 type: string
   *     responses:
   *       200:
   *         description: Updated
   *       404:
   *         description: Not found
   */
  async updateConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const config = await this.configService.update(userId, req.params.id, req.body);
      if (!config) return res.status(404).json({ error: 'Not found' });
      res.status(200).json({ data: config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/email/configs/{id}:
   *   delete:
   *     summary: Delete an email config
   *     tags:
   *       - Email
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Deleted
   *       404:
   *         description: Not found
   */
  async deleteConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const config = await this.configService.delete(userId, req.params.id);
      if (!config) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
} 