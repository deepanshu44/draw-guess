import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import "./App.css";

const App = () => {
  const sigRef = useRef(null);
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("Any");
  const [provider, setProvider] = useState("Gemini");
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const modes = ["Any", "Object", "Letter", "Number", "Scenery"];
  const providers = ["Gemini", "Mistral"];

  const handleClear = () => {
    sigRef.current.clear();
    setGuess("");
    setLoading(false);
    setHistory([]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const undoneState = newHistory.pop();
    setRedoStack(prev => [...prev, undoneState]);
    setHistory(newHistory);
    sigRef.current.clear();
    if (newHistory.length > 0) {
      sigRef.current.fromData(newHistory[newHistory.length - 1]);
    }
    setGuess("");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const newRedoStack = [...redoStack];
    const redoneState = newRedoStack.pop();
    setHistory(prev => [...prev, redoneState]);
    setRedoStack(newRedoStack);
    sigRef.current.fromData(redoneState);
    setGuess("");
  };

  const handleGuess = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    setLoading(true);
    setGuess("");
    try {
      const canvas = sigRef.current.getCanvas();
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const ctx = finalCanvas.getContext("2d");
      
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
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

  const handleStrokeEnd = () => {
    const data = sigRef.current.toData();
    setHistory(prev => [...prev, data]);
    setRedoStack([]);
  };

  return (
    <div className="container">
      <h1>Draw & Guess</h1>
      
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
        <SignatureCanvas
          ref={sigRef}
          onEnd={handleStrokeEnd}
          penColor={isEraser ? "white" : "black"}
          backgroundColor="white"
          velocityFilterWeight={0.1}
          minWidth={isEraser ? 20 : 4}
          maxWidth={isEraser ? 40 : 8}
          canvasProps={{
            className: "sketch-canvas",
            width: 400,
            height: 400,
          }}
        />
        {loading && <div className="loading-overlay">Thinking...</div>}
      </div>

      <div className="controls">
        <button onClick={handleUndo} disabled={history.length === 0} className="secondary-btn">
          Undo
        </button>
        <button onClick={handleRedo} disabled={redoStack.length === 0} className="secondary-btn">
          Redo
        </button>
        <button onClick={handleClear} className="clear-btn">
          Clear
        </button>
        <button onClick={handleGuess} disabled={loading} className="guess-btn large">
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
        {!guess && !loading && <p className="hint">Select a model and draw!</p>}
      </div>
    </div>
  );
};

export default App;
