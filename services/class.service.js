
import classModel from '../models/class.model.js';
import userModel from '../models/user.model.js';
import classMemberService from './class-member.service.js';
import gradeService from './grade.service.js';
import userService from './user.service.js';


const classService = {
    findAll() {
        return classModel.find();
    },
    async findAllHavingSelect() {
        let ret = [];
        const listClasses = await classModel.find().populate(
            {
                path:"createdUser",
                select:{name:1,_id:1}
            });
        for (const c of listClasses) {
            const students = await classMemberService.findAllStudentsInAClass(c._id);
            const numOfStudents = students.length;
            const teachers = await classMemberService.findAllTeachersInAClass(c._id);
            const numOfTeachers = teachers.length;
            const obj = {
                _id:c._id,
                "name":c.name,
                "status":c.status,
                createdUser: c.createdUser,
                numOfStudents,
                numOfTeachers,
            }
            ret.push(obj);
        }
        return ret;
        
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
    async findByCode(code) {
        return classModel.findOne({key:code});
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
    update(condition,updatedObj){
        return classModel.update(condition,updatedObj);
    },
    patch(classId, newObj) {
        return classModel.updateOne({_id:classId},newObj);
    },
    patchGeneral(condition, newObj) {
        return classModel.updateOne(condition,newObj);
    },
    async getGradesOfAllStudents(classId){
        const classInfo = await this.findById(classId);
        if(!classInfo)
            return[];
        const listStudents = classInfo.listStudents;
        if(!listStudents)
            return[];
        const gradeStructure = classInfo.gradeStructure;
        //console.log("GradeStructure OBJECT:",gradeStructure);
        let identity_point = new Map();
        let identity_grade = new Map();
        let sample = [];
        let i = 0;
        for (const assign of gradeStructure) {
            const element = {
                name:assign.name,
                identity:assign.identity,
                point:null
            }
            identity_point.set(assign.identity, assign.point);//point la poin of grade structure
            identity_grade.set(assign.identity, i);
            sample.push(element);
            i++;
        }
        let result = [];
        for (const s of listStudents) {
            let newObj = {};
            newObj.studentId=s.studentId
            //-----------------map to account----------------------------
            const rawInfoStudent = await userService.findByStudentId(s.studentId)
            //console.log(rawInfoStudent);
            if(rawInfoStudent)
                newObj.account={
                    _id:rawInfoStudent._id,
                    name:rawInfoStudent.name,
                };
            else
                newObj.account=null;
            // newObj.account={
            //     name:,
            //     _id
            // }
            //-----------------done map to account-----------------------
            let total = 0;
            //let newGrades = [].concat(sample);
            let newGrades = JSON.parse(JSON.stringify(sample))
            //console.log("AFTER CLONE:",newGrades)
            
            const gradesOfAStudent = await gradeService.findGradesOfAStudent(s.studentId,classId);
            //console.log("Grdae of A Student in db:",gradesOfAStudent);
            for (const g of gradesOfAStudent) {
                newGrades[identity_grade.get(g.gradeIdentity)].point = g.point;
                total+=identity_point.get(g.gradeIdentity)*g.point/10;
            }
            //console.log("Student OBJECT:",s);
            //console.log("NEW OBJECT:",newGrades);
            //console.log("TOTAL GRADE:",total);
            newObj.grades = newGrades;
            newObj.total=Math.round(total * 100) / 100;
            result.push(newObj)
            
        }
        
        return result;

    },
    async getGradesOfAtudents(classId,studentId,flag){
        const classInfo = await this.findById(classId);
        if(!classInfo)
            return[];
        const gradeStructure = classInfo.gradeStructure;
        //console.log("GradeStructure OBJECT:",gradeStructure);
        let identity_point = new Map();
        let identity_grade = new Map();
        let sample = [];
        let i = 0;
        for (const assign of gradeStructure) {
            if(flag &&!assign.finalized){
                continue;
            }
            const element = {
                name:assign.name,
                identity:assign.identity,
                point:null,
            }
            if(flag){
                element.pointStructure=assign.point;
            }
            identity_point.set(assign.identity, assign.point);//point la poin of grade structure
            identity_grade.set(assign.identity, i);
            sample.push(element);
            i++;
        }

        
        let newObj = {};
        newObj.studentId=studentId
        //-----------------map to account----------------------------
        const rawInfoStudent = await classMemberService.findInfoStudentByStudentId(studentId,classId)
        //console.log(rawInfoStudent);
        if(rawInfoStudent)
            newObj.account=rawInfoStudent.user;
        else
            newObj.account=null;
        // newObj.account={
        //     name:,
        //     _id
        // }
        //-----------------done map to account-----------------------
        let total = 0;
        //let newGrades = [].concat(sample);
        let newGrades = sample;
        //console.log("AFTER CLONE:",newGrades)
        
        const gradesOfAStudent = await gradeService.findGradesOfAStudent(studentId,classId);
        //console.log("Grdae of A Student in db:",gradesOfAStudent);
        for (const g of gradesOfAStudent) {
            const element = newGrades[identity_grade.get(g.gradeIdentity)]
            if(element){
                element.point = g.point;
                total+=identity_point.get(g.gradeIdentity)*g.point/10;
            }
            
        }
        //console.log("Student OBJECT:",s);
        //console.log("NEW OBJECT:",newGrades);
        //console.log("TOTAL GRADE:",total);
        newObj.grades = newGrades;
        newObj.total=Math.round(total * 100) / 100;
            
            
        
        return newObj;

    }

}
export default classService;


