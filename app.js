import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import asyncError from 'express-async-errors';
import connectDB  from './utils/db.js';
import auth from './middlewares/auth.mdw.js';

import classRouter from './routes/class.route.js';
import rootRouter from './routes/root.route.js';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

// Importing @sentry/tracing patches the global hub for tracing to work.
import * as Tracing from "@sentry/tracing";

const app = express();
dotenv.config();

//sentry----
Sentry.init({
  dsn: "https://f8ad67a1c9db43c8859a541517219bef@o1089680.ingest.sentry.io/6105125",
  integrations: [
    // Enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // Enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});
// const transaction = Sentry.startTransaction({
//   op: "test",
//   name: "My First Test Transaction",
// });

// setTimeout(() => {
//   try {
//     foo();
//   } catch (e) {
//     Sentry.captureException(e);
//   } finally {
//     transaction.finish();
//   }
// }, 99);

const PORT_FE = process.env.PORT_FE || 3000;
app.use(cors({
  origin: [`http://localhost:${PORT_FE}`,"https://gradebookplus.netlify.app",'http://localhost:63342',"https://gradebookplus-btn01.netlify.app","https://gradebookplus-btn02.netlify.app"],
  methods: 'GET,PATCH,POST,DELETE'
}));

app.use(express.json());
app.use(morgan('dev'));

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use('/',rootRouter);
app.use('/auth/', authRouter);
app.use('/user/', userRouter);
app.use('/class/', classRouter);

app.get('/err', function (req, res) {
  throw new Error('Error!');
});

app.use(function (req, res, next) {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});
app.use(Sentry.Handlers.errorHandler());
app.use(function (err, req, res, next) {
  console.log(err.stack);
  Sentry.captureException(err.stack)
  res.status(500).json({
    error: 'Something broke!'
  })
});
await connectDB();
const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
  console.log(`Gradebook API is listening at http://localhost:${PORT}`);
});