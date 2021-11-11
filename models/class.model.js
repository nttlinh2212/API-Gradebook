import mongoose from "mongoose";
import classSchema from "../schemas/class.schema.js";

const classModel = mongoose.model(
    "class",
    classSchema
);
export default classModel;
