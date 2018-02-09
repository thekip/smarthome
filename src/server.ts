import compression from 'compression';
import config from './config';
import socketIo from 'socket.io';
import { Server } from 'http';
import express from 'express';
import path from 'path';

export const app = express();
const server = new Server(app);
server.listen(config.httpPort);

app.use(compression());
app.use(express.static(path.join(__dirname, '../frontend')));

export const io = socketIo(server);
