import { InlineKeyboardMarkup, InlineKeyboardButton } from "grammy/types";

class MarkupFunction {
    static buildKeyboard(
        buttons: InlineKeyboardButton[][] | InlineKeyboardButton[],
        options: { columns?: number; wrap?: (btn: InlineKeyboardButton, index: number, currentRow: InlineKeyboardButton[]) => boolean }
    ): InlineKeyboardButton[][] {
        const result: InlineKeyboardButton[][] = [];

        if (!Array.isArray(buttons)) {
            return result;
        }

        if (Array.isArray(buttons[0])) {
            return buttons as InlineKeyboardButton[][];
        }

        const wrapFn = options.wrap
            ? options.wrap
            : (_btn: InlineKeyboardButton, _index: number, currentRow: InlineKeyboardButton[]) =>
                  currentRow.length >= (options.columns || 1);

        let currentRow: InlineKeyboardButton[] = [];
        let index = 0;

        for (const btn of buttons as InlineKeyboardButton[]) {
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
    inlineKeyboard(
        buttons: InlineKeyboardButton[] | InlineKeyboardButton[][],
        options: { columns?: number; wrap?: (btn: InlineKeyboardButton, index: number, currentRow: InlineKeyboardButton[]) => boolean } = {}
    ): InlineKeyboardMarkup {
        return {
            inline_keyboard: MarkupFunction.buildKeyboard(buttons, {
                columns: Array.isArray(buttons[0]) ? (buttons as InlineKeyboardButton[][])[0].length : buttons.length,
                ...options
            })
        };
    }
}

class Button {
    text(text: string, data: string): InlineKeyboardButton {
        return { text, callback_data: data };
    }

    url(text: string, url: string): InlineKeyboardButton {
        return { text, url };
    }

    inline(text: string, switch_inline_query_current_chat: string): InlineKeyboardButton {
        return { text, switch_inline_query_current_chat };
    }

    web_app(text: string, url: string): InlineKeyboardButton {
        return { text, web_app: { url } };
    }
}

const markup = new Markup();
const btn = new Button();

export { markup, btn };
