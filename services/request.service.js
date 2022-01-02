

import requestModel from '../models/request.model.js';
import classMemberService from './class-member.service.js';
import classService from './class.service.js';
import gradeService from './grade.service.js';
import userService from './user.service.js';



const requestService = {
    findAll() {
        return requestModel.find();
    },
    async findRequestsOfAStudent(userId) {
        let list =  await requestModel.find({
            user:userId
        }).sort({ createdAt: -1 })
        .populate({
            path:"class",
            select:{
                _id: 1,
                name:1
            }
        }).select({
            _id:1,
            gradeIdentity:1,
            curGrade:1,
            expectedGrade:1,
            explanation:1,
            finalGrade:1,
            "status":1,
            "createdAt":1
        });
        for (let i = 0;i< list.length;i++) {
            const gradeComp = await classService.findOneGrade(list[i].class._id,list[i].gradeIdentity);
            req.gradeComposition = gradeComp;
            req.createdAt = moment(list[i].createdAt)
                .zone("+07:00")
                .format('YYYY-MM-DD HH:mm:ss');
        }
        return list;
    },
    async findRequestsOfATeacher(userId) {
        //find all classes user joining as role teacher
        const raw = await classMemberService.findAllClasses(userId,"teacher");
        let classes = [];
        for (const c of raw) {
            classes.push({class:c.class});
        }
        let list =  await requestModel.find({ 
            $or:classes
        }).sort({ createdAt: -1 })
        .populate({
            path:"class",
            select:{
                _id: 1,
                name:1
            }
        },
        {
            path:"student",
            select:{
                _id: 1,
                name:1,
                studentId:1
            }
        }).select({
            _id:1,
            gradeIdentity:1,
            curGrade:1,
            expectedGrade:1,
            explanation:1,
            finalGrade:1,
            "status":1,
            "createdAt":1
        });
        for (let i = 0;i< list.length;i++) {
            const gradeComp = await classService.findOneGrade(list[i].class._id,list[i].gradeIdentity);
            req.gradeComposition = gradeComp;
            req.createdAt = moment(list[i].createdAt)
                .zone("+07:00")
                .format('YYYY-MM-DD HH:mm:ss');
        }
        return list;
    },
    async findById(requestId) {
        return requestModel.findOne({_id:requestId});
    },
    async findDetailById(requestId) {
       
        let ret =  await requestModel.findOne({ 
            _id:requestId
        })
        .populate({
            path:"class",
            select:{
                _id: 1,
                name:1
            }
        },
        {
            path:"student",
            select:{
                _id: 1,
                name:1,
                studentId:1
            }
        }).select({
            _id:1,
            gradeIdentity:1,
            curGrade:1,
            expectedGrade:1,
            explanation:1,
            finalGrade:1,
            "status":1,
            "createdAt":1
        });
        const gradeComp = await classService.findOneGrade(list[i].class._id,list[i].gradeIdentity);
        ret.gradeComposition = gradeComp;
        ret.createdAt = moment(let.createdAt)
            .zone("+07:00")
            .format('YYYY-MM-DD HH:mm:ss');
        
        return ret;
    },
    async findCommentsOfAReq(requestId) {
        return requestModel.findOne({_id:requestId}).select({
            comments:1
        }.sort({ "comments.createdAt": 1 }));
    },
    async findByIdHavingSelect(requestId,select) {
        return requestModel.findOne({_id:requestId}).select(select);
    },
    async add(reqObj) {
        const studentId = (await userService.findById(reqObj.student)).studentId;
        const curGrade = await gradeService.findStudentComposition(studentId,reqObj.gradeIdentity)
        reqObj.curGrade = curGrade;
        const reqDoc =  new requestModel(reqObj);
        const ret = await reqDoc.save();
        return ret;
    },
    async addNewComment(requestId,commentObj) {
       let ret;
        await requestModel.update(
            { _id: requestId }, 
            { $push: { comments: commentObj } },
            ret
        );
        return ret;
    },

    removeById(requestId) {
        return requestModel.deleteOne({_id:requestId})
    },

    patch(requestId, newObj) {
        return requestModel.updateOne({_id:requestId},newObj);
    },
    patchGeneral(condition, newObj) {
        return requestModel.updateOne(condition,newObj);
    },
    async addIfNotExistElseUpdate(condition,newInfo) {
        return requestModel.findOneAndUpdate(condition,newInfo,{
            upsert:1
        })
    },
    

}
export default requestService;


