import express from 'express';
import bcrypt from 'bcryptjs';
import { readFile } from 'fs/promises';

import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';
import authMdw from '../middlewares/auth.mdw.js';

const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/user.json', import.meta.url)));


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
router.patch('/profile',authMdw.auth, async function (req, res) {
  const user = await userService.findByIdSelected(req.accessTokenPayload.userId)
  res.status(201).json(user);
});


export default router;