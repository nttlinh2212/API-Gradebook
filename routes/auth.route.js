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
const tokenSchema = JSON.parse(await readFile(new URL('../form-schemas/token.json', import.meta.url)));
const rfSchema = JSON.parse(await readFile(new URL('../form-schemas/rf.json', import.meta.url)));
const  SECRET_KEY = process.env.SECRET_KEY;
const CLIENT_ID = process.env.CLIENT_ID;

router.post('/', validate(schema), async function (req, res) {
  const user = await userService.findByEmail(req.body.email);
  if (user === null) {
    return res.status(401).json({
      message:"Invalid email or password"
    });
  }
  if (user.status === "disable") {
    return res.status(401).json({
      message:"This account is disable. Please contact Admin to recover this account."
    });
  }
  if (bcrypt.compareSync(req.body.password, user.password||"") === false) {
    return res.status(401).json({
      message:"Invalid email or password"
    });
  }

  const opts = {
    expiresIn: 30 * 60 // seconds
  };
  const payload = {
    userId: user.id,
    role: user.role,
  };
  const accessToken = jwt.sign(payload,SECRET_KEY, opts);

  const refreshToken = randomstring.generate(80);
  await userService.patch(user.id, {
    rfToken: refreshToken
  });

  res.json({
    authenticated: true,
    _id:user._id,
    firstName:user.firstName,
    lastName:user.lastName,
    name:user.name,
    email:user.email,
    role:user.role,
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
    const { userId,role } = jwt.verify(accessToken, SECRET_KEY, opts);
    //console.log("Sign successfully",userId);
    const ret = await userService.isValidRefreshToken(userId, refreshToken);
    if (ret) {
      const opts = {
        expiresIn: 30 * 60 // seconds
      };
      const payload = { userId,role };
      const new_accessToken = jwt.sign(payload, SECRET_KEY, opts);
      return res.json({
        accessToken: new_accessToken
      });
    }

    return res.status(403).json({
      message: 'Refresh token is revoked.'
    });

  } catch (err) {
    console.log(err);
    return res.status(403).json({
      message: 'Invalid access token.'
    });
  }
});
router.post('/google', validate(tokenSchema), async function (req, res) {
  
  const token = req.body.token;
  console.log("TOKEN",token);

  const client = new OAuth2Client(CLIENT_ID);
  let retPayload;
  try{
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, 
    });
    retPayload = ticket.getPayload();
  }catch(err){
    return res.status(401).json({
      message: 'Invalid Google token.'
    });
  }
  
  
  console.log("PayLoad",retPayload);
  const googleId = retPayload['sub'];
  const exist = await userService.findByEmail(retPayload['email']);
  let userId, firstName, lastName,name, email, role;
  if(!exist){
    const user = await userService.add({
      googleId,
      email:retPayload['email'],
      firstName:retPayload['given_name'],
      lastName:retPayload['family_name'],
      name:retPayload['name'],
      role:'member',
    })
    userId = user._id;
    firstName = user.firstName;
    lastName = user.lastName;
    name = user.name;
    email = user.email; 
    role = user.role;
    
  }
  else {
    if(exist&&!exist.googleId){
      console.log("no google id",exist, exist._id);
      console.log(await userService.patch(exist._id, {
        googleId
      }));
    }
    if (exist.status === "disable") {
      return res.status(401).json({
        message:"This account is disable. Please contact Admin to recover this account."
      });
    }
    userId = exist._id;
    firstName = exist.firstName;
    lastName = exist.lastName;
    name = exist.name;
    email = exist.email; 
    role = exist.role;
  }
  
  
  const opts = {
    expiresIn: 30 * 60 // seconds
  };
  const payload = {
    userId,
    role,

  };
  const accessToken = jwt.sign(payload,SECRET_KEY, opts);

  const refreshToken = randomstring.generate(80);
  await userService.patch(userId, {
    rfToken: refreshToken
  });

  res.json({
    authenticated: true,
    _id:userId,
    firstName,
    lastName,
    name,
    email,
    accessToken,
    refreshToken,
    role
  });
});

//Verify email----------
router.post('/send-verify-email/',validate(inviteEmailSchema),  async function (req, res) {
  const id = req.params.id || 0;
  const email = req.body.email || 0;
  const role = req.body.role||"student";
  const fromEmail = process.env.EMAIL_FROM;
  const urlFE = process.env.URL_FE;
  const user = await userService.findById(req.userId);

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
router.get('/:id/confirm-invite-email', authMdw.auth ,authMdw.class,async function (req, res) {
  const id = req.params.id || 0;
  const token = req.query.token || 0;
  const user = await userService.findById(req.userId);
  //check key
  let participating;
  try{
    participating = await classMemberService.findAMemberInAClass(req.userId,id);
  }catch(err){
    return res.status(404).json({
      err: "Not found class!"
    });
  }
  
  if(participating)
    return res.redirect(`/class/${id}`);
  const decoded = null;
  try{
    const decoded = jwt.verify(token, SECRET_KEY_INVITE);
    console.log("Payload:",decoded);
  } catch (err) {
    //console.log(err);
    return res.status(401).json({
      message: 'invalid link'
    });
  }
  
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
router.post('/:id/confirm-invite-email/',validate(tokenSchema), authMdw.auth ,authMdw.class, async function (req, res) {
  const id = req.params.id || 0;
  const token = req.body.token || 0;
  const user = await userService.findById(req.userId);
  //check key
  let participating;
  try{
    participating = await classMemberService.findAMemberInAClass(req.userId,id);
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




export default router;