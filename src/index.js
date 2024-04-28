// require ('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDb from "./database/connection.js";
dotenv.config({
    path:'./env'
})

connectDb();

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