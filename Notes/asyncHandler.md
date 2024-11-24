asyncHandler is introduced to wrap any asynchronous function :
could be middleware function or route handler functions.


**It is used to avoid repetitive try-catch blocks.**
---

```js
 //const asyncHandler = (fn) => { ()=>{} } returns another function
 export const asyncHandler = (fn) => async (req, res, next)=>{
    try{
        await fn(req,res, next)

    } catch (error){
        res.status(error.code || 500).json({
            success :false,
            message : error.message
        })
    }
 }
```

This fn is typically your `route handler or middleware function`, which has the signature `(req, res, next)`.

When this function is passed to asyncHandler it returns the new function that wraps function `fn`

when wrapped in it the function `fn` is executed asynchronously.

this wrapper catches errors that might occurs inside requestHandler when executing the function `fn` 



```js
const asyncHandler = (requestHandler) =>{
    
    return (req, res, next)=>{

        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>{next(err)})
        //if error occurs forwarded to next [express's error handler] for handling
    }
}
```
