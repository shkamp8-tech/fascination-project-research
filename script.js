/* ═══════════════════════════════════════════
   FASCINATION PROJECT RESEARCH — SCRIPT
   Orthogonal concept map with pan/zoom
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  const CANVAS_W = 1900;
  const CANVAS_H = 1100;

  // ─── NODE POSITIONS ───
  // Uniform widths: concepts=250, tags=135, labels=auto
  const layout = {

    // ═══ TOP ROW ═══
    experience:        { x: 20,   y: 120,  w: 250 },

    // Tags
    exploration:       { x: 310,  y: 95,   w: 135 },
    adventure:         { x: 310,  y: 140,  w: 135 },
    discovery:         { x: 310,  y: 185,  w: 135 },

    // Center-top concepts
    serendipity:       { x: 490,  y: 20,   w: 250 },
    surrealism:        { x: 490,  y: 190,  w: 250 },

    // Tags
    luck:              { x: 780,  y: 30,   w: 135 },
    knowledge:         { x: 780,  y: 75,   w: 135 },
    dream:             { x: 780,  y: 200,  w: 135 },

    // Right-top concepts
    proactive:         { x: 960,  y: 20,   w: 250 },
    paradigm:          { x: 960,  y: 190,  w: 250 },

    // ═══ MIDDLE ROW ═══
    background:        { x: 20,   y: 340,  w: 250 },
    metaphorical:      { x: 20,   y: 510,  w: 250 },

    modularity:        { x: 310,  y: 340,  w: 250 },
    supply:            { x: 310,  y: 510,  w: 250 },

    patterns:          { x: 600,  y: 380,  w: 250 },
    anemoia:           { x: 890,  y: 370,  w: 250 },

    // ═══ FAR-RIGHT COLUMN ═══
    statusquo:         { x: 1350, y: 340,  w: 250 },
    intersubjectivity: { x: 1350, y: 490,  w: 250 },
    entropy:           { x: 1350, y: 640,  w: 250 },
    decay:             { x: 1350, y: 790,  w: 250 },

    // ═══ CONNECTIONS LABEL ═══
    connections:       { x: 600,  y: 540 },

    // ═══ BOTTOM ROW ═══
    tension:           { x: 20,   y: 660 },
    systems:           { x: 310,  y: 650,  w: 250 },
    liminality:        { x: 600,  y: 650,  w: 250 },
    longmoment:        { x: 880,  y: 655,  w: 135 },
    error:             { x: 1060, y: 640,  w: 250 },

    balance:           { x: 20,   y: 830 },
    cause:             { x: 310,  y: 820,  w: 250 },
    threshold:         { x: 600,  y: 820,  w: 250 },
    shortmoment:       { x: 880,  y: 825,  w: 135 },
    glitch:            { x: 1060, y: 810,  w: 250 },

    // ═══ PERSPECTIVES LABEL ═══
    perspectives:      { x: 1630, y: 540 },
  };

  // ─── CONNECTIONS ───
  const connections = [
    // Experience ─┬─► Exploration / Adventure / Discovery
    { type: 'tree', from: 'experience', fromSide: 'right',
      to: ['exploration', 'adventure', 'discovery'], toSide: 'left' },

    // Serendipity → Exploration / Adventure / Discovery (arrows point at the tags)
    { from: 'serendipity', fromSide: 'left', to: 'exploration', toSide: 'right' },
    { from: 'serendipity', fromSide: 'left', to: 'adventure',   toSide: 'right' },
    { from: 'serendipity', fromSide: 'left', to: 'discovery',   toSide: 'right' },

    // Surrealism → Exploration / Adventure / Discovery (arrows point at the tags)
    { from: 'surrealism', fromSide: 'left', to: 'exploration', toSide: 'right' },
    { from: 'surrealism', fromSide: 'left', to: 'adventure',   toSide: 'right' },
    { from: 'surrealism', fromSide: 'left', to: 'discovery',   toSide: 'right' },

    // Luck / Knowledge → Serendipity (arrows point at Serendipity)
    { from: 'luck', fromSide: 'left', to: 'serendipity', toSide: 'right' },
    { from: 'knowledge', fromSide: 'left', to: 'serendipity', toSide: 'right' },

    // Dream → Surrealism (arrow points at Surrealism)
    { from: 'dream', fromSide: 'left', to: 'surrealism', toSide: 'right' },

    // Dream → Paradigm
    { from: 'dream', fromSide: 'right', to: 'paradigm', toSide: 'left' },

    // Paradigm — Status Quo (no arrow)
    { from: 'paradigm', fromSide: 'bottom', to: 'statusquo', toSide: 'top', noArrow: true },

    // Surrealism — Anemoia (no arrow)
    { from: 'surrealism', fromSide: 'bottom', to: 'anemoia', toSide: 'top', noArrow: true },

    // Background Relations — Metaphorical (no arrow)
    { from: 'background', fromSide: 'bottom', to: 'metaphorical', toSide: 'top', noArrow: true },

    // Modularity — Supply — Systems — Cause (no arrows)
    { from: 'modularity', fromSide: 'bottom', to: 'supply', toSide: 'top', noArrow: true },
    { from: 'supply', fromSide: 'bottom', to: 'systems', toSide: 'top', noArrow: true },
    { from: 'systems', fromSide: 'bottom', to: 'cause', toSide: 'top', noArrow: true },

    // Liminality — Threshold (no arrow)
    { from: 'liminality', fromSide: 'bottom', to: 'threshold', toSide: 'top', noArrow: true },

    // Error — Glitch (no arrow)
    { from: 'error', fromSide: 'bottom', to: 'glitch', toSide: 'top', noArrow: true },

    // Entropy — Decay (no arrow)
    { from: 'entropy', fromSide: 'bottom', to: 'decay', toSide: 'top', noArrow: true },

    // Connections ←→ (horizontal lines spanning the connection zone)
    { type: 'biline', id: 'conn-left',  from: 'connections', fromSide: 'left',  length: 290 },
    { type: 'biline', id: 'conn-right', from: 'connections', fromSide: 'right', length: 460 },

    // Error → A long moment (arrow points at longmoment)
    { from: 'error', fromSide: 'left', to: 'longmoment', toSide: 'right' },
    { from: 'longmoment', fromSide: 'left', to: 'liminality', toSide: 'right' },

    // Glitch → A short moment (arrow points at shortmoment)
    { from: 'glitch', fromSide: 'left', to: 'shortmoment', toSide: 'right' },
    { from: 'shortmoment', fromSide: 'left', to: 'threshold', toSide: 'right' },

    // Tension → Systems
    { from: 'tension', fromSide: 'right', to: 'systems', toSide: 'left' },

    // Balance → Cause
    { from: 'balance', fromSide: 'right', to: 'cause', toSide: 'left' },

    // Perspectives ↕ connected to Status Quo (up) and Decay (down)
    { from: 'perspectives', fromSide: 'top', to: 'statusquo', toSide: 'right' },
    { from: 'perspectives', fromSide: 'bottom', to: 'decay', toSide: 'right' },
  ];

  // ─── ADJACENCY ───
  function buildAdjacency() {
    const adj = {};
    function add(a, b) {
      if (!adj[a]) adj[a] = new Set();
      if (!adj[b]) adj[b] = new Set();
      adj[a].add(b);
      adj[b].add(a);
    }
    connections.forEach(c => {
      if (c.type === 'tree') c.to.forEach(t => add(c.from, t));
      else if (c.from && c.to && typeof c.to === 'string') add(c.from, c.to);
    });
    return adj;
  }

  // ═══════════════════════════════════════════
  const viewport = document.getElementById('viewport');
  const canvas   = document.getElementById('canvas');
  const svg      = document.getElementById('connections-svg');
  let scale = 1, tx = 0, ty = 0, adjacency;

  function init() {
    positionNodes();
    requestAnimationFrame(() => {
      drawAllConnections();
      adjacency = buildAdjacency();
      fitToView();
      setupPanZoom();
      setupThemeToggle();
      setupHighlights();
      setupControls();
    });
  }

  // ═══════════════════════════════════════════
  // POSITION
  // ═══════════════════════════════════════════

  function positionNodes() {
    Object.entries(layout).forEach(([id, p]) => {
      const el = document.getElementById('n-' + id);
      if (!el) return;
      el.style.left = p.x + 'px';
      el.style.top  = p.y + 'px';
      if (p.w) el.style.width = p.w + 'px';
    });
  }

  function getRect(id) {
    const el = document.getElementById('n-' + id);
    if (!el) return null;
    return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
  }

  function anchor(id, side) {
    const r = getRect(id);
    if (!r) return { x: 0, y: 0 };
    switch (side) {
      case 'top':    return { x: r.x + r.w / 2, y: r.y };
      case 'bottom': return { x: r.x + r.w / 2, y: r.y + r.h };
      case 'left':   return { x: r.x,           y: r.y + r.h / 2 };
      case 'right':  return { x: r.x + r.w,     y: r.y + r.h / 2 };
      default:       return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }
  }

  // ═══════════════════════════════════════════
  // SVG + ORTHOGONAL PATHS
  // ═══════════════════════════════════════════

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  /**
   * Build a smooth cubic bezier curve between two anchors.
   * Control points extend outward from each anchor in the direction of its side.
   */
  function curvePath(a, fromSide, b, toSide) {
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const tension = Math.max(40, Math.min(dx, dy) * 0.45);

    function cp(pt, side, dist) {
      switch (side) {
        case 'right':  return { x: pt.x + dist, y: pt.y };
        case 'left':   return { x: pt.x - dist, y: pt.y };
        case 'top':    return { x: pt.x, y: pt.y - dist };
        case 'bottom': return { x: pt.x, y: pt.y + dist };
        default:       return { x: pt.x + dist, y: pt.y };
      }
    }

    const c1 = cp(a, fromSide, tension);
    const c2 = cp(b, toSide, tension);
    return `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`;
  }

  // ═══════════════════════════════════════════
  // DRAW
  // ═══════════════════════════════════════════

  function drawAllConnections() {
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    svg.appendChild(defs);
    svg.setAttribute('width', CANVAS_W);
    svg.setAttribute('height', CANVAS_H);
    svg.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);

    connections.forEach(c => {
      if      (c.type === 'tree')   drawTree(c);
      else if (c.type === 'biline') drawBiLine(c);
      else if (c.type === 'vline')  drawVLine(c);
      else                          drawArrow(c);
    });
  }

  function drawArrow(c) {
    const a = anchor(c.from, c.fromSide);
    const b = anchor(c.to,   c.toSide);
    const attrs = {
      d: curvePath(a, c.fromSide, b, c.toSide),
      class: 'connection-path',
      'data-from': c.from,
      'data-to':   c.to,
    };
    if (!c.noArrow) attrs['marker-end'] = 'url(#arrowhead)';
    svg.appendChild(svgEl('path', attrs));
  }

  function drawTree(c) {
    const from = anchor(c.from, c.fromSide);
    const tgts = c.to.map(id => anchor(id, c.toSide));

    // Draw a smooth curve from source to each target
    tgts.forEach((t, i) => {
      svg.appendChild(svgEl('path', {
        d: curvePath(from, c.fromSide, t, c.toSide),
        class: 'connection-path',
        'marker-end': 'url(#arrowhead)',
        'data-from': c.from, 'data-to': c.to[i],
      }));
    });
  }

  function drawBiLine(c) {
    const pt = anchor(c.from, c.fromSide);
    let ex = pt.x, ey = pt.y;
    if      (c.fromSide === 'left')   ex = pt.x - Math.abs(c.length);
    else if (c.fromSide === 'right')  ex = pt.x + Math.abs(c.length);
    else if (c.fromSide === 'top')    ey = pt.y - Math.abs(c.length);
    else if (c.fromSide === 'bottom') ey = pt.y + Math.abs(c.length);

    const attrs = {
      x1: ex, y1: ey, x2: pt.x, y2: pt.y,
      class: 'connection-path',
      'data-from': c.from || c.id, 'data-to': c.id || c.from,
    };
    attrs[c.fromSide === 'left' ? 'marker-start' : 'marker-end'] = 'url(#arrowhead)';
    svg.appendChild(svgEl('line', attrs));
  }

  function drawVLine(c) {
    const r = getRect(c.node);
    if (!r) return;
    const cx = r.x + r.w / 2;
    // Arrow up
    svg.appendChild(svgEl('line', {
      x1: cx, y1: r.y - 2, x2: cx, y2: r.y - 18,
      class: 'connection-path', 'marker-end': 'url(#arrowhead)',
      'data-from': c.node, 'data-to': c.node,
    }));
    // Arrow down
    svg.appendChild(svgEl('line', {
      x1: cx, y1: r.y + r.h + 2, x2: cx, y2: r.y + r.h + c.length,
      class: 'connection-path', 'marker-end': 'url(#arrowhead)',
      'data-from': c.node, 'data-to': c.node,
    }));
  }

  // ═══════════════════════════════════════════
  // PAN / ZOOM
  // ═══════════════════════════════════════════

  function updateTransform() {
    canvas.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }

  function fitToView() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const hdr = 60, eh = vh - hdr;
    scale = Math.min(vw / CANVAS_W, eh / CANVAS_H) * 0.92;
    tx = (vw - CANVAS_W * scale) / 2;
    ty = hdr + (eh - CANVAS_H * scale) / 2;
    updateTransform();
  }

  function zoomAt(cx, cy, d) {
    const prev = scale;
    scale = Math.max(0.2, Math.min(3, scale + d));
    const r = scale / prev;
    tx = cx - (cx - tx) * r;
    ty = cy - (cy - ty) * r;
    updateTransform();
  }

  function setupPanZoom() {
    // ── Unified pointer tracking ──
    const pointers = new Map();   // pointerId → {x, y}
    let prevMid = null, prevDist = 0;

    viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      // Allow dragging from nodes too (1-finger nav)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('dragging');
      if (pointers.size === 1) {
        prevMid = { x: e.clientX, y: e.clientY };
      }
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        prevMid  = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        prevDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    viewport.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        // Single finger/mouse → pan
        const pt = pointers.values().next().value;
        const dx = pt.x - prevMid.x;
        const dy = pt.y - prevMid.y;
        tx += dx;
        ty += dy;
        prevMid = { x: pt.x, y: pt.y };
        updateTransform();

      } else if (pointers.size === 2) {
        // Two fingers → pinch zoom + pan
        const pts = [...pointers.values()];
        const mid  = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

        // Pan from midpoint movement
        tx += mid.x - prevMid.x;
        ty += mid.y - prevMid.y;

        // Zoom from pinch
        if (prevDist > 0) {
          const newScale = Math.max(0.2, Math.min(3, scale * (dist / prevDist)));
          const r = newScale / scale;
          tx = mid.x - (mid.x - tx) * r;
          ty = mid.y - (mid.y - ty) * r;
          scale = newScale;
        }

        prevMid  = mid;
        prevDist = dist;
        updateTransform();
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        viewport.classList.remove('dragging');
        prevMid = null;
        prevDist = 0;
      } else if (pointers.size === 1) {
        // Seamlessly continue with remaining finger
        const pt = pointers.values().next().value;
        prevMid = { x: pt.x, y: pt.y };
        prevDist = 0;
      }
    }
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);

    // ── Mouse wheel zoom ──
    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? -0.08 : 0.08);
    }, { passive: false });
  }

  // ═══════════════════════════════════════════
  // CONTROLS + THEME + HIGHLIGHTS
  // ═══════════════════════════════════════════

  function setupControls() {
    const ctr = (id, fn) => document.getElementById(id).addEventListener('click', fn);
    ctr('zoom-in',  () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 0.15));
    ctr('zoom-out', () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, -0.15));
    ctr('fit-view', fitToView);
    window.addEventListener('resize', fitToView);
    document.addEventListener('keydown', e => {
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 0.1); }
      else if (e.key === '-')             { e.preventDefault(); zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, -0.1); }
      else if (e.key === '0')             { e.preventDefault(); fitToView(); }
    });
  }

  function setupThemeToggle() {
    const html = document.documentElement;
    const stored = localStorage.getItem('fpr-theme');
    if (stored) html.setAttribute('data-theme', stored);
    else if (window.matchMedia('(prefers-color-scheme: light)').matches) html.setAttribute('data-theme', 'light');
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('fpr-theme', next);
    });
  }

  function setupHighlights() {
    let activeId = null;
    document.querySelectorAll('.node').forEach(node => {
      const nid = node.dataset.id;
      if (!nid) return;
      node.addEventListener('mouseenter', () => highlight(nid));
      node.addEventListener('mouseleave', () => clearHighlight());
      node.addEventListener('click', e => {
        e.stopPropagation();
        if (activeId === nid) { clearHighlight(); activeId = null; }
        else { highlight(nid); activeId = nid; }
      });
    });
    viewport.addEventListener('click', e => { if (!e.target.closest('.node')) { clearHighlight(); activeId = null; } });
  }

  function highlight(id) {
    const set = new Set([id]);
    if (adjacency[id]) adjacency[id].forEach(n => set.add(n));
    document.querySelectorAll('.node').forEach(el => {
      const n = el.dataset.id; if (!n) return;
      el.classList.toggle('highlighted', set.has(n));
      el.classList.toggle('dimmed', !set.has(n));
    });
    document.querySelectorAll('.connection-path').forEach(p => {
      const ok = set.has(p.getAttribute('data-from')) && set.has(p.getAttribute('data-to'));
      p.classList.toggle('highlighted', ok);
      p.classList.toggle('dimmed', !ok);
    });
  }

  function clearHighlight() {
    document.querySelectorAll('.highlighted,.dimmed').forEach(el => el.classList.remove('highlighted','dimmed'));
  }

  // ═══════════════════════════════════════════
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
