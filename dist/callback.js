"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env' });
const message_1 = require("./message");
Object.defineProperty(exports, "bot", { enumerable: true, get: function () { return message_1.bot; } });
const helper_1 = __importDefault(require("./components/helper/helper"));
const inline_1 = require("./components/button/inline");
const db_1 = __importDefault(require("./components/database/db"));
const flags_json_1 = __importDefault(require("./language/flags/flags.json"));
const game_1 = __importDefault(require("./components/game/game"));
const handler_1 = __importDefault(require("./components/game/handler"));
message_1.bot.on('callback_query', function (ctx) {
    const cb = ctx.callbackQuery;
    const data = cb?.data;
    const userID = ctx.from?.id;
    const chatID = ctx.chat?.id;
    const keyb = [];
    const ids = (ctx.chat?.type == 'private') ? userID.toString() : chatID.toString();
    const chatType = (ctx.chat?.type == 'private') ? 'private' : 'group';
    var match;
    db_1.default.getData(ids, chatType, (error, result) => {
        if (error)
            return helper_1.default.sendError(error, 'CALLBACK', message_1.bot);
        const langCode = result ? result['language_code'] : 'en';
        helper_1.default.language(langCode, (err, lang_data) => {
            if (err)
                return helper_1.default.sendError(err, 'CALLBACK', message_1.bot);
            var pola = /game_(.+)_(.+)/i;
            if (match = pola.exec(data)) {
                var act = match[1];
                var gameID = match[2];
                var groupID = String(message_1.prop.get(`chat_id_${gameID}`));
                var groupLang = String(message_1.prop.get(`game_lang_${gameID}`));
                if (!message_1.prop.get(`chat_id_${gameID}`))
                    return ctx.answerCallbackQuery({ text: lang_data.string['no_game'], show_alert: true });
                if (act == 'start' || act == 'cancel') {
                    var canManageGame = message_1.prop.get(`can_manage_game_${gameID}`);
                    if (canManageGame == 'admin') {
                        ctx.getChatMember(Number(userID)).then((result) => {
                            var status = result.status;
                            if (!/(administrator|creator)/i.exec(status))
                                return ctx.answerCallbackQuery({ text: lang_data.string['manage_denied'].replace(`{ROLE}`, canManageGame), show_alert: true });
                            if (act == 'start') {
                                var players = String(message_1.prop.get(`players_${gameID}`)).split(',');
                                if (players.length < Number(process.env['MIN_PLAYERS']))
                                    return ctx.answerCallbackQuery({ text: lang_data.string['insufficient_players'].replace(`{PLAYER}`, process.env['MIN_PLAYERS']), show_alert: true });
                                game_1.default.starts('begin', gameID, String(chatID), message_1.prop, langCode, message_1.bot);
                                return;
                            }
                            if (act == 'cancel') {
                                game_1.default.starts('cancel', gameID, String(chatID), message_1.prop, langCode, message_1.bot);
                                ctx.reply(lang_data.string['game_canceled'], { parse_mode: 'HTML' });
                                return;
                            }
                        });
                        return;
                    }
                    if (canManageGame == 'host' && String(message_1.prop.get(`host_${gameID}`)) != String(userID)) {
                        return ctx.answerCallbackQuery({ text: lang_data.string['manage_denied'].replace(`{ROLE}`, canManageGame), show_alert: true });
                    }
                    if (act == 'start') {
                        var players = String(message_1.prop.get(`players_${gameID}`)).split(',');
                        if (players.length < Number(process.env['MIN_PLAYERS']))
                            return ctx.answerCallbackQuery({ text: lang_data.string['insufficient_players'].replace(`{PLAYER}`, process.env['MIN_PLAYERS']), show_alert: true });
                        game_1.default.starts('begin', gameID, String(chatID), message_1.prop, langCode, message_1.bot);
                        return;
                    }
                    if (act == 'cancel') {
                        game_1.default.starts('cancel', gameID, String(chatID), message_1.prop, langCode, message_1.bot);
                        ctx.reply(lang_data.string['game_canceled'], { parse_mode: 'HTML' });
                        return;
                    }
                    return;
                }
                if (act == 'leave') {
                    ctx.editMessageText(lang_data.string['leave'], { parse_mode: 'HTML' });
                    message_1.prop.read(`joined_${gameID}_${String(userID)}`);
                    var player = String(message_1.prop.get(`players_${gameID}`)).split(',');
                    var playerNative = String(message_1.prop.get(`players_native_${gameID}`)).split(',');
                    player = player.filter(id => id != String(userID));
                    playerNative = playerNative.filter(id => id != String(userID));
                    message_1.prop.read(`user_${String(userID)}_${gameID}`);
                    message_1.prop.read(`first_name_${String(userID)}_${gameID}`);
                    message_1.prop.set(`players_${gameID}`, player.join(','));
                    message_1.prop.set(`players_native_${game_1.default}`, playerNative.join(','));
                    var p = '';
                    for (var i = 0; i < player.length; i++) {
                        var id = player[i];
                        p += `${i + 1}. ${message_1.prop.get(`user_${id}_${gameID}`)}\n`;
                    }
                    var msgID = message_1.prop.get(`message_id_1_${gameID}`);
                    helper_1.default.language(groupLang, (e, lang_data) => {
                        keyb[0] = [
                            inline_1.btn.url(lang_data.button['join_game'], `https://${process.env['BOT_USERNAME']}.t.me?start=join_${gameID}`)
                        ];
                        keyb[1] = [
                            inline_1.btn.text(lang_data.button['start_game'], `game_start_${gameID}`),
                            inline_1.btn.text(lang_data.button['cancel_game'], `game_cancel_${gameID}`)
                        ];
                        message_1.bot.api.editMessageText(groupID, Number(msgID), lang_data.string['game'].replace(`{LIST}`, p).replace(`{HOST}`, message_1.prop.get(`user_0_${gameID}`)).replace(`{TIME}`, "60").replace(`{PLAYER}`, String(player.length)), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
                    });
                    return;
                }
            }
            var pola = /vote_(.+)_(.+)/i;
            if (match = pola.exec(data)) {
                var pick = match[1];
                var gameID = match[2];
                if (!message_1.prop.get(`chat_id_${gameID}`))
                    return ctx.answerCallbackQuery({ text: lang_data.string['no_game'], show_alert: true });
                if (message_1.prop.get(`player_died_${gameID}`))
                    return ctx.editMessageText(lang_data.string['player_dieds'], { parse_mode: 'HTML' });
                if (!message_1.prop.get(`time_vote_${gameID}`))
                    return ctx.editMessageText(lang_data.string['no_vote_time'], { parse_mode: 'HTML' });
                if (message_1.prop.get(`died_${pick}_${gameID}`))
                    return ctx.answerCallbackQuery({ text: lang_data.string['player_died'], show_alert: true });
                if (message_1.prop.get(`has_vote_${userID}_${gameID}`))
                    return;
                ctx.editMessageText(lang_data.string['have_vote'].replace(`{PLAYER}`, message_1.prop.get(`user_${pick}_${gameID}`)), { parse_mode: 'HTML' });
                message_1.prop.set(`has_vote_${userID}_${gameID}`, 'true');
                message_1.prop.set(`votes_${gameID}`, 'true');
                message_1.prop.set(`vote_${String(userID)}_${gameID}`, pick);
                var voteIndex = message_1.prop.get(`vote_index_${gameID}`) ?? 0;
                message_1.prop.set(`vote_index_${gameID}`, Number(voteIndex) + 1);
                helper_1.default.language(String(message_1.prop.get(`game_lang_${gameID}`)), (e, lang_data) => {
                    message_1.bot.api.sendMessage(String(message_1.prop.get(`chat_id_${gameID}`)), lang_data.string['voting_msg'].replace(`{PLAYER}`, String(message_1.prop.get(`user_${userID}_${gameID}`))).replace(`{PICK}`, String(message_1.prop.get(`user_${pick}_${gameID}`))), { parse_mode: 'HTML' });
                });
                var getPlayerLen = message_1.prop.get(`players_${gameID}`)?.toString().split(',');
                if (Number(message_1.prop.get(`vote_index_${gameID}`)) == getPlayerLen.length) {
                    clearInterval(Number(message_1.prop.get(`vote_interval_${gameID}`)));
                    setTimeout(() => {
                        handler_1.default.voteCounter(gameID, String(message_1.prop.get(`game_lang_${gameID}`)), String(message_1.prop.get(`chat_id_${gameID}`)), message_1.bot, message_1.prop);
                    }, 1000);
                }
                return;
            }
            var pola = /start$/i;
            if (pola.exec(data)) {
                helper_1.default.getUser(userID.toString(), message_1.bot, (error, result) => {
                    if (error)
                        return helper_1.default.sendError(error, 'CALLBACK', message_1.bot);
                    keyb[0] = [
                        inline_1.btn.url(lang_data.button['start'], `https://${process.env['BOT_USERNAME']}.t.me?startgroup`)
                    ];
                    keyb[1] = [
                        inline_1.btn.text(lang_data.flag, `lang_menu`),
                        inline_1.btn.url(lang_data.button['source_code'], process.env['SOURCE_CODE'])
                    ];
                    ctx.editMessageText(lang_data.string['start'].replace(`{NAME}`, result.username ?? result.hyperlink), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
                    ctx.answerCallbackQuery('');
                    return;
                });
                return;
            }
            var pola = /lang_(.+)/i;
            if (match = pola.exec(data)) {
                var cbs = match[1];
                if (cbs == 'menu') {
                    var entries = Object.entries(flags_json_1.default);
                    for (let i = 0; i < entries.length; i += 2) {
                        var row = [];
                        var [code1, label1] = entries[i];
                        if (code1 && label1) {
                            row.push({ text: label1.toString(), callback_data: `lang_${code1}` });
                        }
                        var next = entries[i + 1];
                        if (next) {
                            var [code2, label2] = next;
                            if (code2 && label2) {
                                row.push({ text: label2.toString(), callback_data: `lang_${code2}` });
                            }
                        }
                        keyb.push(row);
                    }
                    keyb.push([
                        { text: lang_data.button['return'], callback_data: 'start' }
                    ]);
                    ctx.editMessageText(lang_data.string['lang_select_private'], { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyb } });
                    ctx.answerCallbackQuery('');
                    return;
                }
                db_1.default.editData(ids, 'language_code', cbs, chatType);
                helper_1.default.language(cbs, (er, r) => {
                    keyb[0] = [
                        inline_1.btn.text(r.button['return'], 'start')
                    ];
                    ctx.editMessageText(r.string['lang_change'], { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
                    ctx.answerCallbackQuery('');
                });
                return;
            }
        });
    });
});
