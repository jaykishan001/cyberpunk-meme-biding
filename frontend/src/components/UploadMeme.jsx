import { useState } from 'react';
import axios from 'axios';

const GEMINI_API_KEY = 'AIzaSyAC53cbMIK9lp9vw7xmq8V2wFyvZ3CDLYw';

function UploadMeme({ socket }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid image file');
      setFile(null);
    }
  };

  // Gemini Text-Only API: Generate description from meme title
  const handleAIDescription = async () => {
    if (!title) {
      setError('Please enter a meme title first');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Write a short, funny, and engaging meme description for a meme titled: "${title}". The description should be suitable for a meme-sharing app and make people laugh. Return only the description, with no extra text, no quotes, and no formatting.` }
                ]
              }
            ]
          })
        }
      );
      const data = await response.json();
      const aiDesc = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (aiDesc) {
        setDescription(aiDesc);
      } else {
        setError('AI could not generate a description.');
      }
    } catch (err) {
      setError('Failed to generate description with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide both a title and an image');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('description', description);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:4000/api/v1/meme/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      setTitle('');
      setDescription('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload meme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card max-w-lg mx-auto font-mono">
      <h2 className="cyber-heading text-center">UPLOAD MEME</h2>
      {error && (
        <div className="bg-pink-900/80 border border-pink-400 text-pink-300 px-4 py-3 rounded mb-4 cyber-glow-pink">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="cyber-input w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
            className="cyber-input w-full file:bg-black file:text-cyan-400 file:border-cyan-400 file:rounded-lg file:px-4 file:py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="cyber-input w-full min-h-[60px]"
            placeholder="Enter a fun description or use AI to generate one!"
          />
          <button
            type="button"
            onClick={handleAIDescription}
            disabled={aiLoading || !title}
            className="cyber-btn mt-2 px-4 py-1 text-cyan-400 bg-black border-cyan-400 hover:bg-cyan-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? 'Generating...' : 'AI Generate Description'}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="cyber-btn w-full"
        >
          {loading ? 'Uploading...' : 'Upload Meme'}
        </button>
      </form>
    </div>
  );
}

export default UploadMeme; 