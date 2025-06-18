import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MyAuctions({ user }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetchAuctions();
    // eslint-disable-next-line
  }, [status]);

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:4000/api/v1/auction/user/auctions?status=${status}`,
        { headers: { 'Authorization': `Bearer ${token}` } });

      console.log("res of auctions", res);
      setAuctions(res.data.data.auctions || []);
  } catch (err) {
      setError('Failed to fetch your auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleEndAuction = async (auctionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4000/api/v1/auction/${auctionId}/end`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAuctions();
    } catch (err) {
      setError('Failed to end auction');
    }
  };

  return (
    <div className="cyber-card max-w-4xl mx-auto font-mono">
      <h2 className="cyber-heading text-center mb-8">MY AUCTIONS</h2>
      <div className="flex gap-4 mb-6">
        <label className="text-cyan-400 font-mono">Status:</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="cyber-input"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      ) : error ? (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded cyber-glow-pink">{error}</div>
      ) : auctions.length === 0 ? (
        <div className="text-cyan-400 text-center">No auctions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {auctions.map(auction => {
            // Winner logic for ended auctions
            let winner = null;
            let winningBid = null;
            if (auction.status === 'ended' && Array.isArray(auction.bids) && auction.bids.length > 0) {
              // Highest bid is the first in sorted bids (desc)
              const sortedBids = [...auction.bids].sort((a, b) => b.bid_amount - a.bid_amount);
              winningBid = sortedBids[0];
              winner = winningBid?.bidder;
            }
            return (
              <div key={auction.id} className="cyber-card flex flex-col items-center">
                <img
                  src={auction.memes?.image_url}
                  alt={auction.memes?.title}
                  className="w-full h-56 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
                />
                <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
                  {auction.memes?.title}
                </h3>
                <div className="text-purple-400 text-xs mb-2 font-mono">
                  Status: {auction.status.toUpperCase()}
                </div>
                <div className="flex justify-between w-full mb-2">
                  <div className="text-green-400 font-bold">${auction.current_highest_bid}</div>
                  <div className="text-cyan-300">{auction.bids?.length || 0} bids</div>
                </div>
                <div className="text-purple-400 text-xs mb-2 font-mono">
                  Seller: {user?.username || 'You'}
                </div>
                {auction.status === 'ended' ? (
                  winner ? (
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
                  )
                ) : (
                  <>
                    <Link
                      to={`/auction/${auction.id}`}
                      className="cyber-btn w-full mt-2"
                    >
                      View Auction
                    </Link>
                    <button
                      onClick={() => handleEndAuction(auction.id)}
                      className="cyber-btn bg-pink-600 hover:bg-green-500 text-white mt-2"
                    >
                      End Auction
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyAuctions; 