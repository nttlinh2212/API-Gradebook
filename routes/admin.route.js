import express from 'express';

import { readFile } from 'fs/promises';

import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';


const router = express.Router();
// const profileSchema = JSON.parse(await readFile(new URL('../form-schemas/profile.json', import.meta.url)));
// const passSchema = JSON.parse(await readFile(new URL('../form-schemas/password.json', import.meta.url)));
const studentidSchema = JSON.parse(await readFile(new URL('../form-schemas/studentid.json', import.meta.url)));


//------------------------USERS----------------------------------------------------
router.get('/users', async function (req, res) {
  const user = await userService.findAllHavingSelect()
  res.status(200).json(user);
});
router.delete('/users/:id', async function (req, res) {
  const id = req.params.id;
  const user = await userService.patch(id,{status:"disable"})
  res.status(200).json(user);
});
router.post('/users/:id', async function (req, res) {
  const id = req.params.id;
  const user = await userService.patch(id,{status:"enable"})
  res.status(200).json(user);
});
router.patch('/users/:id/studentid',validate(studentidSchema),async function (req, res) {
  const id = req.params.id;
  if(!req.body.studentId||req.body.studentId===""){
    req.body.studentId = null;
  }
  let exist = null;
  if(req.body.studentId)
    exist = await userService.findByStudentId(req.body.studentId);
  if(exist){
    return res.status(400).json({
      message: "StudentID is not available"
    });
  }
  const ret = await userService.patch(id,req.body)
  res.status(201).json({
    message:"update successfully"
  });
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