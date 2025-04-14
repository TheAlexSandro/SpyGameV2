import { config } from 'dotenv';
config({ path: '.env' });

import { Bot } from 'grammy';
import { InlineKeyboardButton } from 'grammy/types';
import { Reader } from 'properties-reader';
import helper from '../helper/helper';
import { markup, btn } from '../button/inline'
import game from './game';

const voting = (gameID: string, lang: string, chatID: string, bot: Bot, prop: Reader): void => {
    prop.set(`time_vote_${gameID}`, 'true');
    const players = prop.get(`players_${gameID}`)?.toString().split(',');
    const keyb: InlineKeyboardButton[][] = [];
    if (!players || players.length === 0) return;

    helper.language(lang, (error: Error | null, lang_data: any) => {
        for (var g = 0; g < players!.length; g++) {
            var userID = players[g];

            const kyb: InlineKeyboardButton[][] = [];
            for (let i = 0; i < players!.length; i++) {
                var id = players[i];
                if (id == userID) { } else {
                    var name = prop.get(`first_name_${id}_${gameID}`) || `Unknown`;
                    var button: InlineKeyboardButton = {
                        text: String(name),
                        callback_data: `vote_${id}_${gameID}`
                    };
                    kyb.push([button]);
                }
            }

            bot.api.sendMessage(userID, lang_data.string['voting_private'], { parse_mode: 'HTML', reply_markup: { inline_keyboard: kyb } });
        }

        keyb[0] = [
            btn.url(lang_data.button['to_bot'], `https://${process.env['BOT_USERNAME']}.t.me`)
        ]
        var votingTime = Number(prop.get(`voting_time_${gameID}`));

        bot.api.sendMessage(chatID, lang_data.string['voting'].replace(`{TIME}`, votingTime), { parse_mode: 'HTML', reply_markup: markup.inlineKeyboard(keyb) });

        var ints = setInterval(() => {
            votingTime--;

            if (votingTime <= 0) {
                clearInterval(ints);
                if (prop.get(`ended_${gameID}`)) return;
                voteCounter(gameID, lang, chatID, bot, prop);
            }
        }, 1000);
        prop.set(`vote_interval_${gameID}`, String(ints));
    })
}

const voteCounter = (gameID: string, lang: string, chatID: string, bot: Bot, prop: Reader): void => {
    helper.language(lang, (error: Error | null, lang_data: any) => {
        if (!prop.get(`votes_${gameID}`)) {
            bot.api.sendMessage(chatID, lang_data.string['no_voter'], { parse_mode: 'HTML' });
            game.initialize(gameID, lang, chatID, bot, prop);
            return;
        }

        const players = prop.get(`players_${gameID}`)?.toString().split(',');
        if (!players || players.length === 0) return;
        const voteCount: { [key: string]: number } = {};

        players.forEach((voterID) => {
            var votedID = prop.get(`vote_${voterID}_${gameID}`);
            if (votedID) { voteCount[String(votedID)] = (voteCount[String(votedID)] || 0) + 1; }
        })

        setTimeout(() => {
            let topVoted: string[] = [];
            let maxVotes = 0;

            for (const id in voteCount) {
                if (voteCount[id] > maxVotes) {
                    maxVotes = voteCount[id];
                    topVoted = [id];
                } else if (voteCount[id] === maxVotes) {
                    topVoted.push(id);
                }
            }

            if (topVoted.length == 1) {
                lynch(topVoted[0], gameID, lang, chatID, bot, prop);
            } else {
                bot.api.sendMessage(chatID, lang_data.string['no_voter'], { parse_mode: 'HTML' });
                game.initialize(gameID, lang, chatID, bot, prop);
                return;
            }
        }, 1000)
    })
}

const lynch = (userID: string, gameID: string, lang: string, chatID: string, bot: Bot, prop: Reader): void => {
    helper.language(lang, (error: Error | null, lang_data: any) => {
        var userLink = String(prop.get(`user_${userID}_${gameID}`));
        bot.api.sendMessage(chatID, lang_data.string['lynch'].replace(`{PLAYER}`, userLink), { parse_mode: 'HTML' });
        var getRole = prop.get(`role_${userID}_${gameID}`);
        var roles = (getRole == 'spy') ? lang_data.string['role_spy'] : lang_data.string['role_civil'];

        setTimeout(() => {
            bot.api.sendMessage(chatID, lang_data.string['lynch_role'].replace(`{PLAYER}`, userLink).replace(`{ROLE}`, roles), { parse_mode: 'HTML' });
            deletePlayer(userID, gameID, prop);
            game.initialize(gameID, lang, chatID, bot, prop);
        }, 1000);
        return;
    })
}

const kick = (userID: any[], gameID: string, lang: string, chatID: string, bot: Bot, prop: Reader): void => {
    helper.language(lang, (error: Error | null, lang_data: any) => {
        if (userID.length == 0) return;
        var p = [];
        for (var i = 0; i < userID.length; i++) {
            var id = userID[i];
            var userLink = String(prop.get(`user_${id}_${gameID}`));
            p.push(userLink);
            deletePlayer(id, gameID, prop);
        }

        bot.api.sendMessage(chatID, lang_data.string['no_answer'].replace(`{PLAYER}`, p.join(', ')), { parse_mode: 'HTML' });
    })
}

const deletePlayer = (userID: string, gameID: string, prop: Reader): void => {
    var getRole = prop.get(`role_${userID}_${gameID}`);
    prop.set(`player_died_${userID}_${gameID}`, 'true');
    prop.read(`joined_${userID}_${gameID}`);
    if (getRole == 'spy') {
        var spyCount = Number(prop.get(`spy_count_${gameID}`));
        var spyTeam = String(prop.get(`spy_team_${gameID}`)).split(',');
        var spy = spyTeam.filter(id => id != userID);
        prop.set(`spy_count_${gameID}`, spyCount - 1);
        prop.set(`spy_team_${gameID}`, spy.join(','));
    } else {
        var civilCount = Number(prop.get(`civil_count_${gameID}`));
        prop.set(`civil_count_${gameID}`, civilCount - 1);
    }
    var player = String(prop.get(`players_${gameID}`)).split(',');
    player = player.filter(id => id != String(userID));
    prop.set(`players_${gameID}`, player.join(','));
}

const spys = (n: number): number => {
    return n == 10 ? 4 :
        n >= 8 ? 3 :
            n >= 5 ? 2 :
                n >= 4 ? 1 : 0;
}

const isSpyWin = (spy: number, civil: number): boolean => {
    if (civil == 0) return true;
    if (spy == 1 && (civil >= 1 && civil <= 2)) return true;
    if (spy == 2 && (civil >= 2 && civil <= 4)) return true;
    if (spy == 3 && (civil >= 5 && civil <= 6)) return true;
    if (spy == 4 && (civil >= 8 && civil <= 10)) return true;
    return false;
}

const deleteProperty = (gameID: string, chatID: string, prop: Reader): void => {
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
}

export default {
    voting,
    voteCounter,
    kick,
    spys,
    isSpyWin,
    deleteProperty
}