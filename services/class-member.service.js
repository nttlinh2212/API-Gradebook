import classMemberModel from '../models/class-member.model.js';
import userService from './user.service.js';

const classMemberService = {
    findAllClassesByUser(userId) {
        return classMemberModel
            .find({ user: userId })
            .populate({
                path: 'class',
                select: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    status: 1,
                },
                populate: {
                    path: 'createdUser',
                    select: {
                        _id: 1,
                        name: 1,
                    },
                },
            })
            .select({
                _id: 1,
            });
    },
    findAllClasses(userId, role) {
        return classMemberModel
            .find({
                user: userId,
                role,
            })
            .select('class');
    },
    // findStudentIdInAClass(studentId,classId){
    //     return classMemberModel.findOne({
    //         class:classId,
    //         role:"student",
    //         studentId
    //     });
    // },
    async findInfoStudentByStudentId(studentId, classId) {
        const user = await userService.findByStudentId(studentId);
        if (!user) return null;
        return classMemberModel
            .findOne({
                class: classId,
                role: 'student',
                user: user._id,
            })
            .populate({
                path: 'user',
                select: {
                    _id: 1,
                    name: 1,
                },
            })
            .select('_id');
    },
    async findAMemberInAClass(memberId, classId) {
        return classMemberModel.findOne({ user: memberId, class: classId });
    },
    async findARoleInAClass(memberId, classId, role) {
        return classMemberModel.findOne({
            user: memberId,
            class: classId,
            role,
        });
    },
    async findAllStudentsInAClass(classId) {
        return classMemberModel
            .find({
                class: classId,
                role: 'student',
            })
            .populate({
                path: 'user',
                select: {
                    _id: 1,
                    name: 1,
                    studentId: 1,
                },
            })
            .select({
                _id: 1
            });
    },
    findAllTeachersInAClass(classId) {
        return classMemberModel
            .find({
                class: classId,
                role: 'teacher',
            })
            .populate({
                path: 'user',
                select: {
                    _id: 1,
                    name: 1,
                },
            })
            .select('_id');
    },
    add(classMemberObj) {
        const classMemberDoc = new classMemberModel(classMemberObj);
        return classMemberDoc.save();
    },

    // removeById(classMemberId) {
    //     return classMemberModel.deleteOne({_id:classMemberId})
    // },

    patch(classMemberId, newObj) {
        return classMemberModel.updateOne({ _id: classMemberId }, newObj);
    },
    delete(classId) {
        return classMemberModel.update(
            { class: classId },
            { $unset: { studentId: 1 } }
        );
    },
};
export default classMemberService;
