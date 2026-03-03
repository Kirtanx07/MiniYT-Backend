import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const userSchema = new mongoose.Schema(
    {username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    
    watchHistory:{
        type:[{
            type: Schema.Types.ObjectId,
            ref:"Video"
        }]
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true,
        //cloudnary service
    },
    coverimage:{
        type:String,
        //cloudnary service
    },
    password:{
        type:String,
        //encrpt
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String,

    },
    createdAt:{},
    updatedAt:{}


    },{timestamps:true})

userSchema.pre("save" , async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


userSchema.methods.isPasswordCorrect = async function 
(password) {
    return await bcrypt.compare(password. this.password)
}

userSchema.methods.genrateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }

)
}


userSchema.methods.genrateRefreshToken = function() {
    return jwt.sign({
        _id: this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_SECRET
    }

)
}


export const User = mongoose.model("user",userSchema)