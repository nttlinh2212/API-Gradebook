
import classModel from '../models/class.model.js';
import classMemberService from './class-member.service.js';


const classService = {
    findAll() {
        return classModel.find();
    },
    findOneGrade(classId,identity){
        return classModel.findOne({
            _id:classId,
            'gradeStructure':{$elemMatch: {identity}}
        
        });
    },
    async findById(classId) {
        return classModel.findOne({_id:classId});
    },
    async findByIdHavingSelect(classId,select) {
        return classModel.findOne({_id:classId}).select(select);
    },
    async findStudentIdInListStudents(classId,studentId) {
        //User.findOne({'local.rooms': {$elemMatch: {name: req.body.username}}}
        return classModel.findOne({
            _id:classId,
            'listStudents':{$elemMatch: {studentId}}
        
        });
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
    async addIfNotExistElseUpdate(condition,newInfo) {
        return classModel.findOneAndUpdate(condition,newInfo,{
            upsert:1
        })
    },

    removeById(classId) {
        return classModel.deleteOne({_id:classId})
    },

    patch(classId, newObj) {
        return classModel.updateOne({_id:classId},newObj);
    },
    patchGeneral(condition, newObj) {
        return classModel.updateOne(condition,newObj);
    }

}
export default classService;


