import dotenv from 'dotenv';
import classMemberService from '../services/class-member.service.js';
import userService from '../services/user.service.js';
import classService from '../services/class.service.js';
import requestService from '../services/request.service.js';
import passport from '../middlewares/passport.js';

dotenv.config();
export default {
    // auth(req,res,next){
    //   const accessToken = req.headers['x-access-token'];
    //   if (accessToken) {
    //     try {
    //       const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
    //       //console.log(decoded);
    //       req.userId = decoded.userId;
    //       req.roleUser = decoded.role;
    //       //console.log("userId:",req.userId);
    //       next();
    //     } catch (err) {
    //       //console.log(err);
    //       return res.status(401).json({
    //         message: 'Invalid or expired access token.'
    //       });
    //     }
    //   } else {
    //     return res.status(401).json({
    //       message: 'Access token is not found.'
    //     });
    //   }
    // },
    auth(req, res, next) {
        //return passport.authenticate('jwt', { session: false })(req,res,next);
        passport.authenticate(
            'jwt',
            {
                session: false,
            },
            function (error, user, info) {
                if (error || !user) {
                    return res.status(401).json({
                        message:
                            'Not found or Invalid or Expired access token.',
                    });
                }
                req.userId = user.userId;
                req.roleUser = user.roleUser;
                next();
            }
        )(req, res, next);
    },
    authAdminUser(req, res, next) {
        if (req.roleUser !== 'admin')
            return res.status(403).json({
                message: 'You do not have permission to access this area!',
            });
        next();
    },
    authMemberUser(req, res, next) {
        if (req.roleUser !== 'member')
            return res.status(403).json({
                message: 'You do not have permission to access this area!',
            });
        next();
    },
    async authMember(req, res, next) {
        //this.core(req,res);
        const id = req.params.id;
        if (!id) {
            return res.status(404).json({
                message: 'Not found class.',
            });
        }
        //console.log("Req.params.id=classid: ",id );
        let participating;
        try {
            participating = await classMemberService.findAMemberInAClass(
                req.userId,
                id
            );
            //console.log("PARTICIPATING1: ",participating);
        } catch (err) {
            return res.status(404).json({
                message: 'Not found.',
            });
        }

        //console.log("PARTICIPATING2: ",participating);
        if (participating) {
            //req.partId = participating._id;
            req.role = participating.role;
            
            //req.participating = participating;
            next();
        } else
            return res.status(403).json({
                message: 'You do not have permission to access this area!',
            });
    },
    // async authMember(req, res, next) {
    //   await this.coreMember(req,res);
    //   next();
    // },
    async authStudent(req, res, next) {
        // const participating =req.participating;
        if (!(req.role === 'student'))
            return res.status(403).json({
                message: 'You do not have permission to access this area!',
            });
        const infoUser = await userService.findById(req.userId);
        req.studentId = infoUser.studentId || null;
        next();
    },
    async authTeacher(req, res, next) {
        // const participating = req.participating;
        if (!(req.role === 'teacher'))
            return res.status(403).json({
                message: 'You do not have permission to access this area!',
            });

        next();
    },
    async authOwner(req, res, next) {
        // const participating = req.participating;
        const id = req.params.id;
        const classInfo = await classService.findById(id);
        if (classInfo.createdUser+"" === req.userId) {
            req.role = "owner"
        }
        if (!(req.role === 'owner')) {
            return res.status(403).json({
                message: 'Only class owner can use this feature!',
            });
        }

        next();
    },
    async class(req, res, next) {
        // const participating = req.participating;
        const id = req.params.id;
        let classObj = null;
        //console.log("id = ",id);
        if (id) classObj = await classService.findById(id);
        //console.log(classObj)
        if (classObj && classObj.status === 'disable')
            return res.status(410).json({
                message:
                    'This class is disable. Please contact Admin to recover this class.',
            });
        req.className = classObj.name;
        next();
    },
    async authRequest(req, res, next) {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({
                message: 'Invalid id.',
            });
        }
        let request = await requestService.findById(id);
        if (!request)
            return res.status(404).json({
                message: 'No found request.',
            });

        if (request.student + '' === req.userId) {
            req.roleReq = 'student';
            req.request = request;
        } else {
            const check = await classMemberService.findARoleInAClass(
                req.userId,
                request.class,
                'teacher'
            );
            if (!check)
                return res.status(403).json({
                    message:
                        'You do not have permision to access this request!',
                });
            req.roleReq = 'teacher';
            req.request = request;
        }
        next();
    },
};
