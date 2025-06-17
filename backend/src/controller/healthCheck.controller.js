import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const healthCheck = asyncHandler(async(req, res)=>{

    res.json(new ApiResponse(200, null, "Ok"))

})