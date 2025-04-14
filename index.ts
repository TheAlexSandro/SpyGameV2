import { bot } from './callback';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

bot.start({ drop_pending_updates: true });
console.log('BOT STARTED!');

const port = process.env.PORT || 8000;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});