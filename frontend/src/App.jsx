import { useRef, useState, useEffect, useMemo } from "react";
import { getStroke } from "perfect-freehand";
import "./App.css";

// Helper to convert perfect-freehand points to an SVG path string
function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, _arr) => {
      const [x1, y1] = _arr[(i + 1) % _arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

const App = () => {
  const canvasRef = useRef(null);
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("Any");
  const [provider, setProvider] = useState("Gemini");
  const [isEraser, setIsEraser] = useState(false);
  
  // New State for Vector Strokes
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [redoStack, setRedoStack] = useState([]);

  const modes = ["Any", "Object", "Letter", "Number", "Scenery"];
  const providers = ["Gemini", "Mistral", "Mistral OCR"];

  // Canvas Drawing Options for perfect-freehand
  const strokeOptions = {
    size: isEraser ? 30 : 5,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    setGuess("");
    setLoading(false);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = [...strokes];
    const undone = newStrokes.pop();
    setRedoStack(prev => [...prev, undone]);
    setStrokes(newStrokes);
    setGuess("");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const redone = newRedo.pop();
    setStrokes(prev => [...prev, redone]);
    setRedoStack(newRedo);
    setGuess("");
  };

  const handleGuess = async () => {
    if (strokes.length === 0) return;

    setLoading(true);
    setGuess("");
    try {
      const canvas = canvasRef.current;
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const ctx = finalCanvas.getContext("2d");
      
      // Paint white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Draw the current visible state
      ctx.drawImage(canvas, 0, 0);

      const dataUrl = finalCanvas.toDataURL("image/png");
      const base64Image = dataUrl.split(",")[1];

      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: base64Image,
          context: mode !== "Any" ? mode : null,
          provider: provider
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGuess(data.guess || "No guess returned");
      } else {
        setGuess(data.error || "Error from server");
      }
    } catch (error) {
      console.error("Guess error:", error);
      setGuess("Check connection");
    } finally {
      setLoading(false);
    }
  };

  // --- Pointer Event Handlers ---
  const handlePointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top, 
      pressure: e.pressure || 0.5 
    };
    setCurrentStroke({
      points: [point],
      color: isEraser ? "white" : "black",
      size: isEraser ? 30 : 5
    });
    setRedoStack([]);
  };

  const handlePointerMove = (e) => {
    if (!currentStroke) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top, 
      pressure: e.pressure || 0.5 
    };
    setCurrentStroke(prev => ({
      ...prev,
      points: [...prev.points, point]
    }));
  };

  const handlePointerUp = () => {
    if (!currentStroke) return;
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  // --- Rendering Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    
    const render = () => {
      // Sync resolution
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.scale(ratio, ratio);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const allStrokes = [...strokes];
      if (currentStroke) allStrokes.push(currentStroke);
      
      allStrokes.forEach(stroke => {
        const outlinePoints = getStroke(stroke.points.map(p => [p.x, p.y, p.pressure]), {
          size: stroke.size,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        });
        
        const pathData = getSvgPathFromStroke(outlinePoints);
        const path = new Path2D(pathData);
        ctx.fillStyle = stroke.color;
        ctx.fill(path);
      });
    };

    render();
  }, [strokes, currentStroke]);

  return (
    <div className="container">
      <h1>Smooth Draw & Guess</h1>
      
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
          <button 
            className={`tool-btn ${!isEraser ? "active" : ""}`}
            onClick={() => setIsEraser(false)}
          >
            ✏️ Pen
          </button>
          <button 
            className={`tool-btn ${isEraser ? "active" : ""}`}
            onClick={() => setIsEraser(true)}
          >
            🧽 Eraser
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="sketch-canvas smooth"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "none" }}
        />
        {loading && <div className="loading-overlay">Thinking...</div>}
      </div>

      <div className="controls">
        <button onClick={handleUndo} disabled={strokes.length === 0} className="secondary-btn">
          Undo
        </button>
        <button onClick={handleRedo} disabled={redoStack.length === 0} className="secondary-btn">
          Redo
        </button>
        <button onClick={handleClear} className="clear-btn">
          Clear
        </button>
        <button onClick={handleGuess} disabled={loading || strokes.length === 0} className="guess-btn large">
          {loading ? "..." : "What is this?"}
        </button>
      </div>

      <div className="result-area">
        {guess && (
          <div className="result">
            <h2>{provider} Thinks:</h2>
            <p className="guess-text">{guess}</p>
          </div>
        )}
        {!guess && !loading && <p className="hint">Draw something smoothly!</p>}
      </div>
    </div>
  );
};

export default App;
