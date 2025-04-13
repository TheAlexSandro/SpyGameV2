"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prop = exports.bot = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env' });
const grammy_1 = require("grammy");
const helper_1 = __importDefault(require("./components/helper/helper"));
const inline_1 = require("./components/button/inline");
const properties_reader_1 = __importDefault(require("properties-reader"));
const db_1 = __importDefault(require("./components/database/db"));
const game_1 = __importDefault(require("./components/game/game"));
const bot = new grammy_1.Bot(process.env['BOT_TOKEN']);
exports.bot = bot;
const prop = (0, properties_reader_1.default)('');
exports.prop = prop;
bot.on('message', function (ctx) {
    const userID = ctx.from?.id;
    const chatID = ctx.chat?.id;
    const keyb = [];
    const ids = (ctx.chat?.type == 'private') ? String(userID) : String(chatID);
    const chatType = (ctx.chat?.type == 'private') ? 'private' : 'group';
    var match;
    db_1.default.getData(ids, chatType, (error, result) => {
        if (error)
            return helper_1.default.sendError(error, 'MESSAGE', bot);
        const langCode = result ? result['language_code'] : 'en';
        helper_1.default.language(langCode, (err, lang_data) => {
            if (err)
                return helper_1.default.sendError(err, 'MESSAGE', bot);
            if (match = /^\/start join_(.+)/i.exec(ctx.message?.text)) {
                var gameID = match[1];
                var groupID = String(prop.get(`chat_id_${gameID}`));
                if (!groupID)
                    return ctx.reply(lang_data.string['no_game']);
                if (prop.get(`joined_${gameID}_${String(userID)}`))
                    return ctx.reply(lang_data.string['joined_already']);
                var kyb = [];
                kyb[0] = [
                    inline_1.btn.text(lang_data.button['leave_game'], `game_leave_${gameID}`)
                ];
                prop.set(`joined_${gameID}_${String(userID)}`, 'true');
                ctx.reply(lang_data.string['success_join'].replace(`{GROUP}`, helper_1.default.clearHTML(String(prop.get(`title_${gameID}`)))), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(kyb) });
                db_1.default.addData(String(userID), 'private');
                helper_1.default.getUser(String(userID), bot, (error, result) => {
                    prop.set(`user_${userID}_${gameID}`, result.hyperlink);
                    prop.set(`first_name_${userID}_${gameID}`, result.first_name);
                });
                var players = prop.get(`players_${gameID}`);
                prop.set(`players_${gameID}`, `${players},${String(userID)}`);
                prop.set(`players_native_${gameID}`, `${players},${String(userID)}`);
                var newPlayers = String(prop.get(`players_${gameID}`)).split(',');
                setTimeout(() => {
                    var p = '';
                    for (var i = 0; i < newPlayers.length; i++) {
                        var id = newPlayers[i];
                        p += `${i + 1}. ${prop.get(`user_${id}_${gameID}`)}\n`;
                    }
                    if (newPlayers.length == Number(process.env['MAX_PLAYERS'])) {
                        game_1.default.starts('begin', gameID, groupID, prop, String(prop.get(`game_lang_${gameID}`)), bot);
                        return;
                    }
                    var msgID = prop.get(`message_id_1_${gameID}`);
                    var groupLang = String(prop.get(`game_lang_${gameID}`));
                    helper_1.default.language(groupLang, (e, lang_data) => {
                        keyb[0] = [
                            inline_1.btn.url(lang_data.button['join_game'], `https://${process.env['BOT_USERNAME']}.t.me?start=join_${gameID}`)
                        ];
                        keyb[1] = [
                            inline_1.btn.text(lang_data.button['start_game'], `game_start_${gameID}`),
                            inline_1.btn.text(lang_data.button['cancel_game'], `game_cancel_${gameID}`)
                        ];
                        bot.api.editMessageText(groupID, Number(msgID), lang_data.string['game'].replace(`{LIST}`, p).replace(`{HOST}`, prop.get(`user_0_${gameID}`)).replace(`{TIME}`, "60").replace(`{PLAYER}`, String(newPlayers.length)), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
                    });
                }, 1000);
                return;
            }
            var pola = /^\/start$/i;
            if (pola.exec(ctx.message?.text)) {
                helper_1.default.getUser(String(userID), bot, (error, result) => {
                    if (error)
                        return helper_1.default.sendError(error, 'MESSAGE', bot);
                    keyb[0] = [
                        inline_1.btn.url(lang_data.button['start'], `https://${process.env['BOT_USERNAME']}.t.me?startgroup`)
                    ];
                    keyb[1] = [
                        inline_1.btn.text(lang_data.flag, `lang_menu`),
                        inline_1.btn.url(lang_data.button['source_code'], process.env['SOURCE_CODE'])
                    ];
                    return ctx.reply(lang_data.string['start'].replace(`{NAME}`, result.username ?? result.hyperlink), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
                });
                db_1.default.addData(String(userID), 'private');
                return;
            }
            var pola = /^\/spy|spy@SpyingGameBot$/i;
            if (pola.exec(ctx.message?.text)) {
                if (chatType == 'private')
                    return ctx.reply(lang_data.string['game_private_warn']);
                try {
                    ctx.deleteMessage();
                }
                catch { }
                ;
                if (prop.get(`game_id_${String(chatID)}`))
                    return true;
                helper_1.default.getUser(String(userID), bot, (error, result) => {
                    if (error)
                        return helper_1.default.sendError(error.message, 'MESSAGE', bot);
                    var ID = helper_1.default.createID(20);
                    keyb[0] = [
                        inline_1.btn.url(lang_data.button['join_game'], `https://${process.env['BOT_USERNAME']}.t.me?start=join_${ID}`)
                    ];
                    keyb[1] = [
                        inline_1.btn.text(lang_data.button['start_game'], `game_start_${ID}`),
                        inline_1.btn.text(lang_data.button['cancel_game'], `game_cancel_${ID}`)
                    ];
                    db_1.default.getData(String(chatID), 'group', (err, rest) => {
                        var times = (rest) ? Number(rest['registration_time']) : 60;
                        var gameTime = (rest) ? Number(rest['game_time']) : 60;
                        var votingTime = (rest) ? Number(rest['voting_time']) : 45;
                        var discussTime = (rest) ? Number(rest['discuss_time']) : 60;
                        ctx.reply(lang_data.string['game'].replace(`{HOST}`, result.hyperlink).replace(`{LIST}`, `1. ${result.hyperlink}\n`).replace(`{TIME}`, times).replace(`{PLAYER}`, 1), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) }).then((result) => {
                            prop.set(`message_id_1_${ID}`, result.message_id);
                            prop.set(`index_msgid_${ID}`, 2);
                        });
                        db_1.default.addData(String(chatID), 'group');
                        prop.set(`game_id_${String(chatID)}`, ID);
                        prop.set(`title_${ID}`, String(ctx.chat.title));
                        prop.set(`chat_id_${ID}`, String(chatID));
                        prop.set(`host_${ID}`, String(userID));
                        prop.set(`players_${ID}`, `${String(userID)}`);
                        prop.set(`players_native_${gameID}`, `${String(userID)}`);
                        prop.set(`joined_${ID}_${String(userID)}`, 'true');
                        prop.set(`user_${userID}_${ID}`, result.hyperlink);
                        prop.set(`first_name_${userID}_${ID}`, result.first_name);
                        prop.set(`user_0_${ID}`, result.hyperlink);
                        prop.set(`game_time_${ID}`, gameTime);
                        prop.set(`voting_time_${ID}`, votingTime);
                        prop.set(`discuss_time_${ID}`, discussTime);
                        prop.set(`game_lang_${ID}`, langCode);
                        prop.set(`can_manage_game_${ID}`, (rest) ? rest['can_manage_game'] : 'host');
                        prop.set(`max_day_${ID}`, (rest) ? rest['day'] : "5");
                        var ints = setInterval(() => {
                            times--;
                            if (/(60|30|10)/i.exec(String(times))) {
                                ctx.reply(lang_data.string['time_message'].replace(`{TIME}`, times))
                                    .then((result) => {
                                    var getMsg = Number(prop.get(`index_msgid_${ID}`));
                                    prop.set(`message_id_${getMsg}_${ID}`, result.message_id);
                                    prop.set(`index_msgid_${ID}`, Number(getMsg) + 1);
                                });
                            }
                            if (times <= 0) {
                                clearInterval(ints);
                                var players = String(prop.get(`players_${ID}`)).split(',');
                                if (players.length < Number(process.env['MIN_PLAYERS'])) {
                                    game_1.default.starts('cancel', ID, String(chatID), prop, null, bot);
                                    return ctx.reply(lang_data.string['insufficient_players'].replace(`{PLAYER}`, process.env['MIN_PLAYERS']), { parse_mode: 'HTML' });
                                }
                                game_1.default.starts('begin', ID, String(chatID), prop, langCode, bot);
                                return;
                            }
                        }, 1000);
                        prop.set(`intervals_${ID}`, String(ints));
                    });
                    return;
                });
            }
            var pola = /^\/t\s+(.+)/i;
            if (pola.exec(ctx.message?.text)) {
                var spySession = prop.get(`spy_chat_${String(userID)}`);
                var getRole = String(prop.get(`role_${String(userID)}_${spySession}`));
                if (getRole != 'spy')
                    return;
                var spyList = String(prop.get(`spy_team_${spySession}`)).split(',');
                ctx.reply(lang_data.string['msg_sent'], { reply_parameters: { message_id: ctx.message?.message_id } });
                for (var i = 0; i < spyList.length; i++) {
                    var id = String(spyList[i]);
                    if (id != String(userID)) {
                        bot.api.sendMessage(id, `<b>${prop.get(`first_name_${String(userID)}_${spySession}`)}</b>:\n<i>${helper_1.default.clearHTML(ctx.message?.text.replace(/\/t\s+/g, ''))}</i>`, { parse_mode: 'HTML' });
                    }
                }
                return;
            }
            // SESSION
            var getSession = prop.get(`session_${String(userID)}`);
            if (getSession) {
                if (chatType == 'group')
                    return;
                var pec = String(getSession).split('_');
                var IDs = pec[0];
                var lang = pec[1];
                var grpID = String(prop.get(`chat_id_${IDs}`));
                ctx.reply(lang_data.string['answer_saved'], { parse_mode: 'HTML' });
                prop.set(`answer_${String(userID)}_${IDs}`, helper_1.default.clearHTML(String(ctx.message?.text)));
                helper_1.default.language(lang, (e, lang_data) => {
                    bot.api.sendMessage(grpID, lang_data.string['answered'].replace(`{PLAYER}`, String(prop.get(`user_${userID}_${IDs}`))), { parse_mode: 'HTML' });
                });
                var getAns = prop.get(`index_answer_${IDs}`);
                var playerLength = String(prop.get(`players_${IDs}`)).split(',').length;
                if (!getAns) {
                    prop.set(`index_answer_${IDs}`, 1);
                }
                else {
                    prop.set(`index_answer_${IDs}`, Number(getAns) + 1);
                }
                prop.read(`session_${String(userID)}`);
                setTimeout(() => {
                    if (Number(prop.get(`index_answer_${IDs}`)) == playerLength) {
                        clearInterval(Number(prop.get(`intervals_g_${IDs}`)));
                        game_1.default.timesUp(IDs, lang, grpID, bot, prop);
                    }
                }, 500);
                return;
            }
        });
    });
});
