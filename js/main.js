/**
 * main.js — Three.js 3D scene, UI interactions, and results rendering
 */

// ══════════════════════════════════════════════════
// THREE.JS BACKGROUND SCENE
// ══════════════════════════════════════════════════

function initThreeScene() {
  const canvas   = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // ── Particle Field ──────────────────────────────
  const particleCount  = 1200;
  const positions      = new Float32Array(particleCount * 3);
  const colors         = new Float32Array(particleCount * 3);
  const sizes          = new Float32Array(particleCount);

  const colorOptions = [
    new THREE.Color('#6366f1'),
    new THREE.Color('#a855f7'),
    new THREE.Color('#ec4899'),
    new THREE.Color('#38bdf8'),
  ];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

    const c = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 1.5 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

  const mat = new THREE.PointsMaterial({
    size:          0.4,
    vertexColors:  true,
    transparent:   true,
    opacity:       0.7,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // ── Floating Wireframe Spheres ──────────────────
  const spheres = [];
  const sphereData = [
    { r: 4,   x: -20, y: 10,  z: -5, speed: 0.003 },
    { r: 2.5, x: 25,  y: -8,  z: -3, speed: 0.005 },
    { r: 6,   x: 10,  y: 15,  z: -15,speed: 0.002 },
    { r: 1.5, x: -30, y: -15, z: -8, speed: 0.008 },
  ];

  sphereData.forEach(d => {
    const sg   = new THREE.SphereGeometry(d.r, 12, 12);
    const sm   = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.15 });
    const mesh = new THREE.Mesh(sg, sm);
    mesh.position.set(d.x, d.y, d.z);
    mesh.userData = d;
    scene.add(mesh);
    spheres.push(mesh);
  });

  // ── Connection Lines ────────────────────────────
  const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.08 });
  for (let i = 0; i < 30; i++) {
    const pts = [
      new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40),
      new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(lineGeo, lineMat));
  }

  // ── Mouse Parallax ──────────────────────────────
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Resize ──────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animate ─────────────────────────────────────
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    particles.rotation.y = time * 0.05 + mouseX * 0.05;
    particles.rotation.x = mouseY * 0.03;

    spheres.forEach(s => {
      s.rotation.x += s.userData.speed;
      s.rotation.y += s.userData.speed * 0.7;
      s.position.y += Math.sin(time + s.userData.x) * 0.01;
    });

    camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;

    renderer.render(scene, camera);
  }
  animate();
}

// ══════════════════════════════════════════════════
// CURSOR GLOW
// ══════════════════════════════════════════════════

function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  let cx = 0, cy = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function updateCursor() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();
}

// ══════════════════════════════════════════════════
// HERO CARD ANIMATION
// ══════════════════════════════════════════════════

function initHeroCard() {
  const card = document.getElementById('hero-card');
  if (!card) return;

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * 12;
    const ry = ((e.clientX - cx) / (rect.width  / 2)) * -12;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  });

  // Animate hero score ring
  const ring   = document.getElementById('hero-ring');
  const numEl  = document.getElementById('hero-score-num');
  if (!ring || !numEl) return;

  const circumference = 2 * Math.PI * 50;
  ring.style.strokeDasharray  = circumference;
  ring.style.strokeDashoffset = circumference;

  setTimeout(() => {
    const targetScore = 72;
    const offset = circumference - (targetScore / 100) * circumference;
    ring.style.transition    = 'stroke-dashoffset 2s ease';
    ring.style.strokeDashoffset = offset;

    let current = 0;
    const step = () => {
      if (current < targetScore) {
        current++;
        numEl.textContent = current;
        requestAnimationFrame(step);
      }
    };
    step();
  }, 800);
}

// ══════════════════════════════════════════════════
// TILT CARDS
// ══════════════════════════════════════════════════

function initTiltCards() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * 8;
      const ry = ((e.clientX - cx) / (rect.width  / 2)) * -8;
      card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

// ══════════════════════════════════════════════════
// NAVBAR SCROLL
// ══════════════════════════════════════════════════

function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ══════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ══════════════════════════════════════════════════

function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.step-card, .tip-card, .mistake-card, .strength-item, .action-plan-card').forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });
}

// ══════════════════════════════════════════════════
// UPLOAD ZONE
// ══════════════════════════════════════════════════

function initUploadZone() {
  const zone      = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');

  browseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

// ══════════════════════════════════════════════════
// FILE HANDLING + ANALYSIS
// ══════════════════════════════════════════════════

const STEPS = [
  'Extracting text from your resume...',
  'Analyzing contact information...',
  'Checking section headers...',
  'Scanning for action verbs...',
  'Measuring keyword density...',
  'Evaluating formatting...',
  'Calculating your ATS score...',
  'Generating improvement report...',
];

async function handleFile(file) {
  // Validate
  const allowed = ['.pdf', '.docx', '.doc', '.txt'];
  const ext     = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showToast('❌ Please upload a PDF, DOCX, or TXT file.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('❌ File too large. Maximum size is 10MB.', 'error');
    return;
  }

  // Show analyzing state
  document.getElementById('upload-zone').style.display     = 'none';
  document.getElementById('analyzing-state').style.display = 'flex';

  let stepIndex = 0;
  const stepEl  = document.getElementById('analyzing-step');
  const progBar = document.getElementById('progress-bar');

  const stepInterval = setInterval(() => {
    if (stepIndex < STEPS.length) {
      stepEl.textContent         = STEPS[stepIndex];
      progBar.style.width        = `${((stepIndex + 1) / STEPS.length) * 100}%`;
      stepIndex++;
    }
  }, 300);

  try {
    // Extract text
    const text = await PARSER.extract(file);

    if (!text || text.trim().length < 50) {
      throw new Error('Could not extract readable text from your file. Make sure the PDF is not scanned/image-based.');
    }

    // Simulate remaining steps
    await new Promise(r => setTimeout(r, 1800));

    // Analyze
    const result = ATS_ENGINE.analyze(text, file.name);

    clearInterval(stepInterval);
    progBar.style.width = '100%';
    await new Promise(r => setTimeout(r, 400));

    displayResults(result, file.name);

  } catch (err) {
    clearInterval(stepInterval);
    document.getElementById('upload-zone').style.display     = 'flex';
    document.getElementById('analyzing-state').style.display = 'none';
    showToast('❌ ' + (err.message || err), 'error');
  }
}

// ══════════════════════════════════════════════════
// RESULTS DISPLAY
// ══════════════════════════════════════════════════

function displayResults(result, fileName) {
  // Hide upload, show results
  document.getElementById('upload-section').style.display  = 'none';
  document.getElementById('results-section').style.display = 'block';

  document.getElementById('file-name-display').textContent = fileName;

  // Smooth scroll to results
  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
  }, 100);

  // Animate score ring
  animateScoreRing(result.score, result.grade, result.gradeColor);

  // Breakdown bars
  renderBreakdown(result.breakdown);

  // Issue badges
  renderIssueBadges(result.issues);

  // Mistakes list
  renderMistakes(result.issues);

  // Strengths
  renderStrengths(result.strengths);

  // Action Plan
  renderActionPlan(result.actionPlan);

  // Re-initialize scroll animations
  setTimeout(initScrollAnimations, 200);

  showToast('✅ Analysis complete!', 'success');
}

function animateScoreRing(score, grade, gradeColor) {
  const ring    = document.getElementById('score-ring-fill');
  const numEl   = document.getElementById('score-number');
  const gradeEl = document.getElementById('score-grade');
  const card    = document.getElementById('score-card-3d');

  const circumference = 2 * Math.PI * 85;
  ring.style.strokeDasharray  = circumference;
  ring.style.strokeDashoffset = circumference;
  ring.style.stroke           = `url(#scoreGrad)`;

  // Update gradient color based on score
  if (score >= 70)       ring.style.stroke = gradeColor;
  else if (score >= 50)  ring.style.stroke = '#f59e0b';
  else                   ring.style.stroke = '#ef4444';

  setTimeout(() => {
    const offset = circumference - (score / 100) * circumference;
    ring.style.transition       = 'stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)';
    ring.style.strokeDashoffset = offset;

    let current = 0;
    const step  = () => {
      if (current < score) {
        current++;
        numEl.textContent = current;
        requestAnimationFrame(step);
      }
    };
    step();
  }, 300);

  gradeEl.textContent  = grade;
  gradeEl.style.color  = gradeColor;

  // 3D tilt on score card
  if (card) {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const rx   = ((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * 10;
      const ry   = ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) * -10;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
    });
  }
}

function renderBreakdown(breakdown) {
  const container = document.getElementById('breakdown-bars');
  container.innerHTML = '';

  Object.entries(breakdown).forEach(([name, data], idx) => {
    const pct = Math.round((data.score / data.max) * 100);
    const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';

    const div = document.createElement('div');
    div.className   = 'breakdown-bar-item';
    div.style.animationDelay = `${idx * 0.1}s`;
    div.innerHTML = `
      <div class="bar-label">
        <span>${name}</span>
        <span style="color:${color}">${data.score}/${data.max}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;background:${color}" data-target="${pct}"></div>
      </div>
    `;
    container.appendChild(div);
  });

  // Animate bars
  setTimeout(() => {
    container.querySelectorAll('.bar-fill').forEach(bar => {
      bar.style.transition = 'width 1s ease';
      bar.style.width      = bar.dataset.target + '%';
    });
  }, 400);
}

function renderIssueBadges(issues) {
  const container = document.getElementById('issue-badges');
  const counts    = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach(i => counts[i.severity]++);

  container.innerHTML = `
    ${counts.critical ? `<div class="issue-badge badge-critical">🔴 ${counts.critical} Critical</div>` : ''}
    ${counts.high     ? `<div class="issue-badge badge-high">🟠 ${counts.high} High</div>` : ''}
    ${counts.medium   ? `<div class="issue-badge badge-medium">🟡 ${counts.medium} Medium</div>` : ''}
    ${counts.low      ? `<div class="issue-badge badge-low">🟢 ${counts.low} Low</div>` : ''}
    ${issues.length === 0 ? `<div class="issue-badge badge-perfect">🏆 No issues found!</div>` : ''}
  `;

  document.getElementById('issues-count').textContent = issues.length;
}

function renderMistakes(issues) {
  const container = document.getElementById('mistakes-list');
  container.innerHTML = '';

  if (issues.length === 0) {
    container.innerHTML = '<div class="no-issues">🎉 No issues found! Your resume is ATS-optimized.</div>';
    return;
  }

  issues.forEach((issue, idx) => {
    const card = document.createElement('div');
    card.className = `mistake-card severity-${issue.severity}`;
    card.style.animationDelay = `${idx * 0.07}s`;

    const severityIcons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const severityLabels = { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };

    card.innerHTML = `
      <div class="mistake-header" onclick="toggleMistake(this)">
        <div class="mistake-left">
          <span class="mistake-severity-icon">${severityIcons[issue.severity]}</span>
          <div>
            <span class="mistake-category">${issue.category}</span>
            <h4 class="mistake-title">${issue.title}</h4>
          </div>
        </div>
        <div class="mistake-right">
          <span class="severity-badge badge-${issue.severity}">${severityLabels[issue.severity]}</span>
          <span class="mistake-toggle">▼</span>
        </div>
      </div>
      <div class="mistake-body">
        <p class="mistake-desc">${issue.desc}</p>
        <div class="mistake-fix">
          <span class="fix-label">💡 How to Fix:</span>
          <p>${issue.fix}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleMistake(header) {
  const card = header.closest('.mistake-card');
  card.classList.toggle('expanded');
  const toggle = header.querySelector('.mistake-toggle');
  toggle.textContent = card.classList.contains('expanded') ? '▲' : '▼';
}
window.toggleMistake = toggleMistake;

function renderStrengths(strengths) {
  const container = document.getElementById('strengths-list');
  container.innerHTML = '';

  if (strengths.length === 0) {
    container.innerHTML = '<div class="no-strengths">No significant strengths detected yet.</div>';
    return;
  }

  strengths.forEach((s, idx) => {
    const el = document.createElement('div');
    el.className = 'strength-item';
    el.style.animationDelay = `${idx * 0.1}s`;
    el.innerHTML = `<span class="strength-icon">${s.icon}</span><span>${s.text}</span>`;
    container.appendChild(el);
  });
}

function renderActionPlan(actionPlan) {
  const container = document.getElementById('action-plan-grid');
  container.innerHTML = '';

  actionPlan.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'action-plan-card tilt-card';
    card.style.animationDelay = `${idx * 0.1}s`;
    card.innerHTML = `
      <div class="action-num">${item.priority}</div>
      <div class="action-impact">${item.impact}</div>
      <div class="action-category">${item.category}</div>
      <p class="action-text">${item.action}</p>
    `;
    container.appendChild(card);
  });

  initTiltCards();
}

// ══════════════════════════════════════════════════
// SAMPLE RESULT (Demo)
// ══════════════════════════════════════════════════

function showSampleResult() {
  const sampleText = `
John Smith
john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | New York, NY

PROFESSIONAL SUMMARY
Results-driven software engineer with 5+ years of experience developing scalable web applications.

WORK EXPERIENCE
Senior Software Engineer — TechCorp Inc, 2021 – Present
- Led development of microservices architecture serving 2M+ daily users
- Reduced API response time by 40% through caching optimization
- Managed team of 6 engineers delivering 15 features per quarter
- Implemented CI/CD pipeline reducing deployment time by 60%

Software Engineer — StartupXYZ, 2019 – 2021
- Developed React-based dashboard used by 50K+ customers
- Increased test coverage from 45% to 90% within 3 months

EDUCATION
B.S. Computer Science — State University, 2019

SKILLS
JavaScript, Python, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, MongoDB

PROJECTS
Portfolio Website — Built with React and Node.js
Open Source Contribution — 200+ GitHub stars
  `;

  const result = ATS_ENGINE.analyze(sampleText, 'sample_resume.txt');
  document.getElementById('upload-section').style.display  = 'none';
  document.getElementById('results-section').style.display = 'block';
  document.getElementById('file-name-display').textContent = 'sample_resume.txt (Demo)';

  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
  }, 100);

  animateScoreRing(result.score, result.grade, result.gradeColor);
  renderBreakdown(result.breakdown);
  renderIssueBadges(result.issues);
  renderMistakes(result.issues);
  renderStrengths(result.strengths);
  renderActionPlan(result.actionPlan);
  setTimeout(initScrollAnimations, 200);
  showToast('👀 Showing sample analysis!', 'info');
}
window.showSampleResult = showSampleResult;

// ══════════════════════════════════════════════════
// BACK BUTTON
// ══════════════════════════════════════════════════

function initBackBtn() {
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('upload-section').style.display  = 'block';
    document.getElementById('analyzing-state').style.display = 'none';
    document.getElementById('upload-zone').style.display     = 'flex';
    document.getElementById('file-input').value              = '';
    document.getElementById('progress-bar').style.width      = '0%';

    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
  });
}

// ══════════════════════════════════════════════════
// TOAST NOTIFICATION
// ══════════════════════════════════════════════════

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent  = msg;
  toast.className    = `toast toast-${type} toast-visible`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}
window.showToast = showToast;

// ══════════════════════════════════════════════════
// INIT ALL
// ══════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  initCursorGlow();
  initHeroCard();
  initTiltCards();
  initNavbar();
  initScrollAnimations();
  initUploadZone();
  initBackBtn();
});
