import express from 'express';
import { readFile } from 'fs/promises';
import randomstring from 'randomstring';
import validate from '../middlewares/validate.mdw.js';
import classService from '../services/class.service.js';
import classMemberService from '../services/class-member.service.js';
import authMdw from '../middlewares/auth.mdw.js';
import userService from '../services/user.service.js';
import bcrypt from 'bcryptjs';


const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/class.json', import.meta.url)));
const userSchema = JSON.parse(await readFile(new URL('../form-schemas/user.json', import.meta.url)));





router.get('/classes',authMdw.auth,authMdw.authMemberUser, async function (req, res) {
  //console.log('ROOT ROUTER: ');
  const list = await classMemberService.findAllClassesByUser(req.userId);
  res.status(200).json(list);
});
// router.get('/test',passport.authenticate('jwt', { session: false }), async function (req, res) {
//   console.log(req.user.userId,req.user.roleUser);
//   const list = await classMemberService.findAllClassesByUser(req.user.userId);
//   res.status(200).json(list);
// });
router.post('/classes',authMdw.auth, validate(schema), async function (req, res) {
  //console.log('ROOT ROUTER: ', req.body);
  req.body.createdUser=req.userId;
  
  const key = randomstring.generate(8);
  req.body.key=key;

  const ret = await classService.add(req.body);
  const classObj = {
    _id: ret._id,
    ...req.body
  }
  res.status(201).json(classObj);
});
router.post('/classes/join',authMdw.auth, async function (req, res) {
  const code = req.query.code;
  const success = await classService.findByCode(code)
  if(!success){
    return res.status(404).json({
      message: "Not found Class."
    });
  }
  const id = success._id;
  //--------- if joined class
  let participating = await classMemberService.findAMemberInAClass(req.userId,id);
  if(participating){
    //return res.redirect(`/class/${id}`);
    const classObj = await classService.findDetailClassInfoByIdWithRole(id,participating.role);
    res.status(200).json(classObj);
  }
  //-----------if not join class
  const ret = await classMemberService.add({
    user:req.userId, 
    role:"student",
    class:id
  });
  //console.log("Result of Adding new member:",ret);
  //return res.redirect(`/class/${id}`);
  const classObj = await classService.findDetailClassInfoByIdWithRole(id,"student");
  res.status(200).json(classObj);
  
});

router.post('/register', validate(userSchema), async function (req, res) {
  let user = req.body;
  user.password = bcrypt.hashSync(user.password, 10);
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