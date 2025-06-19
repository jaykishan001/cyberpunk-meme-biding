import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${BASE_URL}/api/v1/user/register`, formData);
      // Redirect to login page after successful signup
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto cyber-card mt-16 font-mono">
      <h2 className="cyber-heading text-center">SIGN UP</h2>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 cyber-glow-pink">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="cyber-input w-full"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="cyber-input w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="cyber-input w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="cyber-input w-full"
          />
        </div>
        <button
          type="submit"
          className="cyber-btn w-full"
        >
          Signup
        </button>
      </form>
    </div>
  );
}

export default Signup; 