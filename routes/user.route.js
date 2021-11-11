import express from 'express';
import bcrypt from 'bcryptjs';
import { readFile } from 'fs/promises';

import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';

const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/user.json', import.meta.url)));

router.post('/', validate(schema), async function (req, res) {
  let user = req.body;
  user.password = bcrypt.hashSync(user.password, 10);
  let ret;
  //-------------------validate email, username
  try{
    ret = await userService.add(user);
  }catch(err){
    return res.status(400).json({
      err: "Invalid Form"
    });
  }
  

  user = {
    id: ret[0],
    ...user
  }
  delete user.password;
  user._id=ret._id;
  res.status(201).json(user);
});

export default router;