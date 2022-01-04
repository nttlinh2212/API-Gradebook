import express from 'express';

import { readFile } from 'fs/promises';
import bcrypt from 'bcryptjs';
import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';
import authMdw from '../middlewares/auth.mdw.js';

const router = express.Router();
const profileSchema = JSON.parse(await readFile(new URL('../form-schemas/profile.json', import.meta.url)));
const passSchema = JSON.parse(await readFile(new URL('../form-schemas/password.json', import.meta.url)));
const studentidSchema = JSON.parse(await readFile(new URL('../form-schemas/studentid.json', import.meta.url)));

// router.get('/profile', async function (req, res) {
//   const user = await userService.findById(req.userId)
//   res.status(201).json(user);
// });
router.patch('/', async function (req, res) {
  
  const all = await userService.findAll()
  for (const u of all) {
    await userService.patch(u._id, {
      name:u.firstName+" "+u.lastName,
    })
  }
  res.status(201).json(all);
});

router.get('/profile',authMdw.auth, async function (req, res) {
  const user = await userService.findByIdSelected(req.userId)
  res.status(200).json(user);
});
router.patch('/profile',validate(profileSchema),authMdw.auth, async function (req, res) {
  req.body.name = req.body.firstName +" "+ req.body.lastName;
  const user = await userService.patch(req.userId,req.body)
  res.status(201).json(req.body);
});
router.get('/studentid',authMdw.auth,authMdw.authMemberUser, async function (req, res) {
  const infoUser = await userService.findById(req.userId);
  return res.status(200).json({
    studentId: infoUser.studentId||null
  });
});
router.patch('/studentid',validate(studentidSchema),authMdw.auth,authMdw.authMemberUser, async function (req, res) {
  const infoUser = await userService.findById(req.userId);
  req.studentId = infoUser.studentId||null;
  if(req.studentId){
    return res.status(400).json({
      message: "StudentID has only one change."
    });
  }
  const exist = await userService.findByStudentId(req.body.studentId);
  if(exist){
    return res.status(400).json({
      message: "StudentID is not available."
    });
  }
  const ret = await userService.patch(req.userId,req.body)
  res.status(200).json({
    message:"Update successfully."
  });
});
router.patch('/password',validate(passSchema),authMdw.auth, async function (req, res) {
  const user = await userService.findById(req.userId);
  // if(!(req.body.newPass===req.body.confirmPass)){
  //   return res.status(400).json({
  //     message:"New password is not equal confirm password!"
  //   });
  // }
  if(!user.password){
    return res.status(400).json({
      message:"Current password does not exist. Please click on forget password in the login page to create a password!"
    });
  }
  if (bcrypt.compareSync(req.body.curPass, user.password) === false) {
    return res.status(400).json({
      message:"Current password is wrong!"
    });
  }
    
  const password = bcrypt.hashSync(req.body.newPass, 10);
  const ret = await userService.patch(req.userId,{password});
  //console.log("update password",ret);
  res.status(200).json({
    message:"change password successfully"
  });
});

export default router;