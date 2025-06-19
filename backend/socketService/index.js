import jwt from "jsonwebtoken";
import supabase from "../src/db/supabaseClient.js"; // Add .js extension

let io;
const activeAuctions = new Map();
const connectedUsers = new Map();

// --- Competition Logic ---
const competitionQueue = [];
const activeCompetitions = new Map(); // roomId -> { user1, user2, meme1, meme2, votes, status, timer }

const initializeSocket = (socketIo) => {
  io = socketIo;
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", decoded.userId)
        .single();

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.username} connected`);
    connectedUsers.set(socket.userId, socket);

    // Join auction rooms
    socket.on("join_auction", (auctionId) => {
      socket.join(`auction_${auctionId}`);
      console.log(`User ${socket.user.username} joined auction ${auctionId}`);
    });

    // Leave auction rooms
    socket.on("leave_auction", (auctionId) => {
      console.log(
        `User ${socket.user.username} leaved the auction ${auctionId}`
      );
      socket.leave(`auction_${auctionId}`);
    });

    // Handle new bids
    socket.on("place_bid", async (data) => {
      try {
        const { auctionId, bidAmount } = data;
        console.log("Auction id", auctionId, bidAmount);

        // Validate bid
        const { data: auction } = await supabase
          .from("auctions")
          .select("*, memes(*)")
          .eq("id", auctionId)
          .eq("status", "active")
          .single();

        if (!auction) {
          socket.emit("bid_error", {
            message: "Auction not found or not active",
          });
          return;
        }

        if (bidAmount <= auction.current_highest_bid) {
          socket.emit("bid_error", {
            message: "Bid must be higher than current highest bid",
          });
          return;
        }

        // Check user balance
        if (socket.user.wallet_balance < bidAmount) {
          socket.emit("bid_error", { message: "Insufficient balance" });
          return;
        }

        // Place bid
        const { data: newBid, error } = await supabase
          .from("bids")
          .insert({
            auction_id: auctionId,
            bidder_id: socket.userId,
            bid_amount: bidAmount,
          })
          .select()
          .single();

        if (error) throw error;

        // Update auction
        await supabase
          .from("auctions")
          .update({
            current_highest_bid: bidAmount,
            highest_bidder_id: socket.userId,
          })
          .eq("id", auctionId);

        // Broadcast new bid to all users in auction room
        io.to(`auction_${auctionId}`).emit("new_bid", {
          bid: newBid,
          bidder: {
            username: socket.user.username,
            avatar_url: socket.user.avatar_url,
          },
          auction: auction,
        });
      } catch (error) {
        console.error("Bid error:", error);
        socket.emit("bid_error", { message: "Failed to place bid" });
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

    // socket.on("vote_meme", async (data) => {
    //   try {
    //     const { memeId, voteType } = data;
    //     console.log("Data coming when updating vote", data);
    //     console.log(
    //       "memeID of the user who is making update vote call",
    //       memeId,
    //       voteType
    //     );

    //     if (!["upvote", "downvote"].includes(voteType)) {
    //       socket.emit("vote_error", { message: "Invalid vote type" });
    //       console.log("Error emiting emiting");
    //       return;
    //     }

    //     // Check existing vote
    //     const { data: existingVote, error: fetchVoteError } = await supabase
    //       .from("votes")
    //       .select("*")
    //       .eq("user_id", socket.userId)
    //       .eq("meme_id", memeId)
    //       .maybeSingle();

    //     if (fetchVoteError) {
    //       throw fetchVoteError;
    //     }

    //     console.log("Existing vote hai bhai", existingVote);

    //     let voteChange = false;

    //     if (!existingVote) {
    //       // New vote
    //       const { error: insertError } = await supabase.from("votes").insert({
    //         user_id: socket.userId,
    //         meme_id: memeId,
    //         vote_type: voteType,
    //       });

    //       if (insertError) throw insertError;
    //       voteChange = voteType;
    //     } else if (existingVote.vote_type !== voteType) {
    //       // Update existing vote
    //       const { error: updateError } = await supabase
    //         .from("votes")
    //         .update({ vote_type: voteType })
    //         .eq("user_id", socket.userId)
    //         .eq("meme_id", memeId);

    //       if (updateError) throw updateError;
    //       voteChange = voteType;
    //     } else {
    //       // Same vote - no change needed
    //       socket.emit("vote_already_registered", {
    //         message: "Vote already registered",
    //         memeId,
    //         voteType,
    //       });
    //       return;
    //     }

    //     // Update meme vote counts
    //     const incrementField = voteType === "upvote" ? "upvotes" : "downvotes";
    //     const decrementField = voteType === "upvote" ? "downvotes" : "upvotes";

    //     const updates = {
    //       [incrementField]: 1,
    //     };

    //     if (existingVote) {
    //       updates[decrementField] = -1;
    //     }

    //     // const {  error: memeUpdateError } = await supabase.rpc("update_meme_votes", {
    //     //   meme_id_input: memeId,
    //     //   upvote_delta: updates.upvotes || 0,
    //     //   downvote_delta: updates.downvotes || 0,
    //     // });
    //     const { data: updateddMeme, error: memeUpdateError } =
    //       await supabase.rpc("update_meme_votes", {
    //         meme_id_input: memeId,
    //         upvote_delta: updates.upvotes || 0,
    //         downvote_delta: updates.downvotes || 0,
    //       });

    //     console.log("Mememe me erro hai rpc not working", updateddMeme);

    //     if (memeUpdateError) throw memeUpdateError;

    //     // Get updated vote counts
    //     const { data: updatedMeme } = await supabase
    //       .from("memes")
    //       .select("upvotes, downvotes")
    //       .eq("id", memeId)
    //       .single();

    //     // Broadcast vote update to all users globally
    //     io.emit("vote_update", {
    //       memeId: parseInt(memeId),
    //       upvotes: updatedMeme.upvotes,
    //       downvotes: updatedMeme.downvotes,
    //       voteType: voteType,
    //       userId: socket.userId,
    //       username: socket.user.username,
    //     });

    //     // Send confirmation to the voter
    //     socket.emit("vote_success", {
    //       message: `Successfully ${voteChange}d meme`,
    //       memeId,
    //       upvotes: updatedMeme.upvotes,
    //       downvotes: updatedMeme.downvotes,
    //     });
    //   } catch (error) {
    //     console.error("Vote error:", error);
    //     socket.emit("vote_error", { message: "Failed to process vote" });
    //   }
    // });
    socket.on("vote_meme", async (data) => {
      try {
        const { memeId, voteType } = data;
        console.log("Data coming when updating vote", data);

        if (!["upvote", "downvote"].includes(voteType)) {
          socket.emit("vote_error", { message: "Invalid vote type" });
          return;
        }

        // Check existing vote
        const { data: existingVote, error: fetchVoteError } = await supabase
          .from("votes")
          .select("*")
          .eq("user_id", socket.userId)
          .eq("meme_id", memeId)
          .maybeSingle();

        if (fetchVoteError) throw fetchVoteError;

        let voteChange = false;

        if (!existingVote) {
          // Insert new vote
          const { error: insertError } = await supabase.from("votes").insert({
            user_id: socket.userId,
            meme_id: memeId,
            vote_type: voteType,
          });

          if (insertError) throw insertError;
          voteChange = voteType;
        } else if (existingVote.vote_type !== voteType) {
          // Update existing vote
          const { error: updateError } = await supabase
            .from("votes")
            .update({ vote_type: voteType })
            .eq("user_id", socket.userId)
            .eq("meme_id", memeId);

          if (updateError) throw updateError;
          voteChange = voteType;
        } else {
          // Same vote — no changes needed
          socket.emit("vote_already_registered", {
            message: "Vote already registered",
            memeId,
            voteType,
          });
          return;
        }

        // Prepare update counts
        const incrementField = voteType === "upvote" ? "upvotes" : "downvotes";
        const decrementField = voteType === "upvote" ? "downvotes" : "upvotes";

        const updates = {
          [incrementField]: 1,
        };

        if (existingVote) {
          updates[decrementField] = -1;
        }

        // Use updated RPC that returns updated meme (id, upvotes, downvotes)
        const { data: updatedData, error: memeUpdateError } =
          await supabase.rpc("update_meme_votes", {
            meme_id_input: memeId,
            upvote_delta: updates.upvotes || 0,
            downvote_delta: updates.downvotes || 0,
          });

        if (memeUpdateError) throw memeUpdateError;

        const updatedMeme = updatedData?.[0]; // RPC returns an array

        if (!updatedMeme) {
          throw new Error("No meme data returned from RPC");
        }

        // Broadcast to all users
        io.emit("vote_update", {
          memeId,
          upvotes: updatedMeme.upvotes,
          downvotes: updatedMeme.downvotes,
          voteType: voteType,
          userId: socket.userId,
          username: socket.user.username,
        });

        // Send confirmation back to the voter
        socket.emit("vote_success", {
          message: `Successfully ${voteChange}d meme`,
          memeId,
          upvotes: updatedMeme.upvotes,
          downvotes: updatedMeme.downvotes,
        });
      } catch (error) {
        console.error("Vote error:", error);
        socket.emit("vote_error", { message: "Failed to process vote" });
      }
    });

    // User joins the competition queue
    socket.on("join_competition_queue", async () => {
      if (competitionQueue.find((s) => s.userId === socket.userId)) return;
      competitionQueue.push(socket);
      if (competitionQueue.length >= 2) {
        const [user1, user2] = competitionQueue.splice(0, 2);
        const roomId = `competition_${Date.now()}_${user1.userId}_${
          user2.userId
        }`;
        activeCompetitions.set(roomId, {
          user1: user1.userId,
          user2: user2.userId,
          meme1: null,
          meme2: null,
          votes: {},
          status: "waiting",
          timer: null,
        });
        user1.join(roomId);
        user2.join(roomId);
        user1.emit("competition_start", { roomId, opponent: user2.user });
        user2.emit("competition_start", { roomId, opponent: user1.user });
        // Create row in competitions table
        await supabase.from("competitions").insert({
          id: roomId,
          user1_id: user1.userId,
          user2_id: user2.userId,
          status: "waiting",
        });
      }
    });

    // User submits meme for competition
    socket.on("submit_competition_meme", async ({ roomId, memeId }) => {
      const comp = activeCompetitions.get(roomId);
      if (!comp) return;
      let update = {};
      if (socket.userId === comp.user1) {
        comp.meme1 = memeId;
        update.meme1_id = memeId;
      }
      if (socket.userId === comp.user2) {
        comp.meme2 = memeId;
        update.meme2_id = memeId;
      }
      // Update competition row
      await supabase.from("competitions").update(update).eq("id", roomId);
      if (comp.meme1 && comp.meme2 && comp.status === "waiting") {
        comp.status = "active";
        await supabase
          .from("competitions")
          .update({ status: "active" })
          .eq("id", roomId);
        io.to(roomId).emit("competition_ready", {
          meme1: comp.meme1,
          meme2: comp.meme2,
        });
        // Start voting timer (e.g., 60 seconds)
        comp.timer = setTimeout(() => endCompetition(roomId), 60000);
      }
    });

    // Spectator joins competition room
    socket.on("join_competition_room", (roomId) => {
      socket.join(roomId);
    });

    // Spectator votes for a meme
    socket.on("vote_competition_meme", async ({ roomId, memeId }) => {
      const comp = activeCompetitions.get(roomId);
      if (!comp || comp.status !== "active") return;
      comp.votes[socket.userId] = memeId; // Only one vote per user
      // Optionally, emit live vote counts
      const voteCounts = { [comp.meme1]: 0, [comp.meme2]: 0 };
      Object.values(comp.votes).forEach((mid) => {
        if (voteCounts[mid] !== undefined) voteCounts[mid]++;
      });
      io.to(roomId).emit("competition_vote_update", voteCounts);
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.user.username} disconnected`);
      connectedUsers.delete(socket.userId);
      // Remove from queue if present
      const idx = competitionQueue.findIndex((s) => s.userId === socket.userId);
      if (idx !== -1) competitionQueue.splice(idx, 1);
    });
  });
};

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

export { initializeSocket, emitToAuction, emitToUser, emitToMeme, emitToAll };

export const getIo = () => io;

// End competition and announce winner
async function endCompetition(roomId) {
  const comp = activeCompetitions.get(roomId);
  if (!comp || comp.status !== "active") return;
  const voteCounts = { [comp.meme1]: 0, [comp.meme2]: 0 };
  Object.values(comp.votes).forEach((memeId) => {
    if (voteCounts[memeId] !== undefined) voteCounts[memeId]++;
  });
  let winnerMeme = comp.meme1;
  if (voteCounts[comp.meme2] > voteCounts[comp.meme1]) winnerMeme = comp.meme2;
  let winnerUser = winnerMeme === comp.meme1 ? comp.user1 : comp.user2;
  comp.status = "finished";
  // Update competitions table
  await supabase
    .from("competitions")
    .update({
      status: "finished",
      winner_id: winnerUser,
      ended_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  io.to(roomId).emit("competition_result", {
    winnerUser,
    winnerMeme,
    voteCounts,
  });
  activeCompetitions.delete(roomId);
}
