import { bot } from './callback';
import express from 'express';

const app = express();

bot.start({ drop_pending_updates: true });
console.log('BOT STARTED!');

app.listen(8000, () => {
    console.log(`Sever listening on port 8000`);
})