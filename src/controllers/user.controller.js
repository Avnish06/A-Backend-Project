import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import Jwt from "jsonwebtoken";



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

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    console.log(req.files)
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

const refreshAccessTokens = asyncHandler(async (req, res) => {


    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, " Unauthorized request")
    }

    try {
        const decodedToken = Jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET

        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {

            httpOnly: true,
            secure: true
        }

        const { newaccesstokens, newrefreshtokens } = await generateAccessandRefreshTokens(user._id)


        return res
            .status(200)
            .cookie("accessToken", newaccesstokens, options)
            .cookie("refreshToken", newrefreshtokens, options)
            .json(

                new ApiResponse(

                    200,
                    { accesstokens, refreshToken: newrefreshtokens },
                    "Access token refreshed successfully"


                )


            )


    } catch (error) {

        throw new ApiError(401, error?.message || "Invalid refresh tokens.")

    }


})

const changeCurrentpassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword, confPassword } = req.body

    if (newPassword != confPassword) {

        throw new ApiError(401, "The new Password and Confpassword is nor same")

    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password, that you are providing is not correct")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })


    return res.
        status(200)
        .json(new ApiResponse(200, {}, "Password change successfully "))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const currentUser = req.user

    res.status(200)
        .json(new ApiResponse(200, currentUser, "Current user fetched successfully"))


})

const updateUserDetails = asyncHandler(async (req, res) => {

    const { fullName, email, } = req.body

    if (!fullName || !email) {
        throw new ApiError(401, "User details is required")
    }

    const user = User.findByIdAndUpdate(req.user._id,
        {

            $set: {

                fullName,
                email

            }

        },
        { new: true }).select("-password")

    return res.status(200)
        .json(newApiResponse(200, user, "User details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => { 

    const avatarLocaPath = req.file?.path

    if (!avatarLocaPath) {

        throw new ApiError("400", "Please give the avatar to upload.")

    }
           
    const avatar = await uploadonCloudinary(avatarLocaPath)
    if (!avatar.url) {
        throw new ApiError(500, "Something Went wrong")
    }
             
    const user2 = User.findById(req.user._id)
    user2.avatar.url = ""

    const user =User.findByIdAndUpdate(req.user._id,

        {
            $set: {

                avatar: avatar.url

            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
              .json(
                new ApiResponse(200,
                user,
                "Avatar updated successfully")
              )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const CoverImageLocalPath = req.file?.path

    if (!CoverImageLocalPath) {

        throw new ApiError("400", "Please give the coverImage to upload.")

    }

    const coverImage = await uploadonCloudinary(CoverImageLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Something Went wrong")
    }

    const user = User.findByIdAndUpdate(req.user._id,

        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")


    return res.status(200)
        .json(
            new ApiResponse(

                200,
                user,
                "CoverImage update Successfully"
            )
        )
    })

const getuserChannelsProfile = asyncHandler(async(req, res)=> {

    const {username} = req.params 
    if(!username?.trim())
    {
      throw new ApiError(400, "User Name is missing")
    }

    User.find({username})

    const chanel = await User.aggregate([])


})


    export {
        register,
        loginUser,
        logOutUser,
        refreshAccessTokens,
        changeCurrentpassword,
        getCurrentUser,
        updateUserDetails,
        updateUserAvatar,
        updateUserCoverImage

    }