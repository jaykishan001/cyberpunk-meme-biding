// import { Link, useNavigate } from 'react-router-dom';
// import { useState, useRef, useEffect } from 'react';

// function Navbar({ user, onLogout }) {
//   const navigate = useNavigate();
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const avatarBtnRef = useRef(null);

//   // Close dropdown on outside click
//   useEffect(() => {
//     if (!dropdownOpen) return;
//     function handleClick(e) {
//       if (
//         dropdownRef.current && !dropdownRef.current.contains(e.target) &&
//         avatarBtnRef.current && !avatarBtnRef.current.contains(e.target)
//       ) {
//         setDropdownOpen(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClick);
//     return () => document.removeEventListener('mousedown', handleClick);
//   }, [dropdownOpen]);

//   const handleCreateAuction = () => {
//     setDropdownOpen(false);
//     navigate('/auctions/create');
//   };

//   return (
//     <nav className="cyberpunk-bg cyber-border-cyan shadow-lg font-mono">
//       <div className="container mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <div className="flex items-center space-x-8">
//             <Link to="/" className="cyber-heading text-cyan-400">
//             MemeHustle
//             </Link>
//             {user && (
//               <div className="hidden md:flex space-x-4">
//                 <Link
//                   to="/"
//                   className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
//                 >
//                   Memes
//                 </Link>
//                 <Link
//                   to="/auctions"
//                   className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
//                 >
//                   Auctions
//                 </Link>
//                 <Link
//                   to="/my-auctions"
//                   className="uppercase tracking-widest text-cyan-400 hover:text-pink-400 transition-colors font-bold"
//                 >
//                   MyAuctions
//                 </Link>
//                 <Link
//                   to="/leaderboard"
//                   className="uppercase tracking-widest text-yellow-400 hover:text-pink-400 transition-colors font-bold"
//                 >
//                   Leaderboard
//                 </Link>
//                 <Link
//                   to="/competition"
//                   className="uppercase tracking-widest text-green-400 hover:text-pink-400 transition-colors font-bold"
//                 >
//                   Competition
//                 </Link>
//               </div>
//             )}
//           </div>
//           <div className="flex items-center space-x-4 relative">

//             {!user ? (
//               <>
//                 <Link to="/login" className="cyber-btn">Login</Link>
//                 <Link to="/signup" className="cyber-btn">Signup</Link>
//               </>
//             ) : (
//               <>
//               <div>
//                 💰{user?.wallet_balance}
//               </div>

//               <div className="relative">
//                 {/* Avatar Button */}

//                 <button
//                   ref={avatarBtnRef}
//                   onClick={() => setDropdownOpen((open) => !open)}
//                   className="focus:outline-none"
//                 >
//                   <img
//                     src={user.avatar_url}
//                     alt="Profile"
//                     className="w-10 h-10 rounded-full border-2 border-cyan-400"
//                   />
//                 </button>
//                 {/* Dropdown */}
//                 {dropdownOpen && (
//                   <div
//                     ref={dropdownRef}
//                     className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-cyan-400 rounded-lg shadow-lg z-50"
//                   >
//                     <div className="px-4 py-2 font-semibold border-b border-cyan-700 text-cyan-400 uppercase tracking-widest text-sm">
//                       {user.username}
//                     </div>
//                     <button
//                       onClick={handleCreateAuction}
//                       className="w-full text-left px-4 py-2 hover:bg-cyan-800 cyber-btn border-0 rounded-none font-mono uppercase tracking-widest text-cyan-400"
//                     >
//                       Create Auction
//                     </button>
//                     <button
//                       onClick={() => {
//                         setDropdownOpen(false);
//                         navigate('/my-memes');
//                       }}
//                       className="w-full text-left px-4 py-2 hover:bg-cyan-800 cyber-btn border-0 rounded-none font-mono uppercase tracking-widest text-cyan-400"
//                     >
//                       My Memes
//                     </button>
//                     <button
//                       onClick={() => {
//                         setDropdownOpen(false);
//                         onLogout();
//                       }}
//                       className="w-full text-left px-4 py-2 hover:bg-pink-700 cyber-btn border-0 rounded-none font-mono uppercase tracking-widest text-pink-400"
//                     >
//                       Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarBtnRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [navigate]);

  const handleCreateAuction = () => {
    setDropdownOpen(false);
    navigate("/auctions/create");
  };

  return (
    <nav className="cyberpunk-bg cyber-border-cyan shadow-lg font-mono">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="cyber-heading text-cyan-400">
              MemeHustle
            </Link>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-4">
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

          {/* Right side content */}
          <div className="flex items-center space-x-4 relative">
            {!user ? (
              <>
                <Link to="/login" className="cyber-btn">
                  Login
                </Link>
                <Link to="/signup" className="cyber-btn">
                  Signup
                </Link>
              </>
            ) : (
              <>
                {/* Desktop user info */}
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-cyan-400">💰{user?.wallet_balance}</div>
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
                            navigate("/my-memes");
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
                </div>

                {/* Mobile user info and hamburger */}
                <div className="md:hidden flex items-center space-x-3">
          
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-cyan-400"
                  />

                  <div className="text-cyan-400 text-sm">
                    💰{user?.wallet_balance}
                  </div>

                  <button
                    className="p-2 rounded focus:outline-none border border-cyan-400"
                    onClick={() => setMobileNavOpen((open) => !open)}
                    aria-label="Toggle navigation"
                  >
                    <svg
                      className="w-6 h-6 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav menu */}
        {user && (
          <div
            className={`md:hidden transition-all duration-300 ${
              mobileNavOpen
                ? "max-h-screen overflow-y-auto py-4"
                : "max-h-0 overflow-hidden py-0"
            }`}
            style={{
              background: "rgba(15,23,42,0.95)",
              borderRadius: "0 0 1rem 1rem",
            }}
          >
   
            <div className="px-4 py-3 border-b border-cyan-700 mb-2">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-cyan-400"
                />
                <div>
                  <div className="font-semibold text-cyan-400 uppercase tracking-widest text-sm">
                    {user.username}
                  </div>
                  <div className="text-cyan-400 text-sm">
                    💰{user?.wallet_balance}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                to="/"
                className="block px-4 py-2 text-cyan-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                onClick={() => setMobileNavOpen(false)}
              >
                Memes
              </Link>
              <Link
                to="/auctions"
                className="block px-4 py-2 text-cyan-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                onClick={() => setMobileNavOpen(false)}
              >
                Auctions
              </Link>
              <Link
                to="/my-auctions"
                className="block px-4 py-2 text-cyan-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                onClick={() => setMobileNavOpen(false)}
              >
                MyAuctions
              </Link>
              <Link
                to="/leaderboard"
                className="block px-4 py-2 text-yellow-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                onClick={() => setMobileNavOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                to="/competition"
                className="block px-4 py-2 text-green-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                onClick={() => setMobileNavOpen(false)}
              >
                Competition
              </Link>


              <div className="border-t border-cyan-700 mt-2 pt-2">
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate("/auctions/create");
                  }}
                  className="block w-full text-left px-4 py-2 text-cyan-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                >
                  Create Auction
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate("/my-memes");
                  }}
                  className="block w-full text-left px-4 py-2 text-cyan-400 hover:text-pink-400 font-bold uppercase tracking-widest hover:bg-cyan-800 rounded-md mx-2"
                >
                  My Memes
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    onLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-pink-400 hover:text-pink-300 font-bold uppercase tracking-widest hover:bg-pink-700 rounded-md mx-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
