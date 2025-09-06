import { Router } from "express";
import  { loginUser, logOutUser, register, refreshAccessTokens } from "../controllers/user.controller.js";
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


export default router