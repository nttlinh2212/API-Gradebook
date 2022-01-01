import mongoose from "mongoose";
import requestSchema from "../schemas/request.schema.js";

const requestModel = mongoose.model(
    "grade",
    requestSchema
);
export default requestModel;
