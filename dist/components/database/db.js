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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env" });
const mongoose_1 = __importStar(require("mongoose"));
const uri = process.env['MONGODB_URI'];
mongoose_1.default.connect(uri, {
    dbName: 'spygamedb'
});
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});
const userSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    point: { type: String, default: '0' },
    language_code: { type: String, default: 'en' }
});
const groupSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    registration_time: { type: String, default: 60 },
    game_time: { type: String, default: 60 },
    voting_time: { type: String, default: 45 },
    discuss_time: { type: String, default: 60 },
    day: { type: String, default: 5 },
    can_manage_game: { type: String, default: 'host' },
    can_start_registration: { type: String, default: 'all' },
    language_code: { type: String, default: 'en' }
});
const User = mongoose_1.default.model('User', userSchema);
const Group = mongoose_1.default.model('Group', groupSchema);
const addData = (id, chat_type, callback) => {
    getData(id, chat_type, (err, rest) => {
        if (rest)
            return;
        const modelData = (chat_type == 'private') ? new User({ id }) : new Group({ id });
        modelData.save()
            .then(() => callback?.(null, true))
            .catch((err) => callback?.(err.message, null));
    });
};
const getData = (id, chat_type, callback) => {
    const model = (chat_type === 'private' ? User : Group);
    model.findOne({ id })
        .then((result) => {
        if (!result)
            return callback(null, false);
        return callback(null, result);
    })
        .catch((err) => callback(err.message, null));
};
const editData = (id, field, new_value, chat_type, callback) => {
    const model = (chat_type === 'private' ? User : Group);
    model.findOne({ id })
        .then((result) => {
        if (!result)
            return callback?.(null, false);
        if (typeof result[field] === 'undefined')
            return callback?.(null, false);
        result[field] = new_value;
        result.save()
            .then(() => callback?.(null, true));
    })
        .catch((err) => callback?.(err.message, null));
};
exports.default = {
    addData,
    getData,
    editData
};
