import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import classMemberService from '../services/class-member.service.js';


dotenv.config();
export default{
  auth(req,res,next){
    const accessToken = req.headers['x-access-token'];
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
        //console.log(decoded);
        req.accessTokenPayload = decoded;
        //console.log("Payload:",req.accessTokenPayload);
        next();
      } catch (err) {
        //console.log(err);
        return res.status(401).json({
          message: 'Invalid access token.'
        });
      }
    } else {
      return res.status(401).json({
        message: 'Access token not found.'
      });
    }
  },
  // auth(req, res, next) {
  //   this.core(req,res);
  //   next();
  // },
  async authMember(req,res,next){
    //this.core(req,res);
    const id = req.params.id;
    if(!id){
      return res.status(404).json({
        message: 'Not found class'
      });
    }
    //console.log("Req.params.id=classid: ",id );
    let participating;
    try{
      participating = await classMemberService.findAMemberInAClass(req.accessTokenPayload.userId,id);
      //console.log("PARTICIPATING1: ",participating);
    }catch(err){
      return res.status(404).json({
            message: 'Not found'
          });
    }
    
    //console.log("PARTICIPATING2: ",participating);
    if(participating){
      req.partId = participating._id;
      req.role = participating.role;
      req.participating = participating;
      next();
    }else
      return res.status(401).json({
        message: 'No permission'
      });
  },
  // async authMember(req, res, next) {
  //   await this.coreMember(req,res);
  //   next();
  // },
  async authStudent(req, res, next) {
    const participating =req.participating;
    if(!(req.role==="student"))
      return res.status(401).json({
        message: 'No permission'
      });
    req.studentId = participating.studentId||null;
    next();
  },
  async authTeacher(req, res, next) {
    const participating = req.participating;
    if(!(req.role==="teacher"))
      return res.status(401).json({
        message: 'No permission'
      });
    next();
  }
}
