
// creating a custom error handling class to manage errors in APIs
// by attaching extra info (status codes, error messages)


// inheriting built-in Error class to class ApiError
// to handle errors in API responses

class ApiError extends Error {
    constructor(
        statusCode,
        message= 'Something went wrong',
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode= statusCode
        this.data= null
        this.message= message
        this.success= false
        this.errors = errors

        if (stack){
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}
