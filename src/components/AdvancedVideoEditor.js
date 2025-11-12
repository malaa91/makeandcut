import React, { useState, useRef, useEffect } from 'react';
import '../styles/AdvancedVideoEditor.css';

function AdvancedVideoEditor({ videoFile, onClose, backendUrl }) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [autoSubtitleLoading, setAutoSubtitleLoading] = useState(false);
  const videoRef = useRef();

  // Éléments de texte par défaut
  const defaultTextStyles = {
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center'
  };

  // Gestion du temps vidéo
  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime || 0);
  };

  // Ajouter un sous-titre automatique
  const handleAutoSubtitles = async () => {
    setAutoSubtitleLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch(`${backendUrl}/api/generate-subtitles`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSubtitles(result.subtitles);
      }
    } catch (error) {
      console.error('Erreur génération sous-titres:', error);
    }
    setAutoSubtitleLoading(false);
  };

  // Ajouter un texte overlay
  const addTextOverlay = () => {
    const newText = {
      id: Date.now(),
      text: 'Votre texte ici',
      startTime: currentTime,
      endTime: currentTime + 5,
      position: { x: 50, y: 50 },
      styles: { ...defaultTextStyles },
      visible: true
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedElement(newText.id);
  };

  // Mettre à jour un élément
  const updateElement = (id, updates) => {
    setSubtitles(subtitles.map(sub => 
      sub.id === id ? { ...sub, ...updates } : sub
    ));
    setTextOverlays(texts => 
      texts.map(text => 
        text.id === id ? { ...text, ...updates } : text
      )
    );
  };

  // Prévisualiser les éléments actifs
  const getActiveElements = () => {
    const activeSubtitles = subtitles.filter(sub => 
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    const activeTexts = textOverlays.filter(text => 
      text.visible && currentTime >= text.startTime && currentTime <= text.endTime
    );

    return [...activeSubtitles, ...activeTexts];
  };

  return (
    <div className="advanced-editor-overlay">
      <div className="advanced-editor">
        <div className="editor-header">
          <h2>Édition Avancée</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="editor-layout">
          {/* Panneau de prévisualisation */}
          <div className="preview-panel">
            <div className="video-container">
              <video
                ref={videoRef}
                controls
                src={URL.createObjectURL(videoFile)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onTimeUpdate={handleTimeUpdate}
              />
              
              {/* Overlays en temps réel */}
              <div className="video-overlays">
                {getActiveElements().map(element => (
                  <div
                    key={element.id}
                    className={`overlay-element ${element.type || 'text'}`}
                    style={{
                      position: 'absolute',
                      left: `${element.position?.x || 50}%`,
                      top: `${element.position?.y || 50}%`,
                      transform: 'translate(-50%, -50%)',
                      ...element.styles
                    }}
                  >
                    {element.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panneau de contrôle */}
          <div className="control-panel">
            <div className="control-tabs">
              <button className="tab-active">Sous-titres</button>
              <button>Textes</button>
              <button>Style</button>
              <button>Export</button>
            </div>

            {/* Section Sous-titres */}
            <div className="control-section">
              <h3>Sous-titres Automatiques</h3>
              <button 
                onClick={handleAutoSubtitles}
                disabled={autoSubtitleLoading}
                className="action-btn"
              >
                {autoSubtitleLoading ? 'Génération...' : 'Générer les sous-titres'}
              </button>

              <div className="subtitles-list">
                {subtitles.map((sub, index) => (
                  <div key={sub.id} className="subtitle-item">
                    <input
                      type="text"
                      value={sub.text}
                      onChange={(e) => updateElement(sub.id, { text: e.target.value })}
                    />
                    <div className="time-controls">
                      <input
                        type="number"
                        value={sub.startTime}
                        onChange={(e) => updateElement(sub.id, { 
                          startTime: parseFloat(e.target.value) 
                        })}
                        step="0.1"
                      />
                      <span>à</span>
                      <input
                        type="number"
                        value={sub.endTime}
                        onChange={(e) => updateElement(sub.id, { 
                          endTime: parseFloat(e.target.value) 
                        })}
                        step="0.1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Textes Overlay */}
            <div className="control-section">
              <h3>Textes Superposés</h3>
              <button onClick={addTextOverlay} className="action-btn">
                + Ajouter un texte
              </button>

              {textOverlays.map(text => (
                <div key={text.id} className="text-overlay-item">
                  <div className="text-header">
                    <input
                      type="text"
                      value={text.text}
                      onChange={(e) => updateElement(text.id, { text: e.target.value })}
                    />
                    <button onClick={() => setSelectedElement(text.id)}>
                      ✎ Style
                    </button>
                  </div>
                  
                  {selectedElement === text.id && (
                    <div className="style-editor">
                      <label>Couleur texte:</label>
                      <input
                        type="color"
                        value={text.styles.color}
                        onChange={(e) => updateElement(text.id, {
                          styles: { ...text.styles, color: e.target.value }
                        })}
                      />
                      
                      <label>Couleur fond:</label>
                      <input
                        type="color"
                        value={text.styles.backgroundColor}
                        onChange={(e) => updateElement(text.id, {
                          styles: { ...text.styles, backgroundColor: e.target.value }
                        })}
                      />
                      
                      <label>Taille police:</label>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={text.styles.fontSize}
                        onChange={(e) => updateElement(text.id, {
                          styles: { ...text.styles, fontSize: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedVideoEditor;