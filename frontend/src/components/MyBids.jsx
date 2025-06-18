import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MyBids({ user }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBids();
    // eslint-disable-next-line
  }, []);

  const fetchBids = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/api/v1/auction/user/bids', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("res of bids", res);
      setBids(res.data.data.bids || []);
    } catch (err) {
      setError('Failed to fetch your bids');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card max-w-4xl mx-auto font-mono">
      <h2 className="cyber-heading text-center mb-8">MY BIDS</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      ) : error ? (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded cyber-glow-pink">{error}</div>
      ) : bids.length === 0 ? (
        <div className="text-cyan-400 text-center">No bids found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bids.map(bid => (
            <div key={bid.id} className="cyber-card flex flex-col items-center">
              <img
                src={bid.auctions?.memes?.image_url}
                alt={bid.auctions?.memes?.title}
                className="w-full h-56 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
              />
              <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
                {bid.auctions?.memes?.title}
              </h3>
              <div className="text-purple-400 text-xs mb-2 font-mono">
                Status: {bid.auctions?.status?.toUpperCase()}
              </div>
              <div className="flex justify-between w-full mb-2">
                <div className="text-green-400 font-bold">Your Bid: ${bid.bid_amount}</div>
                <div className="text-cyan-300">Auction: ${bid.auctions?.current_highest_bid}</div>
              </div>
              <Link
                to={`/auction/${bid.auction_id}`}
                className="cyber-btn w-full mt-2"
              >
                View Auction
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBids; 