import express from 'express';
import { readFile } from 'fs/promises';

import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
import classMemberService from '../services/class-member.service.js';
import authMdw from '../middlewares/auth.mdw.js';
import userService from '../services/user.service.js';

const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/class.json', import.meta.url)));

router.get('/',authMdw.auth, async function (req, res) {
  console.log('ROOT ROUTER: ');
  const list = await classMemberService.findAllClassesByUser(req.accessTokenPayload.userId);
  res.json(list);
});

router.post('/',authMdw.auth, validate(schema), async function (req, res) {
  console.log('ROOT ROUTER: ', req.body);
  req.body.createdUser=req.accessTokenPayload.userId;
  const ret = await classService.add(req.body);
  const classObj = {
    _id: ret._id,
    ...req.body
  }
  res.status(201).json(classObj);
});
router.get('/profile',authMdw.auth, async function (req, res) {
  const user = await userService.findByIdSelected(req.accessTokenPayload.userId)
  res.status(201).json(user);
});
// router.delete('/:id', async function (req, res) {
//   const id = req.params.id || 0;
//   const n = await classService.del(id);
//   res.json({
//     affected: n
//   });
// });

// router.patch('/:id', async function (req, res) {
//   const id = req.params.id || 0;
//   let classObj = req.body;
//   const n = await classService.patch(id, classObj);
//   res.json({
//     affected: n
//   });
// });

export default router;