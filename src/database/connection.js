import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const  connectDb=async()=>{
    try {
      const connectionInstance=  await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`)
      console.log(`\n Mongodb connected DB:${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Error:",error);
    }
}
export default connectDb;