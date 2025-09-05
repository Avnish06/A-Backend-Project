import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { JsonWebTokenError } from "jsonwebtoken";



//Get users details from Frontend
//validation- Not empty
//Check if the users already there: with username & email
//Upload them to cloduinary: avatar and coerImage
//Create user object && create entry in db
//remove password and tokens field from the response
//check for user creation
//return repsponse


const generateAccessandRefreshTokens = async (userid) => {

    try {

        const user = await User.findById(userid)
        const accessToken = user.genarateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })


        return { accessToken, refreshToken }

    } catch (error) {

        throw new ApiError(500, "Something went wrong while generating Access and refresh tokens")

    }
}


const register = asyncHandler(async (req, res) => {

    // Pull data safely from req.body
    const { email, username, fullName, password } = req.body;

    if (![email, username, fullName, password].every(field => field && field.trim() !== "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Handle files
    const avatarLocalPath = req.files?.avataar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avataar is required");
    }

    // Upload avatar
    const avataar = await uploadonCloudinary(avatarLocalPath);
    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadonCloudinary(coverImageLocalPath);
    }

    if (!avataar) {
        throw new ApiError(400, "Avataar upload failed");
    }

    // Save user
    const user = await User.create({
        fullName,
        avataar: avataar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {

    //Steps to logged in a user
    //req body -> data
    //username or mail
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const { email, username, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "Email or username is required")
    }


    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User is not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user")
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-refreshToken -password")

    const options = {

        httpOnly: true,
        secure: true

    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(

            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "user logged in successfully"
            )
        )

})

//steps to logout an User
//To remove the cookies first
//Then remove the tokens

const logOutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {

        $set: {

            refreshToken: undefined

        }
    },
        {

            new: true

        },
        

    )
  const options = {

        httpOnly: true,
        secure: true

    }
  
    return res
       .status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(new ApiResponse(200, {}, "User loggedOut Successfully"))




})


const refreshAccessTokens = asyncHandler(async(req, res) => {

    
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken) {


   throw new ApiError(401," Unauthorized request")

   JsonWebTokenError.verify(


    
   )



   }


})





export { register, loginUser, logOutUser }