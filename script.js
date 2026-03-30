/* ═══════════════════════════════════════════
   FASCINATION PROJECT RESEARCH — SCRIPT
   Interactive concept map with pan/zoom
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── CANVAS SIZE ───
  const CANVAS_W = 1580;
  const CANVAS_H = 880;

  // ─── NODE POSITIONS { x, y, w? } ───
  const layout = {
    // Concepts — Row 1 (top)
    experience:        { x: 115, y: 145, w: 235 },
    serendipity:       { x: 618, y: 25, w: 255 },
    surrealism:        { x: 618, y: 215, w: 255 },
    proactive:         { x: 1120, y: 25, w: 240 },
    paradigm:          { x: 1120, y: 175, w: 220 },

    // Concepts — Row 2 (middle)
    background:        { x: 14, y: 278, w: 195 },
    metaphorical:      { x: 14, y: 400, w: 195 },
    modularity:        { x: 238, y: 310, w: 220 },
    patterns:          { x: 478, y: 350, w: 215 },
    anemoia:           { x: 720, y: 322, w: 200 },
    supply:            { x: 238, y: 452, w: 220 },

    // Concepts — Row 3 (bottom)
    systems:           { x: 222, y: 575, w: 230 },
    liminality:        { x: 472, y: 578, w: 220 },
    threshold:         { x: 472, y: 700, w: 220 },
    error:             { x: 878, y: 578, w: 200 },
    glitch:            { x: 878, y: 700, w: 200 },
    cause:             { x: 222, y: 710, w: 220 },

    // Concepts — Right column (outside boundary)
    statusquo:         { x: 1120, y: 295, w: 235 },
    intersubjectivity: { x: 1120, y: 410, w: 235 },
    entropy:           { x: 1120, y: 525, w: 230 },
    decay:             { x: 1120, y: 638, w: 230 },

    // Tags
    exploration:  { x: 445, y: 128, w: 158 },
    adventure:    { x: 445, y: 170, w: 158 },
    discovery:    { x: 445, y: 212, w: 158 },
    luck:         { x: 920, y: 35, w: 120 },
    knowledge:    { x: 920, y: 80, w: 120 },
    dream:        { x: 920, y: 182, w: 120 },
    longmoment:   { x: 715, y: 545, w: 148 },
    shortmoment:  { x: 715, y: 680, w: 148 },

    // Labels
    connections:  { x: 478, y: 515 },
    tension:      { x: 18, y: 575 },
    balance:      { x: 18, y: 655 },
    perspectives: { x: 1385, y: 248 },
  };

  // ─── CONNECTION DEFINITIONS ───
  // type: 'arrow' (default), 'tree', 'line'
  // sides: 'top', 'bottom', 'left', 'right'
  const connections = [
    // Experience ─┬─► Exploration / Adventure / Discovery
    { type: 'tree', from: 'experience', fromSide: 'right', to: ['exploration', 'adventure', 'discovery'], toSide: 'left' },

    // Exploration ↑ Serendipity
    { from: 'exploration', fromSide: 'top', to: 'serendipity', toSide: 'bottom' },

    // Serendipity → Luck, Knowledge
    { from: 'serendipity', fromSide: 'right', to: 'luck', toSide: 'left' },
    { from: 'serendipity', fromSide: 'right', to: 'knowledge', toSide: 'left' },

    // Discovery area → Surrealism
    { from: 'adventure', fromSide: 'right', to: 'surrealism', toSide: 'left' },

    // Surrealism → Dream
    { from: 'surrealism', fromSide: 'right', to: 'dream', toSide: 'left' },

    // Dream → Paradigm
    { from: 'dream', fromSide: 'right', to: 'paradigm', toSide: 'left' },

    // Connections ←→ (bidirectional)
    { type: 'biline', id: 'conn-left', from: 'connections', fromSide: 'left', length: 250 },
    { type: 'biline', id: 'conn-right', from: 'connections', fromSide: 'right', length: 370 },

    // Liminality → A long moment → Error
    { from: 'liminality', fromSide: 'right', to: 'longmoment', toSide: 'left' },
    { from: 'longmoment', fromSide: 'right', to: 'error', toSide: 'left' },

    // Threshold → A short moment → Glitch
    { from: 'threshold', fromSide: 'right', to: 'shortmoment', toSide: 'left' },
    { from: 'shortmoment', fromSide: 'right', to: 'glitch', toSide: 'left' },

    // Tension ← (left arrow from boundary area)
    { type: 'biline', id: 'tension-arrow', from: 'tension', fromSide: 'left', length: -80, arrowStart: true },
    // Balance ← (left arrow from boundary area)
    { type: 'biline', id: 'balance-arrow', from: 'balance', fromSide: 'left', length: -80, arrowStart: true },

    // Perspectives — vertical connector
    { type: 'vline', id: 'perspectives-line', node: 'perspectives', length: 160 },
  ];

  // ─── ADJACENCY (for highlight system) ───
  function buildAdjacency() {
    const adj = {};
    function add(a, b) {
      if (!adj[a]) adj[a] = new Set();
      if (!adj[b]) adj[b] = new Set();
      adj[a].add(b);
      adj[b].add(a);
    }
    connections.forEach(c => {
      if (c.type === 'tree') {
        c.to.forEach(t => add(c.from, t));
      } else if (c.from && c.to && typeof c.to === 'string') {
        add(c.from, c.to);
      }
    });
    return adj;
  }

  // ═══════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════

  const viewport = document.getElementById('viewport');
  const canvas = document.getElementById('canvas');
  const svg = document.getElementById('connections-svg');

  let scale = 1;
  let tx = 0, ty = 0;
  let adjacency;

  function init() {
    positionNodes();
    // Small delay so layout settles before drawing connections
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
  // POSITION NODES
  // ═══════════════════════════════════════════

  function positionNodes() {
    Object.entries(layout).forEach(([id, pos]) => {
      const el = document.getElementById('n-' + id);
      if (!el) return;
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      if (pos.w) el.style.width = pos.w + 'px';
    });
  }

  // ═══════════════════════════════════════════
  // GET NODE GEOMETRY
  // ═══════════════════════════════════════════

  function getRect(id) {
    const el = document.getElementById('n-' + id);
    if (!el) return null;
    return {
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
  }

  function anchor(id, side) {
    const r = getRect(id);
    if (!r) return { x: 0, y: 0 };
    switch (side) {
      case 'top':    return { x: r.x + r.w / 2, y: r.y };
      case 'bottom': return { x: r.x + r.w / 2, y: r.y + r.h };
      case 'left':   return { x: r.x, y: r.y + r.h / 2 };
      case 'right':  return { x: r.x + r.w, y: r.y + r.h / 2 };
      default:       return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }
  }

  // ═══════════════════════════════════════════
  // DRAW CONNECTIONS
  // ═══════════════════════════════════════════

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function drawAllConnections() {
    // Preserve <defs>
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    svg.appendChild(defs);
    svg.setAttribute('width', CANVAS_W);
    svg.setAttribute('height', CANVAS_H);
    svg.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);

    connections.forEach(c => {
      if (c.type === 'tree') drawTree(c);
      else if (c.type === 'biline') drawBiLine(c);
      else if (c.type === 'vline') drawVLine(c);
      else drawArrow(c);
    });
  }

  function drawArrow(c) {
    const a = anchor(c.from, c.fromSide);
    const b = anchor(c.to, c.toSide);
    const path = svgEl('path', {
      d: `M${a.x},${a.y} L${b.x},${b.y}`,
      class: 'connection-path',
      'marker-end': 'url(#arrowhead)',
      'data-from': c.from,
      'data-to': c.to,
    });
    svg.appendChild(path);
  }

  function drawTree(c) {
    const fromPt = anchor(c.from, c.fromSide);
    const targets = c.to.map(id => anchor(id, c.toSide));

    // Junction x = midpoint between from and first target
    const jx = Math.round((fromPt.x + targets[0].x) / 2);

    // Trunk: from → junction
    svg.appendChild(svgEl('line', {
      x1: fromPt.x, y1: fromPt.y,
      x2: jx, y2: fromPt.y,
      class: 'connection-path',
      'data-from': c.from, 'data-to': c.to[0],
    }));

    // Vertical connector
    const minY = Math.min(...targets.map(t => t.y));
    const maxY = Math.max(...targets.map(t => t.y));
    svg.appendChild(svgEl('line', {
      x1: jx, y1: minY,
      x2: jx, y2: maxY,
      class: 'connection-path',
      'data-from': c.from, 'data-to': c.to[0],
    }));

    // Branches to each target
    targets.forEach((t, i) => {
      svg.appendChild(svgEl('line', {
        x1: jx, y1: t.y,
        x2: t.x, y2: t.y,
        class: 'connection-path',
        'marker-end': 'url(#arrowhead)',
        'data-from': c.from, 'data-to': c.to[i],
      }));
    });
  }

  function drawBiLine(c) {
    const pt = anchor(c.from, c.fromSide);
    let endX = pt.x, endY = pt.y;

    if (c.fromSide === 'left') endX = pt.x - Math.abs(c.length);
    else if (c.fromSide === 'right') endX = pt.x + Math.abs(c.length);
    else if (c.fromSide === 'top') endY = pt.y - Math.abs(c.length);
    else if (c.fromSide === 'bottom') endY = pt.y + Math.abs(c.length);

    const attrs = {
      x1: endX, y1: endY,
      x2: pt.x, y2: pt.y,
      class: 'connection-path',
      'data-from': c.from || c.id,
      'data-to': c.id || c.from,
    };

    // Arrow at the end (tip) pointing away from label
    if (c.fromSide === 'left') {
      attrs['marker-start'] = 'url(#arrowhead)';
    } else {
      attrs['marker-end'] = 'url(#arrowhead)';
    }

    svg.appendChild(svgEl('line', attrs));
  }

  function drawVLine(c) {
    const r = getRect(c.node);
    if (!r) return;
    const cx = r.x + r.w / 2;
    const topY = r.y - 10;
    const botY = r.y + r.h + c.length;

    svg.appendChild(svgEl('line', {
      x1: cx, y1: topY,
      x2: cx, y2: r.y + r.h + 5,
      class: 'connection-path',
      'data-from': c.node, 'data-to': c.node,
    }));

    // Top arrowhead
    svg.appendChild(svgEl('line', {
      x1: cx, y1: topY,
      x2: cx, y2: topY - 1,
      class: 'connection-path',
      'marker-start': 'url(#arrowhead)',
      'data-from': c.node, 'data-to': c.node,
    }));

    // Bottom
    svg.appendChild(svgEl('line', {
      x1: cx, y1: r.y + r.h + 5,
      x2: cx, y2: botY,
      class: 'connection-path',
      'marker-end': 'url(#arrowhead)',
      'data-from': c.node, 'data-to': c.node,
    }));
  }

  // ═══════════════════════════════════════════
  // TRANSFORM
  // ═══════════════════════════════════════════

  function updateTransform() {
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function fitToView() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const headerH = 60;
    const effectiveH = vh - headerH;

    const sx = vw / CANVAS_W;
    const sy = effectiveH / CANVAS_H;
    scale = Math.min(sx, sy) * 0.92;

    tx = (vw - CANVAS_W * scale) / 2;
    ty = headerH + (effectiveH - CANVAS_H * scale) / 2;
    updateTransform();
  }

  // ═══════════════════════════════════════════
  // PAN & ZOOM
  // ═══════════════════════════════════════════

  function setupPanZoom() {
    let dragging = false;
    let startX, startY;

    // --- MOUSE ---
    viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('.node') || e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX - tx;
      startY = e.clientY - ty;
      viewport.classList.add('dragging');
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', e => {
      if (!dragging) return;
      tx = e.clientX - startX;
      ty = e.clientY - startY;
      updateTransform();
    });

    viewport.addEventListener('pointerup', () => {
      dragging = false;
      viewport.classList.remove('dragging');
    });

    viewport.addEventListener('pointercancel', () => {
      dragging = false;
      viewport.classList.remove('dragging');
    });

    // --- WHEEL ZOOM ---
    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      zoomAt(e.clientX, e.clientY, delta);
    }, { passive: false });

    // --- PINCH ZOOM ---
    let lastPinchDist = 0;

    viewport.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        lastPinchDist = pinchDist(e.touches);
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const dist = pinchDist(e.touches);
        const delta = (dist - lastPinchDist) * 0.003;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomAt(cx, cy, delta);
        lastPinchDist = dist;
      }
    }, { passive: true });

    function pinchDist(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  function zoomAt(cx, cy, delta) {
    const prev = scale;
    scale = Math.max(0.25, Math.min(3, scale + delta));
    const ratio = scale / prev;
    tx = cx - (cx - tx) * ratio;
    ty = cy - (cy - ty) * ratio;
    updateTransform();
  }

  // ═══════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════

  function setupControls() {
    document.getElementById('zoom-in').addEventListener('click', () => {
      zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 0.15);
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, -0.15);
    });
    document.getElementById('fit-view').addEventListener('click', fitToView);

    window.addEventListener('resize', fitToView);

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 0.1);
      } else if (e.key === '-') {
        e.preventDefault();
        zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, -0.1);
      } else if (e.key === '0') {
        e.preventDefault();
        fitToView();
      }
    });
  }

  // ═══════════════════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════════════════

  function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Load stored preference
    const stored = localStorage.getItem('fpr-theme');
    if (stored) html.setAttribute('data-theme', stored);

    // System preference fallback
    if (!stored && window.matchMedia('(prefers-color-scheme: light)').matches) {
      html.setAttribute('data-theme', 'light');
    }

    toggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('fpr-theme', next);
    });
  }

  // ═══════════════════════════════════════════
  // HIGHLIGHT SYSTEM
  // ═══════════════════════════════════════════

  function setupHighlights() {
    const allNodes = document.querySelectorAll('.node');
    let activeId = null;

    allNodes.forEach(node => {
      const nid = node.dataset.id;
      if (!nid) return;

      node.addEventListener('mouseenter', () => highlight(nid));
      node.addEventListener('mouseleave', () => clearHighlight());

      // Touch: tap to toggle highlight
      node.addEventListener('click', e => {
        e.stopPropagation();
        if (activeId === nid) {
          clearHighlight();
          activeId = null;
        } else {
          highlight(nid);
          activeId = nid;
        }
      });
    });

    // Tap on empty space to clear
    viewport.addEventListener('click', e => {
      if (!e.target.closest('.node')) {
        clearHighlight();
        activeId = null;
      }
    });
  }

  function highlight(nodeId) {
    const connected = new Set([nodeId]);
    if (adjacency[nodeId]) {
      adjacency[nodeId].forEach(n => connected.add(n));
    }

    document.querySelectorAll('.node').forEach(el => {
      const nid = el.dataset.id;
      if (!nid) return;
      el.classList.toggle('highlighted', connected.has(nid));
      el.classList.toggle('dimmed', !connected.has(nid));
    });

    document.querySelectorAll('.connection-path').forEach(path => {
      const f = path.getAttribute('data-from');
      const t = path.getAttribute('data-to');
      const isConn = connected.has(f) && connected.has(t);
      path.classList.toggle('highlighted', isConn);
      path.classList.toggle('dimmed', !isConn);
    });
  }

  function clearHighlight() {
    document.querySelectorAll('.highlighted, .dimmed').forEach(el => {
      el.classList.remove('highlighted', 'dimmed');
    });
  }

  // ═══════════════════════════════════════════
  // START
  // ═══════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
