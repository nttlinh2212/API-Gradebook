import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
    },
    point:{
        type: Number,
        required:true,
    }
});
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
    gradeStructure:{
        type: Array,
        of: assignmentSchema,
    }
},
{
    timestamps:true,
}
);

export default classSchema;
