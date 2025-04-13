import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const uri = process.env['MONGODB_URI'] as string;
mongoose.connect(uri, {
    dbName: 'spygamedb'
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});

const userSchema = new Schema({
    id: { type: String, required: true },
    point: { type: String, default: '0' },
    language_code: { type: String, default: 'en' }
});

const groupSchema = new Schema({
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

type User = InferSchemaType<typeof userSchema>;
const User: Model<User> = mongoose.model<User>('User', userSchema);

type Group = InferSchemaType<typeof groupSchema>;
const Group: Model<Group> = mongoose.model<Group>('Group', groupSchema);

type ChatType = 'private' | 'group';
const addData = (id: string, chat_type: ChatType, callback?: (error: Error | null, result: any) => void): void => {
    getData(id, chat_type, (err: Error | null, rest: any) => {
        if (rest) return;
        const modelData = (chat_type == 'private') ? new User({ id }) : new Group({ id });

        modelData.save()
            .then(() => callback?.(null, true))
            .catch((err) => callback?.(err.message, null));
    })
}

const getData = (id: string, chat_type: ChatType, callback: (error: Error | null, result: any) => void): void => {
    const model = (chat_type === 'private' ? User : Group) as mongoose.Model<User | Group>;

    model.findOne({ id })
        .then((result) => {
            if (!result) return callback(null, false);
            return callback(null, result);
        })
        .catch((err) => callback(err.message, null));
}

const editData = (id: string, field: string, new_value: any, chat_type: ChatType, callback?: (error: Error | null, result: any) => void): void => {
    const model = (chat_type === 'private' ? User : Group) as mongoose.Model<User | Group>;

    model.findOne({ id })
        .then((result) => {
            if (!result) return callback?.(null, false);
            if (typeof (result as any)[field] === 'undefined') return callback?.(null, false);
            (result as any)[field] = new_value;

            result.save()
                .then(() => callback?.(null, true));
        })
        .catch((err) => callback?.(err.message, null));
}

export default {
    addData,
    getData,
    editData
}