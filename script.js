/* ═══════════════════════════════════════════
   FASCINATION PROJECT RESEARCH — SCRIPT
   Orthogonal concept map with pan/zoom
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  const CANVAS_W = 1750;
  const CANVAS_H = 1050;

  // ─── NODE POSITIONS ───
  // Each zone uses consistent widths. Generous vertical gaps prevent overlap
  // even when cards have long wrapped text.
  const layout = {

    // ═══ TOP ROW ═══
    experience:        { x: 100,  y: 140,  w: 250 },

    // Tags (between Experience and Serendipity/Surrealism)
    exploration:       { x: 430,  y: 125,  w: 150 },
    adventure:         { x: 430,  y: 168,  w: 150 },
    discovery:         { x: 430,  y: 211,  w: 150 },

    // Center-top concepts
    serendipity:       { x: 635,  y: 28,   w: 250 },
    surrealism:        { x: 635,  y: 218,  w: 250 },

    // Small tags right of serendipity / surrealism
    luck:              { x: 930,  y: 38,   w: 110 },
    knowledge:         { x: 930,  y: 78,   w: 110 },
    dream:             { x: 930,  y: 185,  w: 110 },

    // Far-right top
    proactive:         { x: 1160, y: 28,   w: 250 },
    paradigm:          { x: 1160, y: 170,  w: 250 },

    // ═══ MIDDLE ROW ═══
    background:        { x: 14,   y: 290,  w: 250 },
    metaphorical:      { x: 14,   y: 462,  w: 250 },

    modularity:        { x: 295,  y: 312,  w: 250 },
    supply:            { x: 295,  y: 462,  w: 250 },

    patterns:          { x: 575,  y: 355,  w: 250 },
    anemoia:           { x: 855,  y: 328,  w: 250 },

    // Far-right middle + bottom
    statusquo:         { x: 1160, y: 300,  w: 250 },
    intersubjectivity: { x: 1160, y: 420,  w: 250 },
    entropy:           { x: 1160, y: 540,  w: 250 },
    decay:             { x: 1160, y: 658,  w: 250 },

    // ═══ CONNECTIONS LABEL ═══
    connections:       { x: 575,  y: 510 },

    // ═══ BOTTOM ROW ═══
    systems:           { x: 295,  y: 600,  w: 250 },
    cause:             { x: 295,  y: 760,  w: 250 },

    liminality:        { x: 575,  y: 600,  w: 250 },
    threshold:         { x: 575,  y: 760,  w: 250 },

    longmoment:        { x: 855,  y: 580,  w: 155 },
    shortmoment:       { x: 855,  y: 730,  w: 155 },

    error:             { x: 1040, y: 600,  w: 250 },
    glitch:            { x: 1040, y: 760,  w: 250 },

    // ═══ LABELS ═══
    tension:           { x: 14,   y: 610 },
    balance:           { x: 14,   y: 720 },
    perspectives:      { x: 1438, y: 252 },
  };

  // ─── CONNECTIONS ───
  const connections = [
    // Experience ─┬─► Exploration / Adventure / Discovery
    { type: 'tree', from: 'experience', fromSide: 'right',
      to: ['exploration', 'adventure', 'discovery'], toSide: 'left' },

    // Exploration ↑ Serendipity
    { from: 'exploration', fromSide: 'top', to: 'serendipity', toSide: 'bottom' },

    // Serendipity → Luck / Knowledge
    { from: 'serendipity', fromSide: 'right', to: 'luck', toSide: 'left' },
    { from: 'serendipity', fromSide: 'right', to: 'knowledge', toSide: 'left' },

    // Discovery → Surrealism
    { from: 'discovery', fromSide: 'right', to: 'surrealism', toSide: 'left' },

    // Surrealism → Dream
    { from: 'surrealism', fromSide: 'right', to: 'dream', toSide: 'left' },

    // Dream → Paradigm
    { from: 'dream', fromSide: 'right', to: 'paradigm', toSide: 'left' },

    // Connections ←→
    { type: 'biline', id: 'conn-left',  from: 'connections', fromSide: 'left',  length: 275 },
    { type: 'biline', id: 'conn-right', from: 'connections', fromSide: 'right', length: 400 },

    // Liminality → A long moment → Error
    { from: 'liminality', fromSide: 'right', to: 'longmoment', toSide: 'left' },
    { from: 'longmoment', fromSide: 'right', to: 'error', toSide: 'left' },

    // Threshold → A short moment → Glitch
    { from: 'threshold', fromSide: 'right', to: 'shortmoment', toSide: 'left' },
    { from: 'shortmoment', fromSide: 'right', to: 'glitch', toSide: 'left' },

    // Tension ← / Balance ←
    { type: 'biline', id: 'tension-arrow', from: 'tension',  fromSide: 'left', length: -80 },
    { type: 'biline', id: 'balance-arrow', from: 'balance',  fromSide: 'left', length: -80 },

    // Perspectives ↕
    { type: 'vline', id: 'perspectives-line', node: 'perspectives', length: 175 },
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
    svg.appendChild(svgEl('path', {
      d: curvePath(a, c.fromSide, b, c.toSide),
      class: 'connection-path',
      'marker-end': 'url(#arrowhead)',
      'data-from': c.from,
      'data-to':   c.to,
    }));
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
    let drag = false, sx, sy;

    viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('.node, button')) return;
      drag = true; sx = e.clientX - tx; sy = e.clientY - ty;
      viewport.classList.add('dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', e => {
      if (!drag) return;
      tx = e.clientX - sx; ty = e.clientY - sy;
      updateTransform();
    });
    const endDrag = () => { drag = false; viewport.classList.remove('dragging'); };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? -0.08 : 0.08);
    }, { passive: false });

    let lastDist = 0;
    viewport.addEventListener('touchstart', e => {
      if (e.touches.length === 2) lastDist = pDist(e.touches);
    }, { passive: true });
    viewport.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const d = pDist(e.touches);
        zoomAt(
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2,
          (d - lastDist) * 0.003
        );
        lastDist = d;
      }
    }, { passive: true });
    function pDist(t) {
      const dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
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
