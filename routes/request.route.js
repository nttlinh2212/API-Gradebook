import express from 'express';

import { readFile } from 'fs/promises';
import validate from '../middlewares/validate.mdw.js';
import authMdw from '../middlewares/auth.mdw.js';
import requestService from '../services/request.service.js';

const router = express.Router();

const commentSchema = JSON.parse(await readFile(new URL('../form-schemas/comment.json', import.meta.url)));
const finalDecisionSchema = JSON.parse(await readFile(new URL('../form-schemas/final-decision.json', import.meta.url)));

router.get('/',authMdw.auth, async function (req, res) {
  const role = req.query.role||"student";
  let ret = [];
  if(role === "student"){
    ret = await requestService.findRequestsOfAStudent(req.userId);
  }
  if(role === "teacher"){
    ret = await requestService.findRequestsOfATeacher(req.userId);
  }
  res.status(200).json(user);
});
router.get('/:id',authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  const ret = await requestService.findDetailById(id);
  res.status(200).json(ret);
});
router.get('/:id/comments',authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  const comments = await requestService.findCommentsOfAReq(id);
  res.status(200).json(comments);
});
router.post('/:id/comments',validate(commentSchema),authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  let obj = {
    user: req.userId,
    content: req.body.content
  }
  const ret = await requestService.addNewComment(obj);
  res.status(201).json(ret);
});
router.post('/:id/final',validate(finalDecisionSchema),authMdw.auth, authMdw.authRequest, async function (req, res) {
  if(req.roleReq === "student"){
    return res.status(403).json({
      message: "Forbidden"
    })
  }
  const id = req.params.id;
  let obj = {
    finalGrade: req.body.finalGrade,
    status: "close"
  }
  const ret = await requestService.patch(id,obj);
  res.status(201).json(ret);
});
export default router;