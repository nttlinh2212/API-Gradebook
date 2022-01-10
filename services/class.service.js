import classModel from '../models/class.model.js';
import userModel from '../models/user.model.js';
import classMemberService from './class-member.service.js';
import gradeService from './grade.service.js';
import userService from './user.service.js';
import moment from 'moment';

const classService = {
    findAll() {
        return classModel.find();
    },
    async findAllHavingSelect(query, sort) {
        let ret = [];
        const listClasses = await classModel
            .find(query)
            .populate({
                path: 'createdUser',
                select: { name: 1, _id: 1 },
            })
            .sort(sort);
        for (const c of listClasses) {
            const numOfStudents = await classMemberService.countAllRoleInAClass(
                c._id,
                'student'
            );
            const numOfTeachers = await classMemberService.countAllRoleInAClass(
                c._id,
                'teacher'
            );
            const obj = {
                _id: c._id,
                name: c.name,
                description: c.description,
                status: c.status,
                createdUser: c.createdUser,
                key: c.key,
                numOfStudents,
                //students:students,
                numOfTeachers,
                //teachers:teachers,
                createdAt: moment(c.createdAt)
                    .zone('+07:00')
                    .format('YYYY-MM-DD HH:mm:ss'),
            };
            ret.push(obj);
        }
        return ret;
    },
    findOneGrade(classId, identity) {
        return classModel.findOne({
            _id: classId,
            gradeStructure: { $elemMatch: { identity } },
        });
    },
    findOneGradeFinalize(classId, identity) {
        return classModel.findOne(
            {
                _id: classId,
                'gradeStructure.identity': identity,
                'gradeStructure.finalized': true,
            },
            {
                _id: 0,
                gradeStructure: { $elemMatch: { identity, finalized: true } },
            }
        );
    },
    // findDetailOneGrade(classId,identity){
    //     return classModel.findOne({
    //         _id:classId,
    //         'gradeStructure.identity': identity
    //     },{"gradeStructure.$":1})

    // },
    async findById(classId) {
        return classModel.findOne({ _id: classId });
    },
    async findByCode(code) {
        return classModel.findOne({ key: code });
    },
    async findByIdHavingSelect(classId, select) {
        return classModel.findOne({ _id: classId }).select(select);
    },
    async findStudentIdInListStudents(classId, studentId) {
        //User.findOne({'local.rooms': {$elemMatch: {name: req.body.username}}}
        return classModel.findOne({
            _id: classId,
            listStudents: { $elemMatch: { studentId } },
        });
    },
    async isCorrectKey(classId, key) {
        return classModel.findOne({ _id: classId, key });
    },
    async findClassInfoById(classId) {
        return classModel.findOne({ _id: classId }).populate({
            path: 'createdUser',
            select: { name: 1, _id: 1 },
        });
        // .select({
        //     createdAt: 0,
        //     updatedAt: 0,
        //     __v:0
        // });
    },
    async findDetailClassInfoByIdWithRole(classId, role) {
        const classObj = await this.findClassInfoById(classId);
        if (!classObj) return null;
        if (role === 'student') {
            return {
                _id: classObj._id,
                name: classObj.name,
                description: classObj.description,
                createdUser: classObj.createdUser,
                role,
            };
        }
        return {
            _id: classObj._id,
            name: classObj.name,
            description: classObj.description,
            createdUser: classObj.createdUser,
            role,
            key: classObj.key,
        };
    },
    async add(classObj) {
        const classDoc = new classModel(classObj);

        const ret = await classDoc.save();
        if (
            !(await classMemberService.add({
                user: classObj.createdUser,
                role: 'teacher',
                class: ret._id,
            }))
        )
            throw new Error('Can not add in collection classMember');
        return ret;
    },
    async addIfNotExistElseUpdate(condition, newInfo) {
        return classModel.findOneAndUpdate(condition, newInfo, {
            upsert: 1,
        });
    },

    removeById(classId) {
        return classModel.deleteOne({ _id: classId });
    },
    update(condition, updatedObj) {
        return classModel.update(condition, updatedObj);
    },
    patch(classId, newObj) {
        return classModel.updateOne({ _id: classId }, newObj);
    },
    patchGeneral(condition, newObj) {
        return classModel.updateOne(condition, newObj);
    },
    async getGradesOfAllStudents(classId) {
        const classInfo = await this.findById(classId);
        if (!classInfo) return [];
        const listStudents = classInfo.listStudents;
        if (!listStudents) return [];
        const gradeStructure = classInfo.gradeStructure;
        //console.log("GradeStructure OBJECT:",gradeStructure);
        let identity_point = new Map();
        let identity_grade = new Map();
        let sample = [];
        let i = 0;
        for (const assign of gradeStructure) {
            let element = {};
            if (assign.finalized) {
                element = {
                    name: assign.name,
                    identity: assign.identity,
                    finalized: assign.finalized,
                    point: 0,
                };
            } else {
                element = {
                    name: assign.name,
                    identity: assign.identity,
                    finalized: assign.finalized,
                    point: null,
                };
            }
            identity_point.set(assign.identity, assign.point); //point la poin of grade structure
            identity_grade.set(assign.identity, i);
            sample.push(element);
            i++;
        }
        let result = [];
        for (const s of listStudents) {
            let newObj = {};
            newObj.studentId = s.studentId;
            //-----------------map to account----------------------------
            const rawInfoStudent = await userService.findByStudentId(
                s.studentId
            );
            //console.log(rawInfoStudent);
            if (rawInfoStudent) {
                if (
                    await classMemberService.findARoleInAClass(
                        rawInfoStudent._id,
                        classId,
                        'student'
                    )
                ) {
                    newObj.account = {
                        _id: rawInfoStudent._id,
                        name: rawInfoStudent.name,
                    };
                } else newObj.account = null;
            } else newObj.account = null;
            // newObj.account={
            //     name:,
            //     _id
            // }
            //-----------------done map to account-----------------------
            let total = 0;
            //let newGrades = [].concat(sample);
            let newGrades = JSON.parse(JSON.stringify(sample));
            //console.log("AFTER CLONE:",newGrades)

            const gradesOfAStudent = await gradeService.findGradesOfAStudent(
                s.studentId,
                classId
            );
            //console.log("Grdae of A Student in db:",gradesOfAStudent);
            //console.log(identity_grade);
            //console.log(newGrades);
            for (const g of gradesOfAStudent) {
                if (g.point === null) continue;
                const exist = identity_grade.get(g.gradeIdentity);
                if (exist === null || exist === undefined) {
                    continue;
                }

                //console.log(identity_grade.get(g.gradeIdentity));
                newGrades[identity_grade.get(g.gradeIdentity)].point = g.point;
                total += (identity_point.get(g.gradeIdentity) * g.point) / 10;
            }
            //console.log("Student OBJECT:",s);
            //console.log("NEW OBJECT:",newGrades);
            //console.log("TOTAL GRADE:",total);
            newObj.grades = newGrades;
            newObj.total = Math.round(total * 100) / 100;
            result.push(newObj);
        }

        return result;
    },
    async getGradesOfAtudents(classId, studentId, flag) {
        const classInfo = await this.findById(classId);
        if (!classInfo) return [];
        const gradeStructure = classInfo.gradeStructure;
        //console.log("GradeStructure OBJECT:",gradeStructure);
        let identity_point = new Map();
        let identity_grade = new Map();
        let sample = [];
        let i = 0;
        for (const assign of gradeStructure) {
            // if(flag &&!assign.finalized){
            //     continue;
            // }
            //console.log("Assgine",assign)
            let element = {};
            if (assign.finalized) {
                element = {
                    name: assign.name,
                    identity: assign.identity,
                    finalized: assign.finalized,
                    point: 0,
                };
            } else {
                element = {
                    name: assign.name,
                    identity: assign.identity,
                    finalized: assign.finalized,
                    point: null,
                };
            }
            //console.log("element",element)
            if (flag) {
                element.pointStructure = assign.point;
            }
            identity_point.set(assign.identity, assign.point); //point la poin of grade structure
            identity_grade.set(assign.identity, i);
            sample.push(element);
            i++;
        }

        let newObj = {};
        newObj.studentId = studentId;
        //-----------------map to account----------------------------
        const rawInfoStudent =
            await classMemberService.findInfoStudentByStudentId(
                studentId,
                classId
            );
        //console.log("Raw info student:",rawInfoStudent, studentId, classId)
        //console.log(rawInfoStudent);
        if (rawInfoStudent) newObj.account = rawInfoStudent.user;
        else newObj.account = null;
        // newObj.account={
        //     name:,
        //     _id
        // }
        //-----------------done map to account-----------------------
        let total = 0;
        //let newGrades = [].concat(sample);
        let newGrades = sample;
        //console.log("AFTER CLONE:",newGrades)

        const gradesOfAStudent = await gradeService.findGradesOfAStudent(
            studentId,
            classId
        );
        //console.log("Grdae of A Student in db:",gradesOfAStudent);
        for (const g of gradesOfAStudent) {
            if (g.point === null) continue;
            const exist = identity_grade.get(g.gradeIdentity);
            if (exist === null || exist === undefined) {
                continue;
            }
            let element = newGrades[exist];
            if (element) {
                if (flag && !element.finalized) {
                    //la student va chua finalize -> null
                    element.point = null;
                } else {
                    //la student va diem da finalize || giao vien
                    //console.log(g.point);
                    element.point = g.point;
                    total +=
                        (identity_point.get(g.gradeIdentity) * g.point) / 10;
                }
            }
        }
        //console.log("Student OBJECT:",s);
        //console.log("NEW OBJECT:",newGrades);
        //console.log("TOTAL GRADE:",total);
        newObj.grades = newGrades;
        newObj.total = Math.round(total * 100) / 100;

        return newObj;
    },
};
export default classService;
