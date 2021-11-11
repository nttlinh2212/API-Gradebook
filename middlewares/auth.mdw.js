import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
export default function auth(req, res, next) {
  const accessToken = req.headers['x-access-token'];
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
      console.log(decoded);
      req.accessTokenPayload = decoded;
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
}