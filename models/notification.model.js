import mongoose from "mongoose";
import notiSchema from "../schemas/notification.schema.js";

const notiModel = mongoose.model(
    "notification",
    notiSchema
);
export default notiModel;
