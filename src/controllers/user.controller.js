import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";

const register = asyncHandler(async (req, res) => {
    console.log("req.body 👉", req.body);
    console.log("req.files 👉", req.files);

    // Pull data safely from req.body
    const { email, username, fullName, password } = req.body || {};

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

export default register