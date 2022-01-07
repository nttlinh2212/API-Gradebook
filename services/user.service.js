import userModel from '../models/user.model.js';
import moment from 'moment';

const userService = {
    async findByEmail(email) {
        if (!email) return null;
        return await userModel.findOne({ email });
    },
    findByFbId(id) {
        return userModel.findOne({ facebookId: id });
    },
    async findByStudentId(studentId) {
        return userModel.findOne({ studentId });
    },
    async isValidRefreshToken(userId, refreshToken) {
        return userModel.findOne({ _id: userId, rfToken: refreshToken });
    },
    findAll() {
        return userModel.find();
    },
    async findAllHavingSelect(obj, flag, sort) {
        let ret = [];
        if (flag)
            ret = await userModel
                .find(obj)
                .select({
                    _id: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    name: 1,
                    studentId: 1,
                    role: 1,
                    status: 1,
                    createdAt: 1,
                })
                .sort(sort);
        else
            ret = await userModel
                .find(obj)
                .select({
                    _id: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    name: 1,
                    role: 1,
                    status: 1,
                    createdAt: 1,
                })
                .sort(sort);
        ret = JSON.parse(JSON.stringify(ret));
        for (const user of ret) {
            user.createdAt = moment(user.createdAt)
                .zone('+07:00')
                .format('YYYY-MM-DD HH:mm:ss');
        }
        return ret;
    },
    async findById(userId) {
        return userModel.findOne({ _id: userId });
    },
    async findByIdSelected(userId) {
        return userModel.findOne({ _id: userId }).select({
            _id: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
        });
    },
    add(userObj) {
        userObj.name = userObj.firstName + ' ' + userObj.lastName;
        const user = new userModel(userObj);
        return user.save();
    },

    removeById(userId) {
        return userModel.deleteOne({ _id: userId });
    },

    patch(userId, newObj) {
        return userModel.updateOne({ _id: userId }, newObj);
    },
};
export default userService;
