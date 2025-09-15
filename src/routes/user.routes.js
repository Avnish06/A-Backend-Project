import { Router } from "express";
import  { loginUser, logOutUser, register, refreshAccessTokens, changeCurrentpassword, getCurrentUser, updateUserDetails, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getuserChannelsProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post( upload.fields([
        {
           name: "avataar",
           maxCount: 1

        },
        {
           name: "coverImage",
         maxCount: 1

        }
       ]),   
    register
)

router.route("/login").post(loginUser)

//Secured routes
router.route("/logout").post(verifyJWT,logOutUser)
router.route("refresh-token").post(refreshAccessTokens)
router.route("/change-password").post(verifyJWT, changeCurrentpassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avataar"), updateUserAvatar)
router.route("/cover-Image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("c/:username").get(verifyJWT, getuserChannelsProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


export default router