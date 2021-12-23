import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    password:{
        type:String,
    },
    email: {
        type:String,
        required:true,
        unique:true,
        validate: function (email) {
            var reg = /\S+@\S+\.\S+/;
            if (!reg.test(email)){
                throw new Error(`${email} is invalid`);
            }
            return true;
        },
    },
    googleId: String,
    firstName: String,
    lastName: String,
    name:String,
    rfToken: String,
    role:{
        type:String,
        enum:["member","admin"],
        default:"member"
    },
    studentId:{
        type:String,
        default:null
    },  
    status:{
        type:String,
        enum:["disable","enable"],
        default:"enable"
    },   
},
{
    timestamps:true,
}
);

export default userSchema;
