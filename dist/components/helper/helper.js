"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env' });
const flag = __importStar(require("../../language/flags/flags.json"));
const getUser = function (user_id, bot, callback) {
    bot.api.getChat(user_id)
        .then((result) => {
        var username = result.username || null;
        var first_name = result.first_name ? clearHTML(result.first_name) : null;
        return callback(null, { username: `@${username}`, first_name, hyperlink: `<a href='tg://user?id=${user_id}'>${first_name}</a>`, any: result });
    })
        .catch((error) => {
        return callback(error.message, null);
    });
};
const clearHTML = function (s) {
    if (!s)
        return s;
    return s
        .replace(/>/g, '')
        .replace(/</g, '');
};
const language = function (lang_code, callback) {
    return Promise.all([
        Promise.resolve(`${`../../language/string/${lang_code}.json`}`).then(s => __importStar(require(s))),
        Promise.resolve(`${`../../language/button/${lang_code}.json`}`).then(s => __importStar(require(s))),
    ])
        .then(([stringData, buttonData]) => {
        const flags = flag;
        callback(null, { string: stringData.default, button: buttonData.default, flag: flags[lang_code] });
    })
        .catch((error) => {
        callback(error.message, null);
    });
};
const getWords = function (lang_code, callback) {
    Promise.resolve(`${`../game/words/words-${lang_code}.json`}`).then(s => __importStar(require(s))).then((result) => callback(null, result.default));
};
const createID = function (length) {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const panjangKarakter = characters.length;
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * panjangKarakter));
    }
    return result;
};
const sendError = function (error, place, bot) {
    // bot.api.sendMessage(process.env['BOT_ADMIN'] as string, `❌ <b>Error</b>\nMessage: ${error}\nIn: ${place}`, { parse_mode: 'HTML' })
    console.log(error);
};
exports.default = {
    getUser,
    clearHTML,
    language,
    createID,
    sendError,
    getWords
};
