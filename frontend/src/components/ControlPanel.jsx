import React from "react";

const ControlPanel = ({ 
  providers, 
  provider, 
  setProvider, 
  colors, 
  penColor, 
  setPenColor, 
  penSize, 
  setPenSize, 
  isEraser, 
  setIsEraser 
}) => {
  return (
    <div className="settings-bar">
      <div className="provider-selector">
        {providers.map((p) => (
          <button
            key={p}
            className={`provider-chip ${provider === p ? "active" : ""}`}
            onClick={() => setProvider(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="tool-settings">
        <div className="color-palette">
          {colors.map((c) => (
            <button
              key={c}
              className={`color-swatch ${penColor === c && !isEraser ? "active" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                setPenColor(c);
                setIsEraser(false);
              }}
            />
          ))}
        </div>

        <div className="brush-control">
          <input 
            type="range" 
            min="1" max="15" 
            value={penSize} 
            onChange={(e) => setPenSize(parseInt(e.target.value))} 
          />
        </div>

        <div className="tool-toggles">
          <button 
            className={`tool-btn ${isEraser ? "active" : ""}`} 
            onClick={() => setIsEraser(true)}
          >
            🧽
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
