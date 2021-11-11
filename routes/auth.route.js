import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import randomstring from 'randomstring';
import dotenv from "dotenv";
import { readFile } from 'fs/promises';


import {OAuth2Client} from 'google-auth-library';
import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';

dotenv.config();
const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/login.json', import.meta.url)));
const rfSchema = JSON.parse(await readFile(new URL('../form-schemas/rf.json', import.meta.url)));
const  SECRET_KEY = process.env.SECRET_KEY;
router.post('/', validate(schema), async function (req, res) {
  const user = await userService.findByUserName(req.body.username);
  if (user === null) {
    return res.status(401).json({
      authenticated: false
    });
  }

  if (bcrypt.compareSync(req.body.password, user.password) === false) {
    return res.status(401).json({
      authenticated: false
    });
  }

  const opts = {
    expiresIn: 15 * 60 // seconds
  };
  const payload = {
    userId: user.id
  };
  const accessToken = jwt.sign(payload,SECRET_KEY, opts);

  const refreshToken = randomstring.generate(80);
  await userService.patch(user.id, {
    rfToken: refreshToken
  });

  res.json({
    authenticated: true,
    accessToken,
    refreshToken
  });
});

router.post('/refresh', validate(rfSchema), async function (req, res) {
  const { accessToken, refreshToken } = req.body;
  try {
    const opts = {
      ignoreExpiration: true
    };
    const { userId } = jwt.verify(accessToken, SECRET_KEY, opts);
    //console.log("Sign successfully",userId);
    const ret = await userService.isValidRefreshToken(userId, refreshToken);
    if (ret) {
      const opts = {
        expiresIn: 10 * 60 // seconds
      };
      const payload = { userId };
      const new_accessToken = jwt.sign(payload, SECRET_KEY, opts);
      return res.json({
        accessToken: new_accessToken
      });
    }

    return res.status(401).json({
      message: 'Refresh token is revoked.'
    });

  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: 'Invalid access token.'
    });
  }
});
router.post('/google', validate(schema), async function (req, res) {
  

  
  const client = new OAuth2Client(CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, 
    });
    const payload = ticket.getPayload();
    const userId = payload['sub'];
  }
  verify().catch(console.error);




  const opts = {
    expiresIn: 15 * 60 // seconds
  };
  const payload = {
    userId: user.id
  };
  const accessToken = jwt.sign(payload,SECRET_KEY, opts);

  const refreshToken = randomstring.generate(80);
  await userService.patch(user.id, {
    rfToken: refreshToken
  });

  res.json({
    authenticated: true,
    accessToken,
    refreshToken
  });
});
export default router;