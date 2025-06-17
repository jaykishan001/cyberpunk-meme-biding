
import express from 'express';
import {
  createAuction,
  getActiveAuctions,
  getAuctionById,
  placeBid,
  endAuction,
  getUserAuctions,
  getUserBids,
  getAuctionBidHistory,
  processExpiredAuctions
} from '../controller/auction.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveAuctions);
router.get('/:auctionId', getAuctionById);
router.get('/:auctionId/bids', getAuctionBidHistory);

router.use(verifyJWT); // All routes below this require authentication


router.post('/create', createAuction);
router.post('/:auctionId/bid', placeBid);
router.patch('/:auctionId/end', endAuction);

router.get('/user/auctions', getUserAuctions);
router.get('/user/bids', getUserBids);

// Admin/System routes
router.post('/process-expired', processExpiredAuctions);


export default router;
