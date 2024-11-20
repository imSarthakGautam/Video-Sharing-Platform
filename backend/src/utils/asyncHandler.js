
const asyncHandler = (requestHandler) =>{
    //check asyncHandler.md if confused...
    return (req, res, next)=>{

        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>{next(err)})
        //if error occurs forwarded to next [express's error handler] for handling
    }
}

export {asyncHandler}

