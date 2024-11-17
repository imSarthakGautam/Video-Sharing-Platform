
const asyncHandler = (requestHandler) =>{
    //takes aync function as input.


    //returns a wrapped function :
    // this wrapper catches errors that might occurs inside requestHandler
    (req, res, next)=>{

        Promise.resolve()
        .catch((err)=>{next(err)})
        //if error occurs forwarded to next [express's error handler] for handling
    }
}




//-------------------Approach 2----

 //const asyncHandler = (fn) =>{ ()=>{} }
 /*
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
*/
