import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateAuction({ user, userMemes, setUserMemes, onAuctionCreated }) {
  const navigate = useNavigate();
  const [selectedMeme, setSelectedMeme] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Memoized function to fetch user memes to prevent unnecessary re-renders
  const fetchUserMemes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const res = await axios.get('http://localhost:4000/api/v1/meme/user-memes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("memes", res);
      setUserMemes(res.data.data || []);
      setError(''); 
    } catch (err) {
      console.error('Failed to fetch user memes:', err);
      setError(err.response?.data?.message || 'Failed to load your memes');
    }
  }, [user?.id, setUserMemes]);

  useEffect(() => {
    fetchUserMemes();
  }, [fetchUserMemes]);

  // Form validation helper
  const validateForm = () => {
    if (!selectedMeme) {
      setError('Please select a meme');
      return false;
    }
    if (!startingBid || parseFloat(startingBid) <= 0) {
      setError('Please enter a valid starting bid');
      return false;
    }
    if (!duration || parseInt(duration) <= 0) {
      setError('Please enter a valid duration');
      return false;
    }
    return true;
  };

  // Reset form helper
  const resetForm = () => {
    setSelectedMeme('');
    setStartingBid('');
    setDuration('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log("selectedMeme", selectedMeme);
      console.log("startingBid", startingBid);
      console.log("duration", duration);

      const response = await axios.post('http://localhost:4000/api/v1/auction/create', {
        memeId: selectedMeme,
        startingBid: parseFloat(startingBid),
        duration: parseInt(duration)
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Reset form on success
      resetForm();
      
      // Call the callback if provided
      if (onAuctionCreated) {
        onAuctionCreated();
      }

      // Navigate to the created auction
      const auctionId = response.data?.data?.id || response.data?.id;
      if (auctionId) {
        navigate(`/auction/${auctionId}`);
      } else {
        // Fallback navigation if auction ID is not in expected format
        navigate('/auctions');
      }

    } catch (err) {
      console.error('Failed to create auction:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to create auction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Early return if user is not authenticated
  if (!user) {
    return (
      <div className="cyber-card max-w-lg mx-auto font-mono">
        <div className="bg-yellow-900/80 border border-yellow-400 text-yellow-300 px-4 py-3 rounded cyber-glow-yellow">
          Please log in to create an auction
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card max-w-lg mx-auto font-mono">
      <h2 className="cyber-heading text-center">CREATE AUCTION</h2>
      
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 cyber-glow-pink">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="meme" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Select Meme *
          </label>
          <select
            id="meme"
            value={selectedMeme}
            onChange={(e) => setSelectedMeme(e.target.value)}
            className="cyber-input w-full"
            required
            disabled={loading}
          >
            <option value="">
              {userMemes?.length ? 'Select a meme' : 'No memes available'}
            </option>
            {userMemes?.map((meme) => (
              <option key={meme.id} value={meme.id}>
                {meme.title}
              </option>
            ))}
          </select>
          {!userMemes?.length && (
            <p className="text-sm text-gray-400 mt-1">
              You need to upload memes before creating an auction
            </p>
          )}
        </div>

        <div>
          <label htmlFor="startingBid" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Starting Bid ($) *
          </label>
          <input
            type="number"
            id="startingBid"
            value={startingBid}
            onChange={(e) => setStartingBid(e.target.value)}
            className="cyber-input w-full"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Duration (minutes) *
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="cyber-input w-full"
            min="1"
            max="10080" // 1 week max
            placeholder="60"
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-400 mt-1">
            Minimum: 1 minute, Maximum: 1 week (10080 minutes)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !userMemes?.length}
          className="cyber-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Auction...' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
}

export default CreateAuction;