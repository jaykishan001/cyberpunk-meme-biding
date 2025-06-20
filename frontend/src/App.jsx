import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MemeFeed from './components/MemeFeed';
import Navbar from './components/Navbar';
import UploadMeme from './components/UploadMeme';
import Login from './components/Login';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';
import CreateAuction from './components/CreateAuction';
import MyAuctions from './components/MyAuctions';
import MyBids from './components/MyBids';
import Leaderboard from './components/Leaderboard';
import Competition from './components/Competition';
import MyMemes from './components/MyMemes';
import axios from 'axios';
import SignupUser from './components/SigupPage';

function App() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [memes, setMemes] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userMemes, setUserMemes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  console.log('BASE_URL', BASE_URL);
  // Separate socket initialization function - removed socket dependency
  const initializeSocket = useCallback((token) => {
    const newSocket = io(`${BASE_URL}`, {
      auth: { token },
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server with ID:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Handle vote updates
    newSocket.on('vote_update', (data) => {
      setMemes(prevMemes => 
        prevMemes.map(meme => 
          meme.id === data.memeId 
            ? { ...meme, upvotes: data.upvotes, downvotes: data.downvotes }
            : meme
        )
      );
    });

    // Listen for wallet_update events
    newSocket.on('wallet_update', (data) => {
      setUser(prevUser => 
        prevUser 
          ? { ...prevUser, wallet_balance: data.wallet_balance } 
          : prevUser
      );
    });

    return newSocket;
  }, []); // No dependencies

  // Check for existing token and user on app load
  useEffect(() => {
    const initializeApp = async () => {
      // Safe localStorage access
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (token) {
        try {
          const response = await fetch(`${BASE_URL}/api/v1/user/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            
            // Initialize socket connection
            const newSocket = initializeSocket(token);
            setSocket(newSocket);
          } else {
            // Token is invalid, clean up
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
            }
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
        }
      }
      
      setIsInitialized(true);
    };

    initializeApp();
  }, [initializeSocket]);

  // Optimized login handler
  const handleLogin = useCallback((userData, token) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    
    // Disconnect existing socket
    if (socket) {
      socket.disconnect();
    }
    
    // Initialize new socket connection
    const newSocket = initializeSocket(token);
    setSocket(newSocket);
  }, [initializeSocket]); // Removed socket dependency

  // Optimized logout handler
  const handleLogout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setMemes([]);
    navigate('/login');
  }, [socket, navigate]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError('');
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/meme/leaderboard`);
      setLeaderboard(res.data.memes);
    } catch (err) {
      setLeaderboardError('Failed to fetch leaderboard',err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!socket) return;
    const handleVoteUpdate = () => fetchLeaderboard();
    const handleNewMeme = () => fetchLeaderboard();
    socket.on('vote_update', handleVoteUpdate);
    socket.on('new_meme', handleNewMeme);
    return () => {
      socket.off('vote_update', handleVoteUpdate);
      socket.off('new_meme', handleNewMeme);
    };
  }, [socket, fetchLeaderboard]);

  // Memoized ProtectedRoute component - moved outside render
  const ProtectedRoute = useCallback(({ children }) => {
    if (!isInitialized) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  }, [user, isInitialized]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 font-mono">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "url('/bgimage.webp') no-repeat center center fixed, #0f172a",
        backgroundSize: "cover",
        minHeight: "100vh"
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(10, 10, 42, 0.7)', // dark blue/black with 70% opacity
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Navbar user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="space-y-8">
                  <MemeFeed 
                    socket={socket} 
                    memes={memes} 
                    setMemes={setMemes} 
                    user={user} 
                  />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions"
            element={
              <ProtectedRoute>
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-cyan-400">Active Auctions</h1>
                    <button
                      onClick={() => navigate('/auctions/create')}
                      className="cyber-btn px-4 py-2 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white"
                    >
                      Create Auction
                    </button>
                  </div>
                  <AuctionList socket={socket} user={user} />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/create"
            element={
              <ProtectedRoute>
                <CreateAuction
                  socket={socket}
                  user={user}
                  userMemes={userMemes}
                  setUserMemes={setUserMemes}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auction/:auctionId"
            element={
              <ProtectedRoute>
                <AuctionDetail socket={socket} user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/my-auctions"
            element={
              <ProtectedRoute>
                <MyAuctions user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bids"
            element={
              <ProtectedRoute>
                <MyBids user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <SignupUser/>
              )
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard leaderboard={leaderboard} loading={leaderboardLoading} error={leaderboardError} fetchLeaderboard={fetchLeaderboard} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competition"
            element={
              <ProtectedRoute>
                <Competition socket={socket} user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-memes"
            element={
              <ProtectedRoute>
                <MyMemes user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;