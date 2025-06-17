// import { ApiResponse } from '../utils/api-response.js';
// import { ApiError } from '../utils/api-error.js';
// import {asyncHandler} from '../utils/async-handler.js'
// import supabase from '../db/supabaseClient.js'
// import bcrypt from 'bcryptjs'
// import jwt from 'jsonwebtoken'

// const generateToken = (userId) => {
//   return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
// };

// export const signup = asyncHandler(async (req, res) => {
    
//     const { email, username, password, fullName } = req.body;

//     console.log(email, fullName, password)

//     // Check if user already exists - remove .single() to avoid error when no user found
//     console.log('Checking for existing users...');
//     const { data: existingUsers, error: checkError } = await supabase
//       .from('users')
//       .select('id')
//       .or(`email.eq.${email},username.eq.${username}`);

//     console.log('Existing users check result:', { existingUsers, checkError });

//     if (checkError) {
//       console.error('Error checking existing user:', checkError);
//       return res.status(500).json(new ApiError(500, "Database error"));
//     }

//     if (existingUsers && existingUsers.length > 0) {
//       console.log('User already exists:', existingUsers);
//       return res.status(400).json(new ApiError(400, "User already exists"));
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const avatar_url = `https://api.dicebear.com/9.x/bottts/svg?seed=${username}`
    
//     const { data: user, error } = await supabase
//       .from('users')
//       .insert({
//         email,
//         username,
//         full_name: fullName,
//         password_hash: hashedPassword,
//         avatar_url: avatar_url
//       })
//       .select('id, email, username, full_name, wallet_balance, reputation_score')
//       .single();

//     console.log("user", user);
    
//     if (error) {
//       console.error('Error creating user:', error);
//       return res.status(500).json(new ApiError(500, "Failed to create user"));
//     }

//     const token = generateToken(user.id);

//     res.status(201).json(new ApiResponse(201, {user, token}, "User created successfully!"))
// })

// export const login = asyncHandler(async (req, res) => {
  
//     const { email, password } = req.body;

//     const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

//     if (error || !user) {
//       return res.status(401).json(new ApiError(401, "Invalid credentials", error));
//     }

//     const isValidPassword = await bcrypt.compare(password, user.password_hash);
//     if (!isValidPassword) {
//       return res.status(401).json(new ApiError(401, "Invalid credentials", error));
//     }

//     console.log("logined user", user)
//     const token = generateToken(user.id);
//     // delete user.password_hash;

//     res.status(200).json(new ApiResponse(200, {token, user}, "Login successfully!"))
// })


// export const getProfile = asyncHandler(async (req, res) => {

//     const { data: user, error } = await supabase
//       .from('users')
//       .select('id, email, username, full_name, avatar_url, wallet_balance, reputation_score, created_at')
//       .eq('id', req.user.id)
//       .single();

//     if (error) throw error;

//     res.json({ user });

// }
// )


import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js'
import supabase from '../db/supabaseClient.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = asyncHandler(async (req, res) => {
  const { email, username, password, fullName } = req.body;

  if (!email || !username || !password || !fullName) {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  console.log('Checking for existing users...');
  
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id, email, username')
    .or(`email.eq.${email},username.eq.${username}`);

  if (checkError) {
    console.error('Error checking existing user:', checkError);
    throw new ApiError(500, "Database error while checking existing user");
  }

  if (existingUsers && existingUsers.length > 0) {
    const existingUser = existingUsers[0];
    if (existingUser.email === email) {
      throw new ApiError(400, "User with this email already exists");
    }
    if (existingUser.username === username) {
      throw new ApiError(400, "Username is already taken");
    }
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const avatar_url = `https://api.dicebear.com/9.x/bottts/svg?seed=${username}`;

  const { data: user, error: insertError } = await supabase
    .from('users')
    .insert({
      email,
      username,
      full_name: fullName,
      password_hash: hashedPassword,
      avatar_url: avatar_url
    })
    .select('id, email, username, full_name, wallet_balance, reputation_score, avatar_url, created_at')
    .single();

  if (insertError) {
    console.error('Error creating user:', insertError);
    throw new ApiError(500, "Failed to create user account");
  }

  const token = generateToken(user.id);


  res.cookie('token', token, cookieOptions);

  res.status(201).json(
    new ApiResponse(201, { user, token }, "User registered successfully!")
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user.id);


  const { password_hash, ...userWithoutPassword } = user;

  res.cookie('token', token, cookieOptions);

  res.status(200).json(
    new ApiResponse(200, { user: userWithoutPassword, token }, "Login successful!")
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json(
    new ApiResponse(200, {}, "Logout successful!")
  );
});

export const getProfile = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, full_name, avatar_url, wallet_balance, reputation_score, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw new ApiError(500, "Failed to fetch user profile");
  }

  res.status(200).json(
    new ApiResponse(200, { user }, "Profile fetched successfully!")
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;
  const userId = req.user.id;

  if (username) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .single();

    if (existingUser) {
      throw new ApiError(400, "Username is already taken");
    }
  }

  const updateData = {};
  if (fullName) updateData.full_name = fullName;
  if (username) updateData.username = username;

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, username, full_name, avatar_url, wallet_balance, reputation_score')
    .single();

  if (error) {
    throw new ApiError(500, "Failed to update profile");
  }

  res.status(200).json(
    new ApiResponse(200, { user }, "Profile updated successfully!")
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new ApiError(404, "User not found");
  }
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new ApiError(400, "Current password is incorrect");
  }


  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hashedNewPassword })
    .eq('id', userId);

  if (updateError) {
    throw new ApiError(500, "Failed to update password");
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully!")
  );
});