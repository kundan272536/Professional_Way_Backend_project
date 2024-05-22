import { Router } from "express";
import  {registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getWatchHistory, 
    getUserChannelProfile} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import { verifyJwt } from "../middleware/auth.middleware.js";

const router=Router();
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:5
        }
    ]),
    registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt,changeCurrentPassword);
router.route("/current-user").get(verifyJwt,getCurrentUser);
router.route("/update-account").patch(verifyJwt,updateAccountDetails);
router.route("/avtar").patch(verifyJwt,upload.single("avtar"),updateUserAvatar);
router.route("/cover-image").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage);
router.route("/c/:username").get(verifyJwt,getUserChannelProfile);
router.route("/history").get(verifyJwt,getWatchHistory);
export default router