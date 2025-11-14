import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/AdvancedVideoEditor.css';

// Composant memoïsé pour les sous-titres
const SubtitleItem = React.memo(({ sub, onUpdate, duration }) => {
  const handleTextChange = useCallback((e) => {
    onUpdate(sub.id, { text: e.target.value });
  }, [sub.id, onUpdate]);

  const handleStartTimeChange = useCallback((e) => {
    onUpdate(sub.id, { startTime: parseFloat(e.target.value) || 0 });
  }, [sub.id, onUpdate]);

  const handleEndTimeChange = useCallback((e) => {
    onUpdate(sub.id, { endTime: parseFloat(e.target.value) || 0 });
  }, [sub.id, onUpdate]);

  return (
    <div className="subtitle-item">
      <input
        type="text"
        value={sub.text}
        onChange={handleTextChange}
        placeholder="Texte du sous-titre..."
      />
      <div className="time-controls">
        <input
          type="number"
          value={sub.startTime}
          onChange={handleStartTimeChange}
          step="0.1"
          min="0"
          max={duration}
        />
        <span>à</span>
        <input
          type="number"
          value={sub.endTime}
          onChange={handleEndTimeChange}
          step="0.1"
          min="0"
          max={duration}
        />
        <span>s</span>
      </div>
    </div>
  );
});

// Composant memoïsé pour les textes overlay
const TextOverlayItem = React.memo(({ 
  text, 
  onUpdate, 
  duration, 
  isSelected, 
  onSelect 
}) => {
  const handleTextChange = useCallback((e) => {
    onUpdate(text.id, { text: e.target.value });
  }, [text.id, onUpdate]);

  const handleStartTimeChange = useCallback((e) => {
    onUpdate(text.id, { startTime: parseFloat(e.target.value) || 0 });
  }, [text.id, onUpdate]);

  const handleEndTimeChange = useCallback((e) => {
    onUpdate(text.id, { endTime: parseFloat(e.target.value) || 0 });
  }, [text.id, onUpdate]);

  const handleStyleChange = useCallback((field, value) => {
    onUpdate(text.id, {
      styles: { ...text.styles, [field]: value }
    });
  }, [text.id, onUpdate, text.styles]);

  return (
    <div className="text-overlay-item">
      <div className="text-header">
        <input
          type="text"
          value={text.text}
          onChange={handleTextChange}
          placeholder="Saisissez votre texte..."
        />
        <button 
          onClick={() => onSelect(text.id)}
          className="style-toggle-btn"
        >
          {isSelected ? '▼' : '✎'} Style
        </button>
      </div>
      
      {isSelected && (
        <div className="style-editor">
          <label>🎨 Couleur texte:</label>
          <input
            type="color"
            value={text.styles.color}
            onChange={(e) => handleStyleChange('color', e.target.value)}
          />
          
          <label>🏷️ Couleur fond:</label>
          <input
            type="color"
            value={text.styles.backgroundColor}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
          />
          
          <label>📏 Taille police: {text.styles.fontSize}px</label>
          <input
            type="range"
            min="12"
            max="72"
            value={text.styles.fontSize}
            onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
          />

          <label>⏱️ Durée d'affichage:</label>
          <div className="time-controls">
            <input
              type="number"
              value={text.startTime}
              onChange={handleStartTimeChange}
              step="0.1"
              min="0"
              max={duration}
            />
            <span>à</span>
            <input
              type="number"
              value={text.endTime}
              onChange={handleEndTimeChange}
              step="0.1"
              min="0"
              max={duration}
            />
            <span>s</span>
          </div>
        </div>
      )}
    </div>
  );
});

function AdvancedVideoEditor({ videoFile, onClose, backendUrl }) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [autoSubtitleLoading, setAutoSubtitleLoading] = useState(false);
  const videoRef = useRef();

  // Détection automatique du format vidéo
  const detectAspectRatio = useCallback((videoElement) => {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const aspectRatio = width / height;
    
    return aspectRatio > 1 ? 'landscape' : aspectRatio < 1 ? 'portrait' : 'square';
  }, []);

  // Gestion du chargement vidéo
  const handleVideoLoad = useCallback((e) => {
    const video = e.target;
    setDuration(video.duration);
    const aspectRatio = detectAspectRatio(video);
    console.log(`📐 Format vidéo détecté: ${aspectRatio}`);
  }, [detectAspectRatio]);

  // Gestion du temps vidéo
  const handleTimeUpdate = useCallback(() => {
    setCurrentTime(videoRef.current?.currentTime || 0);
  }, []);

  // Éléments de texte par défaut
  const defaultTextStyles = useCallback(() => ({
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid rgba(255,255,255,0.1)'
  }), []);

  // Mettre à jour un élément - OPTIMISÉ
  const updateElement = useCallback((id, updates) => {
    setSubtitles(prev => prev.map(sub => 
      sub.id === id ? { ...sub, ...updates } : sub
    ));
    setTextOverlays(prev => prev.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  }, []);

  // Ajouter un sous-titre automatique
  const handleAutoSubtitles = useCallback(async () => {
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
      alert('Erreur lors de la génération des sous-titres');
    }
    setAutoSubtitleLoading(false);
  }, [videoFile, backendUrl]);

  // Ajouter un texte overlay
  const addTextOverlay = useCallback(() => {
    const newText = {
      id: Date.now() + Math.random(), // ID unique
      text: 'Votre texte ici ✨',
      startTime: currentTime,
      endTime: currentTime + 5,
      position: { x: 50, y: 50 },
      styles: defaultTextStyles(),
      visible: true,
      type: 'text'
    };
    setTextOverlays(prev => [...prev, newText]);
    setSelectedElement(newText.id);
  }, [currentTime, defaultTextStyles]);

  // Gérer la sélection d'élément
  const handleSelectElement = useCallback((id) => {
    setSelectedElement(prev => prev === id ? null : id);
  }, []);

  // Prévisualiser les éléments actifs - MÉMOÏSÉ
  const activeElements = React.useMemo(() => {
    const activeSubtitles = subtitles.filter(sub => 
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    const activeTexts = textOverlays.filter(text => 
      text.visible && currentTime >= text.startTime && currentTime <= text.endTime
    );

    return [...activeSubtitles, ...activeTexts];
  }, [subtitles, textOverlays, currentTime]);

  return (
    <div className="advanced-editor-overlay">
      <div className="advanced-editor">
        <div className="editor-header">
          <h2>Édition Avancée 🎬</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="editor-layout">
          {/* Panneau de prévisualisation style Instagram */}
          <div className="preview-container">
            <div className="video-preview">
              <video
                ref={videoRef}
                controls
                src={URL.createObjectURL(videoFile)}
                onLoadedMetadata={handleVideoLoad}
                onTimeUpdate={handleTimeUpdate}
                preload="metadata"
              />
              
              {/* Overlays en temps réel */}
              <div className="video-overlays">
                {activeElements.map(element => (
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

          {/* Panneau de contrôle moderne */}
          <div className="control-panel">
            <div className="control-tabs">
              <button className="tab-active">🎯 Sous-titres</button>
              <button>✏️ Textes</button>
              <button>🎨 Style</button>
              <button>📤 Export</button>
            </div>

            {/* Section Sous-titres */}
            <div className="control-section">
              <h3>🎙️ Sous-titres Automatiques</h3>
              <button 
                onClick={handleAutoSubtitles}
                disabled={autoSubtitleLoading}
                className="action-btn"
              >
                {autoSubtitleLoading ? '⏳ Génération en cours...' : '🚀 Générer les sous-titres'}
              </button>

              {subtitles.length > 0 && (
                <div className="subtitles-list">
                  <h4>Sous-titres générés ({subtitles.length})</h4>
                  {subtitles.map((sub) => (
                    <SubtitleItem
                      key={sub.id}
                      sub={sub}
                      onUpdate={updateElement}
                      duration={duration}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section Textes Overlay */}
            <div className="control-section">
              <h3>✨ Textes Superposés</h3>
              <button onClick={addTextOverlay} className="action-btn">
                + Ajouter un texte overlay
              </button>

              {textOverlays.map(text => (
                <TextOverlayItem
                  key={text.id}
                  text={text}
                  onUpdate={updateElement}
                  duration={duration}
                  isSelected={selectedElement === text.id}
                  onSelect={handleSelectElement}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedVideoEditor;