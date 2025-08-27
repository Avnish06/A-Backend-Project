import { asyncHandler } from "../utils/asyncHandler.js";

 const register = asyncHandler(async(requestAnimationFrame, res) => {

    res.status(200).json({

        message: "Ok",
    })
})


export default {register}
