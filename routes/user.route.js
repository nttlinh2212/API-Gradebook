import express from 'express';

import { readFile } from 'fs/promises';
import bcrypt from 'bcryptjs';
import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';
import authMdw from '../middlewares/auth.mdw.js';

const router = express.Router();
const profileSchema = JSON.parse(await readFile(new URL('../form-schemas/profile.json', import.meta.url)));
const passSchema = JSON.parse(await readFile(new URL('../form-schemas/password.json', import.meta.url)));


// router.get('/profile', async function (req, res) {
//   const user = await userService.findById(req.accessTokenPayload.userId)
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
  const user = await userService.findByIdSelected(req.accessTokenPayload.userId)
  res.status(201).json(user);
});
router.patch('/profile',validate(profileSchema),authMdw.auth, async function (req, res) {
  const user = await userService.patch(req.accessTokenPayload.userId,req.body)
  res.status(201).json(req.body);
});

router.patch('/password',validate(passSchema),authMdw.auth, async function (req, res) {
  const user = await userService.findById(req.accessTokenPayload.userId);
  // if(!(req.body.newPass===req.body.confirmPass)){
  //   return res.status(400).json({
  //     message:"New password is not equal confirm password!"
  //   });
  // }
  if (bcrypt.compareSync(req.body.curPass, user.password) === false) {
    return res.status(401).json({
      message:"Current password is wrong!"
    });
  }
    
  const password = bcrypt.hashSync(req.body.newPass, 10);
  const ret = await userService.patch(req.accessTokenPayload.userId,{password});
  console.log("update password",ret);
  res.status(201).json({
    message:"change password successfully"
  });
});

export default router;