import mongoose from "mongoose";


const gradeSchema = new mongoose.Schema({
    studentId:{
        type:String,
        required:true,
    },
    
    class:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"class",
        required:true,
    },
   
    gradeIdentity:{
        type:String,
        required:true,
    },
    point:{
        type:Number,
        required:true,
    },
},
{
    timestamps:true,
}
);

export default gradeSchema;
