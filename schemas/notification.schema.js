import mongoose from 'mongoose';

const notiSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'class',
            required: false,
        },
        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'request',
            required: false,
        },
        type: {
            type: String,
            enum: ['finalize', 'reply', 'decision', 'request'],
        },
        message: {
            type: String,
            required: true,
        },
        byUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        seen: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export default notiSchema;
