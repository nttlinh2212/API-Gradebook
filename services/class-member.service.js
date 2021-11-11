
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
                    firstName:1,
                    lastName:1
                }
            }
        }).select({
            _id:1
        })
    },

    async findAMemberInAClass(memberId, classId) {
        return classMemberModel.findOne({user:memberId,class:classId});
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


