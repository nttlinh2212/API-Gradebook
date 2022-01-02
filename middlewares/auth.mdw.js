import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import classMemberService from '../services/class-member.service.js';
import userService from '../services/user.service.js';
import classService from '../services/class.service.js';
import requestService from '../services/request.service.js';


dotenv.config();
export default{
  auth(req,res,next){
    const accessToken = req.headers['x-access-token'];
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
        //console.log(decoded);
        req.userId = decoded.userId;
        req.roleUser = decoded.role;
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
  authAdminUser(req,res,next){
    if(req.roleUser!=="admin")
      return res.status(403).json({
        message: 'No permission'
      });
    next();
  },
  authMemberUser(req,res,next){
    if(req.roleUser!=="member")
      return res.status(403).json({
        message: 'No permission'
      });
    next();
  },
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
      participating = await classMemberService.findAMemberInAClass(req.userId,id);
      //console.log("PARTICIPATING1: ",participating);
    }catch(err){
      return res.status(404).json({
            message: 'Not found'
          });
    }
    
    //console.log("PARTICIPATING2: ",participating);
    if(participating){
      //req.partId = participating._id;
      req.role = participating.role;
      //req.participating = participating;
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
    // const participating =req.participating;
    if(!(req.role==="student"))
      return res.status(401).json({
        message: 'No permission'
      });
    const infoUser = await userService.findById(req.userId);
    req.studentId = infoUser.studentId||null;
    next();
  },
  async authTeacher(req, res, next) {
    // const participating = req.participating;
    if(!(req.role==="teacher"))
      return res.status(401).json({
        message: 'No permission'
      });
    
    next();
  },
  async class(req, res, next) {
    // const participating = req.participating;
    const id = req.params.id;
    let classObj = null;
    //console.log("id = ",id);
    if(id)
      classObj = await classService.findById(id);
    //console.log(classObj)
    if(classObj&&classObj.status === 'disable')
      return res.status(401).json({
        message: 'This class is disable. Please contact Admin to recover this class.'
      });
    next();
  },
  async authRequest(req,res,next){
    const id = req.params.id;
    if(!id){
      return res.status(404).json({
        message: 'Not found request'
      });
    }
    let request = await requestService.findById(id);

    if(request){
      if(request.student === req.userId){
        req.roleReq = "student";
        return next();
      }
      const check = await classMemberService.findATeacherInAClass(req.userId,request.class);
      if(check){
        req.roleReq = "teacher";
        return next();
      }
      return res.status(401).json({
        message: 'You do not have permision to access this request'
      });
    }else
      return res.status(404).json({
        message: 'No found request'
      });
  },
}
