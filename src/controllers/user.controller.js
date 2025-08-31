import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";


const register = asyncHandler(async (requestAnimationFrame, res) => {

    //Get user details from frontend
    //Check validation -  it is empty or not
    //Chek that username or email already exist or not.
    //Vallidate avataar and images.
    //Upload them on the clodinary
    //create user object - create entry in the db
    //remove password and refresh token field from response
    //check for user creations
    //Send the res

    const { email, username, fullName, avataar, password } = req.body
    console.log(email)

    if ([email, username, fullName, avataar, password].some((field) =>

        field?.trim() === ""
    )) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0].path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar us needed here")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)
    // const coverImage = await uploadonCloudinary(coverImageLocalPath)


    let coverImage;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImage = req.files.coverImage[0].path
    }


    if (!avatar) {
        throw new ApiError(400, "Avatar us needed here")
    }

    const user = await User.create({

        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully",)
    )

})

export default register
