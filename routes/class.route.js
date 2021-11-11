import express from 'express';
import { readFile } from 'fs/promises';

import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
import classMemberService from '../services/class-member.service.js';

const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/class.json', import.meta.url)));

router.get('/', async function (req, res) {
  console.log('CLASS ROUTER: ', req.accessTokenPayload);
  const list = await classMemberService.findAllClassesByUser(req.accessTokenPayload.userId);
  res.json(list);
});

router.get('/:id', async function (req, res) {
  const id = req.params.id || 0;
  const classObj = await classService.findById(id);
  if (classObj === null) {
    return res.status(204).end();
  }
  res.json(classObj);
});

router.post('/', validate(schema), async function (req, res) {
  console.log('CLASS ROUTER: ', req.accessTokenPayload, req.body);
  req.body.createdUser=req.accessTokenPayload.userId;
  const ret = await classService.add(req.body);
  const classObj = {
    _id: ret._id,
    ...req.body
  }
  res.status(201).json(classObj);
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