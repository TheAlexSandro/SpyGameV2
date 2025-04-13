"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env' });
const helper_1 = __importDefault(require("../helper/helper"));
const inline_1 = require("../button/inline");
const handler_1 = __importDefault(require("./handler"));
const starts = (action, gameID, chatID, prop, lang, bot) => {
    clearInterval(Number(prop.get(`intervals_${gameID}`)));
    for (var i = 1; i < 4; i++) {
        if (prop.get(`message_id_${i}_${gameID}`)) {
            try {
                bot.api.deleteMessage(String(chatID), Number(prop.get(`message_id_${i}_${gameID}`)));
            }
            catch { }
        }
    }
    if (action == 'cancel') {
        handler_1.default.deleteProperty(gameID, chatID, prop);
    }
    ;
    if (action == 'begin') {
        initialize(gameID, lang, String(chatID), bot, prop);
    }
    ;
    return;
};
const initialize = (gameID, lang, chatID, bot, prop) => {
    prop.set(`started_${gameID}`, 'true');
    prop.read(`time_vote_${gameID}`);
    const players = prop.get(`players_${gameID}`)?.toString().split(',');
    const keyb = [];
    if (!players || players.length === 0)
        return;
    const getDay = prop.get(`day_${gameID}`) ?? 0;
    if (!prop.get(`role_assigned_${gameID}`)) {
        var spyCount = handler_1.default.spys(players.length);
        prop.set(`spy_count_${gameID}`, spyCount);
        prop.set(`civil_count_${gameID}`, Number(players.length) - spyCount);
    }
    prop.read(`index_answer_${gameID}`);
    prop.read(`vote_index_${gameID}`);
    prop.read(`votes_${gameID}`);
    var spyCount = Number(prop.get(`spy_count_${gameID}`));
    var civilCount = Number(prop.get(`civil_count_${gameID}`));
    if (Number(getDay) == Number(prop.get(`max_day_${gameID}`))) {
        prop.set(`ended_${gameID}`, 'true');
        finish('spy', gameID, lang, chatID, bot, prop);
    }
    else if (spyCount == 0 && civilCount == 0) {
        prop.set(`ended_${gameID}`, 'true');
        finish('nothing', gameID, lang, chatID, bot, prop);
    }
    else if (spyCount == 0 && civilCount > 0) {
        prop.set(`ended_${gameID}`, 'true');
        finish('civil', gameID, lang, chatID, bot, prop);
    }
    else if (handler_1.default.isSpyWin(spyCount, civilCount)) {
        prop.set(`ended_${gameID}`, 'true');
        finish('spy', gameID, lang, chatID, bot, prop);
    }
    if (prop.get(`ended_${gameID}`))
        return;
    prop.set(`day_${gameID}`, Number(getDay) + 1);
    const categories = ['transportation', 'food', 'drinks', 'water', 'fruit', 'electric'];
    var times = Number(prop.get(`game_time_${gameID}`));
    helper_1.default.language(lang, (error, lang_data) => {
        helper_1.default.getWords(lang, (e, r) => {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const cate = r.find((item) => item.type === category);
            var catego = cate?.translation;
            var word1 = cate?.words[Math.floor(Math.random() * cate?.words.length)];
            var word2 = cate?.words[Math.floor(Math.random() * cate?.words.length)];
            while (word1 === word2) {
                word2 = cate?.words[Math.floor(Math.random() * cate?.words.length)];
            }
            if (!prop.get(`role_assigned_${gameID}`)) {
                var spyIndices = new Set();
                while (spyIndices.size < spyCount) {
                    var randomIndex = Math.floor(Math.random() * players.length);
                    spyIndices.add(randomIndex);
                }
                for (var i = 0; i < players.length; i++) {
                    var isSpy = spyIndices.has(i);
                    var id = players[i];
                    prop.set(`role_${id}_${gameID}`, isSpy ? 'spy' : 'civil');
                    if (isSpy) {
                        var spyLists = prop.get(`spy_team_${gameID}`);
                        if (!spyLists) {
                            prop.set(`spy_team_${gameID}`, `${id}`);
                        }
                        else {
                            prop.set(`spy_team_${gameID}`, `${spyLists},${id}`);
                        }
                        ;
                    }
                    const roleMsg = isSpy ? lang_data.string['spy_role'] : lang_data.string['civil_role'];
                    if (!prop.get(`has_send_role_${id}_${gameID}`)) {
                        bot.api.sendMessage(id, roleMsg, { parse_mode: 'HTML' });
                        prop.set(`has_send_role_${gameID}`, 'true');
                    }
                }
            }
            if (Number(prop.get(`spy_count_${gameID}`)) > 1 && !prop.get(`role_assigned_${gameID}`)) {
                var spyList = String(prop.get(`spy_team_${gameID}`)).split(',');
                setTimeout(() => {
                    for (var i = 0; i < players.length; i++) {
                        const id = players[i];
                        const role = String(prop.get(`role_${id}_${gameID}`));
                        if (role == 'spy') {
                            var spy = '';
                            for (var g = 0; g < spyList.length; g++) {
                                const spyID = spyList[g];
                                spy += `${prop.get(`user_${spyID}_${gameID}`)}\n`;
                            }
                            prop.set(`spy_chat_${id}`, gameID);
                            bot.api.sendMessage(id, lang_data.string['spy_team'].replace(`{LIST}`, spy), { parse_mode: 'HTML' });
                        }
                    }
                }, 700);
            }
            setTimeout(() => {
                var p = '';
                for (var i = 0; i < players.length; i++) {
                    const id = players[i];
                    const role = String(prop.get(`role_${id}_${gameID}`));
                    const isSpy = (role == 'spy') ? true : false;
                    const word = isSpy ? word2 : word1;
                    p += `${i + 1}. ${prop.get(`user_${id}_${gameID}`)}\n`;
                    bot.api.sendMessage(id, lang_data.string['words'].replace(`{WORD}`, word).replace(`{CATEGORY}`, catego), { parse_mode: 'HTML' });
                    prop.set(`session_${id}`, `${gameID}_${lang}`);
                    prop.read(`answer_${id}_${gameID}`);
                }
                keyb[0] = [
                    inline_1.btn.url(lang_data.button['to_bot'], `https://${process.env['BOT_USERNAME']}.t.me`)
                ];
                bot.api.sendMessage(chatID, lang_data.string['player_list'].replace(`{LIST}`, p).replace(`{TIME}`, times), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
                var ints = setInterval(() => {
                    times--;
                    if (times <= 0) {
                        clearInterval(ints);
                        if (prop.get(`ended_${gameID}`))
                            return;
                        timesUp(gameID, lang, chatID, bot, prop);
                    }
                }, 1000);
                prop.set(`intervals_g_${gameID}`, String(ints));
            }, 1000);
        });
        var gameTime = 0;
        var ints = setInterval(() => {
            if (prop.get(`ended_${gameID}`)) {
                clearInterval(ints);
                return;
            }
            ;
            gameTime++;
            prop.set(`game_time_${gameID}`, String(gameTime));
        }, 1000);
        prop.set(`game_time_ints_${gameID}`, String(ints));
    });
};
const timesUp = (gameID, lang, chatID, bot, prop) => {
    prop.set(`role_assigned_${gameID}`, 'true');
    const players = prop.get(`players_${gameID}`)?.toString().split(',');
    if (!players || players.length === 0)
        return;
    helper_1.default.language(lang, (error, lang_data) => {
        var p = '';
        var not_answer = [];
        for (var i = 0; i < players.length; i++) {
            var id = players[i];
            p += `${i + 1}. ${prop.get(`user_${id}_${gameID}`)}\nAnswer: ${prop.get(`answer_${id}_${gameID}`) ?? '--'}\n\n`;
            prop.read(`session_${id}`);
            prop.read(`has_vote_${id}_${gameID}`);
            prop.read(`vote_${id}_${gameID}`);
            bot.api.sendMessage(id, lang_data.string['times_up_private'], { parse_mode: 'HTML' });
            if (!prop.get(`answer_${id}_${gameID}`)) {
                not_answer.push(String(id));
            }
            ;
        }
        bot.api.sendMessage(chatID, lang_data.string['times_up'], { parse_mode: 'HTML' });
        setTimeout(() => {
            handler_1.default.kick(not_answer, gameID, lang, chatID, bot, prop);
            setTimeout(() => {
                const getDay = prop.get(`day_${gameID}`);
                const spyCount = Number(prop.get(`spy_count_${gameID}`));
                const civilCount = Number(prop.get(`civil_count_${gameID}`));
                if (Number(getDay) == Number(prop.get(`max_day_${gameID}`))) {
                    prop.set(`ended_${gameID}`, 'true');
                    finish('spy', gameID, lang, chatID, bot, prop);
                }
                else if (spyCount == 0 && civilCount == 0) {
                    prop.set(`ended_${gameID}`, 'true');
                    finish('nothing', gameID, lang, chatID, bot, prop);
                }
                else if (spyCount == 0 && civilCount > 0) {
                    prop.set(`ended_${gameID}`, 'true');
                    finish('civil', gameID, lang, chatID, bot, prop);
                }
                else if (handler_1.default.isSpyWin(spyCount, civilCount)) {
                    prop.set(`ended_${gameID}`, 'true');
                    finish('spy', gameID, lang, chatID, bot, prop);
                }
                if (prop.get(`ended_${gameID}`))
                    return;
                bot.api.sendMessage(chatID, lang_data.string['answer_list'].replace(`{LIST}`, p).replace(`{DAY}`, getDay).replace(`{CIVIL_COUNT}`, civilCount).replace(`{SPY_COUNT}`, spyCount), { parse_mode: 'HTML' });
            }, 1500);
        }, 1000);
        var discussTime = Number(prop.get(`discuss_time_${gameID}`));
        var ints = setInterval(() => {
            discussTime--;
            if (discussTime <= 0) {
                clearInterval(ints);
                if (prop.get(`ended_${gameID}`))
                    return;
                handler_1.default.voting(gameID, lang, chatID, bot, prop);
                return;
            }
        }, 1000);
        prop.set(`times_up_ints_${gameID}`, String(ints));
    });
};
const finish = (team, gameID, lang, chatID, bot, prop) => {
    clearInterval(Number(prop.get(`intervals_g_${gameID}`)));
    clearInterval(Number(prop.get(`game_time_ints_${gameID}`)));
    clearInterval(Number(prop.get(`times_up_ints_${gameID}`)));
    clearInterval(Number(prop.get(`vote_interval_${gameID}`)));
    helper_1.default.language(lang, (error, lang_data) => {
        const players = String(prop.get(`players_native_${gameID}`)).split(',');
        if (!players || players.length === 0)
            return;
        var winner = '';
        var plyr = '';
        for (var i = 0; i < players.length; i++) {
            var id = players[i];
            var getRole = String(prop.get(`role_${id}_${gameID}`));
            var userLink = prop.get(`user_${id}_${gameID}`);
            var roles = (getRole == 'spy') ? lang_data.string['role_spy'] : lang_data.string['role_civil'];
            var msgs = (team == 'spy') ? lang_data.string['spy_victory_pvt'] : lang_data.string['civil_victory_pvt'];
            prop.read(`session_${id}`);
            prop.read(`spy_chat_${id}`);
            if (Number(prop.get(`spy_count_${gameID}`)) == 0 && Number(prop.get(`civil_count_${gameID}`)) == 0) {
                plyr += `${userLink} - ${roles}\n`;
            }
            else {
                if (!prop.get(`player_died_${id}_${gameID}`)) {
                    winner += `${userLink} - ${roles}\n`;
                }
                else {
                    plyr += `${userLink} - ${roles}\n`;
                }
            }
            bot.api.sendMessage(id, msgs, { parse_mode: 'HTML' });
        }
        const gameTime = String(prop.get(`game_time_${gameID}`));
        const msg = (team == 'spy') ? lang_data.string['spy_victory'] : lang_data.string['civil_victory'];
        var pList;
        if (team == 'nothing') {
            pList = msg.replace(`{OTHER}`, plyr);
        }
        else {
            pList = msg.replace(`{WINNER}`, winner).replace(`{OTHER}`, plyr);
        }
        bot.api.sendMessage(chatID, `${pList}${lang_data.string['game_running'].replace(`{TIME}`, gameTime)}`, { parse_mode: 'HTML' });
        handler_1.default.deleteProperty(gameID, chatID, prop);
        return;
    });
};
exports.default = {
    starts,
    initialize,
    timesUp
};
