import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();


app.use(cors({
    option:process.env.CORS_ORGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}));//For getting json
app.use(express.urlencoded({extended:true,limit:"16kb"}));// Request getting from json
app.use(express.static("public")); // For storing static image, pdf and another at local 
app.use(cookieParser()); //For storing the cookie 


// Import user router
import userRouter from "./routes/user.routers.js";


// Declaration of route
app.use("/api/v1/users",userRouter)
export {app};