/**
 * jd-matcher.js — Job Description Keyword Matcher
 * Extracts keywords from a JD and matches them against resume text
 */

const JD_MATCHER = (() => {

  // Stop words to filter out
  const STOP_WORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','up','about','into','through','during','before','after','above','below',
    'is','are','was','were','be','been','being','have','has','had','do','does','did',
    'will','would','could','should','may','might','shall','must','can','need',
    'we','our','you','your','they','their','this','that','these','those','it','its',
    'who','which','what','when','where','how','all','each','every','both','few','more',
    'most','other','some','such','no','not','only','same','so','than','too','very',
    'as','if','while','although','because','since','unless','until','however','therefore',
    'also','well','just','now','then','there','here','any','many','much','such','own',
    'see','make','look','get','go','come','take','give','know','think','feel','become',
    'include','including','including','using','use','uses','used','work','working','works',
    'team','company','role','position','candidate','job','opportunity','apply','please',
    'send','able','strong','good','excellent','great','key','responsible','required',
    'preferred','plus','bonus','ideal','minimum','years','year','experience','looking',
    'seeking','join','help','assist','support','provide','ensure','maintain','develop',
    'manage','lead','build','create','design','implement','deliver','drive','collaborate',
  ]);

  // Important tech/skill patterns to always extract
  const TECH_PATTERNS = [
    /\b(react(\.js)?|vue(\.js)?|angular|next\.js|svelte|node\.js|express|django|flask|spring|laravel)\b/gi,
    /\b(python|javascript|typescript|java|kotlin|swift|go|rust|c\+\+|c#|ruby|php|scala|r)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins|ci\/cd|devops|git|github|gitlab)\b/gi,
    /\b(sql|nosql|postgresql|mysql|mongodb|redis|elasticsearch|kafka|rabbitmq|graphql|rest|api)\b/gi,
    /\b(machine learning|deep learning|nlp|computer vision|data science|ai|ml|llm|gpt)\b/gi,
    /\b(agile|scrum|jira|confluence|kanban|waterfall|sprint|backlog|standup)\b/gi,
    /\b(ux|ui|figma|sketch|adobe|photoshop|illustrator|css|html|sass|webpack|vite)\b/gi,
  ];

  function extractKeywords(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = new Set();

    // 1. Extract tech patterns (multi-word)
    TECH_PATTERNS.forEach(pattern => {
      const matches = lower.match(pattern) || [];
      matches.forEach(m => found.add(m.trim().toLowerCase()));
    });

    // 2. Extract meaningful words (3+ chars, not stop words)
    const words = lower.match(/\b[a-z][a-z0-9\-+#.]{2,}\b/g) || [];
    words.forEach(w => {
      if (!STOP_WORDS.has(w) && w.length >= 3 && w.length <= 30) {
        found.add(w);
      }
    });

    // 3. Extract 2-word phrases that are meaningful
    const phrasePattern = /\b([a-z][a-z]{2,})\s+([a-z][a-z]{2,})\b/g;
    let pm;
    while ((pm = phrasePattern.exec(lower)) !== null) {
      const phrase = pm[0];
      const w1 = pm[1], w2 = pm[2];
      if (!STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        found.add(phrase);
      }
    }

    return Array.from(found);
  }

  function extractImportantKeywords(jdText) {
    if (!jdText) return [];
    const lower = jdText.toLowerCase();

    // Score each keyword by frequency and position (earlier = more important)
    const words = extractKeywords(jdText);
    const scored = words.map(kw => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lower.match(regex) || [];
      const firstPos = lower.indexOf(kw);
      const posScore = firstPos < 200 ? 3 : firstPos < 500 ? 2 : 1;
      return { kw, score: matches.length * posScore, freq: matches.length };
    });

    // Filter: keep keywords with freq >= 1, sort by score, deduplicate subsets
    const sorted = scored
      .filter(s => s.freq >= 1)
      .sort((a, b) => b.score - a.score);

    // Remove single words that are substrings of higher-ranked phrases
    const final = [];
    const seen  = new Set();
    sorted.forEach(({ kw }) => {
      if (seen.has(kw)) return;
      // If a longer phrase contains this word, skip the shorter one (unless it scores higher)
      const isCoveredByPhrase = final.some(f => f.includes(' ') && f.includes(kw));
      if (!isCoveredByPhrase || kw.includes(' ')) {
        final.push(kw);
        seen.add(kw);
      }
    });

    // Cap at top 60 keywords
    return final.slice(0, 60);
  }

  function matchKeywords(jdKeywords, resumeText) {
    const lower = resumeText.toLowerCase();
    const found   = [];
    const missing = [];

    jdKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        found.push(kw);
      } else {
        missing.push(kw);
      }
    });

    return { found, missing };
  }

  function getMatchGrade(pct) {
    if (pct >= 80) return { grade: '🏆 Excellent Match',  color: '#22c55e', desc: 'Your resume is highly aligned with this job. You are a strong candidate.' };
    if (pct >= 65) return { grade: '👍 Good Match',       color: '#84cc16', desc: 'Your resume matches well. Add a few missing keywords to strengthen it.' };
    if (pct >= 50) return { grade: '⚡ Decent Match',     color: '#f59e0b', desc: 'Moderate alignment. Consider tailoring your resume more to this JD.' };
    if (pct >= 35) return { grade: '⚠️ Weak Match',       color: '#ef4444', desc: 'Low alignment. Your resume needs significant keyword additions for this role.' };
    return              { grade: '❌ Poor Match',         color: '#dc2626', desc: 'Very low match. This role may require different skills or experience.' };
  }

  function analyze(resumeText, jdText) {
    const jdKeywords = extractImportantKeywords(jdText);
    if (jdKeywords.length === 0) return null;

    const { found, missing } = matchKeywords(jdKeywords, resumeText);
    const pct   = Math.round((found.length / jdKeywords.length) * 100);
    const grade = getMatchGrade(pct);

    return {
      pct,
      grade:      grade.grade,
      gradeColor: grade.color,
      desc:       grade.desc,
      found,
      missing,
      all:        jdKeywords,
      totalJDKeywords: jdKeywords.length,
    };
  }

  return { analyze, extractImportantKeywords };
})();

// ══════════════════════════════════════════════════
// JD MATCHER UI CONTROLLER
// ══════════════════════════════════════════════════

(function initJDMatcher() {

  const SAMPLE_JD = `We are looking for a Senior Software Engineer to join our growing Engineering team. You will be responsible for designing, developing, and maintaining scalable web applications.

Responsibilities:
- Design and build robust backend services using Node.js and Python
- Develop responsive frontend interfaces using React and TypeScript
- Work with AWS cloud services (EC2, S3, Lambda, RDS)
- Collaborate with cross-functional teams using Agile/Scrum methodology
- Write clean, testable code with unit testing and integration testing
- Design and optimize SQL and NoSQL databases (PostgreSQL, MongoDB)
- Implement CI/CD pipelines using Jenkins and GitHub Actions
- Participate in code reviews and mentor junior engineers

Requirements:
- 5+ years of software engineering experience
- Strong proficiency in JavaScript, TypeScript, and Node.js
- Experience with React or similar frontend frameworks
- Hands-on experience with AWS, Docker, and Kubernetes
- Solid understanding of RESTful APIs and GraphQL
- Experience with agile methodologies and version control (Git)
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or related field

Nice to Have:
- Experience with machine learning or AI/ML tools
- Knowledge of Redis, Kafka, or Elasticsearch
- Contributions to open-source projects`;

  let jdResumeText = null;   // Extracted resume text for JD section
  let jdAllKeywords = null;  // All JD keywords
  let jdFoundKW   = [];
  let jdMissingKW = [];
  let activeTab   = 'missing';

  function init() {
    const fileInput   = document.getElementById('jd-file-input');
    const browseBtn   = document.getElementById('jd-browse-btn');
    const dropZone    = document.getElementById('jd-drop-zone');
    const clearBtn    = document.getElementById('jd-clear-file');
    const textarea    = document.getElementById('jd-textarea');
    const sampleBtn   = document.getElementById('jd-sample-jd-btn');
    const analyzeBtn  = document.getElementById('jd-analyze-btn');
    const resetBtn    = document.getElementById('jd-reset-btn');
    const fullAtsBtn  = document.getElementById('jd-full-analysis-btn');

    if (!fileInput) return;

    // Browse button
    browseBtn.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) loadJDFile(e.target.files[0]);
    });

    // Drag & drop
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) loadJDFile(e.dataTransfer.files[0]);
    });

    // Clear file
    clearBtn.addEventListener('click', () => {
      jdResumeText = null;
      fileInput.value = '';
      document.getElementById('jd-drop-zone').style.display   = 'flex';
      document.getElementById('jd-file-loaded').style.display = 'none';
      setStepStatus('jd-resume-status', 'Pending', '');
    });

    // Textarea word count
    textarea.addEventListener('input', () => {
      const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
      document.getElementById('jd-word-count').textContent = `${words} word${words !== 1 ? 's' : ''}`;
      const status = words > 30 ? 'ready' : '';
      setStepStatus('jd-jd-status', words > 30 ? 'Ready' : 'Pending', status);
    });

    // Sample JD
    sampleBtn.addEventListener('click', () => {
      textarea.value = SAMPLE_JD;
      textarea.dispatchEvent(new Event('input'));
      showToast('📋 Sample job description loaded!', 'info');
    });

    // Main analyze button
    analyzeBtn.addEventListener('click', runJDAnalysis);

    // Reset
    resetBtn.addEventListener('click', resetJD);

    // Run full ATS from JD section
    fullAtsBtn.addEventListener('click', () => {
      if (!jdResumeText) { showToast('Please upload a resume first.', 'error'); return; }
      const result = ATS_ENGINE.analyze(jdResumeText, document.getElementById('jd-file-name').textContent);
      // Show full results section
      document.getElementById('upload-section').style.display  = 'none';
      document.getElementById('results-section').style.display = 'block';
      document.getElementById('file-name-display').textContent = document.getElementById('jd-file-name').textContent;
      displayResults(result, document.getElementById('jd-file-name').textContent);
      setTimeout(() => document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }

  async function loadJDFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    if (!allowed.includes(ext)) { showToast('❌ Unsupported file type', 'error'); return; }

    setStepStatus('jd-resume-status', 'Loading...', 'loading');
    try {
      jdResumeText = await PARSER.extract(file);
      document.getElementById('jd-file-name').textContent = file.name;
      document.getElementById('jd-drop-zone').style.display   = 'none';
      document.getElementById('jd-file-loaded').style.display = 'flex';
      setStepStatus('jd-resume-status', 'Ready ✓', 'ready');
      showToast('✅ Resume loaded!', 'success');
    } catch (err) {
      setStepStatus('jd-resume-status', 'Error', '');
      showToast('❌ ' + (err.message || err), 'error');
    }
  }

  async function runJDAnalysis() {
    const textarea = document.getElementById('jd-textarea');
    const jdText   = textarea.value.trim();

    if (!jdResumeText) { showToast('❌ Please upload your resume first', 'error'); return; }
    if (jdText.length < 50) { showToast('❌ Please paste a job description (at least 50 characters)', 'error'); return; }

    // Show loading
    showJDState('loading');
    document.getElementById('jd-loading-text').textContent = 'Extracting JD keywords...';

    // Pulse the analyze button
    const btn = document.getElementById('jd-analyze-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    await sleep(400);
    document.getElementById('jd-loading-text').textContent = 'Matching against your resume...';
    await sleep(600);
    document.getElementById('jd-loading-text').textContent = 'Calculating match score...';
    await sleep(400);

    const result = JD_MATCHER.analyze(jdResumeText, jdText);

    btn.classList.remove('loading');
    btn.disabled = false;

    if (!result || result.totalJDKeywords === 0) {
      showToast('⚠️ Could not extract keywords from the job description.', 'error');
      showJDState('empty');
      return;
    }

    jdAllKeywords = result.all;
    jdFoundKW     = result.found;
    jdMissingKW   = result.missing;

    renderJDResults(result);
    showJDState('results');

    // Show banner in results section if visible
    showJDBanner(result.pct, result.grade);
  }

  function renderJDResults(result) {
    // Animate ring
    const ring = document.getElementById('jd-ring-fill');
    const pctEl = document.getElementById('jd-match-pct');
    const circumference = 2 * Math.PI * 56;
    ring.style.strokeDasharray  = circumference;
    ring.style.strokeDashoffset = circumference;
    ring.style.stroke           = result.gradeColor;
    ring.style.filter           = `drop-shadow(0 0 8px ${result.gradeColor})`;

    setTimeout(() => {
      const offset = circumference - (result.pct / 100) * circumference;
      ring.style.transition       = 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)';
      ring.style.strokeDashoffset = offset;

      let cur = 0;
      const step = () => {
        if (cur < result.pct) { cur++; pctEl.textContent = cur + '%'; requestAnimationFrame(step); }
      };
      step();
    }, 200);

    // Grade
    document.getElementById('jd-match-grade').textContent = result.grade;
    document.getElementById('jd-match-grade').style.color = result.gradeColor;
    document.getElementById('jd-match-desc').textContent  = result.desc;

    // Pills
    const pills = document.getElementById('jd-meta-pills');
    pills.innerHTML = `
      <span class="jd-pill jd-pill-green">${result.found.length} matched</span>
      <span class="jd-pill jd-pill-red">${result.missing.length} missing</span>
      <span class="jd-pill jd-pill-blue">${result.totalJDKeywords} total</span>
    `;

    // Counts
    document.getElementById('missing-count').textContent = result.missing.length;
    document.getElementById('found-count').textContent   = result.found.length;
    document.getElementById('all-count').textContent     = result.all.length;

    // Default to missing tab
    activeTab = 'missing';
    renderKeywordCloud();
    updateTabStyles();
  }

  function renderKeywordCloud() {
    const cloud  = document.getElementById('jd-keyword-cloud');
    const kwList = activeTab === 'missing' ? jdMissingKW
                 : activeTab === 'found'   ? jdFoundKW
                 : jdAllKeywords;

    cloud.innerHTML = '';

    if (kwList.length === 0) {
      cloud.innerHTML = `<div class="jd-cloud-empty">${activeTab === 'missing' ? '🎉 All keywords matched!' : '(none)'}</div>`;
      return;
    }

    kwList.forEach((kw, i) => {
      const isMissing = jdMissingKW.includes(kw);
      const isFound   = jdFoundKW.includes(kw);

      const tag = document.createElement('span');
      tag.className = `jd-kw-tag ${isMissing ? 'kw-missing' : 'kw-found'}`;
      tag.style.animationDelay = `${i * 0.03}s`;
      tag.innerHTML = `
        <span class="kw-dot">${isMissing ? '✕' : '✓'}</span>
        ${kw}
      `;
      tag.title = isMissing
        ? `"${kw}" is in the JD but NOT in your resume. Add it!`
        : `"${kw}" matches! Found in both your resume and the JD.`;
      cloud.appendChild(tag);
    });
  }

  window.switchJDTab = function(tab) {
    activeTab = tab;
    renderKeywordCloud();
    updateTabStyles();
  };

  function updateTabStyles() {
    ['missing', 'found', 'all'].forEach(t => {
      document.getElementById(`tab-${t}`)?.classList.toggle('active', t === activeTab);
    });
  }

  function resetJD() {
    jdResumeText  = null;
    jdAllKeywords = null;
    jdFoundKW     = [];
    jdMissingKW   = [];
    activeTab     = 'missing';

    const fileInput = document.getElementById('jd-file-input');
    const textarea  = document.getElementById('jd-textarea');
    if (fileInput) fileInput.value = '';
    if (textarea)  { textarea.value = ''; textarea.dispatchEvent(new Event('input')); }

    document.getElementById('jd-drop-zone').style.display   = 'flex';
    document.getElementById('jd-file-loaded').style.display = 'none';

    setStepStatus('jd-resume-status', 'Pending', '');
    setStepStatus('jd-jd-status',    'Pending', '');
    showJDState('empty');
    showToast('🔄 Reset complete', 'info');
  }

  function showJDState(state) {
    const empty   = document.getElementById('jd-empty-state');
    const loading = document.getElementById('jd-loading-state');
    const results = document.getElementById('jd-match-results');
    empty.style.display   = state === 'empty'   ? 'flex' : 'none';
    loading.style.display = state === 'loading' ? 'flex' : 'none';
    results.style.display = state === 'results' ? 'block' : 'none';
  }

  function showJDBanner(pct, grade) {
    const banner = document.getElementById('jd-result-banner');
    if (!banner) return;
    banner.style.display = 'flex';
    document.getElementById('jd-banner-pct').textContent  = pct + '%';
    document.getElementById('jd-banner-desc').textContent = grade;
  }

  function setStepStatus(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className   = `jd-step-status ${type === 'ready' ? 'status-ready' : type === 'loading' ? 'status-loading' : ''}`;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  document.addEventListener('DOMContentLoaded', init);
})();
