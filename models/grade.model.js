import mongoose from 'mongoose';
import gradeSchema from '../schemas/grade.schema.js';

const gradeModel = mongoose.model('grade', gradeSchema);
export default gradeModel;
