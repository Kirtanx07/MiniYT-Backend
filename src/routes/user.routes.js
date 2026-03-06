import { Router } from "express";
import { loginUser, registerUser ,logOutUser , refreshAccessToken, changeCurrentPassword,
     getCurrentUser, updateAccountDetails, updateUserAvtar, updateUserCoverImage 
     , getWatchHistory, getUserChannelProfile } from "../controllers/user.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avtar",
            maxCount:1

        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    
    registerUser);

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT , logOutUser)
router.route("/refreshtoken").post(refreshAccessToken)
router.route("/change-Password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avtar").patch(verifyJWT,upload.single("avtar"),updateUserAvtar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverimage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router;