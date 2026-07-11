import React, { useRef, useEffect, useState, useCallback } from 'react';

const TOOLS = [
  { id: 'pen',      label: 'Pen',     icon: '✏️' },
  { id: 'eraser',   label: 'Eraser',  icon: '🧹' },
  { id: 'line',     label: 'Line',    icon: '╱'  },
  { id: 'rect',     label: 'Rect',    icon: '▭'  },
  { id: 'circle',   label: 'Circle',  icon: '◯'  },
  { id: 'text',     label: 'Text',    icon: 'T'  },
];

const COLORS = [
  '#1e1e1e', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
];

const SIZES = [2, 5, 10, 20];

export default function CanvasWhiteboard({ onClose }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);
  const historyRef = useRef([]);
  const redoStackRef = useRef([]);
  const textInputRef = useRef(null);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1e1e1e');
  const [size, setSize] = useState(3);
  const [bgColor] = useState('#ffffff');
  const [textPos, setTextPos] = useState(null);
  const [textValue, setTextValue] = useState('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      // Save old content
      const oldData = canvas.toDataURL();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = oldData;
      ctxRef.current = ctx;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [bgColor]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL());
    if (historyRef.current.length > 50) historyRef.current.shift();
    redoStackRef.current = [];
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || historyRef.current.length === 0) return;
    redoStackRef.current.push(canvas.toDataURL());
    const prev = historyRef.current.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  }, []);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || redoStackRef.current.length === 0) return;
    historyRef.current.push(canvas.toDataURL());
    const next = redoStackRef.current.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = next;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    saveToHistory();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [bgColor, saveToHistory]);

  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Drawing handlers
  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    if (tool === 'text') {
      const pos = getPos(e, canvas);
      setTextPos(pos);
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    saveToHistory();
    isDrawingRef.current = true;
    const pos = getPos(e, canvas);
    startPosRef.current = pos;

    ctx.strokeStyle = tool === 'eraser' ? bgColor : color;
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    if (tool !== 'pen' && tool !== 'eraser') {
      snapshotRef.current = canvas.toDataURL();
    }
  }, [tool, color, size, bgColor, saveToHistory]);

  const onPointerMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const pos = getPos(e, canvas);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore snapshot for shape preview
      if (snapshotRef.current) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          drawShape(ctx, startPosRef.current, pos, tool, color, size);
        };
        img.src = snapshotRef.current;
      }
    }
  }, [tool, color, size]);

  const onPointerUp = useCallback((e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    if (tool !== 'pen' && tool !== 'eraser' && tool !== 'text') {
      const pos = getPos(e, canvas);
      drawShape(ctx, startPosRef.current, pos, tool, color, size);
    }
    ctx.beginPath();
    snapshotRef.current = null;
  }, [tool, color, size]);

  const handleTextSubmit = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !textPos || !textValue.trim()) {
      setTextPos(null);
      return;
    }
    ctx.font = `${Math.max(14, size * 4)}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textValue, textPos.x, textPos.y);
    setTextPos(null);
    setTextValue('');
  }, [textPos, textValue, color, size]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Escape') setTextPos(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const cursorStyle = tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair';

  return (
    <div className="absolute inset-0 z-[9999] flex flex-col bg-white select-none" style={{ touchAction: 'none' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200 flex-shrink-0 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 mr-2">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${tool === t.id ? 'bg-primary text-white shadow-sm' : 'hover:bg-slate-200 text-slate-700'}`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-1 mr-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={c}
              style={{ background: c, border: color === c ? '2px solid #3b82f6' : '1px solid #cbd5e1' }}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110 shadow-sm"
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Size */}
        <div className="flex items-center gap-1 mr-2">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${size === s ? 'bg-primary text-white' : 'hover:bg-slate-200'}`}
            >
              <div className="rounded-full bg-current" style={{ width: Math.min(s + 2, 16), height: Math.min(s + 2, 16) }} />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">↩</button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">↪</button>
          <button onClick={clearCanvas} title="Clear" className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center text-sm text-red-500">🗑</button>
          <button onClick={downloadCanvas} title="Download PNG" className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-sm">💾</button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="ml-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-all"
        >
          Close ✕
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ cursor: cursorStyle, display: 'block', width: '100%', height: '100%' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />

        {/* Floating text input */}
        {textPos && (
          <div className="absolute z-10" style={{ left: textPos.x, top: textPos.y - 8 }}>
            <input
              ref={textInputRef}
              type="text"
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setTextPos(null); }}
              onBlur={handleTextSubmit}
              className="outline-none border-b-2 border-blue-500 bg-transparent text-base min-w-[80px]"
              style={{ color, fontSize: Math.max(14, size * 4), fontFamily: 'Inter, sans-serif' }}
              placeholder="Type..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function drawShape(ctx, start, end, tool, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (tool === 'line') {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (tool === 'rect') {
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (tool === 'circle') {
    const rx = (end.x - start.x) / 2;
    const ry = (end.y - start.y) / 2;
    const cx = start.x + rx;
    const cy = start.y + ry;
    ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
    ctx.stroke();
  }
}
