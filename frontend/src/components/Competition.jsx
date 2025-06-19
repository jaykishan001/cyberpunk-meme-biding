import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Competition({ socket, user }) {
  const [stage, setStage] = useState('idle'); // idle, waiting, submit, voting, result
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [myMeme, setMyMeme] = useState(null);
  const [opponentMeme, setOpponentMeme] = useState(null);
  const [voteCounts, setVoteCounts] = useState({});
  const [winner, setWinner] = useState(null);
  const [memes, setMemes] = useState([]);
  const [selectedMeme, setSelectedMeme] = useState('');
  const [error, setError] = useState('');

  // Join queue
  const joinQueue = () => {
    setStage('waiting');
    socket.emit('join_competition_queue');
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;
    const onStart = ({ roomId, opponent }) => {
      setRoomId(roomId);
      setOpponent(opponent);
      setStage('submit');
      fetchUserMemes();
    };
    const onReady = ({ meme1, meme2 }) => {
      setMyMeme(user.id === opponent.id ? meme2 : meme1);
      setOpponentMeme(user.id === opponent.id ? meme1 : meme2);
      setStage('voting');
      socket.emit('join_competition_room', roomId);
    };
    const onVoteUpdate = (counts) => setVoteCounts(counts);
    const onResult = ({ winnerUser, winnerMeme, voteCounts }) => {
      setWinner(winnerUser);
      setVoteCounts(voteCounts);
      setStage('result');
    };
    socket.on('competition_start', onStart);
    socket.on('competition_ready', onReady);
    socket.on('competition_vote_update', onVoteUpdate);
    socket.on('competition_result', onResult);
    return () => {
      socket.off('competition_start', onStart);
      socket.off('competition_ready', onReady);
      socket.off('competition_vote_update', onVoteUpdate);
      socket.off('competition_result', onResult);
    };
    // eslint-disable-next-line
  }, [socket, user, opponent, roomId]);

  // Fetch user's memes for selection
  const fetchUserMemes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/api/v1/meme/user-memes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemes(res.data.memes);
    } catch (err) {
      setError('Failed to fetch your memes');
    }
  }, []);

  // Submit meme
  const submitMeme = () => {
    if (!selectedMeme) return setError('Select a meme to submit');
    socket.emit('submit_competition_meme', { roomId, memeId: selectedMeme });
    setStage('waiting_for_opponent');
  };

  // Vote for a meme
  const vote = (memeId) => {
    socket.emit('vote_competition_meme', { roomId, memeId });
  };

  // UI
  if (!user) return <div className="text-center text-cyan-400">Login to join competitions.</div>;
  if (!socket) return <div className="text-center text-cyan-400">Connecting to server...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-green-400 mb-6 text-center uppercase tracking-widest">Meme Competition</h2>
      {error && <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4">{error}</div>}
      {stage === 'idle' && (
        <div className="text-center">
          <button onClick={joinQueue} className="cyber-btn px-6 py-2 text-green-400 bg-black border-green-400 hover:bg-green-700 hover:text-white font-mono text-lg">Join Competition Queue</button>
        </div>
      )}
      {stage === 'waiting' && (
        <div className="text-center text-cyan-400">Waiting for an opponent...</div>
      )}
      {stage === 'submit' && (
        <div>
          <div className="mb-4 text-cyan-200">Select a meme to compete with:</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {memes.map(meme => (
              <div key={meme.id} className={`border-2 rounded-lg p-2 cursor-pointer ${selectedMeme === meme.id ? 'border-green-400' : 'border-cyan-700'}`} onClick={() => setSelectedMeme(meme.id)}>
                <img src={meme.image_url} alt={meme.title} className="w-full h-32 object-cover rounded mb-2" />
                <div className="text-center text-cyan-400 text-sm">{meme.title}</div>
              </div>
            ))}
          </div>
          <button onClick={submitMeme} className="cyber-btn px-4 py-2 text-green-400 bg-black border-green-400 hover:bg-green-700 hover:text-white font-mono">Submit Meme</button>
        </div>
      )}
      {stage === 'waiting_for_opponent' && (
        <div className="text-center text-cyan-400">Waiting for your opponent to submit their meme...</div>
      )}
      {stage === 'voting' && (
        <div>
          <div className="mb-4 text-cyan-200 text-center">Vote for your favorite meme!</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[myMeme, opponentMeme].map((memeId, idx) => (
              <div key={memeId} className="border-2 rounded-lg p-2 flex flex-col items-center">
                <img src={memes.find(m => m.id === memeId)?.image_url} alt="Meme" className="w-full h-32 object-cover rounded mb-2" />
                <button onClick={() => vote(memeId)} className="cyber-btn px-2 py-1 text-yellow-400 bg-black border-yellow-400 hover:bg-yellow-700 hover:text-white font-mono mt-2">Vote</button>
                <div className="text-yellow-400 mt-2">Votes: {voteCounts[memeId] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {stage === 'result' && (
        <div className="text-center">
          <div className="text-xl text-green-400 mb-4">Winner: {winner === user.id ? 'You!' : 'Opponent'}</div>
          <div className="mb-2 text-yellow-400">Final Votes:</div>
          <div className="flex justify-center gap-8">
            {[myMeme, opponentMeme].map((memeId, idx) => (
              <div key={memeId} className="border-2 rounded-lg p-2">
                <img src={memes.find(m => m.id === memeId)?.image_url} alt="Meme" className="w-24 h-24 object-cover rounded mb-2" />
                <div className="text-yellow-400">Votes: {voteCounts[memeId] || 0}</div>
              </div>
            ))}
          </div>
          <button onClick={() => window.location.reload()} className="mt-6 cyber-btn px-4 py-2 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white font-mono">Play Again</button>
        </div>
      )}
    </div>
  );
}

export default Competition; 