import express from 'express';
import cors from 'cors'; // 1. Importe o cors
import { routes } from './routes';

const app = express();

// 2. Configure o CORS aqui
// O 'origin' deve ser a URL do seu Front-end (provavelmente localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json()); // Permite ler JSON no corpo da requisição

// 3. Suas rotas ficam DEPOIS do CORS
app.use(routes);

app.listen(3333, () => {
  console.log('🚀 Servidor rodando na porta 3333!');
});
