

import moment from 'moment';
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
            student:userId
        })
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
        }).sort({ createdAt: -1 });
        //console.log(list);
        let ret = [];
        for (let i = 0;i< list.length;i++) {
            const gradeComp = await classService.findOneGradeFinalize(list[i].class._id,list[i].gradeIdentity);
            let element = {
                _id:list[i]._id,
                class:list[i].class,
                curGrade:list[i].curGrade,
                expectedGrade:list[i].expectedGrade,
                explanation:list[i].explanation,
                status:list[i].status,
                finalGrade:list[i].finalGrade||null,
                createdAt : moment(list[i].createdAt)
                .zone("+07:00")
                .format('YYYY-MM-DD HH:mm:ss')
            }
            element.gradeComposition = {
                identity: gradeComp.gradeStructure[0].identity,
                name: gradeComp.gradeStructure[0].name,
            };
            ret.push(element)
            
        }
        return ret;
    },
    async findRequestsOfATeacher(userId) {
        //find all classes user joining as role teacher
        const raw = await classMemberService.findAllClasses(userId,"teacher");
        let classes = [];
        for (const c of raw) {
            classes.push({class:c.class});
        }
        if(!classes||classes.length === 0){
            throw new Error({message:"You do not receive any request!"})
        }
        //console.log("Classes",classes)
        let list =  await requestModel.find({ 
            $or:classes
        }).sort({ createdAt: -1 })
        .populate({
            path:"class",
            select:{
                _id: 1,
                name:1
            }
        })
        .populate({
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
        let ret = [];
        for (let i = 0;i< list.length;i++) {
            const gradeComp = await classService.findOneGradeFinalize(list[i].class._id,list[i].gradeIdentity);
            let element = {
                _id:list[i]._id,
                class:list[i].class,
                student:list[i].student,
                curGrade:list[i].curGrade,
                expectedGrade:list[i].expectedGrade,
                explanation:list[i].explanation,
                status:list[i].status,
                finalGrade:list[i].finalGrade||null,
                createdAt : moment(list[i].createdAt)
                .zone("+07:00")
                .format('YYYY-MM-DD HH:mm:ss')
            }
            element.gradeComposition = {
                identity: gradeComp.gradeStructure[0].identity,
                name: gradeComp.gradeStructure[0].name,
            };
            ret.push(element)
            
        }
        return ret;
    },
    async findById(requestId) {
        return requestModel.findOne({_id:requestId});
    },
    async findBy(obj) {
        return requestModel.findOne(obj);
    },
    async findDetailById(requestId) {
       
        let raw =  await requestModel.findOne({ 
            _id:requestId
        })
        .populate({
            path:"class",
            select:{
                _id: 1,
                name:1
            }
        }).populate({
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
        const gradeComp = await classService.findOneGradeFinalize(raw.class._id,raw.gradeIdentity);
        let ret = {
            _id:raw._id,
            class:raw.class,
            student:raw.student,
            curGrade:raw.curGrade,
            expectedGrade:raw.expectedGrade,
            explanation:raw.explanation,
            status:raw.status,
            finalGrade:raw.finalGrade||null,
            createdAt : moment(raw.createdAt)
            .zone("+07:00")
            .format('YYYY-MM-DD HH:mm:ss')
        }
        ret.gradeComposition = {
            identity: gradeComp.gradeStructure[0].identity,
            name: gradeComp.gradeStructure[0].name,
        };
        return ret;
    },
    async findCommentsOfAReq(requestId) {
        return requestModel.findOne({_id:requestId}).populate({
            path:"comments.user",
            select:{
                _id: 1,
                name:1,
            }
        }).select({
            comments:1
        }).sort({ "comments.createdAt": 1 });
    },
    async findByIdHavingSelect(requestId,select) {
        return requestModel.findOne({_id:requestId}).select(select);
    },
    async add(reqObj) {
        const studentId = (await userService.findById(reqObj.student)).studentId;
        const composition = await gradeService.findStudentComposition(studentId,reqObj.gradeIdentity);
        const curGrade = composition ?composition.point:null;
        reqObj.curGrade = curGrade;
        //console.log(reqObj);
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
        return {message:"Commented successfully"};
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


