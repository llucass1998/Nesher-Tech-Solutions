import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes';
import { logger } from './lib/logger';
import { requestContext } from './lib/observability';

const app = express();
const port = Number(process.env.PORT ?? 3333);
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

app.use(cors({
  origin: webOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(requestContext);
app.use(routes);

app.listen(port, () => {
  logger.info({ event: 'server_started', service: 'logiflow-api', port, webOrigin });
});
