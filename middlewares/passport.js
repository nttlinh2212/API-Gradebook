import passport from 'passport';
import bcrypt from 'bcryptjs';
import randomstring from 'randomstring';
import * as passportLocal from 'passport-local';
import jwt from 'jsonwebtoken';
import userService from '../services/user.service.js';
import passportjwt from 'passport-jwt';
import userModel from '../models/user.model.js';
const LocalStrategy = passportLocal.Strategy;

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            session: false,
        },
        async function (email, password, done) {
            //console.log(email,password);
            let user = null;
            try {
                user = await userService.findByEmail(email);
            } catch (err) {
                return done(err);
            }

            //console.log(user)

            if (user === null) {
                return done(null, false, {
                    code: 400,
                    message: 'Invalid email or password.',
                });
            }
            if (user.status === 'disable') {
                return done(null, false, {
                    code: 410,
                    message:
                        'This account is disable. Please contact Admin to recover this account.',
                });
            }
            if (!user.verified) {
                return done(null, false, {
                    code: 411,
                    message:
                        'This email is not yet verified. Please verify this email to continue using the application.',
                });
            }
            if (bcrypt.compareSync(password, user.password || '') === false) {
                return done(null, false, {
                    code: 400,
                    message: 'Invalid email or password.',
                });
            }

            const opts = {
                expiresIn: process.env.TOKEN_EXPIRE * 60, // seconds
            };
            const payload = {
                userId: user.id,
                role: user.role,
            };
            const accessToken = jwt.sign(payload, process.env.SECRET_KEY, opts);

            const refreshToken = randomstring.generate(80);
            await userService.patch(user.id, {
                rfToken: refreshToken,
            });

            return done(null, {
                authenticated: true,
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.name,
                email: user.email,
                role: user.role,
                accessToken,
                refreshToken,
            });
        }
    )
);

const JwtStrategy = passportjwt.Strategy;
const ExtractJwt = passportjwt.ExtractJwt;
const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
const opts = {
    jwtFromRequest,
    secretOrKey: process.env.SECRET_KEY,
};

passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
        //console.log(opts);
        return done(null, {
            userId: jwt_payload.userId,
            roleUser: jwt_payload.role,
        });
    })
);

import FacebookTokenStrategy from 'passport-facebook-token';

passport.use(
    'facebookToken',
    new FacebookTokenStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                //   console.log('profile', profile);
                //   console.log('accessToken', accessToken);
                //   console.log('refreshToken', refreshToken);
                const facebookId = profile.id;
                let profile_email = profile.emails[0].value;
                let exist = null,
                    exist1 = null;
                if (!profile_email || profile_email === '') {
                    profile_email = null;
                } else {
                    exist = await userService.findByEmail(profile_email);
                }
                exist1 = await userService.findByFbId(facebookId);
                let userId, firstName, lastName, name, email, role;
                if (!exist && !exist1) {
                    let objUser = {
                        facebookId,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        name:
                            profile.name.givenName +
                            ' ' +
                            profile.name.familyName,
                        role: 'member',
                        verified: true,
                    };
                    if (profile_email) {
                        objUser.email = profile_email;
                    }
                    const user = await userService.add(objUser);
                    userId = user._id;
                    firstName = user.firstName;
                    lastName = user.lastName;
                    name = user.name;
                    email = user.email;
                    role = user.role;
                } else {
                    if (exist && !exist.facebookId) {
                        //console.log("no google id",exist, exist._id);
                        console.log(
                            await userService.patch(exist._id, {
                                facebookId,
                            })
                        );
                    }
                    if (exist && exist.status && exist.status === 'disable') {
                        return done(null, false, {
                            code: 410,
                            message:
                                'This account is disable. Please contact Admin to recover this account.',
                        });
                    }
                    if (
                        exist1 &&
                        exist1.status &&
                        exist1.status === 'disable'
                    ) {
                        return done(null, false, {
                            code: 410,
                            message:
                                'This account is disable. Please contact Admin to recover this account.',
                        });
                    }
                    if (exist && !exist.verified) {
                        await userService.patch(exist._id, { verified: true });
                    }
                    if (exist) {
                        userId = exist._id;
                        firstName = exist.firstName;
                        lastName = exist.lastName;
                        name = exist.name;
                        email = exist.email;
                        role = exist.role;
                    } else if (exist1) {
                        userId = exist1._id;
                        firstName = exist1.firstName;
                        lastName = exist1.lastName;
                        name = exist1.name;
                        email = exist1.email;
                        role = exist1.role;
                    }
                }

                const opts = {
                    expiresIn: process.env.TOKEN_EXPIRE * 60, // seconds
                };
                const payload = {
                    userId,
                    role,
                };
                const accessToken = jwt.sign(
                    payload,
                    process.env.SECRET_KEY,
                    opts
                );

                const refreshToken = randomstring.generate(80);
                await userService.patch(userId, {
                    rfToken: refreshToken,
                });

                return done(null, {
                    authenticated: true,
                    _id: userId,
                    firstName,
                    lastName,
                    name,
                    email,
                    accessToken,
                    refreshToken,
                    role,
                });
            } catch (error) {
                done(error, false, error.message);
            }
        }
    )
);

export default passport;
