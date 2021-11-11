
import classModel from '../models/class.model.js';
import classMemberService from './class-member.service.js';


const classService = {
    findAll() {
        return classModel.find();
    },

    async findById(classId) {
        return classModel.findOne({_id:classId});
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


