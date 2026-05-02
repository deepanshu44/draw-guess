import React from "react";

const AIResult = ({ guess, aiPos, penColor, provider }) => {
  if (!guess) return null;

  // Spatial/Handwriting Mode
  if (aiPos) {
    return (
      <div 
        className="ai-spatial-result" 
        style={{ 
          left: `${aiPos.x}%`, 
          top: `${aiPos.y}%`, 
          color: penColor 
        }}
      >
        {guess}
      </div>
    );
  }

  // Standard Result Box
  return (
    <div className="result">
      <h2>{provider} Result:</h2>
      <p className="guess-text">{guess}</p>
    </div>
  );
};

export default AIResult;
