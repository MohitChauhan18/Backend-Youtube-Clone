import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`)
    console.log("Database is conneted");
    
  } catch (error) {
    console.log("Error in connection : ",error);
    process.exit(1)    
  }
}

export default connectDb