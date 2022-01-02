
// import gradeModel from '../models/grade.model.js';



// const gradeService = {
//     findAll() {
//         return gradeModel.find();
//     },
//     findGradesOfAStudent(studentId,classId) {
//         return gradeModel.find({
//             studentId,
//             class:classId
//         });
//     },
//     async findById(gradeId) {
//         return gradeModel.findOne({_id:gradeId});
//     },
//     async findByIdHavingSelect(gradeId,select) {
//         return gradeModel.findOne({_id:gradeId}).select(select);
//     },
//     async add(gradeObj) {
//         const gradeDoc =  new gradeModel(gradeObj);
//         const ret = await gradeDoc.save();
//         return ret;
//     },

//     removeById(gradeId) {
//         return gradeModel.deleteOne({_id:gradeId})
//     },

//     patch(gradeId, newObj) {
//         return gradeModel.updateOne({_id:gradeId},newObj);
//     },
//     patchGeneral(condition, newObj) {
//         return gradeModel.updateOne(condition,newObj);
//     },
//     async addIfNotExistElseUpdate(condition,newInfo) {
//         return gradeModel.findOneAndUpdate(condition,newInfo,{
//             upsert:1
//         })
//     },
    

// }
// export default gradeService;


