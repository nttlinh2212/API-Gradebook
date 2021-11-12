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
},
{
    timestamps:true,
}
);

export default userSchema;
