import { asynHandlers } from "../utils/ayncHandlers.js";


const registerUser=asynHandlers(async(req,res)=>{
    const {fname,lname,email,contact_no}=req.body;
    res.status(200).json({
        message:"ok"
    })
});
const loginUser=asynHandlers(async(req,res)=>{
    const {email, password}=req.body;
    res.status(200).json({
        message:"ok"
    })
});
export {registerUser,loginUser};