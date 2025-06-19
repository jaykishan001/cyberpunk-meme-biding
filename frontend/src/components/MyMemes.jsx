import { useEffect, useState } from 'react';
import axios from 'axios';

function MyMemes({ user }) {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyMemes = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/v1/meme/user-memes`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMemes(res.data.data || res.data || []);
      } catch (err) {
        setError('Failed to fetch your memes');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMyMemes();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="cyber-card max-w-4xl mx-auto font-mono">
      <h2 className="cyber-heading text-center mb-8">MY MEMES</h2>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 cyber-glow-pink">{error}</div>
      )}
      {(!memes || memes.length === 0) ? (
        <div className="text-cyan-400 text-center">You do not own any memes yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memes.map(meme => (
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
                <div className="text-green-400 text-center text-sm font-mono">Upvotes: {meme.upvotes || 0}</div>
                <div className="text-pink-400 text-center text-sm font-mono">Downvotes: {meme.downvotes || 0}</div>
              </div>
              <div className="text-xs text-purple-400 font-mono self-end">
                Owner: {user?.username || 'You'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyMemes; 