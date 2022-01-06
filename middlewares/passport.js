import passport from 'passport';
import bcrypt from 'bcryptjs';
import randomstring from 'randomstring';
import * as passportLocal from 'passport-local';
import jwt from 'jsonwebtoken';
import userService from '../services/user.service.js';
import passportjwt from 'passport-jwt'
import userModel from '../models/user.model.js';
const LocalStrategy = passportLocal.Strategy;

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        session: false,
    },
      async function(email, password, done) {
        //console.log(email,password);
        let user = null;
        try{
            user = await userService.findByEmail(email);
        }catch(err){
            return done(err);
        }
            
        //console.log(user)
        
        if (user === null) {
            return done(null,false,{
                code:400,
                message:"Invalid email or password."
            });
        }
        if (user.status === "disable") {
            return done(null,false,{
                code:410,
                message:"This account is disable. Please contact Admin to recover this account."
            });
        }
        if (!user.verified) {
            return done(null,false,{
                code:411,
                message:"This email is not yet verified. Please verify this email to continue using the application."
            });
        }
        if (bcrypt.compareSync(password, user.password||"") === false) {
        return done(null,false,{
            code:400,
            message:"Invalid email or password."
            });
        }
    
        const opts = {
            expiresIn: 30 * 60 // seconds
        };
        const payload = {
            userId: user.id,
            role: user.role,
        };
        const accessToken = jwt.sign(payload,process.env.SECRET_KEY, opts);
    
        const refreshToken = randomstring.generate(80);
        await userService.patch(user.id, {
            rfToken: refreshToken
        });
    
        return done(null,{
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
    }
    
))

const JwtStrategy = passportjwt.Strategy;
const ExtractJwt = passportjwt.ExtractJwt;
const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
const opts = {
    jwtFromRequest,
    secretOrKey:process.env.SECRET_KEY
}

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    //console.log(opts);
    return done(null,{
        userId : jwt_payload.userId,
        roleUser : jwt_payload.role
    })
}));
export default passport;


