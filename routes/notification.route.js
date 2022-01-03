import express from 'express';
import moment from 'moment';

import authMdw from '../middlewares/auth.mdw.js';
import notiService from '../services/notification.service.js';

const router = express.Router();



router.get('/',authMdw.auth, async function (req, res) {
  const raw = await notiService.findByUser(req.userId);
  let ret = [];
  if(raw){
      for (const n of raw) {
          const element = {
              _id: n._id,
              type:n.type,
              classId:n.class,
              requestId:n.request,
              message:n.message,
              byUser:n.byUser,
              createdAt:moment(n.createdAt)
                .zone("+07:00")
                .format('YYYY-MM-DD HH:mm:ss')
          };
          ret.push(element);
      }
  }
  res.status(200).json(ret);
});


export default router;