
import userModel from '../models/user.model.js';

const userService = {
    async findByEmail(email) {
        return userModel.findOne({email});
    },
      
    async isValidRefreshToken (userId, refreshToken) {
        return userModel.findOne({_id:userId, rfToken:refreshToken});
    },
    findAll() {
        return userModel.find();
    },
   
    async findById(userId) {
        return userModel.findOne({_id:userId});
    },
    async findByIdSelected(userId) {
        return userModel.findOne({_id:userId}).select({
            _id:1,
            email:1,
            firstName:1,
            lastName:1
        });
    },
    add(userObj) {
        userObj.name = userObj.firstName+" "+userObj.lastName;
        const user =  new userModel(userObj);
        return user.save();
    },

    removeById(userId) {
        return userModel.deleteOne({_id:userId})
    },

    patch(userId, newObj) {
        return userModel.updateOne({_id:userId},newObj);
    }

}
export default userService;


