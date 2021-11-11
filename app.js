import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import asyncError from 'express-async-errors';
import connectDB  from './utils/db.js';
import auth from './middlewares/auth.mdw.js';

import classRouter from './routes/class.route.js';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import dotenv from "dotenv";

const app = express();
dotenv.config();


const PORT_FE = process.env.PORT_FE || 3000;
app.use(cors({
  origin: `http://localhost:${PORT_FE}`,
  methods: 'GET,PATCH,POST,DELETE'
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth/', authRouter);
app.use('/api/user/', userRouter);
app.use('/api/class/', auth, classRouter);

app.get('/err', function (req, res) {
  throw new Error('Error!');
});

app.use(function (req, res, next) {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(500).json({
    error: 'Something broke!'
  })
});
await connectDB();
const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
  console.log(`Gradebook API is listening at http://localhost:${PORT}`);
});