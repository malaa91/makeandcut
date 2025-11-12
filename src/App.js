import React, { useState, useCallback } from 'react';
import './App.css';
import VideoEditor from './components/VideoEditor';
import MultiCutEditor from './components/MultiCutEditor'; // AJOUT IMPORT
import Pricing from './components/Pricing';

function App() {
  const [video, setVideo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMultiCutEditor, setShowMultiCutEditor] = useState(false);

  const handleVideoUpload = useCallback((file) => {
    if (file && file.type.startsWith('video/')) {
      setVideo(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  }, []);

  const handleFileInput = (event) => {
    const file = event.target.files[0];
    if (file) handleVideoUpload(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) handleVideoUpload(file);
  };

  const backendUrl = 'https://makeandcut-backend.onrender.com';

  return (
    <div className="App">
      <header className="app-header">
        <h1>MakeAndCut</h1>
        <p>Coupez vos vidéos comme un professionnel</p>
        <button 
          onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
          className="cta-button"
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '12px 24px',
            borderRadius: '50px',
            marginTop: '20px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Voir les tarifs
        </button>
      </header>

      <div className="upload-container">
        <div className="upload-section">
          <h3>Commencez par importer votre vidéo</h3>
          
          <div 
            className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileInput}
              className="file-input"
            />
            <div className="file-drop-content">
              <div className="icon">📁</div>
              <h4>Glissez-déposez votre vidéo ici</h4>
              <p>ou cliquez pour parcourir vos fichiers</p>
              <p style={{ fontSize: '0.9em', marginTop: '10px', opacity: 0.7 }}>
                Formats supportés: MP4, MOV, AVI, MKV (max 50MB)
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="file-info-card">
              <h4>Fichier sélectionné</h4>
              <div className="file-details">
                <div className="file-detail">
                  <strong>Nom:</strong>
                  <span>{selectedFile.name}</span>
                </div>
                <div className="file-detail">
                  <strong>Taille:</strong>
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="file-detail">
                  <strong>Type:</strong>
                  <span>{selectedFile.type}</span>
                </div>
                <div className="file-detail">
                  <strong>Dernière modification:</strong>
                  <span>{new Date(selectedFile.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          
          {video && (
            <div className="video-preview-section">
              <h4>Aperçu de la vidéo</h4>
              <div className="video-container">
                <video controls src={video} />
              </div>
              <div className="editor-options">
                <button 
                  onClick={() => setShowEditor(true)} 
                  className="editor-btn"
                >
                  Éditeur simple (1 partie)
                </button>
                <button 
                  onClick={() => setShowMultiCutEditor(true)} 
                  className="editor-btn multi-cut-btn"
                >
                  Éditeur multiple (2+ parties)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditor && selectedFile && (
        <VideoEditor 
          videoFile={selectedFile}
          onClose={() => setShowEditor(false)}
          backendUrl={backendUrl}
        />
      )}

      {showMultiCutEditor && selectedFile && (
        <MultiCutEditor 
          videoFile={selectedFile}
          onClose={() => setShowMultiCutEditor(false)}
          backendUrl={backendUrl}
        />
      )}
      
      <Pricing />
    </div>
  );
}

export default App;