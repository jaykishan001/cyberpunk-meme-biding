// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';

// function AuctionList() {
//   const [auctions, setAuctions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchAuctions();
//   }, []);

//   const fetchAuctions = async () => {
//     try {
//       const res = await axios.get('http://localhost:4000/api/v1/auction/all');
//       setAuctions(res.data.auctions);
//     } catch (err) {
//       setError('Failed to fetch auctions');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded cyber-glow-pink">
//         {error}
//       </div>
//     );
//   }

//   if (!auctions || auctions.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-cyan-400 font-mono">No auctions found. Be the first to create one!</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <h2 className="cyber-heading text-center mb-8">AUCTIONS</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//         {auctions.map((auction) => (
//           <div key={auction.id} className="cyber-card flex flex-col items-center">
//             <img
//               src={auction.meme?.image_url}
//               alt={auction.meme?.title}
//               className="w-full h-56 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
//             />
//             <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
//               {auction.meme?.title}
//             </h3>
//             <div className="text-purple-400 text-xs mb-2 font-mono">
//               Seller: {auction.seller?.username || 'Unknown'}
//             </div>
//             <div className="flex justify-between w-full mb-2">
//               <div className="text-green-400 font-bold">${auction.current_bid}</div>
//               <div className="text-cyan-300">{auction.status.toUpperCase()}</div>
//             </div>
//             <Link
//               to={`/auction/${auction.id}`}
//               className="cyber-btn w-full mt-2"
//             >
//               View Auction
//             </Link>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default AuctionList; 






import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AuctionList({ socket, user }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, ended
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest_bid, lowest_bid

  // Memoized fetch function
  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : {};

      const res = await axios.get('http://localhost:4000/api/v1/auction/active', config);
      console.log("auctions", res.data.data.auctions);
      setAuctions(res.data.data.auctions || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch auctions';
      setError(errorMessage);
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket event handlers
  const handleAuctionUpdated = useCallback((updatedAuction) => {
    setAuctions(prevAuctions => 
      prevAuctions.map(auction => 
        auction.id === updatedAuction.id ? { ...auction, ...updatedAuction } : auction
      )
    );
  }, []);

  const handleNewAuction = useCallback((newAuction) => {
    // Unwrap if the auction is nested in { auction: ... }
    const auctionObj = newAuction && newAuction.auction ? newAuction.auction : newAuction;
    setAuctions(prevAuctions => [auctionObj, ...prevAuctions]);
  }, []);

  const handleAuctionEnded = useCallback((auctionData) => {
    setAuctions(prevAuctions => 
      prevAuctions.map(auction => 
        auction.id === auctionData.auctionId 
          ? { ...auction, status: 'ended', winner: auctionData.winner }
          : auction
      )
    );
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Socket listeners
  useEffect(() => {
    if (socket) {
      socket.on('auction_updated', handleAuctionUpdated);
      socket.on('new_auction', handleNewAuction);
      socket.on('auction_ended', handleAuctionEnded);
      socket.on('bid_placed', handleAuctionUpdated); // Handle bid updates

      return () => {
        socket.off('auction_updated', handleAuctionUpdated);
        socket.off('new_auction', handleNewAuction);
        socket.off('auction_ended', handleAuctionEnded);
        socket.off('bid_placed', handleAuctionUpdated);
      };
    }
  }, [socket, handleAuctionUpdated, handleNewAuction, handleAuctionEnded]);

  // Filtered and sorted auctions
  const processedAuctions = useMemo(() => {
    let filtered = auctions;

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = auctions.filter(auction => auction.status === 'active');
        break;
      case 'ended':
        filtered = auctions.filter(auction => auction.status === 'ended');
        break;
      default:
        filtered = auctions;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'highest_bid':
          return (b.current_bid || 0) - (a.current_bid || 0);
        case 'lowest_bid':
          return (a.current_bid || 0) - (b.current_bid || 0);
        case 'ending_soon':
          return new Date(a.end_time) - new Date(b.end_time);
        default: // newest
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return sorted;
  }, [auctions, filter, sortBy]);

  // Helper function to format time remaining
  const getTimeRemaining = useCallback((endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // Status badge component
  const StatusBadge = useCallback(({ status, endTime }) => {
    const isEnded = status === 'ended' || new Date(endTime) <= new Date();
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
        isEnded 
          ? 'bg-red-900/50 text-red-300 border border-red-400' 
          : 'bg-green-900/50 text-green-300 border border-green-400'
      }`}>
        {isEnded ? 'Ended' : 'Active'}
      </span>
    );
  }, []);

  // Loading component
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  // Error component
  if (error) {
    return (
      <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded cyber-glow-pink">
        <div className="flex justify-between items-center">
          <span>{error}</span>
          <div className="space-x-2">
            <button 
              onClick={fetchAuctions}
              className="text-pink-200 hover:text-white underline"
            >
              Retry
            </button>
            <button 
              onClick={() => setError('')}
              className="text-pink-200 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!auctions || auctions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-cyan-400 font-mono mb-4">No auctions found. Be the first to create one!</p>
        <button 
          onClick={fetchAuctions}
          className="cyber-btn px-4 py-2 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="cyber-heading text-center mb-8">AUCTIONS</h2>
      
      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex flex-wrap gap-2">
          <label className="text-cyan-400 font-mono text-sm">Filter:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-cyan-400 text-cyan-400 px-2 py-1 rounded text-sm font-mono"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <label className="text-cyan-400 font-mono text-sm">Sort:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-cyan-400 text-cyan-400 px-2 py-1 rounded text-sm font-mono"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_bid">Highest Bid</option>
            <option value="lowest_bid">Lowest Bid</option>
            <option value="ending_soon">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-cyan-400 font-mono text-sm mb-4">
        Showing {processedAuctions.length} of {auctions.length} auctions
      </div>

      {/* Auction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {processedAuctions.map((auction) => (
          <div key={auction.id} className="cyber-card flex flex-col">
            {/* Image */}
            <div className="relative">
              <img
                src={auction.meme?.image_url}
                alt={auction.meme?.title || 'Auction item'}
                className="w-full h-56 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-full h-56 bg-gray-800 rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg items-center justify-center text-cyan-400 font-mono text-sm hidden"
              >
                Image not available
              </div>
              
              {/* Status badge overlay */}
              <div className="absolute top-2 right-2">
                <StatusBadge status={auction.status} endTime={auction.end_time} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
                {auction.meme?.title || 'Untitled'}
              </h3>
              
              <div className="text-purple-400 text-xs mb-2 font-mono text-center">
                Seller: {auction.seller?.username || 'Unknown'}
              </div>

              <div className="flex justify-between items-center mb-2">
                <div className="text-green-400 font-bold font-mono">
                  ${auction.current_bid || auction.starting_bid || 0}
                </div>
                <div className="text-cyan-300 text-xs font-mono">
                  {auction.bid_count || 0} bids
                </div>
              </div>

              {/* Time remaining */}
              {auction.end_time && (
                <div className="text-center mb-3">
                  <div className="text-xs text-purple-400 font-mono">
                    {getTimeRemaining(auction.end_time)} remaining
                  </div>
                </div>
              )}

              {/* Action button */}
              <Link
                to={`/auction/${auction.id}`}
                className="cyber-btn w-full mt-auto text-center py-2 px-4 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors duration-200"
              >
                View Auction
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* No results after filtering */}
      {processedAuctions.length === 0 && auctions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-cyan-400 font-mono">No auctions match your current filters.</p>
          <button 
            onClick={() => {
              setFilter('all');
              setSortBy('newest');
            }}
            className="mt-2 text-purple-400 hover:text-purple-300 underline font-mono text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default AuctionList;