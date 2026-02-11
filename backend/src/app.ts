import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './utils/config.js';
import { errorHandler, notFoundHandler } from './errors/errorHandler.js';
import routes from './routes/index.js';
import * as subscriptionController from './controllers/subscription.controller.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [config.FRONTEND_URL, config.ADMIN_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// Stripe webhook needs raw body - mount before json parser
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook as any);

app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
