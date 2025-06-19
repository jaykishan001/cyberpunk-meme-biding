import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarBtnRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        avatarBtnRef.current && !avatarBtnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleCreateAuction = () => {
    setDropdownOpen(false);
    navigate('/auctions/create');
  };

  return (
    <nav className="cyberpunk-bg cyber-border-cyan shadow-lg font-mono">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="cyber-heading text-cyan-400">
              MEMEBIDING
            </Link>
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
                >
                  Memes
                </Link>
                <Link
                  to="/auctions"
                  className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
                >
                  Auctions
                </Link>
                <Link
                  to="/my-auctions"
                  className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
                >
                  MyAuctions
                </Link>
                <Link
                  to="/leaderboard"
                  className="uppercase tracking-widest text-yellow-400 hover:text-pink-400 transition-colors font-bold"
                >
                  Leaderboard
                </Link>
                <Link
                  to="/competition"
                  className="uppercase tracking-widest text-green-400 hover:text-pink-400 transition-colors font-bold"
                >
                  Competition
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 relative">
            
            {!user ? (
              <>
                <Link to="/login" className="cyber-btn">Login</Link>
                <Link to="/signup" className="cyber-btn">Signup</Link>
              </>
            ) : (
              <>
              <div>
                💰{user?.wallet_balance}
              </div>


              <div className="relative">
                {/* Avatar Button */}

                <button
                  ref={avatarBtnRef}
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="focus:outline-none"
                >
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-cyan-400"
                  />
                </button>
                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-cyan-400 rounded-lg shadow-lg z-50"
                  >
                    <div className="px-4 py-2 font-semibold border-b border-cyan-700 text-cyan-400 uppercase tracking-widest text-sm">
                      {user.username}
                    </div>
                    <button
                      onClick={handleCreateAuction}
                      className="w-full text-left px-4 py-2 hover:bg-cyan-800 cyber-btn border-0 rounded-none font-mono uppercase tracking-widest text-cyan-400"
                    >
                      Create Auction
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/my-memes');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-cyan-800 cyber-btn border-0 rounded-none font-mono uppercase tracking-widest text-cyan-400"
                    >
                      My Memes
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-pink-700 cyber-btn border-0 rounded-none font-mono uppercase tracking-widest text-pink-400"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
