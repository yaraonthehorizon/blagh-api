import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();
const controller = new EmailController();

router.post('/send', (req, res) => controller.send(req, res));

// CRUD for configs
router.get('/configs', (req, res) => controller.listConfigs(req, res));
router.get('/configs/:id', (req, res) => controller.getConfig(req, res));
router.post('/configs', (req, res) => controller.createConfig(req, res));
router.put('/configs/:id', (req, res) => controller.updateConfig(req, res));
router.delete('/configs/:id', (req, res) => controller.deleteConfig(req, res));

export default router; 