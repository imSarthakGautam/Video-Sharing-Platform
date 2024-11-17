import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

let userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique : true,
            lowercase : true,
            trim: true,

            index: true
        },

        email: {
            type: String,
            required: true,
            unique : true,
            lowercase : true,
            trim: true,
        },

        fullname: {
            type: String,
            required: true,
            trim: true,

            index: true
        },

        avatar : {
            type : String, //cloudinary url
            required : true
        },

        coverImage : {
            type : String, //cloudinary url
        },

        hasChannel : {
            type : Boolean

        },

        watchHistory : [{
            type : Schema.Types.ObjectId,
            ref : 'Video'
        }],

        password : {
            type : String,
            required : [true, "Password is required"]
        },

        refreshToken : {
            type : String
        }

    },
    {
        timestamps: true
    }
  
)

//before saving perform some action like middleware
userSchema.pre('save', async function(next){
    //run only when password feild is referenced

    if(!this.isModified('password')) return next();
    this.password= await bcrypt.hash(this.password, 10)
    next();
})

//-----------custom methods in mongoose---
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
    //returns true or false
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign({
        //payload
        _id: this._id,
        email: this.email,
        fullname: this.fullname
    },
    //Secret Key
    process.env.ACCESS_TOKEN_SECRET,
    //expiry
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign({
        //payload
        _id: this._id,
        
    },
    //Secret Key
    process.env.REFRESH_TOKEN_SECRET,
    //expiry
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}



export const User = mongoose.model('User', userSchema)