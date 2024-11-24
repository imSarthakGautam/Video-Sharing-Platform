import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    let existingSub = await Subscription.findOne({channel: channelId, subscriber:req.user._id})
    if (!existingSub) {    
        const sub =await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
            
        })
        return res.status(200).json(new ApiResponse(201, { sub }, 'Subscribed to Channel successfully'));
    }

    
    await  existingSub.deleteOne() 
    return res.status(200).json(new ApiResponse(200, {}, 'Subscription toggled successfully'))
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    

    // Step 1: Fetch subscribers for the given channel
    const channelSubscribers = await Subscription.aggregate([
        // Match subscriptions for the given channel
        { 
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        // Lookup subscriber details from the User collection
        {
            $lookup: {
                from: 'users', // User collection
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriberDetails'
            }
        },
        {
            $unwind: { path: '$subscriberDetails', preserveNullAndEmptyArrays: true }
        },
        // Project only the required fields
        {
            $project: {
                subscriberId: '$subscriberDetails._id',
                username: '$subscriberDetails.username', // Adjust based on your schema         
            }
        }
    ]);

    console.log('Channle Subscribers', channelSubscribers)

    // Step 2: Handle no subscribers
    if (!channelSubscribers.length) {
        throw new ApiError(404, 'No subscribers found for this channel');
    }

    // Step 3: Return the structured response
    return res.status(200).json(
        new ApiResponse(200, { subscribers: channelSubscribers }, 'Channel subscribers fetched successfully')
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    

    // Step 1: Fetch the subscriptions of the given subscriber
    const subscribedChannels = await Subscription.aggregate([
        
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId) // Match subscriptions for the given subscriber
                
            }
        },
        // stage2:  Lookup channel details from the User collection
        {
            $lookup: {
                from: 'users', // User collection
                localField: 'channel',
                foreignField: '_id',
                as: 'channelDetails'
            }
        },
        // Flatten the channelDetails array
        {
            $unwind: '$channelDetails'
        },
        // stage 3: Lookup to count subscribers for each channel from the Subscription collection
        {
            $lookup: {
                from: 'subscriptions', // Subscription collection
                localField: 'channel',
                foreignField: 'channel',
                as: 'subscriberDetails'
            }
        },
        // Add a field for the subscriber count
        {
            $addFields: {
                subscribersCount: { $size: '$subscriberDetails' }
            }
        },
        // Project only the necessary fields
        {
            $project: {
                channelId: '$channelDetails._id',
                channelName: '$channelDetails.channelName', // Adjust based on your User schema
                username: '$channelDetails.username', // Adjust based on your User schema
                subscribersCount: 1
            }
        }
    ]);

    console.log('Subscribed channels',subscribedChannels)

    // Step 2: Check if no subscribed channels exist
    if (!subscribedChannels.length) {
        throw new ApiError(404, 'No subscribed channels found');
    }

    // Step 3: Structure the response
    return res.status(200).json(
        new ApiResponse(200, { channels: subscribedChannels }, 'Subscribed channels fetched successfully')
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}