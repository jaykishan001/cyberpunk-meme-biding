import supabase from '../db/supabaseClient.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getIo } from '../../socketService/index.js'; 

export const uploadMeme = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'No image file provided');
    }

    console.log("User in upload meme", req.user)
    const { title, description } = req.body;
    const imageUrl = await uploadToCloudinary(req.file.path, "memes");


    console.log("Image url", imageUrl)

    const memedata = await supabase.from('memes').select("*");
  
    console.log("supabase meme", memedata)

    const { data: meme, error } = await supabase
      .from('memes')
      .insert({
        title,
        description,
        image_url: imageUrl,
        creator_id: req.user.id,
        current_owner_id: req.user.id,
      })
      .select(`*,creator:users!creator_id(username, avatar_url),current_owner:users!current_owner_id(username, avatar_url)`)

    if (error) throw new ApiError(500, "Failed to insert meme", error);

    res.status(201).json(new ApiResponse(201, { meme }, "Meme uploaded successfully"));
  
}
)

export const getMemes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;

  const numericPage = parseInt(page, 10);
  const numericLimit = parseInt(limit, 10);
  const offset = (numericPage - 1) * numericLimit;

  const { data: memes, error } = await supabase
    .from('memes')
    .select(`
      *,
      creator:users!creator_id(username, avatar_url),
      current_owner:users!current_owner_id(username, avatar_url)
    `)
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + numericLimit - 1);

  if (error) throw error;

  res.status(200).json({
    success: true,
    page: numericPage,
    limit: numericLimit,
    memes
  });
});



// export const voteOnMeme = asyncHandler(async (req, res) => {
//   const { memeId } = req.params;
//   const { voteType } = req.body; 
//   const userId = req.user.id;

//   if (!['upvote', 'downvote'].includes(voteType)) {
//     throw new ApiError(400, "Invalid vote type");
//   }

//   const { data: existingVotes, error: fetchVoteError } = await supabase
//     .from("votes")
//     .select("*")
//     .eq("user_id", userId)
//     .eq("meme_id", memeId)
//     .maybeSingle();

//   if (fetchVoteError) {
//     throw new ApiError(500, "Failed to check existing vote", fetchVoteError);
//   }

//   let voteChange = false;

//   if (!existingVotes) {
//     await supabase.from("votes").insert({
//       user_id: userId,
//       meme_id: memeId,
//       vote_type: voteType,
//     });

//     voteChange = voteType;
//   } else if (existingVotes.vote_type !== voteType) {
//     await supabase
//       .from("votes")
//       .update({ vote_type: voteType })
//       .eq("user_id", userId)
//       .eq("meme_id", memeId);

//     voteChange = voteType;
//   } else {
//     return res.status(200).json(new ApiResponse(200, null, "Vote already registered"));
//   }

//   const incrementField = voteType === "upvote" ? "upvotes" : "downvotes";
//   const decrementField = voteType === "upvote" ? "downvotes" : "upvotes";

//   const updates = {
//     [incrementField]: 1,
//   };

//   if (existingVotes) {
//     updates[decrementField] = -1;
//   }

//   const { error: memeUpdateError } = await supabase.rpc("update_meme_votes", {
//     meme_id_input: memeId,
//     upvote_delta: updates.upvotes || 0,
//     downvote_delta: updates.downvotes || 0,
//   });

//   if (memeUpdateError) {
//     throw new ApiError(500, "Failed to update meme votes", memeUpdateError);
//   }

//   res.status(200).json(new ApiResponse(200, null, `Successfully ${voteChange}d meme`));
// });


export const voteOnMeme = asyncHandler(async (req, res) => {
  const { memeId } = req.params;
  const { voteType } = req.body; 
  const userId = req.user.id;

  if (!['upvote', 'downvote'].includes(voteType)) {
    throw new ApiError(400, "Invalid vote type");
  }

  const { data: existingVotes, error: fetchVoteError } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", userId)
    .eq("meme_id", memeId)
    .maybeSingle();

  if (fetchVoteError) {
    throw new ApiError(500, "Failed to check existing vote", fetchVoteError);
  }

  let voteChange = false;

  if (!existingVotes) {
    await supabase.from("votes").insert({
      user_id: userId,
      meme_id: memeId,
      vote_type: voteType,
    });

    voteChange = voteType;
  } else if (existingVotes.vote_type !== voteType) {
    await supabase
      .from("votes")
      .update({ vote_type: voteType })
      .eq("user_id", userId)
      .eq("meme_id", memeId);

    voteChange = voteType;
  } else {
    return res.status(200).json(new ApiResponse(200, null, "Vote already registered"));
  }

  const incrementField = voteType === "upvote" ? "upvotes" : "downvotes";
  const decrementField = voteType === "upvote" ? "downvotes" : "upvotes";

  const updates = {
    [incrementField]: 1,
  };

  if (existingVotes) {
    updates[decrementField] = -1;
  }

  const { error: memeUpdateError } = await supabase.rpc("update_meme_votes", {
    meme_id_input: memeId,
    upvote_delta: updates.upvotes || 0,
    downvote_delta: updates.downvotes || 0,
  });

  if (memeUpdateError) {
    throw new ApiError(500, "Failed to update meme votes", memeUpdateError);
  }

  
  const { data: updatedMeme, error: fetchError } = await supabase
    .from('memes')
    .select('upvotes, downvotes')
    .eq('id', memeId)
    .single();

  if (fetchError) {
    console.error('Error fetching updated vote counts:', fetchError);
  } else {
    // Emit real-time update to all connected users
    const io = getIo();
    if (io) {
      io.emit('vote_update', {
        memeId: parseInt(memeId),
        upvotes: updatedMeme.upvotes,
        downvotes: updatedMeme.downvotes,
        voteType: voteType,
        userId: userId,
        username: req.user.username // Assuming you have username in req.user
      });
    }
  }

  res.status(200).json(new ApiResponse(200, {
    upvotes: updatedMeme?.upvotes,
    downvotes: updatedMeme?.downvotes
  }, `Successfully ${voteChange}d meme`));
});


export const getUserMemes = asyncHandler(async (req, res) => {

    const { data: memes, error } = await supabase
      .from('memes')
      .select(`
        *,
        creator:users!creator_id(username, avatar_url)
      `)
      .eq('creator_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(new ApiResponse(200, memes ,"retrived successfully" ));
 
})