import mongoose from 'mongoose';
import classMemberSchema from '../schemas/class-member.schema.js';

const classMemberModel = mongoose.model('class_member', classMemberSchema);
export default classMemberModel;
