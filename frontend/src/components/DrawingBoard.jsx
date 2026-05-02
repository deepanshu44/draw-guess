import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { getStroke } from "perfect-freehand";

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

const DrawingBoard = forwardRef(({ penColor = "#1a1a1a", penSize = 5, isEraser = false, onHistoryChange }, ref) => {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [redoStack, setRedoStack] = useState([]);

  // Expose API to the parent
  useImperativeHandle(ref, () => ({
    clear: () => {
      setStrokes([]);
      setRedoStack([]);
    },
    undo: () => {
      if (strokes.length === 0) return;
      const newStrokes = [...strokes];
      const undone = newStrokes.pop();
      setRedoStack(prev => [...prev, undone]);
      setStrokes(newStrokes);
    },
    redo: () => {
      if (redoStack.length === 0) return;
      const newRedo = [...redoStack];
      const redone = newRedo.pop();
      setStrokes(prev => [...prev, redone]);
      setRedoStack(newRedo);
    },
    exportImage: async (size = 512) => {
      const canvas = canvasRef.current;
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = size;
      finalCanvas.height = size;
      const ctx = finalCanvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);
      return finalCanvas.toDataURL("image/png").split(",")[1];
    },
    getHistoryCount: () => strokes.length,
    getRedoCount: () => redoStack.length,
    isEmpty: () => strokes.length === 0
  }));

  // Notify parent of history changes (for button state)
  useEffect(() => {
    if (onHistoryChange) onHistoryChange({ undo: strokes.length, redo: redoStack.length });
  }, [strokes.length, redoStack.length]);

  const handlePointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure || 0.5 };
    setCurrentStroke({
      points: [point],
      color: isEraser ? "white" : penColor,
      size: isEraser ? 35 : penSize
    });
    setRedoStack([]);
  };

  const handlePointerMove = (e) => {
    if (!currentStroke) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure || 0.5 };
    setCurrentStroke(prev => ({ ...prev, points: [...prev.points, point] }));
  };

  const handlePointerUp = () => {
    if (!currentStroke) return;
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    
    const render = () => {
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const allStrokes = [...strokes];
      if (currentStroke) allStrokes.push(currentStroke);
      
      allStrokes.forEach(stroke => {
        const outlinePoints = getStroke(stroke.points.map(p => [p.x, p.y, p.pressure]), {
          size: stroke.size, thinning: 0.6, smoothing: 0.5, streamline: 0.5,
        });
        const pathData = getSvgPathFromStroke(outlinePoints);
        ctx.fillStyle = stroke.color;
        ctx.fill(new Path2D(pathData));
      });
    };
    render();
  }, [strokes, currentStroke]);

  return (
    <canvas
      ref={canvasRef}
      className="sketch-canvas smooth"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "none", width: "100%", height: "100%", borderRadius: "inherit" }}
    />
  );
});

export default DrawingBoard;
