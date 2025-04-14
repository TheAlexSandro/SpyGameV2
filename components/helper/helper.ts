import { config } from 'dotenv';
config({ path: '.env' });

import { Bot } from "grammy";
import * as flag from '../../language/flags/flags.json';
import * as wordsen from '../game/words/words-en';
import * as wordsid from '../game/words/words-id';
import * as wordsru from '../game/words/words-ru';
import * as wordsuz from '../game/words/words-uz';

import * as btnen from '../../language/button/en';
import * as btnid from '../../language/button/id';
import * as btnru from '../../language/button/ru';
import * as btnuz from '../../language/button/uz';

import * as stren from '../../language/string/en';
import * as strid from '../../language/string/id';
import * as strru from '../../language/string/ru';
import * as struz from '../../language/string/uz';

const getUser = function (user_id: string, bot: Bot, callback: (error: Error | null, result: any) => void): void {
    bot.api.getChat(user_id)
        .then((result) => {
            var username = result.username || null;
            var first_name = result.first_name ? clearHTML(result.first_name as string) : null;
            return callback(null, { username: `@${username}`, first_name, hyperlink: `<a href='tg://user?id=${user_id}'>${first_name}</a>`, any: result })
        })
        .catch((error) => {
            return callback(error.message, null);
        })
}

const clearHTML = function (s: string): string {
    if (!s) return s;
    return s
        .replace(/>/g, '')
        .replace(/</g, '');
}

const language = function (lang_code: string, callback: (error: Error | null, result: any | null) => void): any {
    return Promise.all([
        import(`../../language/string/${lang_code}.ts`),
        import(`../../language/button/${lang_code}.ts`),
    ])
        .then(([stringData, buttonData]) => {
            const flags = flag as Record<string, string>;
            callback(null, { string: stringData.default, button: buttonData.default, flag: flags[lang_code] });
        })
        .catch((error) => {
            callback(error.message, null);
        });
}

const getWords = function (lang_code: string, callback: (error: Error | null, result: any | null) => void): any {
    import(`../game/words/words-${lang_code}.ts`)
        .then((result) => callback(null, result.default));
}

const createID = function(length: number): string {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const panjangKarakter = characters.length;
    let result = "";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * panjangKarakter));
    }

    return result;
}

const sendError = function(error: any, place: string, bot: Bot): void {
    // bot.api.sendMessage(process.env['BOT_ADMIN'] as string, `❌ <b>Error</b>\nMessage: ${error}\nIn: ${place}`, { parse_mode: 'HTML' })
    console.log(error);
}

export default {
    getUser,
    clearHTML,
    language,
    createID,
    sendError,
    getWords
}