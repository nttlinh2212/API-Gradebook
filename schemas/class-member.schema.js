import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    class:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"class",
        required:true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    role:{
        type:String,
        default:'student',
        enum:['student','teacher'],
    },
    studentId:{
        type:String,
    },
    grade:{
        type:Object
    },
    
},
{
    timestamps:true,
}
);

export default classSchema;
