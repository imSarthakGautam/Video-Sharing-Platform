import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

let videoSchema = new Schema({

    videoFile: {
        url : {
            type : String, //cloudinary url
            
        },
        publicId : {
            type : String, //cloudinary uniqueId
            
        }
        
    }, 

    thumbnail: {
        url : {
            type : String, //cloudinary url
            
        },
        publicId : {
            type : String, //cloudinary uniqueId
            
        }
    },

    owner:{ 
        type: Schema.Types.ObjectId,
        ref: 'User'
    }, 

    title: {
        type: String,
        required : true,
    },

    description: {
        type:String
    },
    
    duration: {
        type:Number,
        required: true
    }, //duration in seconds

    views: {
        type:Number,
        default:0,
    },

    isPublished: {
        type:Boolean
    },

    owner : {
        type: Schema.Types.ObjectId
    }
    

},{
    required : true
}
)

//powerful Mongoose plugin that extends the capabilities of MongoDB aggregation pipelines by adding pagination and sorting features.

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)