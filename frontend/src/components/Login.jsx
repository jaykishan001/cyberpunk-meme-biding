import { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

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
      const response = await axios.post('http://localhost:4000/api/v1/user/login', formData);
      onLogin(response.data.data.user, response.data.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto cyber-card mt-16 font-mono">
      <h2 className="cyber-heading text-center">LOGIN</h2>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 cyber-glow-pink">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
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
          Login
        </button>
      </form>
    </div>
  );
}

export default Login; 