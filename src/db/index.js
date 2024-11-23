import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionIntence = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST : ${connectionIntence.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connectin Failed ", error);
    process.exit(1);
  }
};
export default connectDB 
