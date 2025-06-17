import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import supabase from '../db/supabaseClient.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      throw new ApiError(401, "Access token is required");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decodedToken?.userId) {
      throw new ApiError(401, "Invalid access token");
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, full_name, avatar_url, wallet_balance, reputation_score')
      .eq('id', decodedToken.userId)
      .single();

    if (error || !user) {
      throw new ApiError(401, "Invalid access token - user not found");
    }

    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid access token");
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Access token has expired");
    }
    throw error;
  }
});

// // Optional middleware - doesn't throw error if no token
// export const optionalAuth = asyncHandler(async (req, res, next) => {
//   try {
//     const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    
//     if (!token) {
//       req.user = null;
//       return next();
//     }

//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
//     if (!decodedToken?.userId) {
//       req.user = null;
//       return next();
//     }

//     const { data: user, error } = await supabase
//       .from('users')
//       .select('id, email, username, full_name, avatar_url, wallet_balance, reputation_score')
//       .eq('id', decodedToken.userId)
//       .single();

//     req.user = error || !user ? null : user;
//     next();
    
//   } catch (error) {
//     req.user = null;
//     next();
//   }
// });

// // Admin middleware (if you have admin roles)
// export const verifyAdmin = asyncHandler(async (req, res, next) => {
//   if (!req.user) {
//     throw new ApiError(401, "Authentication required");
//   }

//   // Add your admin check logic here
//   // For example, if you have a role field:
//   // if (req.user.role !== 'admin') {
//   //   throw new ApiError(403, "Admin access required");
//   // }

//   next();
// });