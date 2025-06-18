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

function App() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [memes, setMemes] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userMemes, setUserMemes] = useState([]);

  // Check for existing token and user on app load
  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Verify token and get user data
          const response = await fetch('http://localhost:4000/api/v1/user/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            
            // Initialize socket connection with valid token
            initializeSocket(token);
          } else {
            // Token is invalid, clean up
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
        }
      }
      
      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  // Separate socket initialization function
  const initializeSocket = useCallback((token) => {
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io('http://localhost:4000', {
      auth: { token },
      forceNew: true // Ensure fresh connection
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

    setSocket(newSocket);

    // Return cleanup function
    return () => {
      newSocket.disconnect();
    };
  }, [socket]);

  // Optimized login handler
  const handleLogin = useCallback((userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    
    // Initialize socket connection after successful login
    initializeSocket(token);
  }, [initializeSocket]);

  // Optimized logout handler
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Clear memes on logout
    setMemes([]);
    
    // Navigate to login
    navigate('/login');
  }, [socket, navigate]);

  // Memoized ProtectedRoute component
  const ProtectedRoute = useMemo(() => {
    return ({ children }) => {
      if (!isInitialized) {
        // Show loading spinner while checking authentication
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
    };
  }, [user, isInitialized]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

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
    <div className="min-h-screen bg-gray-900">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="space-y-8">
                  <UploadMeme socket={socket} user={user} />
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
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;