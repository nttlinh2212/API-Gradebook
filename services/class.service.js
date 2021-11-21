
import classModel from '../models/class.model.js';
import classMemberService from './class-member.service.js';


const classService = {
    findAll() {
        return classModel.find();
    },

    async findById(classId) {
        return classModel.findOne({_id:classId});
    },
    async findByIdHavingSelect(classId,select) {
        return classModel.findOne({_id:classId}).select(select);
    },
    async isCorrectKey(classId,key) {
        return classModel.findOne({_id:classId, key});
    },
    async findClassInfoById(classId) {
        return classModel.findOne({_id:classId}).populate(
            {
                path:"createdUser",
                select:{name:1,_id:1}
            })
            // .select({
            //     createdAt: 0,
            //     updatedAt: 0,
            //     __v:0
            // });
    },
    async add(classObj) {
        const classDoc =  new classModel(classObj);
        
        const ret = await classDoc.save();
        if(!await classMemberService.add({user:classObj.createdUser, role: "teacher",class:ret._id}))
            throw new Error("Can not add in collection classMember");
        return ret;
    },

    removeById(classId) {
        return classModel.deleteOne({_id:classId})
    },

    patch(classId, newObj) {
        return classModel.updateOne({_id:classId},newObj);
    }

}
export default classService;


