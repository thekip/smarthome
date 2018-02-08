import compression from 'compression';
import config from './config';
import socketIo from 'socket.io';
import { Server } from 'http';
import express from 'express';

export const app = express();
const server = new Server(app);
server.listen(config.httpPort);

app.use(compression());
app.use(express.static(__dirname + '/frontend'));

export const io = socketIo(server);
