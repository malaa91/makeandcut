import React, { useState, useRef, useEffect } from 'react';
import '../styles/MultiCutEditor.css';

function MultiCutEditor({ videoFile, onClose, backendUrl }) {
  const [cuts, setCuts] = useState([]);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef();
  const videoUrlRef = useRef(); // Référence pour l'URL stable

  // Stocker l'URL de la vidéo une fois pour éviter les re-renders
  if (!videoUrlRef.current) {
    videoUrlRef.current = URL.createObjectURL(videoFile);
  }

  // Charger la durée de la vidéo une seule fois
  const handleVideoLoad = (e) => {
    const video = e.target;
    const videoDuration = video.duration || 0;
    setDuration(videoDuration);
    
    // Initialiser la première coupe seulement si c'est la première fois
    if (cuts.length === 0) {
      setCuts([{ startTime: 0, endTime: videoDuration, name: 'Partie 1' }]);
    }
  };

  // Nettoyer l'URL à la fermeture
  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);

  // Ajouter une nouvelle coupe
  const addCut = () => {
    const lastCut = cuts[cuts.length - 1];
    setCuts([
      ...cuts, 
      { 
        startTime: lastCut ? lastCut.endTime : 0, 
        endTime: duration, 
        name: `Partie ${cuts.length + 1}` 
      }
    ]);
  };

  // Supprimer une coupe
  const removeCut = (index) => {
    if (cuts.length > 1) {
      setCuts(cuts.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour une coupe
  const updateCut = (index, field, value) => {
    const newCuts = [...cuts];
    
    if (field === 'startTime') {
      value = Math.max(0, Math.min(value, newCuts[index].endTime - 0.1));
    } else if (field === 'endTime') {
      value = Math.min(duration, Math.max(value, newCuts[index].startTime + 0.1));
    }
    
    newCuts[index][field] = value;
    setCuts(newCuts);
  };

  // Valider toutes les coupes
  const validateCuts = () => {
    for (let i = 0; i < cuts.length; i++) {
      const cut = cuts[i];
      if (cut.startTime >= cut.endTime) {
        return `La partie ${i + 1} a un temps de début supérieur au temps de fin`;
      }
      if (cut.endTime > duration) {
        return `La partie ${i + 1} dépasse la durée de la vidéo`;
      }
    }
    return null;
  };

  // Traiter le découpage multiple
  const handleMultiCut = async () => {
    const validationError = validateCuts();
    if (validationError) {
      alert(validationError);
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('cuts', JSON.stringify(cuts));

      const response = await fetch(`${backendUrl}/api/cut-video-multiple`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Télécharger chaque partie
        result.results.forEach((part, index) => {
          if (part.success && part.downloadUrl) {
            setTimeout(() => {
              const downloadLink = document.createElement('a');
              downloadLink.href = part.downloadUrl;
              downloadLink.download = `${part.name.replace(/\s+/g, '-')}.mp4`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
            }, index * 500); // Délai pour éviter les blocages
          }
        });

        alert(`${result.message}\n\n${result.results.length} partie(s) téléchargée(s)`);
      } else {
        alert('Erreur: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      alert('Erreur de connexion: ' + error.message);
    }

    setProcessing(false);
  };

  return (
    <div className="multi-cut-overlay">
      <div className="multi-cut-editor">
        <div className="editor-header">
          <h2>Découpage Multiple</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="editor-content">
          <div className="video-preview">
            <video
              ref={videoRef}
              controls
              src={videoUrlRef.current} // URL stable
              onLoadedMetadata={handleVideoLoad}
              preload="metadata"
              key="video-player" // Key stable
            />
          </div>

          <div className="multi-cut-controls">
            <h3>Configuration des parties ({cuts.length} partie(s))</h3>

            <div className="cuts-list">
              {cuts.map((cut, index) => (
                <div key={index} className="cut-item">
                  <div className="cut-header">
                    <h4>Partie {index + 1}</h4>
                    {cuts.length > 1 && (
                      <button 
                        onClick={() => removeCut(index)}
                        className="remove-cut-btn"
                        type="button"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="cut-fields">
                    <div className="cut-field">
                      <label>Nom:</label>
                      <input
                        type="text"
                        value={cut.name}
                        onChange={(e) => updateCut(index, 'name', e.target.value)}
                        placeholder={`Partie ${index + 1}`}
                      />
                    </div>

                    <div className="cut-field">
                      <label>Début (s):</label>
                      <input
                        type="number"
                        value={cut.startTime}
                        onChange={(e) => updateCut(index, 'startTime', parseFloat(e.target.value) || 0)}
                        min="0"
                        max={duration}
                        step="0.1"
                      />
                    </div>

                    <div className="cut-field">
                      <label>Fin (s):</label>
                      <input
                        type="number"
                        value={cut.endTime}
                        onChange={(e) => updateCut(index, 'endTime', parseFloat(e.target.value) || 0)}
                        min="0"
                        max={duration}
                        step="0.1"
                      />
                    </div>

                    <div className="cut-field">
                      <label>Durée:</label>
                      <span className="duration-display">
                        {(cut.endTime - cut.startTime).toFixed(2)}s
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="multi-cut-actions">
              <button onClick={addCut} className="add-cut-btn" type="button">
                + Ajouter une partie
              </button>

              <button 
                onClick={handleMultiCut} 
                disabled={processing || cuts.length === 0}
                className="process-btn"
                type="button"
              >
                {processing ? 'Traitement en cours...' : `Découper en ${cuts.length} partie(s)`}
              </button>
            </div>

            {duration > 0 && (
              <div className="multi-cut-info">
                <p>Durée totale de la vidéo: <strong>{duration.toFixed(2)}s</strong></p>
                <p>Durée totale sélectionnée: <strong>{cuts.reduce((total, cut) => total + (cut.endTime - cut.startTime), 0).toFixed(2)}s</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiCutEditor;