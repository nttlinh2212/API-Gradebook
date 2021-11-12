import express from 'express';
import { readFile } from 'fs/promises';

import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
import classMemberService from '../services/class-member.service.js';

const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/class.json', import.meta.url)));

router.get('/', async function (req, res) {
  const id = req.query.id || 0;
  const classObj = await classService.findClassInfoById(id);
  if (classObj === null) {
    return res.status(204).end();
  }
  console.log("Role:",req.role,classObj)
  const retJson = {
    _id:classObj._id,
    name:classObj.name,
    description:classObj.description,
    createdUser:classObj.createdUser,
    role:req.role
  }
  console.log("Role:",req.role,retJson)
  res.json(retJson);
});
router.get('/list-member', async function (req, res) {
  const id = req.query.id || 0;
  const listStudents = await classMemberService.findAllStudentsInAClass(id);
  const listTeachers = await classMemberService.findAllTeachersInAClass(id);
  const retJson = {
    _id: id,
    students: listStudents,
    teachers: listTeachers,
  }
  res.json(retJson);
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