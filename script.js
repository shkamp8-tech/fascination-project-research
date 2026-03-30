/* ═══════════════════════════════════════════
   FASCINATION PROJECT RESEARCH — SCRIPT
   Interactive concept map with pan/zoom
   Orthogonal (right-angle) connections
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── CANVAS SIZE ───
  const CANVAS_W = 1600;
  const CANVAS_H = 920;

  // ─── NODE POSITIONS ───
  // Carefully spaced to match the original diagram with no overlaps
  const layout = {
    // ── Top area ──
    experience:        { x: 100, y: 140, w: 245 },

    // Tags between experience and serendipity/surrealism
    exploration:       { x: 430, y: 120, w: 155 },
    adventure:         { x: 430, y: 162, w: 155 },
    discovery:         { x: 430, y: 204, w: 155 },

    serendipity:       { x: 620, y: 26, w: 260 },
    surrealism:        { x: 620, y: 210, w: 260 },

    // Tags right of serendipity
    luck:              { x: 930, y: 34, w: 110 },
    knowledge:         { x: 930, y: 78, w: 110 },

    // Tag right of surrealism
    dream:             { x: 930, y: 178, w: 110 },

    // Far right top
    proactive:         { x: 1120, y: 26, w: 250 },
    paradigm:          { x: 1120, y: 166, w: 228 },

    // ── Middle area ──
    background:        { x: 12, y: 280, w: 195 },
    metaphorical:      { x: 12, y: 400, w: 195 },

    modularity:        { x: 238, y: 315, w: 220 },
    patterns:          { x: 480, y: 355, w: 215 },
    anemoia:           { x: 720, y: 325, w: 205 },

    supply:            { x: 238, y: 460, w: 220 },

    // ── Bottom area ──
    systems:           { x: 218, y: 580, w: 235 },
    cause:             { x: 218, y: 730, w: 228 },

    liminality:        { x: 476, y: 580, w: 225 },
    threshold:         { x: 476, y: 720, w: 225 },

    // Tags between liminality/threshold and error/glitch
    longmoment:        { x: 725, y: 552, w: 145 },
    shortmoment:       { x: 725, y: 692, w: 145 },

    error:             { x: 898, y: 577, w: 200 },
    glitch:            { x: 898, y: 720, w: 200 },

    // ── Right column (outside boundary) ──
    statusquo:         { x: 1120, y: 300, w: 242 },
    intersubjectivity: { x: 1120, y: 418, w: 242 },
    entropy:           { x: 1120, y: 532, w: 235 },
    decay:             { x: 1120, y: 648, w: 235 },

    // ── Labels ──
    connections:       { x: 482, y: 520 },
    tension:           { x: 14, y: 585 },
    balance:           { x: 14, y: 670 },
    perspectives:      { x: 1394, y: 248 },
  };

  // ─── CONNECTION DEFINITIONS ───
  // All rendered as orthogonal (right-angle) paths
  const connections = [
    // Experience ─┬─► Exploration / Adventure / Discovery
    { type: 'tree', from: 'experience', fromSide: 'right', to: ['exploration', 'adventure', 'discovery'], toSide: 'left' },

    // Exploration ↑ Serendipity (up then right)
    { from: 'exploration', fromSide: 'top', to: 'serendipity', toSide: 'bottom' },

    // Serendipity → Luck
    { from: 'serendipity', fromSide: 'right', to: 'luck', toSide: 'left' },
    // Serendipity → Knowledge
    { from: 'serendipity', fromSide: 'right', to: 'knowledge', toSide: 'left' },

    // Discovery → Surrealism
    { from: 'discovery', fromSide: 'right', to: 'surrealism', toSide: 'left' },

    // Surrealism → Dream
    { from: 'surrealism', fromSide: 'right', to: 'dream', toSide: 'left' },

    // Dream → Paradigm
    { from: 'dream', fromSide: 'right', to: 'paradigm', toSide: 'left' },

    // Connections ←→ (horizontal arrows)
    { type: 'biline', id: 'conn-left', from: 'connections', fromSide: 'left', length: 260 },
    { type: 'biline', id: 'conn-right', from: 'connections', fromSide: 'right', length: 390 },

    // Liminality → A long moment → Error
    { from: 'liminality', fromSide: 'right', to: 'longmoment', toSide: 'left' },
    { from: 'longmoment', fromSide: 'right', to: 'error', toSide: 'left' },

    // Threshold → A short moment → Glitch
    { from: 'threshold', fromSide: 'right', to: 'shortmoment', toSide: 'left' },
    { from: 'shortmoment', fromSide: 'right', to: 'glitch', toSide: 'left' },

    // Tension ←
    { type: 'biline', id: 'tension-arrow', from: 'tension', fromSide: 'left', length: -80 },
    // Balance ←
    { type: 'biline', id: 'balance-arrow', from: 'balance', fromSide: 'left', length: -80 },

    // Perspectives — vertical with arrows at both ends
    { type: 'vline', id: 'perspectives-line', node: 'perspectives', length: 170 },
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
  // SVG HELPERS
  // ═══════════════════════════════════════════

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // Build an orthogonal (right-angle) SVG path between two anchors.
  function orthoPath(a, fromSide, b, toSide) {
    let points = [a];

    if (fromSide === 'right' && toSide === 'left') {
      const mx = Math.round((a.x + b.x) / 2);
      points.push({ x: mx, y: a.y });
      points.push({ x: mx, y: b.y });
    } else if (fromSide === 'left' && toSide === 'right') {
      const mx = Math.round((a.x + b.x) / 2);
      points.push({ x: mx, y: a.y });
      points.push({ x: mx, y: b.y });
    } else if (fromSide === 'top' && toSide === 'bottom') {
      const my = Math.round((a.y + b.y) / 2);
      points.push({ x: a.x, y: my });
      points.push({ x: b.x, y: my });
    } else if (fromSide === 'bottom' && toSide === 'top') {
      const my = Math.round((a.y + b.y) / 2);
      points.push({ x: a.x, y: my });
      points.push({ x: b.x, y: my });
    } else if (fromSide === 'right' && toSide === 'top') {
      points.push({ x: b.x, y: a.y });
    } else if (fromSide === 'right' && toSide === 'bottom') {
      points.push({ x: b.x, y: a.y });
    } else if (fromSide === 'bottom' && toSide === 'left') {
      points.push({ x: a.x, y: b.y });
    } else if (fromSide === 'top' && toSide === 'left') {
      points.push({ x: a.x, y: b.y });
    } else {
      const mx = Math.round((a.x + b.x) / 2);
      points.push({ x: mx, y: a.y });
      points.push({ x: mx, y: b.y });
    }

    points.push(b);

    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L${points[i].x},${points[i].y}`;
    }
    return d;
  }

  // ═══════════════════════════════════════════
  // DRAW CONNECTIONS
  // ═══════════════════════════════════════════

  function drawAllConnections() {
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
    const d = orthoPath(a, c.fromSide, b, c.toSide);
    svg.appendChild(svgEl('path', {
      d: d,
      class: 'connection-path',
      'marker-end': 'url(#arrowhead)',
      'data-from': c.from,
      'data-to': c.to,
    }));
  }

  function drawTree(c) {
    const fromPt = anchor(c.from, c.fromSide);
    const targets = c.to.map(id => anchor(id, c.toSide));

    const jx = Math.round((fromPt.x + targets[0].x) / 2);

    // Trunk: horizontal from → junction
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

    // Branches: horizontal to each target
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
    const topY = r.y - 15;
    const botY = r.y + r.h + c.length;

    // Top arrow (pointing up)
    svg.appendChild(svgEl('line', {
      x1: cx, y1: r.y - 2,
      x2: cx, y2: topY,
      class: 'connection-path',
      'marker-end': 'url(#arrowhead)',
      'data-from': c.node, 'data-to': c.node,
    }));

    // Bottom arrow (pointing down)
    svg.appendChild(svgEl('line', {
      x1: cx, y1: r.y + r.h + 2,
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

    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      zoomAt(e.clientX, e.clientY, delta);
    }, { passive: false });

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

    const stored = localStorage.getItem('fpr-theme');
    if (stored) html.setAttribute('data-theme', stored);

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
