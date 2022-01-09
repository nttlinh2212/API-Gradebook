import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import asyncError from 'express-async-errors';
import connectDB from './utils/db.js';
import auth from './middlewares/auth.mdw.js';

import classRouter from './routes/class.route.js';
import rootRouter from './routes/root.route.js';
import reqRouter from './routes/request.route.js';
import userRouter from './routes/user.route.js';
import adminRouter from './routes/admin.route.js';
import authRouter from './routes/auth.route.js';
import notiRouter from './routes/notification.route.js';
import dotenv from 'dotenv';
import authMdw from './middlewares/auth.mdw.js';
import passport from './middlewares/passport.js';
import createWs from './ws.js';

const app = express();
dotenv.config();

const PORT_FE = process.env.PORT_FE || 3000;
app.use(
    cors({
        origin: [
            `http://localhost:${PORT_FE}`,
            'https://gradebookplus.netlify.app',
            'http://localhost:63342',
            'https://gradebookplus-btn01.netlify.app',
            'https://gradebookplus-btn02.netlify.app',
            'https://gradebookplus-final.netlify.app',
            'https://gradebookplus.xyz',
            'https://gallant-cori-eb6952.netlify.app',
        ],
        methods: 'GET,PATCH,POST,DELETE',
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(passport.initialize());

app.use('/', rootRouter);
app.use('/auth/', authRouter);
app.use('/user/', userRouter);
app.use('/admin/', authMdw.auth, authMdw.authAdminUser, adminRouter);
app.use('/class/', classRouter);
app.use('/request/', reqRouter);
app.use('/noti/', notiRouter);

app.use(function (req, res, next) {
    res.status(404).json({
        error: 'Endpoint not found.',
    });
});

app.use(function (err, req, res, next) {
    console.log(err.stack);
    res.status(500).json({
        error: 'Something went wrong. Please try again.',
    });
});
await connectDB();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, function () {
    console.log(`Gradebook API is listening at http://localhost:${PORT}`);
});
createWs(server);
