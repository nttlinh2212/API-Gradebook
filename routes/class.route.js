import express from 'express';
import { readFile } from 'fs/promises';
import sgMail  from '@sendgrid/mail';
import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
import classMemberService from '../services/class-member.service.js';
import authMdw from '../middlewares/auth.mdw.js';
import dotenv from 'dotenv';
import userService from '../services/user.service.js';
import jwt from 'jsonwebtoken';
import renderContentEmail from '../utils/email-template.js';
import mongoose from 'mongoose';

const router = express.Router();
const studentidSchema = JSON.parse(await readFile(new URL('../form-schemas/studentid.json', import.meta.url)));
const inviteEmailSchema = JSON.parse(await readFile(new URL('../form-schemas/invite-email.json', import.meta.url)));
const tokenSchema = JSON.parse(await readFile(new URL('../form-schemas/token.json', import.meta.url)));
const gradeStructureSchema = JSON.parse(await readFile(new URL('../form-schemas/grade-structure.json', import.meta.url)));
const listStudentsSchema = JSON.parse(await readFile(new URL('../form-schemas/list-students.json', import.meta.url)));

dotenv.config();
const SECRET_KEY_INVITE = process.env.SECRET_KEY_INVITE;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

 

router.get('/:id',authMdw.auth ,authMdw.authMember, async function (req, res) {
  const id = req.params.id || 0;
  const classObj = await classService.findClassInfoById(id);
  if (classObj === null) {
    return res.status(204).end();
  }
  //console.log("Role:",req.role,classObj)
  if(req.role==="student"){
    console.log("Student info claass");
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
router.get('/:id/list-member',authMdw.auth ,authMdw.authMember, async function (req, res) {
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

});

// router.delete('/:id', async function (req, res) {
//   const id = req.params.id || 0;
//   const n = await classService.del(id);
//   res.json({
//     affected: n
//   });
// });

router.get('/:id/studentid',authMdw.auth ,authMdw.authMember,authMdw.authStudent, async function (req, res) {
  
  return res.status(200).json({
    studentId: req.studentId
  });
});
router.patch('/:id/studentid',validate(studentidSchema),authMdw.auth ,authMdw.authMember,authMdw.authStudent, async function (req, res) {
  if(req.studentId){
    return res.status(400).json({
      message: "StudentID has only one change"
    });
  }
  const exist = await classMemberService.findStudentIdInAClass(req.body.studentId,req.params.id);
  if(exist){
    return res.status(400).json({
      message: "StudentID is not available"
    });
  }
  const ret = await classMemberService.patch(req.partId,req.body)
  res.status(201).json({
    message:"update successfully"
  });
});




// router.patch('/', async function (req, res) {
//   const classId = req.params.classid || 0;
//   const key = req.params.key || 0;
//   console.log(classId,"/",key);
//   const all = await classService.findAll();
//   for (const c of all) {
//     const key = randomstring.generate(8);
//     const n = await classService.patch(c._id, {key});
//   }
  
//   res.json({
//     all
//   });
// });
router.patch('/', async function (req, res) {

  const all = await classService.findAll();
  for (const c of all) {
    const gradeStructure = [];
    const n = await classService.patch(c._id, {gradeStructure});
  }
  
  res.json({
    all
  });
});

router.post('/:id/send-invite-email/',validate(inviteEmailSchema),authMdw.auth ,authMdw.authMember,authMdw.authTeacher, async function (req, res) {
  const id = req.params.id || 0;
  const email = req.body.email || 0;
  const role = req.body.role||"student";
  const fromEmail = process.env.EMAIL_FROM;
  const urlFE = process.env.URL_FE;
  const user = await userService.findById(req.accessTokenPayload.userId);

  //check xem neu da la member
  const invitedUser = await userService.findByEmail(email);
  console.log("invited user:",invitedUser)
  if(invitedUser){
    let participating;
    try{
      participating = await classMemberService.findAMemberInAClass(invitedUser._id,id);
    }catch(err){
      return res.status(404).json({
        err: "Not found class!"
      });
    }
    if(participating){
      return res.status(404).json({
        err: `Can not invite since ${email} is a member of this class`
      });
    
    }
  }
  
  //create token
  const opts = {
    expiresIn: '2d' // seconds
  };
  const payload = {
    email,
    role,
    classId:id,
  };
  const className = (await classService.findById(id)).name;
  const token = jwt.sign(payload,SECRET_KEY_INVITE, opts);
  //console.log("DECODE:",(Buffer.from(token, 'base64').toString("utf8")))
  //send email
///class/join/6192342f1da8dc83c060b2a0?token=jllaGPGE&role=teacher
  const acceptedLink = `${urlFE}class/join/${id}?token=${token}&role=${role}`;
  sgMail.setApiKey(SENDGRID_API_KEY);
  const msg = {
    to: email, // Change to your recipient
    from: fromEmail, // Change to your verified sender
    subject: `${user.name} has invited you to join ${className}`,
    text: 'if you accept that, please click link below',
    html: renderContentEmail(user.name,user.email,className,acceptedLink,role)
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
      return res.status(200).json({
        message: "Send email successfully"
      });
    })
    .catch((error) => {
      console.error(error)
      return res.status(400).json({
        message: "Send email fail"
      });
    })

 
});
router.get('/:id/confirm-invite-email',authMdw.auth , async function (req, res) {
  const id = req.params.id || 0;
  const token = req.query.token || 0;
  const user = await userService.findById(req.accessTokenPayload.userId);
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
  const decoded = jwt.verify(token, SECRET_KEY_INVITE);
  console.log("Payload:",decoded);
  const{email,role,classId}=decoded;
  if(id!==classId||email!==user.email){
    return res.status(401).json({
      err: "invalid link"
    });
  }
  const className = (await classService.findById(classId)).name;
  return res.status(200).json({
    email,
    role,
    classId,
    className,
  });
 
});
router.post('/:id/confirm-invite-email/',validate(tokenSchema),authMdw.auth , async function (req, res) {
  const id = req.params.id || 0;
  const token = req.body.token || 0;
  const user = await userService.findById(req.accessTokenPayload.userId);
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
  const decoded = jwt.verify(token, SECRET_KEY_INVITE);
  console.log("Payload:",decoded);
  const{email,role,classId}=decoded;
  if(id!==classId||email!==user.email){
    return res.status(401).json({
      err: "invalid link"
    });
  }
  const ret = await classMemberService.add({
    user:user._id, 
    role,
    class:classId
  });
  console.log("Result of Adding new member:",ret);
  return res.redirect(`/class/${id}`);
 
});
router.patch('/:id/grade-structure', validate(gradeStructureSchema),authMdw.auth ,authMdw.authMember,authMdw.authTeacher, async function (req, res) {
  const classId = req.params.id || 0;
  const structure = req.body;
  console.log("Structure:",structure);
  let sum = 0;
  for (let i = 0;i< structure.gradeStructure.length;i++) {
    sum+=structure.gradeStructure[i].point;
    if(!structure.gradeStructure[i].identity){
      structure.gradeStructure[i].identity = new mongoose.Types.ObjectId();//randomstring.generate(10); 
    }
  }
  if(sum>10){
    return res.status(400).json({
      err: "Total score is not more than 10",
    });
  }
  
  const ret = await classService.patch(classId, {gradeStructure:structure.gradeStructure});
  console.log("RESULT OF GRADE STRUCTURE:",ret);
  res.status(201).json(structure);
});
router.get('/:id/grade-structure',authMdw.auth ,authMdw.authMember,authMdw.authTeacher, async function (req, res) {
  const classId = req.params.id || 0;
  const ret = await classService.findByIdHavingSelect(classId, {"gradeStructure":1});
  console.log("RESULT OF GRADE STRUCTURE:",ret);
  res.status(200).json(ret);
});
//------------------------add list students---------------------------------
router.post('/:id/list-students', validate(listStudentsSchema), authMdw.auth ,authMdw.authMember,authMdw.authTeacher, async function (req, res) {
  
  const classId = req.params.id || 0;
  const listStudents = req.body.listStudents;
  //console.log("List Students:",listStudents);
  
  const ret = await classService.patch(classId, {listStudents});
  //console.log("result update list students:",ret);
  res.status(201).json(listStudents);



  // const storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, '../storage');
  //   },
  //   filename: function (req, file, cb) {
  //     cb(null, file.originalname);
  //   }
  // });
  // const upload = multer({ storage: storage });
  // upload.single('listStudents')(req, res, function (err) {
  //   console.log(req.body);
  //   if (err) {
  //     return res.status(400).json({
  //       err: err
  //     });
  //   } else {
  //     const list = uploadListStudent(`../storage/${req.file}`,'sheet1');
  //     console.log(list)
      
  //   }
  // });
  
  
  
  
});
export default router;