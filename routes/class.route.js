import express from 'express';
import { readFile } from 'fs/promises';

import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
import classMemberService from '../services/class-member.service.js';
import authMdw from '../middlewares/auth.mdw.js';
import randomstring from 'randomstring';
const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/class.json', import.meta.url)));

router.get('/:id', authMdw.authMember, async function (req, res) {
  const id = req.params.id || 0;
  const classObj = await classService.findClassInfoById(id);
  if (classObj === null) {
    return res.status(204).end();
  }
  //console.log("Role:",req.role,classObj)
  if(req.role==="student"){
    const retJson = {
      _id:classObj._id,
      name:classObj.name,
      description:classObj.description,
      createdUser:classObj.createdUser,
      role:req.role
    }
    console.log("Role:",req.role,retJson)
    return res.json(retJson);
  }
  const retJson = {
    _id:classObj._id,
    name:classObj.name,
    description:classObj.description,
    createdUser:classObj.createdUser,
    role:req.role,
    key:classObj.key,
  }
  console.log("Role:",req.role,retJson)
  res.json(retJson);
});
router.get('/:id/list-member', authMdw.authMember, async function (req, res) {
  const id = req.params.id || 0;
  const listStudents = await classMemberService.findAllStudentsInAClass(id);
  const listTeachers = await classMemberService.findAllTeachersInAClass(id);
  const retJson = {
    _id: id,
    students: listStudents,
    teachers: listTeachers,
  }
  res.json(retJson);
});

router.get('/:id/key/:key',authMdw.auth, async function (req, res) {
  const id = req.params.id || 0;
  const key = req.params.key || 0;
  //check key
  let participating;
  try{
    participating = await classMemberService.findAMemberInAClass(req.accessTokenPayload.userId,id);
  }catch(err){
    return res.status(404).json({
      err: "Not found class!"
    });
  }
  
  if(participating)
    return res.redirect(`/class/${id}`);
  const isCorrect = await classService.isCorrectKey(id,key);
  if(!isCorrect)
    return res.status(400).json({
      err: "Key is not right!"
    });
  const ret = await classMemberService.add({
    user:req.accessTokenPayload.userId,
    class:id
  });
  console.log("Add member in a class:",ret)
  return res.redirect(`/class/${id}`);

  // const listStudents = await classMemberService.findAllStudentsInAClass(id);
  // const listTeachers = await classMemberService.findAllTeachersInAClass(id);
  // const retJson = {
  //   _id: id,
  //   students: listStudents,
  //   teachers: listTeachers,
  // }
  // res.json(retJson);
});

// router.delete('/:id', async function (req, res) {
//   const id = req.params.id || 0;
//   const n = await classService.del(id);
//   res.json({
//     affected: n
//   });
// });

router.patch('/', async function (req, res) {
  const classId = req.params.classid || 0;
  const key = req.params.key || 0;
  console.log(classId,"/",key);
  const all = await classService.findAll();
  for (const c of all) {
    const key = randomstring.generate(8);
    const n = await classService.patch(c._id, {key});
  }
  
  res.json({
    all
  });
});

export default router;