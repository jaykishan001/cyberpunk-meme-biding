import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

function MemeFeed({ socket, memes, setMemes, user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votingStates, setVotingStates] = useState(new Set());
  const hasFetchedRef = useRef(false);
  const socketRef = useRef(null);

  // Memoize the fetchMemes function to prevent unnecessary re-creations
  const fetchMemes = useCallback(async (force = false) => {
    // Prevent multiple simultaneous calls unless forced
    if (!force && hasFetchedRef.current && loading) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('http://localhost:4000/api/v1/meme/all');
      setMemes(response.data.memes);
      hasFetchedRef.current = true;
    } catch (err) {
      setError('Failed to fetch memes');
      console.error('Error fetching memes:', err);
    } finally {
      setLoading(false);
    }
  }, [setMemes, loading]);

  // Memoize socket event handlers to prevent re-creating them on every render
  const handleMemeUpdated = useCallback((updatedMeme) => {
    setMemes(prevMemes => 
      prevMemes.map(meme => 
        meme.id === updatedMeme.id ? updatedMeme : meme
      )
    );
  }, [setMemes]);

  const handleNewMeme = useCallback((newMeme) => {
    setMemes(prevMemes => [newMeme, ...prevMemes]);
  }, [setMemes]);

  // Initial fetch effect - runs only once
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchMemes();
    }
  }, []); // Empty dependency array - runs only on mount

  // Socket effect - set up listeners for meme updates and new memes
  useEffect(() => {
    if (socket && socket !== socketRef.current) {
      if (socketRef.current) {
        socketRef.current.off('meme_updated', handleMemeUpdated);
        socketRef.current.off('new_meme', handleNewMeme);
      }
      socket.on('meme_updated', handleMemeUpdated);
      socket.on('new_meme', handleNewMeme);
      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('meme_updated', handleMemeUpdated);
        socketRef.current.off('new_meme', handleNewMeme);
      }
    };
  }, [socket, handleMemeUpdated, handleNewMeme]);

  // Optimized vote handler with loading state and error handling
  const handleVote = useCallback(async (memeId, voteType) => {
    if (!socket || !user || votingStates.has(memeId)) return;
    setVotingStates(prev => new Set([...prev, memeId]));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.post(
        `http://localhost:4000/api/v1/meme/${memeId}/vote`,
        { voteType },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      socket.emit('vote_meme', { memeId, voteType });
      setError('');
    } catch (err) {
      console.error('Vote error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to vote on meme';
      setError(errorMessage);
    } finally {
      setVotingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(memeId);
        return newSet;
      });
    }
  }, [socket, user, votingStates]);

  // Memoize the loading component
  const LoadingComponent = useMemo(() => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
    </div>
  ), []);

  // Memoize the error component
  const ErrorComponent = useMemo(() => (
    error ? (
      <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded cyber-glow-pink mb-4">
        {error}
        <button 
          onClick={() => setError('')}
          className="ml-2 text-pink-200 hover:text-white"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    ) : null
  ), [error]);

  // Memoize the empty state component
  const EmptyStateComponent = useMemo(() => (
    <div className="text-center py-8">
      <p className="text-cyan-400 font-mono">No memes found. Be the first to upload one!</p>
      <button 
        onClick={() => fetchMemes(true)}
        className="mt-4 cyber-btn px-4 py-2 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white"
      >
        Refresh
      </button>
    </div>
  ), [fetchMemes]);

  // Early returns for loading and empty states
  if (loading) {
    return LoadingComponent;
  }

  if (!memes || memes.length === 0) {
    return (
      <>
        {ErrorComponent}
        {EmptyStateComponent}
      </>
    );
  }

  return (
    <>
      {ErrorComponent}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {memes.map((meme) => {
          const isVoting = votingStates.has(meme.id);
          return (
            <div key={meme.id} className="cyber-card flex flex-col items-center">
              <img
                src={meme.image_url}
                alt={meme.title}
                className="w-full h-64 object-cover rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-full h-64 bg-gray-800 rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg items-center justify-center text-cyan-400 font-mono text-sm hidden"
              >
                Failed to load image
              </div>
              <h3 className="text-lg font-bold mb-2 text-cyan-400 cyber-glow-cyan uppercase tracking-widest text-center">
                {meme.title}
              </h3>
              {meme.description && (
                <div className="mb-2 text-cyan-200 text-sm text-center font-mono bg-black/40 rounded p-2 border border-cyan-700">
                  {meme.description}
                </div>
              )}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote(meme.id, 'upvote')}
                    className="cyber-btn px-3 py-1 text-green-400 bg-black border-green-400 hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!user || isVoting}
                    aria-label={`Upvote meme: ${meme.title}`}
                  >
                    {isVoting ? '⏳' : '▲'} {meme.upvotes || 0}
                  </button>
                  <button
                    onClick={() => handleVote(meme.id, 'downvote')}
                    className="cyber-btn px-3 py-1 text-pink-400 bg-black border-pink-400 hover:bg-pink-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!user || isVoting}
                    aria-label={`Downvote meme: ${meme.title}`}
                  >
                    {isVoting ? '⏳' : '▼'} {meme.downvotes || 0}
                  </button>
                </div>
                <div className="text-xs text-purple-400 font-mono">
                  {meme.user?.username || 'Anonymous'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default MemeFeed;