import express from 'express';

import { readFile } from 'fs/promises';
import bcrypt from 'bcryptjs';
import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
const userSchema = JSON.parse(await readFile(new URL('../form-schemas/user.json', import.meta.url)));

const router = express.Router();
// const profileSchema = JSON.parse(await readFile(new URL('../form-schemas/profile.json', import.meta.url)));
// const passSchema = JSON.parse(await readFile(new URL('../form-schemas/password.json', import.meta.url)));
const studentidSchema = JSON.parse(await readFile(new URL('../form-schemas/studentid.json', import.meta.url)));


//------------------------USERS----------------------------------------------------
router.get('/users', async function (req, res) {
  const role = req.query.role
  const user = await userService.findAllHavingSelect({role},role==="member");
  res.status(200).json(user);
});
router.delete('/users/:id', async function (req, res) {
  const id = req.params.id;
  //console.log("id=",id,"/",req.userId);
  if(id===req.userId){
    return res.status(403).json({
      message: "You do not have permission to block your account!"
    });
  }
  const user = await userService.patch(id,{status:"disable"})
  res.status(200).json(user);
});
router.post('/users/:id', async function (req, res) {
  const id = req.params.id;
  if(id===req.userId){
    return res.status(403).json({
      message: "You do not have permission to enable your account!"
    });
  }
  const user = await userService.patch(id,{status:"enable"})
  res.status(200).json(user);
});
router.patch('/users/:id/studentid',validate(studentidSchema),async function (req, res) {
  const id = req.params.id;
  if((await userService.findById(id)).role==="admin")
    return res.status(400).json({
      message: "Admin does not have studentId."
    });
  if(!req.body.studentId||req.body.studentId===""){
    req.body.studentId = null;
  }
  let exist = null;
  if(req.body.studentId)
    exist = await userService.findByStudentId(req.body.studentId);
  if(exist){
    return res.status(400).json({
      message: "StudentId is not available."
    });
  }
  const ret = await userService.patch(id,req.body)
  res.status(200).json({
    message:"Update successfully."
  });
});
//----------------------------------------MANAGE ADMIN ACCOUNT-ACCOUNTT--------------
router.post('/admins',validate(userSchema), async function (req, res) {
  //
  let user = req.body;
  user.password = bcrypt.hashSync(user.password, 10);
  user.role = "admin";
  let ret;
  //-------------------validate email, username
  const duplicate = await userService.findByEmail(user.email)
  console.log(duplicate);
  if(duplicate){
    return res.status(400).json({
      message: "Email is not available."
    });
  }
  try{
    ret = await userService.add(user);
  }catch(err){
    return res.status(400).json({
      message: "Invalid Form."
    });
  }
  

  user = {
    _id: ret._id,
    ...user
  }
  delete user.password;
  //user._id=ret._id;
  res.status(201).json(user);

});
//-----------------------------------------CLASS-------------------
router.get('/classes', async function (req, res) {
  const classObj = await classService.findAllHavingSelect();
  res.status(200).json(classObj);
});
router.delete('/classes/:id', async function (req, res) {
  const id = req.params.id;
  const classObj = await classService.patch(id,{status:"disable"})
  res.status(200).json(classObj);
});
router.post('/classes/:id', async function (req, res) {
  const id = req.params.id;
  const classObj = await classService.patch(id,{status:"enable"})
  res.status(200).json(classObj);
});
export default router;