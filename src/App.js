import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>TikTok Downloader</h1>
        
        <form onSubmit={handleSubmit} className="download-form">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste TikTok URL here..."
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading || !url}>
            {loading ? 'Processing...' : 'Get Video'}
          </button>
        </form>

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
            <button onClick={handleReset} className="reset-btn">
              Download Another Video
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;