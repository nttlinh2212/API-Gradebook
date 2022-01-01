
import requestModel from '../models/request.model.js';



const requestService = {
    findAll() {
        return requestModel.find();
    },
    findRequestsOfAStudent(userId) {
        return requestModel.find({
            user:userId
        }).populate({
            path:"class",
            select:{
                _id: 1,
                name:1
            },
            populate:{
                path:"gradeComposition",
                select:{
                    _id:1,
                    name:1,
                }
            }
        }).select({
            _id:1
        })
    },
    async findById(requestId) {
        return requestModel.findOne({_id:requestId});
    },
    async findByIdHavingSelect(requestId,select) {
        return requestModel.findOne({_id:requestId}).select(select);
    },
    async add(reqObj) {
        const reqDoc =  new requestModel(reqObj);
        const ret = await reqDoc.save();
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


