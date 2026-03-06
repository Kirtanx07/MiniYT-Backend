import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../../models/user.model.js"; // Corrected relative path
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { channel } from "diagnostics_channel";
import mongoose from "mongoose";

//generateAccessAndRefereshTokens
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}



const registerUser = asyncHandler(async (req, res) => {
    // 1. Get user details from frontend
    const { fullName, email, username, password } = req.body;

    // 2. Validation - Not Empty
    if ([fullName, email, username, password].some(
        (field) => field?.trim() === ""
    )) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User Exists Already");
    }

    // 4. Extract local file paths provided by Multer
    const avtarlocalPath = req.files?.avtar?.[0]?.path;
    //const coverImagePath = req.files?.coverImage?.[0]?.path;

    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path;
    }

    if (!avtarlocalPath) {
        throw new ApiError(400, "Avatar file is Required!");
    }

    // 5. Upload files to Cloudinary
    const avtar = await uploadOnCloudinary(avtarlocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    // Verify avatar upload succeeded
    if (!avtar) {
        throw new ApiError(400, "Error while uploading avatar to Cloudinary");
    }

    // 6. Create user entry in database
    const user = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "", // Corrected to match model field name 'coverimage'
        email,
        password,
        username: username.toLowerCase()
    });

    // 7. Remove sensitive fields from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // 8. Check for successful user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 9. Return success response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully")
    );
});

//Login User
const loginUser = asyncHandler(async(req,res) => {
    //req body
     //username or email
    //Find the user
    //password check
    

    const {username,email,password} = req.body
    if ((!username && !email) || !password) {
    throw new ApiError(400, "Username or Email and Password required")
    }


    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(400,"User Doesn't exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password) 

    if (!isPasswordValid){
        throw new ApiError(401,"Password is incorrect")
    }


    //Give acces token and refresh token To user
    //Send Cookies(secure)
    //Response
    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    //calling database
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,
                refreshToken
               
            }, "User Logged In Succesfully"
    
    )
)

   
});

//logout
const logOutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
        $set: {
            refreshToken:undefined,

        }
    },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {}, "User LoggedOut  Succesfully-6"
    
    ))

});


const refreshAccessToken = asyncHandler (async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Request-9")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET)
        if (!decodedToken) {
            throw new ApiError(401,"Unauthorized Request-10")
        }
        const user = User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401,"Invalid token-7")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh Token is expired or used")  
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refrehToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newrefreshToken},
                "Access Token Request"
    
        )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid RefrehToken")
        
    }
    

});

const changeCurrentPassword = asyncHandler(async(req,rees) => {
    const {oldPassworrd,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password-9");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {}, "Password Changed Succesfully-6"
    
    ))


});

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched Successfully"))

});

///add changes Permissions!
const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "FullName and Email are required")
    }       

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user},
            "Account details updated successfully"
        )
    )
});

const updateUserAvtar = asyncHandler(async(req,res) => {
    const avtarLocalPath = req.file?.path

    if (!avtarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)

    if (!avtar) {
        throw new ApiError(400, "Error while uploading avatar to Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avtar: avtar.url }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user},
            "Avatar updated successfully"
        )
    )
});

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path              
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is required")
    }   

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "Error while uploading cover image to Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {                           
            $set: {
                coverImage: coverImage.url
            }   
        },
        {
            new:true    
        }
    ).select("-password")       


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user},
            "Cover image updated successfully"
        )
    )
}   
);

const getUserChannelProfile =asyncHandler(async(req,res) => {
    const {username} = req.params
    if (!username) {
        throw new ApiError(400,"username is Missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()

            }

        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }

        },
        {
            $addFields:{
                subscribersCount : {
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if :{$in:[req.user?._id,"$subscribers.subscriber"],
                            then: true,
                            else:false

                        }
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avtar:1,
                email:1,
                coverImage:1


            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(400,"channel Does Not Exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel Fetched Succesfully!"
    )
)
});

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory"
                ,foreignField:"_id",
                as : "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avtar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    if (!user || user.length === 0) {
        throw new ApiError(404, "User not found")}

    

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )


});

export { registerUser ,
     loginUser , 
     logOutUser , 
     refreshAccessToken ,
      changeCurrentPassword ,
      getCurrentUser ,
      updateAccountDetails ,
      updateUserAvtar,
      getUserChannelProfile,
      updateUserCoverImage,
    getWatchHistory}; 