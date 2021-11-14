import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    createdUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    key:{
        type:String,
    },
},
{
    timestamps:true,
}
);

export default classSchema;
