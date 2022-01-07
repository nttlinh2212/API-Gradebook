import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        content: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);
const requestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'class',
            required: true,
        },
        gradeIdentity: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        curGrade: {
            type: Number,
            //required:true,
            default: null,
        },
        expectedGrade: {
            type: Number,
            required: true,
        },
        finalGrade: {
            type: Number,
            required: false,
        },
        explanation: {
            type: String,
            required: false,
        },

        status: {
            type: String,
            enum: ['open', 'close'],
            default: 'open',
        },
        comments: {
            type: Array,
            of: commentSchema,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default requestSchema;
