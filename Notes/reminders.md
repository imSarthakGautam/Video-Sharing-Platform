
### project structure : app.js & index.js(main)
**App.js**
- Express App : `const app = express()`
- import and use middlewares
- import routes and declare them
- `export {app}`

**index.js**
- `import {app} from './app.js'`
- dotenv.config()
- connect DB
- Listen on port

**src**
- controllers
- db
- middlewares
- routes
- utils
- models


## Reminders:

1. **Nodemon**  
   - Use for auto-reloading during development.

2. **Dotenv**  
   - Import and configure as early as possible to ensure environment variables are accessible immediately.  
   - Example:  
     ```javascript
     require("dotenv").config({ path: "./env" });
     ```
   - Or in Scripts itself:  
     ```json
     {
       "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
     }
     ```

3. **Database Operations**  
   - Wrap all database operations in a `try-catch` block.  
   - Use `async-await` for cleaner asynchronous code.

### Database Connection Approaches

1. **Function-Based**  
   ```javascript
   function connectDB() {
     // DB connection logic
   }
   connectDB();
   ```

2. **IIFE (Immediately Invoked Function Expression)**  
executed as soon as defined-
   ```javascript
   (async () => {
     try {
       // DB connection logic
     } catch (error) {
       console.error("Error connecting to DB:", error);
     }
   })();
   ```

### Example: Complete Setup itself in `index.js`

```javascript
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log("App is listening on port", process.env.PORT);
    });
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
})();
```
In this project however
```js
connectDB()
.then(()=>{ app.listen(port)})
```

### Middleware Usage

1. **Parsing JSON**  
   ```javascript
   app.use(express.json());
   ```
   - Automatically parses JSON data in request body and attaches it to `req.body`.
   - dont have to manually parse them to Js objects
   - Once parsed, the JSON data is conveniently accessible in the req.body object. This makes it easy to work with the data in your route handlers

2. **Parsing URL-Encoded Data**  
   ```javascript
   app.use(
     express.urlencoded({
       extended: true, // Allows handling deeply nested objects
     })
   );
   ```
   in url data is sent like `name=Bob&age=25` which is converted to 
    ```js
    {
        name: 'Bob',
        age: '25'
    }
    ```

### MongoDB Indexing for Searchability  
- To make a field searchable in MongoDB:  
  ```javascript
  { index: true }
  ```

### Mongoose Middlewares and Custom Methods  
- Use pre/post middleware for lifecycle hooks.  
- Define custom methods for schema instances or models.

### Routing Patterns

1. **In the Same File**  
   ```javascript
   app.get('/');
   ```

2. **Separate Route Files**  
   ```javascript
   app.use('/api/version/baseroute', routeName);
   ```

### Router Import Styles

1. **Standard Import**  
   ```javascript
   import express from 'express';
   const router = express.Router();
   ```
   Imports the entire express module.
   Accesses the Router function as a property of the express object using express.Router().
    
    useful if you also need other functionality from express, like express.json() or express.static().  


2. **Destructured Import**  
   ```javascript
   import { Router } from 'express';
   const router = Router();
   ```
   Only imports the Router function directly from the express module.

    This is a destructured import, extracting Router as a specific functionality from the module.

    Use this when you only need Router and don’t need the rest of Express's features in this file.


### Cookies

1. **Set a Cookie**  
   ```javascript
   res.cookie('name', value, options);
   ```

2. **Clear a Cookie**  
   ```javascript
   res.clearCookie('name');
   ```

### Refresh Token Workflow  [25]
- On access token expiry, allow the frontend to call an endpoint to send the refresh token.  
- Match the refresh token in the database and issue a new access token.

### Aggregation and ObjectId in MongoDB

1. **Problem**  [26]
   - `req.user._id` is a string, but MongoDB `_id` is an `ObjectId`.  
   - Normal queries handle type conversion automatically, but aggregation pipelines do not.

   - Aggregation pipelines require explicit type management because they don't automatically convert data types in operations like $match. Thus, when comparing values (like _id), you need to ensure they are of the same type (ObjectId), or the comparison will fail

2. **Solution**  
   ```javascript
   _id: mongoose.Types.ObjectId(req.user._id)
   ```

### Handling Empty Arrays in Aggregations
```javascript
subscribersCount: { $size: { $ifNull: ['$subscribers', []] } }
```

### Mongoose Pagination  
- **Install Plugin**  
  ```bash
  npm install mongoose-aggregate-paginate-v2
  ```
- **Usage**  
  ```javascript
  const mongoose = require('mongoose');
  const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

  mongooseAggregatePaginate.paginate.options = {
    // Custom options
  };
  mongoose.plugin(mongooseAggregatePaginate);
  ```

### Cloudinary: Deleting Videos
Specify resource type when deleting assets.  
```javascript
const result = await cloudinary.uploader.destroy(publicId, {
  resource_type: 'video',
  type: 'upload', // or 'authenticated'
});
```
