import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    console.log("Request reached controller");
    //get user details from forntend
    const {fullName, email ,username, password}=req.body
    console.log("email:", email);

    //validation-Not Empty

    if ([fullName, email, username, password].some(
    (field) => field?.trim() === ""
)) {
    throw new ApiError(400, "All fields are required");
}

    //check if user already exists: username and email

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"User Exists Already")
    }

    //files-avtar and cover image!check
    console.log("FILES:", req.files);
    //const avtarlocalPath = req.files?.avtar[0]?.path;
    //const coverImagePath = req.files?.coverImage[0]?.path;
    const avtarlocalPath = req.files?.avtar?.[0]?.path;
    const coverImagePath = req.files?.coverImage?.[0]?.path;
    

    if (!avtarlocalPath) {
        throw new ApiError(400,"Avtar File is Required!")
    }
    //upload them to cloudnary-reference url //avtar check
    const avtar = await uploadOnCloudinary(avtarlocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if (!avtar) {
        throw new ApiError(400,"Avtar file is Required!")
    }

    
    //create user object -- create entry in db
    const User = await User.create({
        fullName,
        avtar:avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refresh token field from response
    const createdUser = await User.findById(User._id).select(
        "-password -refreshToken"
    )

    
    //check for user creation
    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while Registering the user")
    }

    
    //return response

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User Registerd Succesfully")
    )



});

export {registerUser,}

//http://localhost:8000/api/v1/users/register