import notiModel from '../models/notification.model.js';

const notiService = {
    findAll() {
        return notiModel.find();
    },
    async findById(notiId) {
        return notiModel.findOne({ _id: notiId });
    },
    async findByIdHavingSelect(notiId, select) {
        return notiModel.findOne({ _id: notiId }).select(select);
    },
    async findByUser(userId, limit) {
        if (!limit) {
            return notiModel
                .find({ user: userId })
                .populate({
                    path: 'byUser',
                    select: {
                        _id: 1,
                        name: 1,
                    },
                })
                .sort({ createdAt: -1 });
        }
        return notiModel
            .find({ user: userId })
            .populate({
                path: 'byUser',
                select: {
                    _id: 1,
                    name: 1,
                },
            })
            .sort({ createdAt: -1 })
            .limit(limit);
    },
    async addNewFinalize(userId, classId, className, byUserId) {
        const notiDoc = new notiModel({
            user: userId,
            type: 'finalize',
            message: `The teacher posted new grade in class ${className}`,
            class: classId,
            byUser: byUserId,
        });
        const ret = await notiDoc.save();
        return ret;
    },
    async addNewReply(userId, userName, requestId, byUserId) {
        const notiDoc = new notiModel({
            user: userId,
            type: 'reply',
            message: `Teacher ${userName} commented in your request review`,
            request: requestId,
            byUser: byUserId,
        });
        const ret = await notiDoc.save();
        return ret;
    },
    async addNewDecision(userId, username, requestId, byUserId) {
        const notiDoc = new notiModel({
            user: userId,
            type: 'decision',
            message: `Your request review is closed by teacher ${username}. See your final mark`,
            request: requestId,
            byUser: byUserId,
        });
        const ret = await notiDoc.save();
        return ret;
    },
    async addNewRequest(userId, className, requestId, byUserId) {
        const notiDoc = new notiModel({
            user: userId,
            type: 'request',
            message: `You have a request review in class ${className}`,
            request: requestId,
            byUser: byUserId,
        });
        const ret = await notiDoc.save();
        return ret;
    },
    async add(notiObj) {
        const notiDoc = new notiModel(notiObj);
        const ret = await notiDoc.save();
        return ret;
    },

    removeById(notiId) {
        return notiModel.deleteOne({ _id: notiId });
    },

    patch(notiId, newObj) {
        return notiModel.updateOne({ _id: notiId }, newObj);
    },
    patchGeneral(condition, newObj) {
        return notiModel.updateOne(condition, newObj);
    },
    async addIfNotExistElseUpdate(condition, newInfo) {
        return notiModel.findOneAndUpdate(condition, newInfo, {
            upsert: 1,
        });
    },
};
export default notiService;
