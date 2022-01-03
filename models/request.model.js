import mongoose from "mongoose";
import requestSchema from "../schemas/request.schema.js";

const requestModel = mongoose.model(
    "request",
    requestSchema
);
export default requestModel;
