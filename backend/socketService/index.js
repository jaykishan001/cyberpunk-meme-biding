import jwt from 'jsonwebtoken'
import supabase from '../src/db/supabaseClient.js'; // Add .js extension

let io;
const activeAuctions = new Map();
const connectedUsers = new Map();

const initializeSocket = (socketIo) => {
  io = socketIo;
  io.use(async (socket, next) => {
    try {

      const token = socket.handshake.auth.token;
      console.log("toekn comming", token)
      

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      console.log("User extracted", user);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`);
    connectedUsers.set(socket.userId, socket);

    console.log("Connected user array", connectedUsers);

    // Join auction rooms
    socket.on('join_auction', (auctionId) => {
      socket.join(`auction_${auctionId}`);
      console.log(`User ${socket.user.username} joined auction ${auctionId}`);
    });

    // Leave auction rooms
    socket.on('leave_auction', (auctionId) => {
      console.log(`User ${socket.user.username} leaved the auction ${auctionId}`);
      socket.leave(`auction_${auctionId}`);
    });

    // Handle new bids
    socket.on('place_bid', async (data) => {
      try {
        const { auctionId, bidAmount } = data;
        console.log("Auction id", auctionId, bidAmount);
        
        // Validate bid
        const { data: auction } = await supabase
          .from('auctions')
          .select('*, memes(*)')
          .eq('id', auctionId)
          .eq('status', 'active')
          .single();

        if (!auction) {
          socket.emit('bid_error', { message: 'Auction not found or not active' });
          return;
        }

        if (bidAmount <= auction.current_highest_bid) {
          socket.emit('bid_error', { message: 'Bid must be higher than current highest bid' });
          return;
        }

        // Check user balance
        if (socket.user.wallet_balance < bidAmount) {
          socket.emit('bid_error', { message: 'Insufficient balance' });
          return;
        }

        // Place bid
        const { data: newBid, error } = await supabase
          .from('bids')
          .insert({
            auction_id: auctionId,
            bidder_id: socket.userId,
            bid_amount: bidAmount
          })
          .select()
          .single();

        if (error) throw error;

        // Update auction
        await supabase
          .from('auctions')
          .update({
            current_highest_bid: bidAmount,
            highest_bidder_id: socket.userId
          })
          .eq('id', auctionId);

        // Broadcast new bid to all users in auction room
        io.to(`auction_${auctionId}`).emit('new_bid', {
          bid: newBid,
          bidder: {
            username: socket.user.username,
            avatar_url: socket.user.avatar_url
          },
          auction: auction
        });

      } catch (error) {
        console.error('Bid error:', error);
        socket.emit('bid_error', { message: 'Failed to place bid' });
      }
    });

    // socket.on('vote_meme', async (data) => {
    //   try {
    //     const { memeId, voteType } = data;
    //     console.log('memeID', memeId, voteType)
        
    //     const { error } = await supabase
    //       .from('votes')
    //       .upsert({
    //         user_id: socket.userId,
    //         meme_id: memeId,
    //         vote_type: voteType
    //       });

    //     if (error) throw error;

    //     // Get updated vote counts
    //     const { data: voteCounts } = await supabase
    //       .from('memes')
    //       .select('upvotes, downvotes')
    //       .eq('id', memeId)
    //       .single();

    //     // Broadcast vote update
    //     io.emit('vote_update', {
    //       memeId,
    //       upvotes: voteCounts.upvotes,
    //       downvotes: voteCounts.downvotes
    //     });

    //   } catch (error) {
    //     console.error('Vote error:', error);
    //     socket.emit('vote_error', { message: 'Failed to process vote' });
    //   }
    // });

    socket.on('vote_meme', async (data) => {
      try {
        const { memeId, voteType } = data;
        console.log('memeID', memeId, voteType)
        
        if (!['upvote', 'downvote'].includes(voteType)) {
          socket.emit('vote_error', { message: 'Invalid vote type' });
          return;
        }

        // Check existing vote
        const { data: existingVote, error: fetchVoteError } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', socket.userId)
          .eq('meme_id', memeId)
          .maybeSingle();

        if (fetchVoteError) {
          throw fetchVoteError;
        }

        let voteChange = false;

        if (!existingVote) {
          // New vote
          const { error: insertError } = await supabase
            .from('votes')
            .insert({
              user_id: socket.userId,
              meme_id: memeId,
              vote_type: voteType
            });

          if (insertError) throw insertError;
          voteChange = voteType;
        } else if (existingVote.vote_type !== voteType) {
          // Update existing vote
          const { error: updateError } = await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('user_id', socket.userId)
            .eq('meme_id', memeId);

          if (updateError) throw updateError;
          voteChange = voteType;
        } else {
          // Same vote - no change needed
          socket.emit('vote_already_registered', { 
            message: 'Vote already registered',
            memeId,
            voteType 
          });
          return;
        }

        // Update meme vote counts
        const incrementField = voteType === "upvote" ? "upvotes" : "downvotes";
        const decrementField = voteType === "upvote" ? "downvotes" : "upvotes";

        const updates = {
          [incrementField]: 1,
        };

        if (existingVote) {
          updates[decrementField] = -1;
        }

        const { error: memeUpdateError } = await supabase.rpc("update_meme_votes", {
          meme_id_input: memeId,
          upvote_delta: updates.upvotes || 0,
          downvote_delta: updates.downvotes || 0,
        });

        if (memeUpdateError) throw memeUpdateError;

        // Get updated vote counts
        const { data: updatedMeme } = await supabase
          .from('memes')
          .select('upvotes, downvotes')
          .eq('id', memeId)
          .single();

        // Broadcast vote update to all users globally
        io.emit('vote_update', {
          memeId: parseInt(memeId),
          upvotes: updatedMeme.upvotes,
          downvotes: updatedMeme.downvotes,
          voteType: voteType,
          userId: socket.userId,
          username: socket.user.username
        });

        // Send confirmation to the voter
        socket.emit('vote_success', {
          message: `Successfully ${voteChange}d meme`,
          memeId,
          upvotes: updatedMeme.upvotes,
          downvotes: updatedMeme.downvotes
        });

      } catch (error) {
        console.error('Vote error:', error);
        socket.emit('vote_error', { message: 'Failed to process vote' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
      connectedUsers.delete(socket.userId);
    });
  });
};

// const emitToAuction = (auctionId, event, data) => {
//   if (io) {
//     io.to(`auction_${auctionId}`).emit(event, data);
//   }
// };

// const emitToUser = (userId, event, data) => {
//   const userSocket = connectedUsers.get(userId);
//   if (userSocket) {
//     userSocket.emit(event, data);
//   }
// };


const emitToAuction = (auctionId, event, data) => {
  if (io) {
    io.to(`auction_${auctionId}`).emit(event, data);
  }
};

const emitToMeme = (memeId, event, data) => {
  if (io) {
    io.to(`meme_${memeId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  const userSocket = connectedUsers.get(userId);
  if (userSocket) {
    userSocket.emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export {
  initializeSocket,
  emitToAuction,
  emitToUser,
  emitToMeme,
  emitToAll
};

export const getIo = () => io;