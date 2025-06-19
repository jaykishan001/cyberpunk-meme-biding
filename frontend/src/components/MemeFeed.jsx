import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import UploadMeme from './UploadMeme';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

function MemeFeed({ socket, memes, setMemes, user }) {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const hasFetched = useRef(false);
  const socketRef = useRef(null);

  // Fetch memes from API
  const fetchMemes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/meme/all`);
      setMemes(res.data.memes);
      hasFetched.current = true;
    } catch (err) {
      setError('Failed to fetch memes', err);
    } finally {
      setLoading(false);
    }
  }, [setMemes]);

  // Real-time vote update handler
  const handleVoteUpdate = useCallback((data) => {
    console.log('Received vote_update:', data);
    setMemes(prev => prev.map(meme =>
      meme.id === data.memeId
        ? { ...meme, upvotes: data.upvotes, downvotes: data.downvotes }
        : meme
    ));
  }, [setMemes]);

  // Vote success handler (for the voting user)
  const handleVoteSuccess = useCallback((data) => {
    setVoting(prev => {
      const newSet = new Set(prev);
      newSet.delete(parseInt(data.memeId));
      return newSet;
    });
  }, []);

  // Vote error handler
  const handleVoteError = useCallback((data) => {
    setError(data.message || 'Failed to vote');
    setVoting(new Set());
  }, []);

  // Already registered vote handler
  const handleVoteAlreadyRegistered = useCallback((data) => {
    setVoting(prev => {
      const newSet = new Set(prev);
      newSet.delete(parseInt(data.memeId));
      return newSet;
    });
  }, []);

  // Real-time new meme handler
  const handleNewMeme = useCallback((newMeme) => {
    console.log('[SOCKET] new_meme received:', newMeme);
    setMemes(prev => [newMeme, ...prev]);
  }, [setMemes]);

  // Initial fetch
  useEffect(() => {
    if (!hasFetched.current) fetchMemes();
  }, [fetchMemes]);

  // Socket event setup/cleanup
  useEffect(() => {
    if (socket && socket !== socketRef.current) {
      if (socketRef.current) {
        socketRef.current.off('vote_update', handleVoteUpdate);
        socketRef.current.off('vote_success', handleVoteSuccess);
        socketRef.current.off('vote_error', handleVoteError);
        socketRef.current.off('vote_already_registered', handleVoteAlreadyRegistered);
        socketRef.current.off('new_meme', handleNewMeme);
      }
      socket.on('vote_update', handleVoteUpdate);
      socket.on('vote_success', handleVoteSuccess);
      socket.on('vote_error', handleVoteError);
      socket.on('vote_already_registered', handleVoteAlreadyRegistered);
      socket.on('new_meme', handleNewMeme);
      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('vote_update', handleVoteUpdate);
        socketRef.current.off('vote_success', handleVoteSuccess);
        socketRef.current.off('vote_error', handleVoteError);
        socketRef.current.off('vote_already_registered', handleVoteAlreadyRegistered);
        socketRef.current.off('new_meme', handleNewMeme);
      }
    };
  }, [socket, handleVoteUpdate, handleVoteSuccess, handleVoteError, handleVoteAlreadyRegistered, handleNewMeme]);

  // Voting handler
  const handleVote = useCallback((memeId, voteType) => {
    if (!socket || !user || voting.has(memeId)) return;
    setVoting(prev => new Set([...prev, memeId]));
    setError('');
    socket.emit('vote_meme', { memeId, voteType });
  }, [socket, user, voting]);

  // UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-pink-200 hover:text-white" aria-label="Dismiss error">×</button>
        </div>
      )}
      <div className="flex justify-end mb-6">
        <button
          className="cyber-btn px-6 py-2 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white font-mono text-lg"
          onClick={() => setShowUpload(true)}
        >
          Upload Meme
        </button>
      </div>
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-cyan-400 hover:text-pink-400 text-2xl font-bold"
              onClick={() => setShowUpload(false)}
              aria-label="Close upload form"
            >
              ×
            </button>
            <UploadMeme
              socket={socket}
              onSuccess={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}
      {(!memes || memes.length === 0) ? (
        <div className="text-center py-8">
          <p className="text-cyan-400 font-mono">No memes found. Be the first to upload one!</p>
          <button 
            onClick={fetchMemes}
            className="mt-4 cyber-btn px-4 py-2 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memes.map(meme => {
            const isVoting = voting.has(meme.id);
            return (
              <div key={meme.id} className="cyber-card flex flex-col items-center">
                <img
                  src={meme.image_url}
                  alt={meme.title}
                  className="w-full h-64 object-contain rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg"
                  loading="lazy"
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-64 bg-gray-800 rounded-lg mb-4 border-2 border-cyan-400 shadow-cyan-400/40 shadow-lg items-center justify-center text-cyan-400 font-mono text-sm hidden">
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
                  <div className="flex flex-col items-center space-x-0 space-y-2">
                    <button
                      onClick={() => handleVote(meme.id, 'upvote')}
                      className="cyber-btn p-2 text-green-400 bg-black border-green-400 hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      disabled={!user || isVoting}
                      aria-label={`Upvote meme: ${meme.title}`}
                    >
                      <ArrowUpIcon className="h-6 w-6" />
                    </button>
                    <span className="text-green-400 text-center text-sm font-mono">{meme.upvotes || 0}</span>
                  </div>
                  <div className="flex flex-col items-center space-x-0 space-y-2">
                    <button
                      onClick={() => handleVote(meme.id, 'downvote')}
                      className="cyber-btn p-2 text-pink-400 bg-black border-pink-400 hover:bg-pink-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      disabled={!user || isVoting}
                      aria-label={`Downvote meme: ${meme.title}`}
                    >
                      <ArrowDownIcon className="h-6 w-6" />
                    </button>
                    <span className="text-pink-400 text-center text-sm font-mono">{meme.downvotes || 0}</span>
                  </div>
                  <div className="text-xs text-purple-400 font-mono self-end">
                    {meme.current_owner?.username || 'Anonymous'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default MemeFeed;