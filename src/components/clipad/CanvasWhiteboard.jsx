import React, { useRef, useEffect, useState, useCallback } from 'react';

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'select',  label: 'Select',       icon: '↖', shortcut: 'V' },
  { id: 'pen',     label: 'Pen',          icon: '✏️', shortcut: 'P' },
  { id: 'eraser',  label: 'Eraser',       icon: '⌫',  shortcut: 'E' },
  { id: 'line',    label: 'Line',         icon: '╱',  shortcut: 'L' },
  { id: 'arrow',   label: 'Arrow',        icon: '→',  shortcut: 'A' },
  { id: 'rect',    label: 'Rectangle',    icon: '▭',  shortcut: 'R' },
  { id: 'circle',  label: 'Circle',       icon: '◯',  shortcut: 'C' },
  { id: 'sticky',  label: 'Sticky Note',  icon: '📝', shortcut: 'N' },
  { id: 'text',    label: 'Text',         icon: 'T',  shortcut: 'T' },
  { id: 'image',   label: 'Image',        icon: '🖼', shortcut: 'I' },
];

const PALETTE = [
  '#111827','#6b7280','#ffffff',
  '#ef4444','#f97316','#eab308',
  '#22c55e','#06b6d4','#3b82f6',
  '#8b5cf6','#ec4899','#10b981',
];

const STICKY_COLORS = ['#fef08a','#bbf7d0','#bfdbfe','#fecaca','#e9d5ff','#fed7aa'];
const SIZES = [2, 4, 8, 16];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getClientPos(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function drawArrow(ctx, x1, y1, x2, y2, size) {
  const headLen = Math.max(10, size * 5);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawShape(ctx, start, end, tool, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (tool === 'line') {
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  } else if (tool === 'arrow') {
    drawArrow(ctx, start.x, start.y, end.x, end.y, size);
  } else if (tool === 'rect') {
    ctx.beginPath(); ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (tool === 'circle') {
    const rx = (end.x - start.x) / 2, ry = (end.y - start.y) / 2;
    ctx.beginPath(); ctx.ellipse(start.x + rx, start.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI); ctx.stroke();
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CanvasWhiteboard({ onClose }) {
  const canvasRef  = useRef(null);
  const ctxRef     = useRef(null);
  const fileRef    = useRef(null);
  const textRef    = useRef(null);

  const isDrawing  = useRef(false);
  const startPos   = useRef({ x: 0, y: 0 });
  const snapshot   = useRef(null);
  const history    = useRef([]);
  const redoStack  = useRef([]);
  const isPanning  = useRef(false);
  const lastPan    = useRef({ x: 0, y: 0 });

  const [tool,         setTool]         = useState('pen');
  const [color,        setColor]        = useState('#111827');
  const [size,         setSize]         = useState(3);
  const [showGrid,     setShowGrid]     = useState(true);
  const [zoom,         setZoom]         = useState(1);
  const [pan,          setPan]          = useState({ x: 0, y: 0 });
  const [textInput,    setTextInput]    = useState(null);   // { x, y, val }
  const [stickies,     setStickies]     = useState([]);     // [{id,x,y,text,bg}]
  const [editSticky,   setEditSticky]   = useState(null);
  const [stickyColor,  setStickyColor]  = useState(STICKY_COLORS[0]);
  const [showPalette,  setShowPalette]  = useState(false);

  // ── Canvas init / resize ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const old  = canvas.toDataURL();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = old;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // ── Grid overlay ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showGrid) return;
    // grid is purely visual via CSS background on parent — no canvas needed
  }, [showGrid]);

  // ── Pointer helpers ─────────────────────────────────────────────────────────
  const toCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top  - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current.push(canvas.toDataURL());
    if (history.current.length > 60) history.current.shift();
    redoStack.current = [];
  }, []);

  const applyCtxStyle = useCallback((ctx) => {
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, [color, size]);

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx || !history.current.length) return;
    redoStack.current.push(canvas.toDataURL());
    const prev = history.current.pop();
    const img  = new Image();
    img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = prev;
  }, []);

  const redo = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx || !redoStack.current.length) return;
    history.current.push(canvas.toDataURL());
    const next = redoStack.current.pop();
    const img  = new Image();
    img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = next;
  }, []);

  const clearBoard = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    saveHistory();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    setStickies([]);
  }, [saveHistory]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // ── Image import ────────────────────────────────────────────────────────────
  const onFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current, ctx = ctxRef.current;
        if (!canvas || !ctx) return;
        saveHistory();
        const maxW = canvas.width * 0.5;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const cx = (canvas.width  - img.width  * scale) / 2;
        const cy = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, cx, cy, img.width * scale, img.height * scale);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [saveHistory]);

  // ── Pointer events ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const { x: cx, y: cy } = getClientPos(e);

    // Middle mouse or space+drag → pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastPan.current = { x: cx, y: cy };
      return;
    }

    if (tool === 'image') { fileRef.current?.click(); return; }

    if (tool === 'sticky') {
      const pos = toCanvas(cx, cy);
      setStickies(prev => [...prev, { id: Date.now(), x: pos.x, y: pos.y, text: '', bg: stickyColor }]);
      setEditSticky(Date.now()); // will not match yet — set after state update
      return;
    }

    if (tool === 'text') {
      const pos = toCanvas(cx, cy);
      setTextInput({ x: pos.x, y: pos.y, val: '' });
      setTimeout(() => textRef.current?.focus(), 30);
      return;
    }

    const ctx    = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    saveHistory();
    isDrawing.current = true;
    const pos = toCanvas(cx, cy);
    startPos.current = pos;

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    applyCtxStyle(ctx);

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = size * 5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      snapshot.current = canvas.toDataURL();
    }
    ctx.restore();
  }, [tool, toCanvas, saveHistory, applyCtxStyle, pan, zoom, size, stickyColor]);

  const onPointerMove = useCallback((e) => {
    e.preventDefault();
    const { x: cx, y: cy } = getClientPos(e);

    if (isPanning.current) {
      const dx = cx - lastPan.current.x;
      const dy = cy - lastPan.current.y;
      lastPan.current = { x: cx, y: cy };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }

    if (!isDrawing.current) return;
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const pos = toCanvas(cx, cy);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    applyCtxStyle(ctx);

    if (tool === 'pen') {
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = size * 5;
      ctx.lineCap     = 'round';
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (snapshot.current) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(-pan.x / zoom, -pan.y / zoom, canvas.width / zoom, canvas.height / zoom);
        ctx.drawImage(img, -pan.x / zoom, -pan.y / zoom, canvas.width / zoom, canvas.height / zoom);
        drawShape(ctx, startPos.current, pos, tool, color, size);
      };
      img.src = snapshot.current;
    }
    ctx.restore();
  }, [tool, toCanvas, applyCtxStyle, pan, zoom, color, size]);

  const onPointerUp = useCallback((e) => {
    e.preventDefault();
    if (isPanning.current) { isPanning.current = false; return; }
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const { x: cx, y: cy } = getClientPos(e);
    const pos = toCanvas(cx, cy);

    if (snapshot.current && !['pen','eraser'].includes(tool)) {
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      applyCtxStyle(ctx);
      drawShape(ctx, startPos.current, pos, tool, color, size);
      ctx.restore();
    }
    ctx.beginPath();
    snapshot.current = null;
  }, [tool, toCanvas, applyCtxStyle, pan, zoom, color, size]);

  // ── Text submit ─────────────────────────────────────────────────────────────
  const submitText = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !textInput?.val?.trim()) { setTextInput(null); return; }
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.font = `${Math.max(14, size * 5)}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput.val, textInput.x, textInput.y);
    ctx.restore();
    setTextInput(null);
  }, [textInput, color, size, pan, zoom]);

  // ── Zoom ────────────────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(z => Math.max(0.2, Math.min(5, z + delta)));
  }, []);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Escape') { setTextInput(null); setEditSticky(null); }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(5, z + 0.1));
      if (e.key === '-') setZoom(z => Math.max(0.2, z - 0.1));
      if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); }
      TOOLS.forEach(t => { if (e.key.toLowerCase() === t.shortcut?.toLowerCase()) setTool(t.id); });
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [undo, redo]);

  const zoomPct = Math.round(zoom * 100);
  const cursorMap = { select: 'default', pen: 'crosshair', eraser: 'cell', text: 'text', image: 'pointer', sticky: 'copy' };
  const cursor = cursorMap[tool] || 'crosshair';

  return (
    <div className="absolute inset-0 z-[9999] flex flex-col bg-white select-none" style={{ touchAction: 'none', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex-shrink-0 flex-wrap shadow-sm">

        {/* Tool group */}
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={`${t.label} (${t.shortcut})`}
              className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${tool === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}>
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-7 bg-slate-200 mx-1" />

        {/* Color palette */}
        <div className="relative">
          <button onClick={() => setShowPalette(p => !p)}
            className="w-8 h-8 rounded-xl border-2 border-white shadow-md ring-2 ring-slate-200 transition-transform hover:scale-110"
            style={{ background: color }} title="Color" />
          {showPalette && (
            <div className="absolute top-10 left-0 z-50 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl grid grid-cols-6 gap-1.5 w-44">
              {PALETTE.map(c => (
                <button key={c} onClick={() => { setColor(c); setShowPalette(false); }}
                  className="w-6 h-6 rounded-full border border-slate-200 hover:scale-125 transition-transform shadow-sm"
                  style={{ background: c, outline: color === c ? '2px solid #059669' : 'none', outlineOffset: 2 }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 bg-transparent" title="Custom color" />
            </div>
          )}
        </div>

        {/* Size */}
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${size === s ? 'bg-emerald-600' : 'hover:bg-slate-100'}`}>
              <div className="rounded-full bg-current" style={{ width: Math.min(s + 2, 16), height: Math.min(s + 2, 16), color: size === s ? 'white' : '#334155' }} />
            </button>
          ))}
        </div>

        {tool === 'sticky' && (
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {STICKY_COLORS.map(c => (
              <button key={c} onClick={() => setStickyColor(c)}
                className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform"
                style={{ background: c, borderColor: stickyColor === c ? '#059669' : 'transparent' }} />
            ))}
          </div>
        )}

        <div className="w-px h-7 bg-slate-200 mx-1" />

        {/* Actions */}
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">↩</button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">↪</button>
          <button onClick={() => setShowGrid(g => !g)} title="Toggle grid"
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${showGrid ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>⊞</button>
          <button onClick={download} title="Export PNG" className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 text-sm">💾</button>
          <button onClick={clearBoard} title="Clear" className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500 text-sm">🗑</button>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm text-xs font-semibold text-slate-600">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center font-bold">−</button>
          <span className="w-10 text-center">{zoomPct}%</span>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center font-bold">+</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="ml-1 text-emerald-500 hover:text-emerald-700" title="Reset view">⊙</button>
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="ml-auto px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
          ✕ Close
        </button>
      </div>



      {/* ── Canvas area ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ background: showGrid ? 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)' : '#ffffff', backgroundSize: showGrid ? '24px 24px' : undefined }}
        onWheel={onWheel}
      >
        <canvas
          ref={canvasRef}
          style={{ cursor, display: 'block', width: '100%', height: '100%', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />

        {/* Sticky notes overlay */}
        {stickies.map(s => (
          <div key={s.id}
            style={{ position: 'absolute', left: s.x * zoom + pan.x, top: s.y * zoom + pan.y, background: s.bg, width: 180, minHeight: 100, zIndex: 10 }}
            className="rounded-xl shadow-lg border border-black/10 p-3 flex flex-col gap-1 cursor-move group"
            onMouseDown={e => {
              e.stopPropagation();
              const startX = e.clientX, startY = e.clientY;
              const origX = s.x, origY = s.y;
              const move = (ev) => {
                const dx = (ev.clientX - startX) / zoom;
                const dy = (ev.clientY - startY) / zoom;
                setStickies(prev => prev.map(n => n.id === s.id ? { ...n, x: origX + dx, y: origY + dy } : n));
              };
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move);
              window.addEventListener('mouseup', up);
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-wide">Note</span>
              <button onClick={() => setStickies(prev => prev.filter(n => n.id !== s.id))}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded flex items-center justify-center text-black/40 hover:text-red-500 text-xs">✕</button>
            </div>
            <textarea
              value={s.text}
              onChange={e => setStickies(prev => prev.map(n => n.id === s.id ? { ...n, text: e.target.value } : n))}
              placeholder="Type your note..."
              className="flex-1 bg-transparent resize-none text-sm text-slate-800 placeholder-black/30 outline-none leading-relaxed"
              style={{ minHeight: 60, fontFamily: 'Inter, sans-serif' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        ))}

        {/* Floating text input */}
        {textInput && (
          <div className="absolute z-20" style={{ left: textInput.x * zoom + pan.x, top: textInput.y * zoom + pan.y - 10 }}>
            <input
              ref={textRef}
              type="text"
              value={textInput.val}
              onChange={e => setTextInput(t => ({ ...t, val: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submitText(); if (e.key === 'Escape') setTextInput(null); }}
              onBlur={submitText}
              placeholder="Type here..."
              className="outline-none border-b-2 border-indigo-500 bg-transparent text-base min-w-[100px] placeholder-slate-300"
              style={{ color, fontSize: Math.max(14, size * 5), fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        )}
      </div>

      {/* Hidden file input for image import */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}
