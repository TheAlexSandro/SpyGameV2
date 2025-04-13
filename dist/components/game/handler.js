"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env' });
const helper_1 = __importDefault(require("../helper/helper"));
const inline_1 = require("../button/inline");
const game_1 = __importDefault(require("./game"));
const voting = (gameID, lang, chatID, bot, prop) => {
    prop.set(`time_vote_${gameID}`, 'true');
    const players = prop.get(`players_${gameID}`)?.toString().split(',');
    const keyb = [];
    if (!players || players.length === 0)
        return;
    helper_1.default.language(lang, (error, lang_data) => {
        for (var g = 0; g < players.length; g++) {
            var userID = players[g];
            const kyb = [];
            for (let i = 0; i < players.length; i++) {
                var id = players[i];
                if (id == userID) { }
                else {
                    var name = prop.get(`first_name_${id}_${gameID}`) || `Unknown`;
                    var button = {
                        text: String(name),
                        callback_data: `vote_${id}_${gameID}`
                    };
                    kyb.push([button]);
                }
            }
            bot.api.sendMessage(userID, lang_data.string['voting_private'], { parse_mode: 'HTML', reply_markup: { inline_keyboard: kyb } });
        }
        keyb[0] = [
            inline_1.btn.url(lang_data.button['to_bot'], `https://${process.env['BOT_USERNAME']}.t.me`)
        ];
        var votingTime = Number(prop.get(`voting_time_${gameID}`));
        bot.api.sendMessage(chatID, lang_data.string['voting'].replace(`{TIME}`, votingTime), { parse_mode: 'HTML', reply_markup: inline_1.markup.inlineKeyboard(keyb) });
        var ints = setInterval(() => {
            votingTime--;
            if (votingTime <= 0) {
                clearInterval(ints);
                if (prop.get(`ended_${gameID}`))
                    return;
                voteCounter(gameID, lang, chatID, bot, prop);
            }
        }, 1000);
        prop.set(`vote_interval_${gameID}`, String(ints));
    });
};
const voteCounter = (gameID, lang, chatID, bot, prop) => {
    helper_1.default.language(lang, (error, lang_data) => {
        if (!prop.get(`votes_${gameID}`)) {
            bot.api.sendMessage(chatID, lang_data.string['no_voter'], { parse_mode: 'HTML' });
            game_1.default.initialize(gameID, lang, chatID, bot, prop);
            return;
        }
        const players = prop.get(`players_${gameID}`)?.toString().split(',');
        if (!players || players.length === 0)
            return;
        const voteCount = {};
        players.forEach((voterID) => {
            var votedID = prop.get(`vote_${voterID}_${gameID}`);
            if (votedID) {
                voteCount[String(votedID)] = (voteCount[String(votedID)] || 0) + 1;
            }
        });
        setTimeout(() => {
            let topVoted = [];
            let maxVotes = 0;
            for (const id in voteCount) {
                if (voteCount[id] > maxVotes) {
                    maxVotes = voteCount[id];
                    topVoted = [id];
                }
                else if (voteCount[id] === maxVotes) {
                    topVoted.push(id);
                }
            }
            if (topVoted.length == 1) {
                lynch(topVoted[0], gameID, lang, chatID, bot, prop);
            }
            else {
                bot.api.sendMessage(chatID, lang_data.string['no_voter'], { parse_mode: 'HTML' });
                game_1.default.initialize(gameID, lang, chatID, bot, prop);
                return;
            }
        }, 1000);
    });
};
const lynch = (userID, gameID, lang, chatID, bot, prop) => {
    helper_1.default.language(lang, (error, lang_data) => {
        var userLink = String(prop.get(`user_${userID}_${gameID}`));
        bot.api.sendMessage(chatID, lang_data.string['lynch'].replace(`{PLAYER}`, userLink), { parse_mode: 'HTML' });
        var getRole = prop.get(`role_${userID}_${gameID}`);
        var roles = (getRole == 'spy') ? lang_data.string['role_spy'] : lang_data.string['role_civil'];
        setTimeout(() => {
            bot.api.sendMessage(chatID, lang_data.string['lynch_role'].replace(`{PLAYER}`, userLink).replace(`{ROLE}`, roles), { parse_mode: 'HTML' });
            deletePlayer(userID, gameID, prop);
            game_1.default.initialize(gameID, lang, chatID, bot, prop);
        }, 1000);
        return;
    });
};
const kick = (userID, gameID, lang, chatID, bot, prop) => {
    helper_1.default.language(lang, (error, lang_data) => {
        var p = [];
        for (var i = 0; i < userID.length; i++) {
            var id = userID[i];
            var userLink = String(prop.get(`user_${id}_${gameID}`));
            p.push(userLink);
            deletePlayer(id, gameID, prop);
        }
        bot.api.sendMessage(chatID, lang_data.string['no_answer'].replace(`{PLAYER}`, p.join(', ')), { parse_mode: 'HTML' });
    });
};
const deletePlayer = (userID, gameID, prop) => {
    var getRole = prop.get(`role_${userID}_${gameID}`);
    prop.set(`player_died_${userID}_${gameID}`, 'true');
    prop.read(`joined_${userID}_${gameID}`);
    if (getRole == 'spy') {
        var spyCount = Number(prop.get(`spy_count_${gameID}`));
        var spyTeam = String(prop.get(`spy_team_${gameID}`)).split(',');
        var spy = spyTeam.filter(id => id != userID);
        prop.set(`spy_count_${gameID}`, spyCount - 1);
        prop.set(`spy_team_${gameID}`, spy.join(','));
    }
    else {
        var civilCount = Number(prop.get(`civil_count_${gameID}`));
        prop.set(`civil_count_${gameID}`, civilCount - 1);
    }
    var player = String(prop.get(`players_${gameID}`)).split(',');
    player = player.filter(id => id != String(userID));
    prop.set(`players_${gameID}`, player.join(','));
};
const spys = (n) => {
    return n == 10 ? 4 :
        n >= 8 ? 3 :
            n >= 5 ? 2 :
                n >= 4 ? 1 : 0;
};
const isSpyWin = (spy, civil) => {
    if (civil == 0)
        return true;
    if (spy == 1 && (civil >= 1 && civil <= 2))
        return true;
    if (spy == 2 && (civil >= 2 && civil <= 4))
        return true;
    if (spy == 3 && (civil >= 5 && civil <= 6))
        return true;
    if (spy == 4 && (civil >= 8 && civil <= 10))
        return true;
    return false;
};
const deleteProperty = (gameID, chatID, prop) => {
    prop.read(`game_id_${chatID}`);
    prop.read(`title_${gameID}`);
    prop.read(`chat_id_${gameID}`);
    prop.read(`host_${gameID}`);
    prop.read(`players_${gameID}`);
    prop.read(`user_0_${gameID}`);
    prop.read(`game_time_${gameID}`);
    prop.read(`voting_time_${gameID}`);
    prop.read(`discuss_time_${gameID}`);
    prop.read(`game_lang_${gameID}`);
    prop.read(`can_manage_game_${gameID}`);
};
exports.default = {
    voting,
    voteCounter,
    kick,
    spys,
    isSpyWin,
    deleteProperty
};
