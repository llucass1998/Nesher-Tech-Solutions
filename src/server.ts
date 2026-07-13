import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { logger } from './lib/logger';
import { requestContext } from './lib/observability';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(requestContext);
app.use(routes);

app.listen(3333, () => {
  logger.info({ event: 'server_started', service: 'logiflow-api', port: 3333 });
});
