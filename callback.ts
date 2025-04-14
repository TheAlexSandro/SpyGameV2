import { config } from 'dotenv';
config({ path: '.env' });

import { bot, prop } from './message';
import { Context } from 'grammy';
import helper from './components/helper/helper';
import { markup, btn } from './components/button/inline';
import { InlineKeyboardButton } from 'grammy/types';
import db from './components/database/db';
import flag from './language/flags/flags.json';
import game from './components/game/game';
import handler from './components/game/handler';

bot.on('callback_query', function (ctx: NonNullable<Context>) {
    const cb = ctx.callbackQuery;
    const data = cb?.data;
    const userID = ctx.from?.id;
    const chatID = ctx.chat?.id;
    const keyb: InlineKeyboardButton[][] = [];
    const ids = (ctx.chat?.type == 'private') ? userID!.toString() : chatID!.toString();
    const chatType = (ctx.chat?.type == 'private') ? 'private' : 'group';
    var match: any;

    db.getData(ids, chatType, (error: Error | null, result: any) => {
        if (error) return helper.sendError(error, 'CALLBACK', bot);
        const langCode = result ? result['language_code'] : 'en';

        helper.language(langCode, (err: Error | null, lang_data: any) => {
            if (err) return helper.sendError(err, 'CALLBACK', bot);

            var pola = /game_(.+)_(.+)/i
            if (match = pola.exec(data!)) {
                var act = match[1];
                var gameID = match[2];
                var groupID = String(prop.get(`chat_id_${gameID}`));
                var groupLang = String(prop.get(`game_lang_${gameID}`));

                if (!prop.get(`chat_id_${gameID}`)) return ctx.answerCallbackQuery({ text: lang_data.string['no_game'], show_alert: true });
                if (act == 'start' || act == 'cancel') {
                    var canManageGame = prop.get(`can_manage_game_${gameID}`);
                    if (canManageGame == 'admin') {
                        ctx.getChatMember(Number(userID)).then((result) => {
                            var status = result.status;
                            if (!/(administrator|creator)/i.exec(status)) return ctx.answerCallbackQuery({ text: lang_data.string['manage_denied'].replace(`{ROLE}`, canManageGame), show_alert: true });

                            if (act == 'start') {
                                var players = String(prop.get(`players_${gameID}`)).split(',');
                                if (players.length < Number(process.env['MIN_PLAYERS'])) return ctx.answerCallbackQuery({ text: lang_data.string['insufficient_players'].replace(`{PLAYER}`, process.env['MIN_PLAYERS']), show_alert: true });

                                game.starts('begin', gameID, String(chatID), prop, langCode, bot);
                                return;
                            }

                            if (act == 'cancel') {
                                game.starts('cancel', gameID, String(chatID), prop, langCode, bot);
                                ctx.reply(lang_data.string['game_canceled'], { parse_mode: 'HTML' });
                                return;
                            }
                        })
                        return;
                    }

                    if (canManageGame == 'host' && String(prop.get(`host_${gameID}`)) != String(userID)) {
                        return ctx.answerCallbackQuery({ text: lang_data.string['manage_denied'].replace(`{ROLE}`, canManageGame), show_alert: true });
                    }

                    if (act == 'start') {
                        if (prop.get(`started_${gameID}`)) return ctx.answerCallbackQuery('');
                        prop.set(`started_${gameID}`, 'true');
                        var players = String(prop.get(`players_${gameID}`)).split(',');
                        if (players.length < Number(process.env['MIN_PLAYERS'])) return ctx.answerCallbackQuery({ text: lang_data.string['insufficient_players'].replace(`{PLAYER}`, process.env['MIN_PLAYERS']), show_alert: true });

                        game.starts('begin', gameID, String(chatID), prop, langCode, bot);
                        return;
                    }

                    if (act == 'cancel') {
                        game.starts('cancel', gameID, String(chatID), prop, langCode, bot);
                        ctx.reply(lang_data.string['game_canceled'], { parse_mode: 'HTML' });
                        return;
                    }
                    return;
                }

                if (act == 'leave') {
                    ctx.editMessageText(lang_data.string['leave'], { parse_mode: 'HTML' });
                    prop.read(`joined_${gameID}_${String(userID)}`);
                    var player = String(prop.get(`players_${gameID}`)).split(',');
                    var playerNative = String(prop.get(`players_native_${gameID}`)).split(',');
                    player = player.filter(id => id != String(userID));
                    playerNative = playerNative.filter(id => id != String(userID));
                    prop.read(`user_${String(userID)}_${gameID}`);
                    prop.read(`first_name_${String(userID)}_${gameID}`);
                    prop.set(`players_${gameID}`, player.join(','));
                    prop.set(`players_native_${game}`, playerNative.join(','));

                    var p = '';
                    for (var i = 0; i < player!.length; i++) {
                        var id = player[i];
                        p += `${i + 1}. ${prop.get(`user_${id}_${gameID}`)}\n`
                    }

                    var msgID = prop.get(`message_id_1_${gameID}`);

                    helper.language(groupLang, (e: Error | null, lang_data: any) => {
                        keyb[0] = [
                            btn.url(lang_data.button['join_game'], `https://${process.env['BOT_USERNAME']}.t.me?start=join_${gameID}`)
                        ]
                        keyb[1] = [
                            btn.text(lang_data.button['start_game'], `game_start_${gameID}`),
                            btn.text(lang_data.button['cancel_game'], `game_cancel_${gameID}`)
                        ]

                        bot.api.editMessageText(groupID, Number(msgID), lang_data.string['game'].replace(`{LIST}`, p).replace(`{HOST}`, prop.get(`user_0_${gameID}`)).replace(`{TIME}`, "60").replace(`{PLAYER}`, String(player!.length)), { parse_mode: 'HTML', reply_markup: markup.inlineKeyboard(keyb) });
                    })
                    return;
                }
            }

            var pola = /vote_(.+)_(.+)/i
            if (match = pola.exec(data!)) {
                var pick = match[1];
                var gameID = match[2];
                if (!prop.get(`chat_id_${gameID}`)) return ctx.answerCallbackQuery({ text: lang_data.string['no_game'], show_alert: true });
                if (prop.get(`player_died_${gameID}`)) return ctx.editMessageText(lang_data.string['player_dieds'], { parse_mode: 'HTML' });
                if (!prop.get(`time_vote_${gameID}`)) return ctx.editMessageText(lang_data.string['no_vote_time'], { parse_mode: 'HTML' });
                if (prop.get(`died_${pick}_${gameID}`)) return ctx.answerCallbackQuery({ text: lang_data.string['player_died'], show_alert: true });
                if (prop.get(`has_vote_${userID}_${gameID}`)) return;

                ctx.editMessageText(lang_data.string['have_vote'].replace(`{PLAYER}`, prop.get(`user_${pick}_${gameID}`)), { parse_mode: 'HTML' });
                prop.set(`has_vote_${userID}_${gameID}`, 'true');
                prop.set(`votes_${gameID}`, 'true');
                prop.set(`vote_${String(userID)}_${gameID}`, pick);
                var voteIndex = prop.get(`vote_index_${gameID}`) ?? 0;
                prop.set(`vote_index_${gameID}`, Number(voteIndex) + 1);

                helper.language(String(prop.get(`game_lang_${gameID}`)), (e: Error | null, lang_data: any) => {
                    bot.api.sendMessage(String(prop.get(`chat_id_${gameID}`)), lang_data.string['voting_msg'].replace(`{PLAYER}`, String(prop.get(`user_${userID}_${gameID}`))).replace(`{PICK}`, String(prop.get(`user_${pick}_${gameID}`))), { parse_mode: 'HTML' });
                })

                var getPlayerLen = prop.get(`players_${gameID}`)?.toString().split(',');
                if (Number(prop.get(`vote_index_${gameID}`)) == getPlayerLen.length) {
                    clearInterval(Number(prop.get(`vote_interval_${gameID}`)));
                    setTimeout(() => {
                        handler.voteCounter(gameID, String(prop.get(`game_lang_${gameID}`)), String(prop.get(`chat_id_${gameID}`)), bot, prop);
                    }, 1000)
                }
                return;
            }

            var pola = /start$/i
            if (pola.exec(data!)) {
                helper.getUser(userID!.toString(), bot, (error: Error | null, result: any) => {
                    if (error) return helper.sendError(error, 'CALLBACK', bot);
                    keyb[0] = [
                        btn.url(lang_data.button['start'], `https://${process.env['BOT_USERNAME']}.t.me?startgroup`)
                    ]
                    keyb[1] = [
                        btn.text(lang_data.flag, `lang_menu`),
                        btn.url(lang_data.button['source_code'], process.env['SOURCE_CODE'] as string)
                    ]

                    ctx.editMessageText(lang_data.string['start'].replace(`{NAME}`, result.username ?? result.hyperlink), { parse_mode: 'HTML', reply_markup: markup.inlineKeyboard(keyb) });
                    ctx.answerCallbackQuery('');
                    return;
                })
                return;
            }

            var pola = /lang_(.+)/i
            if (match = pola.exec(data!)) {
                var cbs = match[1];

                if (cbs == 'menu') {
                    var entries = Object.entries(flag);
                    for (let i = 0; i < entries.length; i += 2) {
                        var row: InlineKeyboardButton[] = [];
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
                db.editData(ids, 'language_code', cbs, chatType);
                helper.language(cbs, (er: Error | null, r: any) => {
                    keyb[0] = [
                        btn.text(r.button['return'], 'start')
                    ]
                    ctx.editMessageText(r.string['lang_change'], { parse_mode: 'HTML', reply_markup: markup.inlineKeyboard(keyb) });
                    ctx.answerCallbackQuery('');
                })
                return;
            }
        })
    })
})

export { bot };