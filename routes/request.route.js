import express from 'express';

import moment from 'moment';
import { readFile } from 'fs/promises';
import validate from '../middlewares/validate.mdw.js';
import authMdw from '../middlewares/auth.mdw.js';
import requestService from '../services/request.service.js';
import classMemberService from '../services/class-member.service.js';
import classService from '../services/class.service.js';
import gradeService from '../services/grade.service.js';
import userService from '../services/user.service.js';
import notiService from '../services/notification.service.js';

const router = express.Router();

const commentSchema = JSON.parse(await readFile(new URL('../form-schemas/comment.json', import.meta.url)));
const finalDecisionSchema = JSON.parse(await readFile(new URL('../form-schemas/final-decision.json', import.meta.url)));
const requestSchema = JSON.parse(await readFile(new URL('../form-schemas/request.json', import.meta.url)));

router.get('/',authMdw.auth, async function (req, res) {
  const role = req.query.role||"student";
  let ret = [];
  if(role === "student"){
    ret = await requestService.findRequestsOfAStudent(req.userId);
  }
  if(role === "teacher"){
    try{
      ret = await requestService.findRequestsOfATeacher(req.userId);
    }catch(err){
      return res.status(400).json({
        message: "You do not receive any request!"
      })
    }
  }
  res.status(200).json(ret);
});
router.post('/',validate(requestSchema),authMdw.auth, async function (req, res) {

  //check student joinning this class,gradeIdentity
  try{
    const isJoin = await classMemberService.findARoleInAClass(req.userId,req.body.class,"student");
    const isComposition = await classService.findOneGradeFinalize(req.body.class,req.body.gradeIdentity);
    if(!isJoin||!isComposition){
      return res.status(400).json({
        message: "Invalid classId or gradeIdentity"
      })
    }
  }catch(err){
    return res.status(400).json({
      message: "Invalid classId or gradeIdentity"
    })
  }
  
  
  //console.log("Is composition",isComposition)
  //check allow request review 2 time
  const exist = await requestService.findBy({
    class:req.body.class,
    gradeIdentity:req.body.gradeIdentity,
    student:req.userId
  })
  if(exist){
    return res.status(400).json({
      message: "You only have one chance to request a review for a grade compostion."
    })
  }
  req.body.student = req.userId;
  const ret = await requestService.add(req.body)

  //------------------add noti --------------------------------------
  //find all teachers in a class
  const listTeachers = await classMemberService.findAllTeachersInAClass(req.body.class);
  if(!listTeachers){
    res.status(200).json(ret);
  }
  const classInfo = await classService.findById(req.body.class);
  for (const t of listTeachers) {
    await notiService.addNewRequest(t.user._id,classInfo.name,ret._id,req.userId);
  }
  
  
  res.status(200).json(ret);
});
router.get('/:id',authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  const ret = await requestService.findDetailById(id);
  ret.role = req.roleReq;
  res.status(200).json(ret);
});
router.delete('/:id',authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  if(req.request.status === "close"){
    return res.status(400).json({
      message: "The request is closed by the teacher."
    })
  }
  const finalGrade = req.body.finalGrade;
  if(req.roleReq!=="teacher")
    return res.status(403).json({
      message: "You do not have permission to this action"
    })
  const studentId = (await userService.findById(req.request.student)).studentId;
  const update1 = await gradeService.patchGeneral({
    studentId,
    class:req.request.class,
    gradeIdentity:req.request.gradeIdentity
  },{
    point:finalGrade
  })
  const update2 = await requestService.patch(id,{
    finalGrade,
    status:"close"
  });
  //------------------add noti --------------------------------------
  
  const teacherName = (await userService.findById(req.userId)).name;
  await notiService.addNewDecision(req.request.student,teacherName,id,req.userId);
  
  res.status(200).json({
    message:"Close request successfully"
  });
});
router.get('/:id/comments',authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  const raw = await requestService.findCommentsOfAReq(id);
  //console.log(raw);
  const comments = raw.comments;
  let ret = [];
  for (let i = 0;i< comments.length;i++) {
    
    const c = comments[i];
    //console.log(c);
    const element = {
      _id:c._id,
      user:c.user,
      content:c.content,
      createdAt:moment(c.createdAt)
      .zone("+07:00")
      .format('YYYY-MM-DD HH:mm:ss')
    }
    ret.push(element);
  }
  res.status(200).json(ret);
});
router.post('/:id/comments',validate(commentSchema),authMdw.auth, authMdw.authRequest, async function (req, res) {
  const id = req.params.id;
  if(req.request.status === "close"){
    return res.status(400).json({
      message: "The request is closed by the teacher."
    })
  }
  let obj = {
    user: req.userId,
    content: req.body.content
  }
  const ret = await requestService.addNewComment(id,obj);
  //------------------add noti --------------------------------------
  if(req.roleReq === "teacher"){
    const teacherName = (await userService.findById(req.userId)).name;
    await notiService.addNewReply(req.request.student,teacherName,id,req.userId)
  }
  res.status(201).json(ret);
});
// router.post('/:id/final',validate(finalDecisionSchema),authMdw.auth, authMdw.authRequest, async function (req, res) {
//   if(req.roleReq === "student"){
//     return res.status(403).json({
//       message: "You don not have permission to this action"
//     })
//   }
//   const id = req.params.id;
//   let obj = {
//     finalGrade: req.body.finalGrade,
//     status: "close"
//   }
//   const ret = await requestService.patch(id,obj);
//   res.status(201).json(ret);
// });
export default router;