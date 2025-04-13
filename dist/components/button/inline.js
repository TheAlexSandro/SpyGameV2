"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.btn = exports.markup = void 0;
class MarkupFunction {
    static buildKeyboard(buttons, options) {
        const result = [];
        if (!Array.isArray(buttons)) {
            return result;
        }
        if (Array.isArray(buttons[0])) {
            return buttons;
        }
        const wrapFn = options.wrap
            ? options.wrap
            : (_btn, _index, currentRow) => currentRow.length >= (options.columns || 1);
        let currentRow = [];
        let index = 0;
        for (const btn of buttons) {
            if (wrapFn(btn, index, currentRow) && currentRow.length > 0) {
                result.push(currentRow);
                currentRow = [];
            }
            currentRow.push(btn);
            index++;
        }
        if (currentRow.length > 0) {
            result.push(currentRow);
        }
        return result;
    }
}
class Markup {
    inlineKeyboard(buttons, options = {}) {
        return {
            inline_keyboard: MarkupFunction.buildKeyboard(buttons, {
                columns: Array.isArray(buttons[0]) ? buttons[0].length : buttons.length,
                ...options
            })
        };
    }
}
class Button {
    text(text, data) {
        return { text, callback_data: data };
    }
    url(text, url) {
        return { text, url };
    }
    inline(text, switch_inline_query_current_chat) {
        return { text, switch_inline_query_current_chat };
    }
    web_app(text, url) {
        return { text, web_app: { url } };
    }
}
const markup = new Markup();
exports.markup = markup;
const btn = new Button();
exports.btn = btn;
