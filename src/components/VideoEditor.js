import React, { useState, useRef, useEffect } from 'react';
import '../styles/VideoEditor.css';

function VideoEditor({ videoFile, onClose, backendUrl }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('landscape');
  const videoRef = useRef();
  const [downloadUrl, setDownloadUrl] = useState(null);
  // Détecter le format de la vidéo
  const detectAspectRatio = (videoElement) => {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const aspectRatio = width / height;
    
    if (aspectRatio > 1) {
      return 'landscape';
    } else if (aspectRatio < 1) {
      return 'portrait';
    } else {
      return 'square';
    }
  };

  // Mettre à jour le format quand la vidéo est chargée
  const handleVideoLoad = (e) => {
    const video = e.target;
    const videoDuration = video.duration || 0;
    setDuration(videoDuration);
    setEndTime(videoDuration);
    
    const aspectRatio = detectAspectRatio(video);
    setVideoAspectRatio(aspectRatio);
  };

  // Obtenir les infos de la vidéo depuis l'API
  const getVideoInfo = async () => {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch(`${backendUrl}/api/video-info`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDuration(data.duration || 0);
        setEndTime(data.duration || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos vidéo:', error);
      // En cas d'erreur, on utilise la durée du fichier local
      if (videoRef.current) {
        const video = videoRef.current;
        video.onloadedmetadata = () => {
          setDuration(video.duration || 0);
          setEndTime(video.duration || 0);
        };
      }
    }
  };

  // Couper la vidéo
  const handleCutVideo = async () => {
    setProcessing(true);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('startTime', startTime.toString());
    formData.append('endTime', endTime.toString());

    try {
      const response = await fetch(`${backendUrl}/api/cut-video`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDownloadUrl(result.downloadUrl);
        alert(`✅ ${result.message}`);
      } else {
        const errorText = await response.text();
        alert('❌ Erreur lors du traitement: ' + errorText);
      }
    } catch (error) {
      alert('❌ Erreur de connexion: ' + error.message);
    }
    
    setProcessing(false);
  };

  // Charger les infos au montage
  useEffect(() => {
    getVideoInfo();
  }, []);

  return (
    <div className="video-editor-overlay">
      <div className="video-editor">
        <div className="editor-header">
          <h2> Éditeur Vidéo Professionnel</h2>
          <button onClick={onClose} aria-label="Fermer">x</button>
        </div>

        <div className="editor-content">
          <div className={`video-preview ${videoAspectRatio}`}>
            <video 
              ref={videoRef}
              controls 
              src={URL.createObjectURL(videoFile)}
              onLoadedMetadata={handleVideoLoad}
              preload="metadata"
            />
          </div>

          <div className="cut-controls">
            <h3>Paramètres de coupe</h3>
            
            <div className="time-controls">
              <div className="time-input">
                <label htmlFor="start-time">Temps de début (secondes):</label>
                <input 
                  id="start-time"
                  type="number" 
                  value={startTime} 
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setStartTime(Math.max(0, Math.min(value, duration)));
                  }}
                  min="0" 
                  max={duration}
                  step="0.1"
                />
              </div>

              <div className="time-input">
                <label htmlFor="end-time">Temps de fin (secondes):</label>
                <input 
                  id="end-time"
                  type="number" 
                  value={endTime} 
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setEndTime(Math.max(0, Math.min(value, duration)));
                  }}
                  min="0" 
                  max={duration}
                  step="0.1"
                />
              </div>
            </div>

            <div className="duration-info">
              <p>Durée totale: <strong>{duration.toFixed(2)}s</strong></p>
              <p>Durée sélectionnée: <strong>{(endTime - startTime).toFixed(2)}s</strong></p>
              <p>Format: <strong>{videoAspectRatio === 'portrait' ? 'Portrait (9:16)' : videoAspectRatio === 'landscape' ? 'Paysage (16:9)' : 'Carré'}</strong></p>
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleCutVideo} 
                disabled={processing || startTime >= endTime || duration === 0}
                className="process-btn"
              >
                {processing ? ' Traitement en cours...' : ' Couper la vidéo'}
              </button>
              
              {startTime >= endTime && duration > 0 && (
                <p style={{ color: '#e53e3e', fontSize: '14px', marginTop: '10px' }}>
                   Le temps de fin doit être supérieur au temps de début
                </p>
              )}
            </div>
          </div>


          {downloadUrl && (
            <div className="download-section">
              <h4>🎉 Vidéo prête !</h4>
              <a 
                href={downloadUrl} 
                download="video-coupee.mp4"
                className="download-btn"
              >
                📥 Télécharger la vidéo coupée
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default VideoEditor;