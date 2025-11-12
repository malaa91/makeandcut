import React, { useState, useRef, useEffect } from 'react';
import '../styles/VideoEditor.css';
import VideoTimeline from './VideoTimeline';

function VideoEditor({ videoFile, onClose, backendUrl }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('landscape');
  const videoRef = useRef();

  // Gestion du temps
  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setStartTime(Math.max(0, Math.min(value, endTime - 0.1)));
    } else {
      setEndTime(Math.min(duration, Math.max(value, startTime + 0.1)));
    }
  };
  
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
    
    console.log('Début du découpage:', {
      startTime, 
      endTime, 
      duration: endTime - startTime,
      file: videoFile.name
    });

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('startTime', startTime.toString());
    formData.append('endTime', endTime.toString());

    try {
      const response = await fetch(`${backendUrl}/api/cut-video`, {
        method: 'POST',
        body: formData,
      });

      console.log('Réponse serveur:', response.status);

      const result = await response.json();
      console.log('Données reçues:', result);

      if (response.ok && result.success) {
        // SUCCÈS - Téléchargement automatique
        if (result.downloadUrl) {
          console.log('Téléchargement:', result.downloadUrl);
          
          // Créer un lien de téléchargement invisible
          const downloadLink = document.createElement('a');
          downloadLink.href = result.downloadUrl;
          downloadLink.download = `makeandcut-${Date.now()}.mp4`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          alert(`${result.message}\n\nDétails:\n- Durée: ${result.details.duration}\n- Format: ${result.details.outputFormat}\n- Taille: ${result.details.outputSize || 'Optimisée'}`);
        } else {
          alert(result.message);
        }
        
        // Afficher les détails dans la console
        if (result.details) {
          console.log('Détails du traitement:', result.details);
        }
      } else {
        console.error('Erreur backend:', result);
        alert('Erreur: ' + (result.error || result.details || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur de connexion: ' + error.message);
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
          <h2>Editeur Vidéo Professionnel</h2>
          <button onClick={onClose}>×</button>
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
            
            {/* Timeline */}
            <VideoTimeline
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              onTimeChange={handleTimeChange}
              videoRef={videoRef}
            />

            {/* Contrôles manuels */}
            <div className="time-controls-manual">
              <div className="time-input">
                <label>Temps de début (secondes):</label>
                <input 
                  type="number" 
                  value={startTime} 
                  onChange={(e) => handleTimeChange('start', parseFloat(e.target.value) || 0)}
                  min="0" 
                  max={duration}
                  step="0.1"
                />
              </div>

              <div className="time-input">
                <label>Temps de fin (secondes):</label>
                <input 
                  type="number" 
                  value={endTime} 
                  onChange={(e) => handleTimeChange('end', parseFloat(e.target.value) || 0)}
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
                {processing ? (
                  <div className="processing-indicator">
                    <div className="spinner"></div>
                    Traitement en cours...
                  </div>
                ) : (
                  'Couper la vidéo'
                )}
              </button>
              
              {startTime >= endTime && duration > 0 && (
                <p style={{ color: '#e53e3e', fontSize: '14px', marginTop: '10px' }}>
                  Le temps de fin doit être supérieur au temps de début
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoEditor;