
import classMemberModel from '../models/class-member.model.js';

const classMemberService = {
    findAllClassesByUser(userId) {
        return classMemberModel.find({user:userId}).populate({
            path:"class",
            select:{
                _id: 1,
                name:1,
                description:1,
            },
            populate:{
                path:"createdUser",
                select:{
                    _id:1,
                    name:1,
                }
            }
        }).select({
            _id:1
        })
    },

    async findAMemberInAClass(memberId, classId) {
        return classMemberModel.findOne({user:memberId,class:classId});
    },
    async findAllStudentsInAClass(classId) {
        return classMemberModel.find({
            class:classId, 
            role:"student"
        }).populate({
            path:"user",
            select:{
                _id:1,
                name:1,
            }
        }).select("_id");
    },
    findAllTeachersInAClass(classId) {
        return classMemberModel.find({
            class:classId, 
            role:"teacher"
        }).populate({
            path:"user",
            select:{
                _id:1,
                name:1,
            }
        }).select("_id");
    },
    add(classMemberObj) {
        const classMemberDoc =  new classMemberModel(classMemberObj);
        return classMemberDoc.save();
    },

    // removeById(classMemberId) {
    //     return classMemberModel.deleteOne({_id:classMemberId})
    // },

    // patch(classMemberId, newObj) {
    //     return classMemberModel.updateOne({_id:classMemberId},newObj);
    // }

}
export default classMemberService;


