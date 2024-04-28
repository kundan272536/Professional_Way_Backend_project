// require ('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDb from "./database/connection.js";
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})

connectDb().then(()=>{
   app.listen(process.env.PORT || 8000,()=>{
    console.log(`Server is runnig at port http://localhost:8000`);
   })
}).catch((err)=>{
   console.log("MongoDb Connection Failed!!!:",err);
})

/*
const dbConnection=async ()=>{
    try{
    mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    }
    catch(err){
        console.error("ERROR:",err);
    }
}
module.exports=dbConnection;
*/