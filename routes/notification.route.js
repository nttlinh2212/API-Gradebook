import express from 'express';
import moment from 'moment';

import authMdw from '../middlewares/auth.mdw.js';
import notiService from '../services/notification.service.js';

const router = express.Router();

router.get('/', authMdw.auth, async function (req, res) {
    let limit = null;
    try {
        limit = +req.query.limit || null;
    } catch (err) {
        res.status(400).json({
            message: 'limit must be number.',
        });
    }

    let retObj = {};
    retObj.notis = await notiService.findByUser(req.userId, limit);
    retObj.numNoSeen = await notiService.countNotSeen(req.userId);
    // let ret = [];
    // if (raw) {
    //     for (const n of raw) {
    //         const element = {
    //             _id: n._id,
    //             type: n.type,
    //             classId: n.class,
    //             requestId: n.request,
    //             message: n.message,
    //             byUser: n.byUser,
    //             createdAt: moment(n.createdAt)
    //                 .zone('+07:00')
    //                 .format('YYYY-MM-DD HH:mm:ss'),
    //         };
    //         ret.push(element);
    //     }
    // }
    res.status(200).json(retObj);
});
router.post('/:id/seen', authMdw.auth, async function (req, res) {
    if (!req.params.id) {
        return res.status(400).json({
            message: 'Invalid id.',
        });
    }
    const noti = await notiService.findById(req.params.id);
    if (!noti) {
        return res.status(404).json({
            message: 'Not found.',
        });
    }
    if (!noti.seen)
        await notiService.patchSeen(req.params.id, { seen: true }, req.userId);
    return res.status(204).end();
});
router.post('/seen', authMdw.auth, async function (req, res) {
    await notiService.patchSeenGeneral(
        { user: req.userId },
        { seen: true },
        req.userId
    );
    return res.status(204).end();
});
export default router;
