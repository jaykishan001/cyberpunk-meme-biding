import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

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
                  My Auctions
                </Link>
                <Link
                  to="/my-bids"
                  className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
                >
                  My Bids
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-green-400 font-bold uppercase tracking-widest">
                  {user.username}
                </span>
                <button
                  onClick={() => navigate('/auctions/create')}
                  className="cyber-btn"
                >
                  Create Auction
                </button>
                <button
                  onClick={onLogout}
                  className="cyber-btn bg-pink-600 hover:bg-green-500 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="cyber-btn"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 