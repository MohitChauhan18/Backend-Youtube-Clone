import { Router } from "express";
import { changePassword, generateNewAccessToken, getCurrentUser, getWatchHistory, loginUser, logoutUser, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJwt,logoutUser)
router.route("/refresh-token").post(generateNewAccessToken)
router.route("/change-password").post(verifyJwt,changePassword)
router.route("/get-current-user").post(verifyJwt,getCurrentUser)
router.route("/update-details").post(verifyJwt,updateAccountDetails)
router.route("/update-avatar").patch(verifyJwt,upload.single("avatar"),updateAvatar)
router.route("/update-coverImage").patch(verifyJwt,upload.single("coverImage"),updateCoverImage)
router.route("/c/:userName").get(verifyJwt,getCurrentUser)
router.route("/watch-history").get(verifyJwt,getWatchHistory)

export default router