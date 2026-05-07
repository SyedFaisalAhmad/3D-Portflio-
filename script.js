/* ============================================================
   POLY.STUDIO — 3D Portfolio  |  main.js
   ============================================================ */

/* ── Custom Cursor ── */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx - 6 + 'px';
    cursor.style.top  = my - 6 + 'px';
  });

  function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx - 20 + 'px';
    ring.style.top  = ry - 20 + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  // Scale cursor on interactive elements
  const hoverEls = document.querySelectorAll('a, button, .project-card, .skill-pill');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'scale(2)';
      ring.style.transform   = 'scale(0.6)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = '';
      ring.style.transform   = '';
    });
  });
})();


/* ── Helper: resize canvas to its CSS size ── */
function fitCanvas(canvas) {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}


/* ── HERO BACKGROUND: animated particle/network field ── */
(function initHeroBg() {
  const canvas = document.getElementById('heroBg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { fitCanvas(canvas); }
  resize();
  window.addEventListener('resize', resize);

  const NPTS = 130;
  const pts = Array.from({ length: NPTS }, () => ({
    x:  Math.random(),
    y:  Math.random(),
    z:  Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.00025,
    vy: (Math.random() - 0.5) * 0.00025,
  }));

  let t = 0;

  function draw() {
    t += 0.005;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, W, H);

    // Update + draw connections
    for (let i = 0; i < NPTS; i++) {
      const p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      for (let j = i + 1; j < NPTS; j++) {
        const q   = pts[j];
        const dx  = (p.x - q.x) * W;
        const dy  = (p.y - q.y) * H;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const alpha = (1 - dist / 150) * 0.28;
          ctx.strokeStyle = `rgba(200,255,0,${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x * W, p.y * H);
          ctx.lineTo(q.x * W, q.y * H);
          ctx.stroke();
        }
      }
    }

    // Draw dots
    for (const p of pts) {
      const brightness = 0.4 + Math.sin(t * p.z + p.x * 10) * 0.2;
      ctx.fillStyle = `rgba(200,255,0,${brightness})`;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.z * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();
})();


/* ── PROJECT CANVAS HELPER ──
   shape: 'cube' | 'torus' | 'sphere'
   colorA/colorB: CSS color strings
*/
function makeProjectCanvas(canvasId, colorA, colorB, shape) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { fitCanvas(canvas); }
  resize();
  new ResizeObserver(resize).observe(canvas);

  let t = 0;

  /* --- 3-D rotation helpers --- */
  function rotXY(x, y, z, pitch, yaw) {
    // Pitch (rotate around X)
    const y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
    const z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
    // Yaw (rotate around Y)
    const x2 = x * Math.cos(yaw) + z1 * Math.sin(yaw);
    const z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
    return [x2, y1, z2];
  }

  function project(x, y, z, W, H, scale, fov = 3) {
    const sc = fov / (fov + z);
    return [W / 2 + x * scale * sc, H / 2 + y * scale * sc, z];
  }

  /* --- Wireframe Cube --- */
  function drawCube(W, H) {
    const scale  = Math.min(W, H) * 0.28;
    const pitch  = t * 0.7;
    const yaw    = t;
    const verts3 = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];

    const proj = verts3.map(([x,y,z]) => {
      const [rx, ry, rz] = rotXY(x, y, z, pitch, yaw);
      return project(rx, ry, rz, W, H, scale);
    });

    edges.forEach(([a, b]) => {
      const [ax, ay] = proj[a];
      const [bx, by] = proj[b];
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, colorA);
      g.addColorStop(1, colorB);
      ctx.strokeStyle = g;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    });

    // Vertex dots
    proj.forEach(([px, py]) => {
      ctx.fillStyle = colorA;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* --- Dot-cloud Torus --- */
  function drawTorus(W, H) {
    const R      = Math.min(W, H) * 0.22;
    const r      = Math.min(W, H) * 0.08;
    const yaw    = t * 0.5;
    const steps  = 24, tube = 16;

    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      for (let j = 0; j < tube; j++) {
        const phi = (j / tube) * Math.PI * 2 + t;
        const x   = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y   = r * Math.sin(phi);
        const z   = (R + r * Math.cos(phi)) * Math.sin(theta);
        const [rx, ry, rz] = rotXY(x, y, z, 0, yaw);
        const [px, py, pz] = project(rx, ry, rz, W, H, 1);
        const bright = (pz + R + r) / (2 * (R + r));
        ctx.fillStyle   = bright > 0.5 ? colorA : colorB;
        ctx.globalAlpha = 0.4 + bright * 0.6;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  /* --- Wireframe Sphere --- */
  function drawSphere(W, H) {
    const rad  = Math.min(W, H) * 0.3;
    const segs = 14;
    const yaw  = t * 0.3;

    for (let lat = 0; lat <= segs; lat++) {
      const a = (lat / segs) * Math.PI;
      ctx.beginPath();
      for (let lon = 0; lon <= segs * 2; lon++) {
        const b   = (lon / (segs * 2)) * Math.PI * 2 + t * 0.5;
        const x   = Math.sin(a) * Math.cos(b);
        const y   = Math.cos(a);
        const z   = Math.sin(a) * Math.sin(b);
        const [rx, ry, rz] = rotXY(x, y, z, 0, yaw);
        const fov = 3, sc = fov / (fov + rz * 0.5);
        const px  = W / 2 + rx * rad * sc;
        const py  = H / 2 + ry * rad * sc;
        lon === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      const g = ctx.createLinearGradient(W / 2 - rad, H / 2, W / 2 + rad, H / 2);
      g.addColorStop(0, colorB);
      g.addColorStop(1, colorA);
      ctx.strokeStyle = g;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }
  }

  /* --- Grid overlay (shared) --- */
  function drawGrid(W, H) {
    const spacing = Math.min(W, H) * 0.12;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function draw() {
    t += 0.012;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, W, H);
    drawGrid(W, H);

    if (shape === 'cube')   drawCube(W, H);
    if (shape === 'torus')  drawTorus(W, H);
    if (shape === 'sphere') drawSphere(W, H);

    requestAnimationFrame(draw);
  }
  draw();
}

makeProjectCanvas('proj1', '#c8ff00', '#00ffd0', 'cube');
makeProjectCanvas('proj2', '#60a5fa', '#a78bfa', 'torus');
makeProjectCanvas('proj3', '#ff3c3c', '#ff9900', 'sphere');


/* ── ABOUT CANVAS: rotating icosahedron ── */
(function initAboutCanvas() {
  const canvas = document.getElementById('aboutCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { fitCanvas(canvas); }
  resize();
  new ResizeObserver(resize).observe(canvas);

  const phi  = (1 + Math.sqrt(5)) / 2;
  const rawV = [
    [-1, phi,0],[1, phi,0],[-1,-phi,0],[1,-phi,0],
    [0,-1, phi],[0, 1, phi],[0,-1,-phi],[0, 1,-phi],
    [ phi,0,-1],[ phi,0, 1],[-phi,0,-1],[-phi,0, 1],
  ];
  // Normalize to unit sphere
  const verts = rawV.map(([x,y,z]) => {
    const len = Math.sqrt(x*x + y*y + z*z);
    return [x/len, y/len, z/len];
  });

  const faces = [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
  ];

  let t = 0;

  function draw() {
    t += 0.008;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const scale  = Math.min(W, H) * 0.38;
    const pitch  = t * 0.6;
    const yaw    = t;

    function project([x, y, z]) {
      // Pitch
      const y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
      const z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
      // Yaw
      const x2 =  x * Math.cos(yaw) + z1 * Math.sin(yaw);
      const z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
      const fov = 3, sc = fov / (fov + z2);
      return [W / 2 + x2 * scale * sc, H / 2 + y1 * scale * sc, z2];
    }

    const proj = verts.map(project);

    // Sort faces back-to-front (painter's algorithm)
    const sorted = faces
      .map(f => ({ f, depth: (proj[f[0]][2] + proj[f[1]][2] + proj[f[2]][2]) / 3 }))
      .sort((a, b) => a.depth - b.depth);

    sorted.forEach(({ f }) => {
      const [ax, ay] = proj[f[0]];
      const [bx, by] = proj[f[1]];
      const [cx, cy] = proj[f[2]];
      const depth    = (proj[f[0]][2] + proj[f[1]][2] + proj[f[2]][2]) / 3;
      const norm     = (depth + 1) / 2;

      ctx.fillStyle   = `rgba(${Math.floor(norm * 80)},${Math.floor(norm * 255)},${Math.floor(norm * 40)},${0.06 + norm * 0.12})`;
      ctx.strokeStyle = `rgba(200,255,0,${0.25 + norm * 0.45})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();


/* ── Scroll-reveal: fade in sections ── */
(function initScrollReveal() {
  const sections = document.querySelectorAll('.works, .about, .contact');
  sections.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(32px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  sections.forEach(el => observer.observe(el));
})();
