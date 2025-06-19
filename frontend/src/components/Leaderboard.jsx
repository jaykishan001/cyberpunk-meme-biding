import React from 'react';

function Leaderboard({ leaderboard, loading, error, fetchLeaderboard }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-yellow-400 mb-8 text-center cyber-glow-cyan uppercase tracking-widest">Meme Leaderboard</h2>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 text-center">
          {error}
        </div>
      )}
      <div className="flex justify-end mb-4">
        <button
          className="cyber-btn px-4 py-2 text-yellow-400 bg-black border-yellow-400 hover:bg-yellow-700 hover:text-white font-mono text-sm"
          onClick={fetchLeaderboard}
        >
          Refresh
        </button>
      </div>
      {(!leaderboard || leaderboard.length === 0) ? (
        <div className="text-center py-8">
          <p className="text-yellow-400 font-mono">No leaderboard data found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leaderboard.map((meme, idx) => {
            const highlight = idx === 0 ? 'border-yellow-400 shadow-yellow-400/60' : idx === 1 ? 'border-gray-300 shadow-gray-300/60' : idx === 2 ? 'border-orange-400 shadow-orange-400/60' : 'border-cyan-400 shadow-cyan-400/40';
            return (
              <div key={meme.id} className={`cyber-card flex flex-col items-center ${highlight} border-4 shadow-lg`}>
                <div className="w-full relative">
                  <img
                    src={meme.image_url}
                    alt={meme.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                    loading="lazy"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-64 bg-gray-800 rounded-lg mb-4 items-center justify-center text-yellow-400 font-mono text-sm hidden">
                    Failed to load image
                  </div>
                  {idx < 3 && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-lg shadow-lg">
                      #{idx + 1}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold mb-2 text-yellow-400 cyber-glow-cyan uppercase tracking-widest text-center">
                  {meme.title}
                </h3>
                <div className="mb-2 text-yellow-200 text-sm text-center font-mono bg-black/40 rounded p-2 border border-yellow-700">
                  Upvotes: <span className="font-bold">{meme.upvotes || 0}</span>
                </div>
                <div className="text-xs text-purple-400 font-mono self-end">
                  Owner: {meme.current_owner?.username || 'Anonymous'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Leaderboard; 