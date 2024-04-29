import { asynHandlers } from "../utils/ayncHandlers.js";


const registerUser=asynHandlers(async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
});

export default registerUser;