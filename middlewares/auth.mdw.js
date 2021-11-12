import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import classMemberService from '../services/class-member.service.js';


dotenv.config();
export default{
  auth(req, res, next) {
    const accessToken = req.headers['x-access-token'];
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
        console.log(decoded);
        req.accessTokenPayload = decoded;
        console.log("Payload:",req.accessTokenPayload)
        next();
      } catch (err) {
        console.log(err);
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
  async authMember(req, res, next) {
    const accessToken = req.headers['x-access-token'];
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
        console.log(decoded);
        req.accessTokenPayload = decoded;
        console.log("Payload:",req.accessTokenPayload)
        if(!req.query.id){
          return res.status(404).json({
            message: 'Not found'
          });
        }
        console.log("Req.query.id=classid: ", req.query.id);
        const participating = await classMemberService.findAMemberInAClass(req.accessTokenPayload.userId,req.query.id);
        console.log("PARTICIPATING: ",participating);
        if(participating){
          req.role = participating.role;
          next();
        }else
          return res.status(401).json({
            message: 'No permission'
          });
          
        
      } catch (err) {
        console.log(err);
        return res.status(401).json({
          message: 'Invalid access token.'
        });
      }
    } else {
      return res.status(401).json({
        message: 'Access token not found.'
      });
    }
  }
}
