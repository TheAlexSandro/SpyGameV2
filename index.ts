import { bot } from './callback';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { Request, Response } from 'express';

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

app.get('/ping', (req: Request, res: Response) => {
    res.status(200).json({ ok: true, message: 'Pong!' });
    return;
})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});