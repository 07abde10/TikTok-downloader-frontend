import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('downloadHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState('main'); // 'main' or 'history'

  // Auto-paste from clipboard
  const handleInputFocus = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes('tiktok.com')) {
        setUrl(text);
      }
    } catch (err) {
      // Ignore clipboard errors
    }
  };

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVideoData(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/tiktok/download`, {
        url: url
      });

      if (response.data.success) {
        setVideoData(response.data.data);
        // Add to history (avoid duplicates)
        const historyItem = {
          id: Date.now(),
          url: url,
          title: response.data.data.title,
          thumbnail: response.data.data.thumbnail,
          type: response.data.data.type,
          date: new Date().toLocaleDateString()
        };
        const filteredHistory = history.filter(item => item.url !== url);
        const newHistory = [historyItem, ...filteredHistory.slice(0, 9)];
        setHistory(newHistory);
        localStorage.setItem('downloadHistory', JSON.stringify(newHistory));
        
        // Auto scroll down
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const downloadSingleImage = (imageUrl, index) => {
    const downloadUrl = `${API_BASE_URL}/api/tiktok/download-file?video_url=${encodeURIComponent(imageUrl)}&filename=tiktok_${videoData.id}_image_${index + 1}.jpg`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `tiktok_${videoData.id}_image_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async () => {
    if (!videoData?.download_url) return;

    const downloadUrl = `${API_BASE_URL}/api/tiktok/download-file?video_url=${encodeURIComponent(videoData.download_url)}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `tiktok_${videoData.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Auto scroll up and reset
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setUrl('');
      setVideoData(null);
      setError('');
      setActiveImageIndex(0);
    }, 500);
  };

  const handleGalleryScroll = (e) => {
    const gallery = e.target;
    const imageWidth = 295;
    const scrollLeft = gallery.scrollLeft;
    const newActiveIndex = Math.round(scrollLeft / imageWidth);
    setActiveImageIndex(newActiveIndex);
  };

  const handleReset = () => {
    setUrl('');
    setVideoData(null);
    setError('');
    setActiveImageIndex(0);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('downloadHistory');
  };

  return (
    <div className="App">
      {currentPage === 'main' ? (
        <header className="App-header">
          <button 
            onClick={() => setCurrentPage('history')} 
            className="history-nav-btn"
          >
            📋 History
          </button>
          
          <h1>TikTok Downloader</h1>
        
        <form onSubmit={handleSubmit} className="download-form">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Paste TikTok URL here..."
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading || !url}>
            {loading ? 'Processing...' : 'Get Video'}
          </button>
        </form>

        {showHistory && (
          <div className="history-panel">
            <div className="history-header">
              <h3>Download History</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="clear-btn">
                  🗑️ Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p>No downloads yet</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="thumb" className="history-thumb" />
                    )}
                    <div className="history-info">
                      <p className="history-title">{item.title}</p>
                      <p className="history-date">{item.date}</p>
                    </div>
                    <button 
                      onClick={() => setUrl(item.url)}
                      className="reuse-btn"
                    >
                      ↻
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {videoData && (
          <div className="video-info">
            <h3>{videoData.title}</h3>
            {videoData.type === 'images' ? (
              <div className="images-gallery" onScroll={handleGalleryScroll}>
                {videoData.images?.map((img, index) => (
                  <div key={index} className={`image-container ${index === activeImageIndex ? 'active' : ''}`}>
                    <img src={img} alt={`Image ${index + 1}`} className="gallery-img" />
                    <button 
                      onClick={() => downloadSingleImage(img, index)} 
                      className="image-download-btn"
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {videoData.thumbnail && (
                  <img src={videoData.thumbnail} alt="Video thumbnail" />
                )}
                <button onClick={handleDownload} className="download-btn">
                  Download Video
                </button>
              </>
            )}
          </div>
        )}
      </header>
      ) : (
        <div className="history-page">
          <div className="history-header">
            <button 
              onClick={() => setCurrentPage('main')} 
              className="back-btn"
            >
              ← Back
            </button>
            <h2>Download History</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="clear-btn">
                🗑️ Clear
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="empty-history">
              <p>No downloads yet</p>
              <button 
                onClick={() => setCurrentPage('main')} 
                className="start-btn"
              >
                Start Downloading
              </button>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="thumb" className="history-thumb" />
                  )}
                  <div className="history-info">
                    <p className="history-title">{item.title}</p>
                    <p className="history-date">{item.date}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setUrl(item.url);
                      setCurrentPage('main');
                    }}
                    className="reuse-btn"
                  >
                    ↻ Use
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;