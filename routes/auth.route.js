import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import randomstring from 'randomstring';
import dotenv from "dotenv";
import { readFile } from 'fs/promises';
import sgMail  from '@sendgrid/mail';
import {OAuth2Client} from 'google-auth-library';
import userService from '../services/user.service.js';
import validate from '../middlewares/validate.mdw.js';
import renderContentEmail from '../utils/email-template.js';
import  passport  from '../middlewares/passport.js';

dotenv.config();
const router = express.Router();
const schema = JSON.parse(await readFile(new URL('../form-schemas/login.json', import.meta.url)));
const emailSchema = JSON.parse(await readFile(new URL('../form-schemas/email.json', import.meta.url)));
const tokenSchema = JSON.parse(await readFile(new URL('../form-schemas/token.json', import.meta.url)));
const accessTokenSchema = JSON.parse(await readFile(new URL('../form-schemas/access-token.json', import.meta.url)));
const resetPassSchema = JSON.parse(await readFile(new URL('../form-schemas/reset-pw.json', import.meta.url)));
const rfSchema = JSON.parse(await readFile(new URL('../form-schemas/rf.json', import.meta.url)));

const SECRET_KEY = process.env.SECRET_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET_KEY_INVITE = process.env.SECRET_KEY_INVITE;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// router.post('/', validate(schema), async function (req, res) {
//   const user = await userService.findByEmail(req.body.email);
//   if (user === null) {
//     return res.status(400).json({
//       message:"Invalid email or password."
//     });
//   }
//   if (user.status === "disable") {
//     return res.status(410).json({
//       message:"This account is disable. Please contact Admin to recover this account."
//     });
//   }
//   if (!user.verified) {
//     return res.status(411).json({
//       message:"This email is not yet verified. Please verify this email to continue using the application."
//     });
//   }
//   if (bcrypt.compareSync(req.body.password, user.password||"") === false) {
//     return res.status(400).json({
//       message:"Invalid email or password."
//     });
//   }

//   const opts = {
//     expiresIn: 30 * 60 // seconds
//   };
//   const payload = {
//     userId: user.id,
//     role: user.role,
//   };
//   const accessToken = jwt.sign(payload,SECRET_KEY, opts);

//   const refreshToken = randomstring.generate(80);
//   await userService.patch(user.id, {
//     rfToken: refreshToken
//   });

//   res.status(200).json({
//     authenticated: true,
//     _id:user._id,
//     firstName:user.firstName,
//     lastName:user.lastName,
//     name:user.name,
//     email:user.email,
//     role:user.role,
//     accessToken,
//     refreshToken
//   });
// });

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
      return res.status(200).json({
        accessToken: new_accessToken
      });
    }

    return res.status(413).json({
      message: 'Refresh token is revoked.'
    });

  } catch (err) {
    //console.log(err);
    return res.status(413).json({
      message: 'Invalid access token.'
    });
  }
});
router.post('/google', validate(tokenSchema), async function (req, res) {
  
  const token = req.body.token;
  //console.log("TOKEN",token);

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
  
  
  //console.log("PayLoad",retPayload);
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
      verified:true
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
    if (exist.status&&exist.status === "disable") {
      return res.status(410).json({
        message:"This account is disable. Please contact Admin to recover this account."
      });
    }
    if (!exist.verified) {
      await userService.patch(exist._id,{"verified":true});
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

  res.status(200).json({
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

//----------------------------------------VERIFY EMAIL------------------------------------------
router.post('/verify-email/send',validate(emailSchema),  async function (req, res) {
  const email = req.body.email;
  const fromEmail = process.env.EMAIL_FROM;
  const urlFE = process.env.URL_FE;

  //const user = await userService.findById(req.userId);

  //check xem neu da verify
  const verifiedUser = await userService.findByEmail(email);
  //console.log("invited user:",verifiedUser)
  if(!verifiedUser){
    return res.status(404).json({
      message: "Not found user."
    });
  }
  if(verifiedUser.verified){
    return res.status(400).json({
      message: "This account is verified before."
    });
  }
  //create token
  const opts = {
    expiresIn: 10 * 60 // seconds
  };
  const payload = {
    email
  };
  const token = jwt.sign(payload,SECRET_KEY_INVITE, opts);
  //console.log("DECODE:",(Buffer.from(token, 'base64').toString("utf8")))
  //send email
///class/join/6192342f1da8dc83c060b2a0?token=jllaGPGE&role=teacher
  const link = `${urlFE}verify-email?token=${token}`;
  sgMail.setApiKey(SENDGRID_API_KEY);
  const msg = {
    to: email, // Change to your recipient
    from: fromEmail, // Change to your verified sender
    subject: `Let verify your email so you can start using the application`,
    html: renderContentEmail("Verify email","Please click the button below to verify this email.","Verify email","10 mins",link)
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
      return res.status(200).json({
        message: "Send email successfully!"
      });
    })
    .catch((error) => {
      console.error(error)
      return res.status(400).json({
        message: "Send email fail!"
      });
    })

 
});
router.post('/verify-email/confirm', validate(tokenSchema), async function (req, res) {
  const token = req.body.token;
  let decoded = null;
  try{
    decoded = jwt.verify(token, SECRET_KEY_INVITE);
    //console.log("Payload:",decoded);
  } catch (err) {
    //console.log(err);
    return res.status(400).json({
      message: 'Invalid link.'
    });
  }
  
  const email = decoded.email;
  const user = await userService.findByEmail(email);
  if(!user){
    return res.status(404).json({
      message: "Not found user."
    });
  }
  if(user.verified){
    return res.status(400).json({
      message: "This account is verified before."
    });
  }
  const ret = await userService.patch(user._id,{"verified":true});
  return res.status(200).json({
    message: "Verified successfully!"
  });
 
});

//----------------------------------------FORGOT PASSWORD------------------------------------------
router.post('/reset-pw/send',validate(emailSchema),  async function (req, res) {
  const email = req.body.email;
  const fromEmail = process.env.EMAIL_FROM;
  const urlFE = process.env.URL_FE;

  //const user = await userService.findById(req.userId);

  //check xem neu da verify
  const user = await userService.findByEmail(email);
  //console.log("invited user:",verifiedUser)
  if(!user){
    return res.status(404).json({
      message: "Not found user."
    });
  }
  //create token
  const opts = {
    expiresIn: 10 * 60 // seconds
  };
  const payload = {
    email
  };
  const token = jwt.sign(payload,SECRET_KEY_INVITE, opts);
  //console.log("DECODE:",(Buffer.from(token, 'base64').toString("utf8")))
  //send email
///class/join/6192342f1da8dc83c060b2a0?token=jllaGPGE&role=teacher
  const link = `${urlFE}forgot-password?email=${encodeURIComponent(email)}&token=${token}`;
  sgMail.setApiKey(SENDGRID_API_KEY);
  const msg = {
    to: email, // Change to your recipient
    from: fromEmail, // Change to your verified sender
    subject: `Reset password at Gradebook`,
    html: renderContentEmail("Reset password","We have received a request to reset your password.\nPlease click the button below to reset password or If you did not make this request, please ignore this email."
      ,"Reset your password","10 mins",link)
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
      return res.status(200).json({
        message: "Send email successfully!"
      });
    })
    .catch((error) => {
      console.error(error)
      return res.status(400).json({
        message: "Send email fail."
      });
    })

 
});
router.post('/reset-pw/confirm', validate(resetPassSchema), async function (req, res) {
  const token = req.body.token;
  const newPass = req.body.newPass;
  let decoded = null;
  try{
    decoded = jwt.verify(token, SECRET_KEY_INVITE);
    //console.log("Payload:",decoded);
  } catch (err) {
    //console.log(err);
    return res.status(400).json({
      message: 'Invalid link.'
    });
  }
  
  const email = decoded.email;
  const user = await userService.findByEmail(email);
  if(!user){
    return res.status(404).json({
      message: "Not found user."
    });
  }

  const password = bcrypt.hashSync(newPass, 10);
  const ret = await userService.patch(user._id,{password});
  //console.log("update password",ret,token,newPass);
  res.status(200).json({
    message:"Reset password successfully!"
  });
 
});

router.post('/', validate(schema), (req,res,next) => {
  //console.log(req.body);
  passport.authenticate('local', function (err, user, info){
  //console.log(user,info)
  if(!user){
    if(info&&info.code){
      delete info.code;
       return res.status(info.code).json(info);
    }
    return res.status(400).json(info);
  }
  return res.status(200).json(user);
  })(req, res, next)
});
router.post('/facebook', validate(accessTokenSchema), (req,res,next) => {
  passport.authenticate('facebookToken', function (err, user, info){
    console.log(err,info)
    if(!user){
      if(info&&info.code){
        delete info.code;
         return res.status(info.code).json(info);
      }
      return res.status(400).json(info);  
    }
    return res.status(200).json(user);
    })(req, res, next)
});
export default router;