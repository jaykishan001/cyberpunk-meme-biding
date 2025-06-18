import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function AuctionDetail({ socket, user }) {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');
  const messagesEndRef = useRef(null);

  // Calculate auction status
  const isAuctionEnded = auction?.status === 'ended';
  const isSeller = user && auction?.seller_id === user.id;
  const isHighestBidder = user && auction?.highest_bidder_id === user.id;
  const canBid = !isAuctionEnded && user && !isSeller;

  useEffect(() => {
    fetchAuctionDetails();
    if (socket) {
      socket.emit('join_auction', auctionId);
      setupSocketListeners();
    }

    return () => {
      if (socket) {
        socket.emit('leave_auction', auctionId);
        cleanupSocketListeners();
      }
    };
  }, [auctionId, socket]);

  useEffect(() => {
    if (auction && !isAuctionEnded) {
      const timer = setInterval(() => {
        const endTime = new Date(auction.auction_end_time);
        const now = new Date();
        const difference = endTime - now;

        if (difference <= 0) {
          setTimeLeft('Auction Ended');
          clearInterval(timer);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        if (minutes > 0) timeString += `${minutes}m `;
        timeString += `${seconds}s`;

        setTimeLeft(timeString);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [auction, isAuctionEnded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocketListeners = () => {
    socket.on('new_bid', handleNewBid);
    socket.on('auction_ended', handleAuctionEnded);
    socket.on('new_message', handleNewMessage);
    socket.on('bid_error', handleBidError);
  };

  const cleanupSocketListeners = () => {
    socket.off('new_bid', handleNewBid);
    socket.off('auction_ended', handleAuctionEnded);
    socket.off('new_message', handleNewMessage);
    socket.off('bid_error', handleBidError);
  };

  const fetchAuctionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const [auctionResponse, bidHistoryResponse] = await Promise.all([
        axios.get(`http://localhost:4000/api/v1/auction/${auctionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        axios.get(`http://localhost:4000/api/v1/auction/${auctionId}/bids`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      setAuction(auctionResponse.data.data);
      setBidHistory(bidHistoryResponse.data.data?.bids || []);
      setMessages([]); // Initialize empty messages array
    } catch (err) {
      console.error('Error fetching auction details:', err);
      setError('Failed to fetch auction details');
    } finally {
      setLoading(false);
    }
  };

  const handleNewBid = (data) => {
    if (data.auction.id === auctionId) {
      setAuction(prevAuction => ({
        ...prevAuction,
        current_highest_bid: data.bid.bid_amount,
        highest_bidder_id: data.bid.bidder_id,
        total_bids: prevAuction.total_bids + 1
      }));
      setBidHistory(prevHistory => {
        const currentHistory = Array.isArray(prevHistory) ? prevHistory : [];
        return [data.bid, ...currentHistory];
      });
    }
  };

  const handleAuctionEnded = (data) => {
    if (data.auctionId === auctionId) {
      setAuction(prevAuction => ({
        ...prevAuction,
        status: 'ended',
        winner: data.winner,
        winningBid: data.winningBid
      }));
    }
  };

  const handleNewMessage = (data) => {
    if (data.auctionId === auctionId) {
      setMessages(prevMessages => [...prevMessages, data.message]);
    }
  };

  const handleBidError = (data) => {
    setError(data.message);
    setTimeout(() => setError(''), 3000);
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!socket || !bidAmount || !user) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:4000/api/v1/auction/${auctionId}/bid`,
        { bidAmount: parseFloat(bidAmount) },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setBidAmount('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    }
  };

  const handleEndAuction = async () => {
    if (!user || !auction || user.id !== auction.seller_id) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:4000/api/v1/auction/${auctionId}/end`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end auction');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !newMessage.trim() || !user) return;

    socket.emit('send_message', {
      auctionId,
      message: newMessage.trim()
    });
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Auction not found
      </div>
    );
  }

  // Find the highest bid and bidder for ended auctions
  let winner = null;
  let winningBid = null;
  if (isAuctionEnded && bidHistory.length > 0) {
    // Highest bid is the first in sorted bidHistory (desc)
    const sortedBids = [...bidHistory].sort((a, b) => b.bid_amount - a.bid_amount);
    winningBid = sortedBids[0];
    winner = winningBid?.bidder;
  }

  if (isAuctionEnded) {
    return (
      <div className="cyber-card max-w-2xl mx-auto font-mono">
        <h2 className="cyber-heading text-center mb-6">AUCTION RESULT</h2>
        <div className="flex flex-col items-center gap-6">
          <img
            src={auction?.meme?.image_url}
            alt={auction?.meme?.title}
            className="w-full h-72 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
          />
          <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
            {auction?.meme?.title}
          </h3>
          <div className="text-purple-400 text-xs mb-2 font-mono">
            Seller: {auction?.seller?.username || 'Unknown'}
          </div>
          {winner ? (
            <div className="bg-black/80 border border-green-400 rounded-lg p-4 mb-2 cyber-glow-cyan text-center">
              <h4 className="text-green-400 font-bold mb-2 uppercase tracking-widest">Winner</h4>
              <div className="text-lg text-green-300 font-mono">{winner.username}</div>
              <div className="text-cyan-300 font-mono">Winning Bid: ${winningBid.bid_amount}</div>
            </div>
          ) : (
            <div className="bg-black/80 border border-pink-400 rounded-lg p-4 mb-2 cyber-glow-pink text-center">
              <h4 className="text-pink-300 font-bold mb-2 uppercase tracking-widest">No Winner</h4>
              <div className="text-cyan-300 font-mono">No bids were placed.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card max-w-2xl mx-auto font-mono">
      <h2 className="cyber-heading text-center mb-6">AUCTION DETAIL</h2>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 cyber-glow-pink">
          {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center">
          <img
            src={auction?.meme?.image_url}
            alt={auction?.meme?.title}
            className="w-full h-72 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
          />
          <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
            {auction?.meme?.title}
          </h3>
          <div className="text-purple-400 text-xs mb-2 font-mono">
            Seller: {auction?.seller?.username || 'Unknown'}
          </div>
          <div className="flex justify-between w-full mb-2">
            <div className="text-green-400 font-bold">${auction?.current_highest_bid}</div>
            <div className="text-cyan-300">{isAuctionEnded ? 'Auction Ended' : timeLeft}</div>
          </div>
          <div className="text-cyan-400 text-xs mb-2">Time left: {timeLeft}</div>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-black/80 border border-cyan-400 rounded-lg p-4 mb-2 cyber-glow-cyan">
            <h4 className="text-cyan-300 font-bold mb-2 uppercase tracking-widest">Bid History</h4>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {bidHistory.length === 0 ? (
                <li className="text-cyan-500">No bids yet.</li>
              ) : (
                bidHistory.map((bid, idx) => (
                  <li key={idx} className="text-green-400 font-mono">
                    {bid.bidder?.username || 'Anonymous'}: ${bid.bid_amount}
                  </li>
                ))
              )}
            </ul>
          </div>
          {canBid && (
            <form onSubmit={handlePlaceBid} className="flex gap-2 items-end">
              <input
                type="number"
                min={auction?.current_highest_bid + 0.01 || 0.01}
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="cyber-input flex-1"
                placeholder="Your bid"
                required
              />
              <button
                type="submit"
                className="cyber-btn"
                disabled={loading}
              >
                {loading ? 'Bidding...' : 'Place Bid'}
              </button>
            </form>
          )}
          {isSeller && !isAuctionEnded && (
            <button
              onClick={handleEndAuction}
              className="cyber-btn bg-pink-600 hover:bg-green-500 text-white mt-4"
            >
              End Auction
            </button>
          )}
          <div className="bg-black/80 border border-pink-400 rounded-lg p-4 mt-4 cyber-glow-pink">
            <h4 className="text-pink-300 font-bold mb-2 uppercase tracking-widest">Messages</h4>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {messages.length === 0 ? (
                <li className="text-pink-400">No messages yet.</li>
              ) : (
                messages.map((msg, idx) => (
                  <li key={idx} className="text-pink-300 font-mono">
                    <span className="font-bold">{msg.username || 'Anonymous'}:</span> {msg.content}
                  </li>
                ))
              )}
            </ul>
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="cyber-input flex-1"
                placeholder="Type a message..."
                disabled={isAuctionEnded}
                required
              />
              <button
                type="submit"
                className="cyber-btn"
                disabled={isAuctionEnded || !newMessage.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionDetail; 