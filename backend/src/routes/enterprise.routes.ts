import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  submitContactSchema,
  submitEnterpriseContact,
  getMyEnterpriseConfig,
} from '../services/enterprise.service.js';

const router = Router();

// All enterprise user routes require authentication
router.use('/enterprise', authenticate as any);

// POST /api/enterprise/contact — submit contact form
router.post('/enterprise/contact', async (req: any, res: any) => {
  try {
    const data = submitContactSchema.parse(req.body);
    await submitEnterpriseContact(req.user.id, data);
    res.json({ success: true, message: 'Thank you! Our team will contact you within 24 hours.' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    } else {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
  }
});

// GET /api/enterprise/my-config — get own enterprise config
router.get('/enterprise/my-config', async (req: any, res: any) => {
  try {
    const config = await getMyEnterpriseConfig(req.user.id);
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

export default router;
