import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { emitToAuction, getIo } from '../../socketService/index.js'


export const createAuction = asyncHandler(async (req, res) => {
  const { memeId, startingBid, duration } = req.body;
  console.log("Aution creating", memeId, startingBid, duration);
  if (!memeId || !startingBid || !duration) {
    throw new ApiError(400, 'Meme ID, starting bid, and duration are required');
  }

  // Check if meme exists and user owns it
  const { data: meme, error: memeError } = await supabase
    .from('memes')
    .select('*')
    .eq('id', memeId)
    .eq('current_owner_id', req.user.id)
    .single();

    console.log("if meme exist and user ownIt", meme);

  if (memeError || !meme) {
    throw new ApiError(404, 'Meme not found or you do not own this meme');
  }

  // Check if meme is already in an active auction
  const { data: existingAuction } = await supabase
    .from('auctions')
    .select('id')
    .eq('meme_id', memeId)
    .eq('status', 'active')
    .single();

  console.log("Is active auction", existingAuction);

  if (existingAuction) {
    throw new ApiError(400, 'This meme is already in an active auction');
  }

  // Calculate end time
  const endTime = new Date(Date.now() + duration * 60 * 1000); // duration in minutes

  // Create auction
  const { data: auction, error } = await supabase
    .from('auctions')
    .insert({
      meme_id: memeId,
      seller_id: req.user.id,
      starting_price: startingBid,
      current_highest_bid: startingBid,
      auction_end_time: endTime.toISOString(),
      status: 'active'
    })
    .select(`
      *,
      memes(*),
      seller:users!seller_id(username, avatar_url)
    `)
    .single();

  console.log("Auction created", auction);

  if (error) {
    throw new ApiError(500, 'Failed to create auction', error);
  }

  // Notify all users about new auction
  const io = getIo();
  io.emit('new_auction', {
    auction,
    message: `New auction started for "${meme.title}"`
  });

  res.status(201).json(new ApiResponse(201, { auction }, 'Auction created successfully'));
});

// Get all active auctions
export const getActiveAuctions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { data: auctions, error } = await supabase
    .from('auctions')
    .select(`
      *,
      memes(*),
      seller:users!seller_id(username, avatar_url),
      highest_bidder:users!highest_bidder_id(username, avatar_url),
      bids(count)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new ApiError(500, 'Failed to fetch auctions', error);
  }

  res.status(200).json(new ApiResponse(200, { auctions }, 'Auctions fetched successfully'));
});


export const getAuctionById = asyncHandler(async (req, res) => {
  const { auctionId } = req.params;

  const { data: auction, error } = await supabase
    .from('auctions')
    .select(`
      *,
      memes(*),
      seller:users!seller_id(username, avatar_url),
      highest_bidder:users!highest_bidder_id(username, avatar_url),
      bids(
        *,
        bidder:users!bidder_id(username, avatar_url)
      )
    `)
    .eq('id', auctionId)
    .single();

  if (error || !auction) {
    throw new ApiError(404, 'Auction not found');
  }

  res.status(200).json(new ApiResponse(200, { auction }, 'Auction fetched successfully'));
});

// Place a bid (HTTP endpoint - the main bidding is handled via Socket.IO)
export const placeBid = asyncHandler(async (req, res) => {
  const { auctionId } = req.params;
  const { bidAmount } = req.body;

  if (!bidAmount || bidAmount <= 0) {
    throw new ApiError(400, 'Valid bid amount is required');
  }

  // Get auction details
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select(`
      *,
      memes(*),
      seller:users!seller_id(username, avatar_url)
    `)
    .eq('id', auctionId)
    .single();

  if (auctionError || !auction) {
    throw new ApiError(404, 'Auction not found');
  }

  // Check if auction is active
  if (auction.status !== 'active') {
    throw new ApiError(400, 'Auction is not active');
  }

  // Check if auction has ended
  if (new Date() > new Date(auction.end_time)) {
    throw new ApiError(400, 'Auction has ended');
  }

  // Check if user is trying to bid on their own auction
  if (auction.seller_id === req.user.id) {
    throw new ApiError(400, 'You cannot bid on your own auction');
  }

  // Check if bid is higher than current highest bid
  if (bidAmount <= auction.current_highest_bid) {
    throw new ApiError(400, 'Bid must be higher than current highest bid');
  }

  // Check user balance
  if (req.user.wallet_balance < bidAmount) {
    throw new ApiError(400, 'Insufficient wallet balance');
  }

  // Place bid
  const { data: newBid, error: bidError } = await supabase
    .from('bids')
    .insert({
      auction_id: auctionId,
      bidder_id: req.user.id,
      bid_amount: bidAmount
    })
    .select(`
      *,
      bidder:users!bidder_id(username, avatar_url)
    `)
    .single();

  if (bidError) {
    throw new ApiError(500, 'Failed to place bid', bidError);
  }

  // Update auction with new highest bid
  const { error: updateError } = await supabase
    .from('auctions')
    .update({
      current_highest_bid: bidAmount,
      highest_bidder_id: req.user.id
    })
    .eq('id', auctionId);

  if (updateError) {
    throw new ApiError(500, 'Failed to update auction', updateError);
  }

  // Notify all users in the auction room
  emitToAuction(auctionId, 'new_bid', {
    bid: newBid,
    auction: { ...auction, current_highest_bid: bidAmount, highest_bidder_id: req.user.id },
    message: `${req.user.username} placed a bid of $${bidAmount}`
  });

  res.status(200).json(new ApiResponse(200, { bid: newBid }, 'Bid placed successfully'));
});

// End auction manually (only seller can do this before time expires)
export const endAuction = asyncHandler(async (req, res) => {
  const { auctionId } = req.params;

  // Get auction details
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select(`
      *,
      memes(*),
      seller:users!seller_id(username, avatar_url),
      highest_bidder:users!highest_bidder_id(username, avatar_url)
    `)
    .eq('id', auctionId)
    .single();

  if (auctionError || !auction) {
    throw new ApiError(404, 'Auction not found');
  }

  // Check if user is the seller
  if (auction.seller_id !== req.user.id) {
    throw new ApiError(403, 'Only the seller can end the auction');
  }

  // Check if auction is active
  if (auction.status !== 'active') {
    throw new ApiError(400, 'Auction is not active');
  }

  // End the auction
  const { error: endError } = await supabase
    .from('auctions')
    .update({ status: 'ended' })
    .eq('id', auctionId);

  if (endError) {
    throw new ApiError(500, 'Failed to end auction', endError);
  }

  // Transfer ownership if there was a highest bidder
  if (auction.highest_bidder_id) {
    // Transfer meme ownership
    const { error: transferError } = await supabase
      .from('memes')
      .update({ current_owner_id: auction.highest_bidder_id })
      .eq('id', auction.meme_id);

    if (transferError) {
      throw new ApiError(500, 'Failed to transfer meme ownership', transferError);
    }

    // Update wallet balances
    await Promise.all([
      // Deduct from winner
      supabase.rpc('update_wallet_balance', {
        user_id: auction.highest_bidder_id,
        amount: -auction.current_highest_bid
      }),
      // Add to seller
      supabase.rpc('update_wallet_balance', {
        user_id: auction.seller_id,
        amount: auction.current_highest_bid
      })
    ]);
  }

  // Notify all users in the auction room
  emitToAuction(auctionId, 'auction_ended', {
    auction,
    winner: auction.highest_bidder,
    winningBid: auction.current_highest_bid,
    message: auction.highest_bidder_id 
      ? `Auction ended! Won by ${auction.highest_bidder.username} for $${auction.current_highest_bid}`
      : 'Auction ended with no bids'
  });

  res.status(200).json(new ApiResponse(200, { auction }, 'Auction ended successfully'));
});

// Get user's auctions (as seller)
export const getUserAuctions = asyncHandler(async (req, res) => {
  const { status } = req.query; // 'active', 'ended', or 'all'
  
  let query = supabase
    .from('auctions')
    .select(`
      *,
      memes(*),
      highest_bidder:users!highest_bidder_id(username, avatar_url),
      bids(count)
    `)
    .eq('seller_id', req.user.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: auctions, error } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch user auctions', error);
  }

  res.status(200).json(new ApiResponse(200, { auctions }, 'User auctions fetched successfully'));
});

// Get user's bids
export const getUserBids = asyncHandler(async (req, res) => {
  const { data: bids, error } = await supabase
    .from('bids')
    .select(`
      *,
      auctions(
        *,
        memes(*),
        seller:users!seller_id(username, avatar_url)
      )
    `)
    .eq('bidder_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ApiError(500, 'Failed to fetch user bids', error);
  }

  res.status(200).json(new ApiResponse(200, { bids }, 'User bids fetched successfully'));
});

// Get auction bid history
export const getAuctionBidHistory = asyncHandler(async (req, res) => {
  const { auctionId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // First check if auction exists
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('id')
    .eq('id', auctionId)
    .single();

  if (auctionError || !auction) {
    throw new ApiError(404, 'Auction not found');
  }

  // Get bid history
  const { data: bids, error } = await supabase
    .from('bids')
    .select(`
      *,
      bidder:users!bidder_id(username, avatar_url)
    `)
    .eq('auction_id', auctionId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new ApiError(500, 'Failed to fetch bid history', error);
  }

  res.status(200).json(new ApiResponse(200, { bids }, 'Bid history fetched successfully'));
});

// Auto-end expired auctions (this would typically be called by a cron job)
export const processExpiredAuctions = asyncHandler(async (req, res) => {
  const { data: expiredAuctions, error } = await supabase
    .from('auctions')
    .select(`
      *,
      memes(*),
      seller:users!seller_id(username, avatar_url),
      highest_bidder:users!highest_bidder_id(username, avatar_url)
    `)
    .eq('status', 'active')
    .lt('end_time', new Date().toISOString());

  if (error) {
    throw new ApiError(500, 'Failed to fetch expired auctions', error);
  }

  const processedAuctions = [];

  for (const auction of expiredAuctions) {
    try {
      // End the auction
      await supabase
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', auction.id);

      // Transfer ownership if there was a highest bidder
      if (auction.highest_bidder_id) {
        // Transfer meme ownership
        await supabase
          .from('memes')
          .update({ current_owner_id: auction.highest_bidder_id })
          .eq('id', auction.meme_id);

        // Update wallet balances
        await Promise.all([
          supabase.rpc('update_wallet_balance', {
            user_id: auction.highest_bidder_id,
            amount: -auction.current_highest_bid
          }),
          supabase.rpc('update_wallet_balance', {
            user_id: auction.seller_id,
            amount: auction.current_highest_bid
          })
        ]);
      }

      // Notify users
      emitToAuction(auction.id, 'auction_ended', {
        auction,
        winner: auction.highest_bidder,
        winningBid: auction.current_highest_bid,
        message: auction.highest_bidder_id 
          ? `Auction ended! Won by ${auction.highest_bidder.username} for $${auction.current_highest_bid}`
          : 'Auction ended with no bids'
      });

      processedAuctions.push(auction.id);
    } catch (error) {
      console.error(`Failed to process auction ${auction.id}:`, error);
    }
  }

  res.status(200).json(new ApiResponse(200, { 
    processedCount: processedAuctions.length,
    processedAuctions 
  }, 'Expired auctions processed successfully'));
});