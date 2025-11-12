import React, { useState, useRef } from 'react';
import '../styles/MultiCutEditor.css';

function MultiCutEditor({ videoFile, onClose, backendUrl }) {
  const [cuts, setCuts] = useState([{ startTime: 0, endTime: 0, name: '' }]);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef();

  // Charger la durée de la vidéo
  const handleVideoLoad = (e) => {
    const video = e.target;
    setDuration(video.duration || 0);
    // Initialiser la première coupe avec la durée totale
    setCuts([{ startTime: 0, endTime: video.duration || 0, name: 'Partie 1' }]);
  };

  // Ajouter une nouvelle coupe
  const addCut = () => {
    const lastCut = cuts[cuts.length - 1];
    setCuts([
      ...cuts, 
      { 
        startTime: lastCut.endTime, 
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
      const response = await fetch(`${backendUrl}/api/cut-video-multiple`, {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('video', videoFile);
          formData.append('cuts', JSON.stringify(cuts));
          return formData;
        })(),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Télécharger chaque partie
        result.results.forEach((part, index) => {
          if (part.success && part.downloadUrl) {
            const downloadLink = document.createElement('a');
            downloadLink.href = part.downloadUrl;
            downloadLink.download = `${part.name.replace(/\s+/g, '-')}.mp4`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
        });

        alert(`✅ ${result.message}\n\n${result.results.length} partie(s) téléchargée(s)`);
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
              src={URL.createObjectURL(videoFile)}
              onLoadedMetadata={handleVideoLoad}
              preload="metadata"
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
              <button onClick={addCut} className="add-cut-btn">
                + Ajouter une partie
              </button>

              <button 
                onClick={handleMultiCut} 
                disabled={processing}
                className="process-btn"
              >
                {processing ? 'Traitement en cours...' : `Découper en ${cuts.length} partie(s)`}
              </button>
            </div>

            <div className="multi-cut-info">
              <p>Durée totale de la vidéo: <strong>{duration.toFixed(2)}s</strong></p>
              <p>Durée totale sélectionnée: <strong>{cuts.reduce((total, cut) => total + (cut.endTime - cut.startTime), 0).toFixed(2)}s</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiCutEditor;