// Simple local Express server to run Vercel serverless API in dev
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Dynamic import of serverless handler
  const mod = await import('../api/unified.js');
  const handler = mod.default || mod.handler || mod;

  if (typeof handler !== 'function') {
    console.error('API handler not found in api/unified.js');
    process.exit(1);
  }

  // Mount the serverless handler under the same path used in production
  app.all('/api/unified', (req, res) => {
    try {
      return handler(req, res);
    } catch (err) {
      console.error('Local API error:', err);
      res.status(500).json({ success: false, error: 'Local API error' });
    }
  });

  // Health
  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`[local-api] Listening on http://localhost:${PORT}`);
  });
}

bootstrap();
