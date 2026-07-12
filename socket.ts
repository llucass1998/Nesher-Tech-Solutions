import { io } from 'socket.io-client';

// Conecta no seu back-end que está rodando na porta 3333
export const socket = io('http://localhost:3333');