# MongoDB Aggregation Pipeline: User Channel Information



## **Overview of the Pipeline**

The pipeline aggregates data from two collections:
1. **`User`** collection – stores user information (e.g., username, fullname, avatar, etc.).
2. **`Subscription`** collection – stores subscription details, which links users to the channels they subscribe to and vice versa.

### **Steps in the Aggregation Pipeline**

The aggregation pipeline is structured in the following stages:

### **Stage 1: `$match` - Filter Users by Username**
```javascript
{
   $match: {
      username: username?.toLowerCase()
   }
}
```
- **Purpose**: This stage filters the documents in the `User` collection, returning the user document that matches the provided `username`.
- **Explanation**: 
  - The `$match` operator is used to filter the documents based on a condition.
  - The `username?.toLowerCase()` ensures case-insensitive matching for the provided username.
  - The output of this stage is a filtered user document.

### **Stage 2: `$lookup` - Get Subscribers**
```javascript
{
   $lookup: {
      from: 'Subscription',
      localField: '_id',
      foreignField: 'channel',
      as: 'subscribers'
   }
}
```
- **Purpose**: This stage performs a **left join** to fetch all subscriptions where the current user is the **channel**.
- **Explanation**: 
  - `localField: '_id'` specifies the field from the `User` collection (i.e., the user’s unique ID).
  - `foreignField: 'channel'` specifies the field in the `Subscription` collection that links to the channel (i.e., the subscribed-to user).
  - The result is stored in the `subscribers` array, which contains all subscriptions where the user is the channel.
- **Output**: Each document now has a `subscribers` array containing subscription documents related to the user as a channel.

### **Stage 3: `$lookup` - Get Subscriptions (Subscribed Channels)**
```javascript
{
   $lookup: {
      from: 'Subscription',
      localField: '_id',
      foreignField: 'subscriber',
      as: 'subscribedTo'
   }
}
```
- **Purpose**: This stage performs another **left join** to fetch all subscriptions where the current user is the **subscriber**.
- **Explanation**: 
  - `localField: '_id'` refers to the user’s unique ID.
  - `foreignField: 'subscriber'` refers to the `subscriber` field in the `Subscription` collection.
  - The result is stored in the `subscribedTo` array, which contains all subscriptions where the user is a subscriber.
- **Output**: Each document now has a `subscribedTo` array, containing the subscriptions of the current user.

### **Stage 4: `$addFields` - Add Extra Fields for Subscribers Count, Subscribed Count, and Subscription Status**
```javascript
{
   $addFields: {
      subscribersCount: {
         $size: "$subscribers"
      },
      subscribedToCount: {
         $size: "$subscribedTo"
      },
      isSubscribed: {
         $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscribed"] },
            then: true,
            else: false
         }
      }
   }
}
```
- **Purpose**: This stage adds additional fields that will provide useful information about the user’s channel and subscriptions:
  1. **`subscribersCount`**: The total number of people subscribing to the channel.
  2. **`subscribedToCount`**: The total number of channels the user is subscribed to.
  3. **`isSubscribed`**: A boolean value indicating if the logged-in user is subscribed to this channel.
  
- **Explanation**:
  - **`subscribersCount`**: Uses the `$size` operator to count the number of elements in the `subscribers` array.
  - **`subscribedToCount`**: Uses the `$size` operator to count the number of elements in the `subscribedTo` array.
  - **`isSubscribed`**: 
    - `$cond`: A conditional statement that checks if the logged-in user (`req.user._id`) exists in the `subscribers.subscribed` field.
    - `$in`: Checks if the logged-in user's ID exists in the array of `subscribers.subscribed`.
    - If the user is found in the `subscribed` field, `isSubscribed` is set to `true`; otherwise, it's set to `false`.

### **Stage 5: `$project` - Select Final Fields for Output**
```javascript
{
   $project: {
      fullname: 1,
      username: 1,
      subscribersCount: 1,
      subscribedToCount: 1,
      isSubscribed: 1,
      avatar: 1,
      coverImage: 1
   }
}
```
- **Purpose**: This stage allows us to **select** and **shape** the final output.
- **Explanation**:
  - The `$project` operator is used to specify which fields should appear in the final document.
  - Fields with a value of `1` are included in the output.
  - The final output will include:
    - `fullname`, `username`, `avatar`, `coverImage` – Basic user details.
    - `subscribersCount`, `subscribedToCount`, `isSubscribed` – Subscription-related counts and status.

---

## **Example Output of the Pipeline**
After executing the above aggregation, each user document will look something like this:

```json
{
  "_id": ObjectId("60c72b2f5f1b2c001f8b4d9b"),
  "fullname": "John Doe",
  "username": "john_doe",
  "subscribersCount": 150,
  "subscribedToCount": 5,
  "isSubscribed": true,
  "avatar": "path/to/avatar.jpg",
  "coverImage": "path/to/cover.jpg"
}
```
