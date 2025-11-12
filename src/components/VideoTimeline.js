import React, { useRef, useEffect, useState } from 'react';
import '../styles/VideoTimeline.css';

function VideoTimeline({ duration, startTime, endTime, onTimeChange, videoRef }) {
  const timelineRef = useRef();
  const [isDragging, setIsDragging] = useState(null); // 'start', 'end', or 'selection'

  // Convertir le temps en pourcentage
  const timeToPercent = (time) => (time / duration) * 100;
  
  // Convertir le pourcentage en temps
  const percentToTime = (percent) => (percent / 100) * duration;

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (clickX / rect.width) * 100;
    const newTime = percentToTime(percent);

    if (isDragging === 'start') {
      onTimeChange('start', Math.max(0, Math.min(newTime, endTime - 0.1)));
    } else if (isDragging === 'end') {
      onTimeChange('end', Math.min(duration, Math.max(newTime, startTime + 0.1)));
    } else if (isDragging === 'selection') {
      const currentDuration = endTime - startTime;
      const newStart = Math.max(0, Math.min(newTime, duration - currentDuration));
      onTimeChange('start', newStart);
      onTimeChange('end', newStart + currentDuration);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Écouter les événements globaux
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startTime, endTime]);

  const handleTimelineClick = (e) => {
    if (isDragging) return; // Éviter les conflits pendant le drag
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = percentToTime((clickX / rect.width) * 100);
    
    // Mettre à jour la position de la vidéo
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="video-timeline">
      <div className="timeline-header">
        <div className="time-info">
          <span className="time-label">Début: <strong>{startTime.toFixed(2)}s</strong></span>
          <span className="time-label">Fin: <strong>{endTime.toFixed(2)}s</strong></span>
          <span className="time-label">Durée: <strong>{(endTime - startTime).toFixed(2)}s</strong></span>
        </div>
        
        <div className="time-controls">
          <button 
            onClick={() => onTimeChange('start', Math.max(0, startTime - 1))}
            className="time-btn"
          >
            -1s
          </button>
          <button 
            onClick={() => onTimeChange('start', Math.max(0, startTime - 0.1))}
            className="time-btn"
          >
            -0.1s
          </button>
          <button 
            onClick={() => onTimeChange('end', Math.min(duration, endTime + 0.1))}
            className="time-btn"
          >
            +0.1s
          </button>
          <button 
            onClick={() => onTimeChange('end', Math.min(duration, endTime + 1))}
            className="time-btn"
          >
            +1s
          </button>
        </div>
      </div>

      <div 
        ref={timelineRef}
        className="timeline-track"
        onClick={handleTimelineClick}
      >
        {/* Fond de la timeline */}
        <div className="timeline-background" />
        
        {/* Zone sélectionnée */}
        <div 
          className="timeline-selection"
          style={{
            left: `${timeToPercent(startTime)}%`,
            width: `${timeToPercent(endTime - startTime)}%`
          }}
          onMouseDown={(e) => handleMouseDown(e, 'selection')}
        />
        
        {/* Marqueur de début */}
        <div 
          className="timeline-marker start-marker"
          style={{ left: `${timeToPercent(startTime)}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="marker-handle"></div>
        </div>
        
        {/* Marqueur de fin */}
        <div 
          className="timeline-marker end-marker"
          style={{ left: `${timeToPercent(endTime)}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="marker-handle"></div>
        </div>

        {/* Indicateurs de temps */}
        <div className="time-ticks">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="time-tick"
              style={{ left: `${(i / 5) * 100}%` }}
            >
              <span className="tick-label">
                {((i / 5) * duration).toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoTimeline;