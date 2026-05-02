import { useRef, useState } from "react";
import DrawingBoard from "./components/DrawingBoard";
import ControlPanel from "./components/ControlPanel";
import AIResult from "./components/AIResult";
import "./App.css";

const App = () => {
  const boardRef = useRef(null);
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("Gemini");
  const [isEraser, setIsEraser] = useState(false);
  const [penSize, setPenSize] = useState(5);
  const [penColor, setPenColor] = useState("#1a1a1a");
  const [historyCount, setHistoryCount] = useState({ undo: 0, redo: 0 });
  const [aiPos, setAiPos] = useState(null);

  const providers = ["Gemini", "Mistral", "Mistral OCR"];
  const colors = ["#1a1a1a", "#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6"];

  const handleGuess = async () => {
    if (!boardRef.current || boardRef.current.isEmpty()) return;

    setLoading(true);
    setGuess("");
    setAiPos(null);
    
    try {
      const base64Image = await boardRef.current.exportImage(512);

      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, provider }),
      });

      const data = await response.json();
      if (response.ok) {
        setGuess(data.guess);
        if (data.location && data.isSpatial) {
          setAiPos({ x: data.location.x_percent, y: data.location.y_percent });
        }
      } else {
        setGuess(data.error || "Error");
      }
    } catch (error) {
      console.error("Guess error:", error);
      setGuess("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Draw & Guess AI</h1>
      <p className="subtitle">Identify characters, solve math, or sketch objects!</p>
      
      <ControlPanel 
        providers={providers}
        provider={provider}
        setProvider={setProvider}
        colors={colors}
        penColor={penColor}
        setPenColor={setPenColor}
        penSize={penSize}
        setPenSize={setPenSize}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
      />

      <div className="canvas-wrapper">
        <DrawingBoard 
          ref={boardRef}
          penColor={penColor}
          penSize={penSize}
          isEraser={isEraser}
          onHistoryChange={setHistoryCount}
        />
        {loading && <div className="loading-overlay">Thinking...</div>}
        
        <AIResult 
          guess={guess}
          aiPos={aiPos}
          penColor={penColor}
          provider={provider}
        />
      </div>

      <div className="controls">
        <button onClick={() => boardRef.current.undo()} disabled={historyCount.undo === 0} className="secondary-btn">
          Undo ({historyCount.undo})
        </button>
        <button onClick={() => boardRef.current.redo()} disabled={historyCount.redo === 0} className="secondary-btn">
          Redo ({historyCount.redo})
        </button>
        <button onClick={() => boardRef.current.clear()} className="clear-btn">Clear</button>
        <button onClick={handleGuess} disabled={loading || historyCount.undo === 0} className="guess-btn large">
          {loading ? "..." : "Analyze"}
        </button>
      </div>

      <div className="result-area">
        <AIResult 
          guess={guess}
          aiPos={null} // Only show non-spatial result here
          provider={provider}
        />
        {!guess && !loading && <p className="hint">Pick a color and start sketching!</p>}
      </div>
    </div>
  );
};

export default App;
