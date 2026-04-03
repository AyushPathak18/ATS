/**
 * ATS Engine — Resume Analysis & Scoring
 * Analyzes resume text across 10 categories and returns a structured report
 */

const ATS_ENGINE = (() => {

  // ── Constants ──────────────────────────────────────────────────
  const REQUIRED_SECTIONS = [
    { key: 'experience', patterns: ['experience', 'work history', 'employment', 'professional experience', 'career history'], weight: 20 },
    { key: 'education',  patterns: ['education', 'academic', 'degree', 'university', 'college'],                              weight: 15 },
    { key: 'skills',     patterns: ['skills', 'technical skills', 'competencies', 'expertise', 'proficiencies'],             weight: 15 },
    { key: 'summary',    patterns: ['summary', 'objective', 'profile', 'about', 'overview', 'professional summary'],         weight: 10 },
    { key: 'contact',    patterns: ['contact', 'phone', 'email', 'linkedin', 'address'],                                     weight: 10 },
  ];

  const ACTION_VERBS = [
    'achieved','administered','analyzed','built','coordinated','created','delivered','designed',
    'developed','directed','drove','engineered','established','executed','generated','improved',
    'implemented','increased','launched','led','managed','mentored','optimized','organized',
    'planned','produced','reduced','resolved','spearheaded','streamlined','supervised','trained',
    'transformed','collaborated','architected','automated','deployed','facilitated','negotiated',
    'pioneered','restructured','scaled','secured','strengthened','validated','accelerated',
  ];

  const POWER_KEYWORDS = [
    'results-driven','cross-functional','agile','stakeholder','roi','kpi','scalable','end-to-end',
    'data-driven','strategic','initiative','revenue','growth','performance','leadership','collaboration',
  ];

  const CONTACT_PATTERNS = {
    email:    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    phone:    /(\+?\d[\d\s\-().]{7,}\d)/,
    linkedin: /linkedin\.com\/in\//i,
  };

  const NUMBER_PATTERN    = /\b\d+(\.\d+)?(%|k|m|million|billion|thousand|x|times|hours?|days?|weeks?|months?|years?|users?|customers?|employees?|engineers?|projects?|clients?)?\b/gi;
  const BULLET_PATTERN    = /^[\s•\-\*►▸▶→✓✔●○■□▪▫]+/m;
  const YEAR_PATTERN      = /\b(19|20)\d{2}\b/g;
  const URL_PATTERN       = /https?:\/\/[^\s]+/gi;

  // Check if text has problematic formatting indicators
  const FORMAT_ISSUES = [
    { pattern: /\|/g,             msg: 'Pipe "|" characters found — may confuse ATS parsers', severity: 'medium' },
    { pattern: /_{3,}/g,          msg: 'Long underscores used — may cause parsing errors', severity: 'low' },
    { pattern: /\t{3,}/g,         msg: 'Excessive tab characters detected — use line breaks instead', severity: 'medium' },
  ];

  // ── Helpers ────────────────────────────────────────────────────
  function normalizeText(text) {
    return text.toLowerCase().replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  }

  function countWordFrequency(text) {
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    return freq;
  }

  function getActionVerbUsage(text) {
    const lower = text.toLowerCase();
    return ACTION_VERBS.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(lower));
  }

  function getQuantifiedAchievements(text) {
    const lines = text.split('\n');
    return lines.filter(line => NUMBER_PATTERN.test(line) && line.trim().length > 20);
  }

  function getSectionScore(text, section) {
    const lower = normalizeText(text);
    const found = section.patterns.some(p => lower.includes(p));
    return found;
  }

  function getWordCount(text) {
    return (text.match(/\b\w+\b/g) || []).length;
  }

  function getLineCount(text) {
    return text.split('\n').filter(l => l.trim().length > 0).length;
  }

  function getLengthCategory(wordCount) {
    if (wordCount < 200)  return { label: 'Too Short',   color: 'red',    ok: false };
    if (wordCount < 400)  return { label: 'Short',       color: 'yellow', ok: false };
    if (wordCount <= 800) return { label: 'Ideal',       color: 'green',  ok: true  };
    if (wordCount <= 1200)return { label: 'A bit long',  color: 'yellow', ok: false };
    return                       { label: 'Too Long',    color: 'red',    ok: false };
  }

  // ── Main Analysis ───────────────────────────────────────────────
  function analyze(rawText, fileName = '') {
    const text    = rawText || '';
    const lower   = normalizeText(text);
    const wordCount = getWordCount(text);
    const issues  = [];
    const strengths = [];
    const breakdown = {};
    let totalScore  = 0;

    // ── 1. Contact Information (15 pts) ──────────────────────────
    let contactScore = 0;
    const contactDetails = { email: false, phone: false, linkedin: false };
    if (CONTACT_PATTERNS.email.test(text))    { contactDetails.email    = true; contactScore += 5; }
    if (CONTACT_PATTERNS.phone.test(text))    { contactDetails.phone    = true; contactScore += 5; }
    if (CONTACT_PATTERNS.linkedin.test(text)) { contactDetails.linkedin = true; contactScore += 5; }

    if (!contactDetails.email)    issues.push({ category: 'Contact Info', severity: 'critical', title: 'Missing Email Address', desc: 'No email address found. Every professional resume must include a valid email address for recruiters to contact you.', fix: 'Add a professional email address (e.g., john.smith@gmail.com) near the top of your resume.' });
    if (!contactDetails.phone)    issues.push({ category: 'Contact Info', severity: 'high',     title: 'Missing Phone Number',  desc: 'No phone number detected. ATS systems and recruiters need this to contact you.', fix: 'Add your phone number in format: (555) 123-4567 or +1-555-123-4567' });
    if (!contactDetails.linkedin) issues.push({ category: 'Contact Info', severity: 'medium',   title: 'No LinkedIn URL',       desc: 'LinkedIn profiles increase credibility and are expected by most ATS systems and recruiters.', fix: 'Add your LinkedIn URL: linkedin.com/in/yourname' });

    if (contactScore >= 15) strengths.push({ icon: '📧', text: 'Complete contact information found' });
    else if (contactScore >= 10) strengths.push({ icon: '📧', text: 'Basic contact information present' });

    breakdown['Contact Info'] = { score: contactScore, max: 15, items: contactDetails };
    totalScore += contactScore;

    // ── 2. Section Headers (20 pts) ──────────────────────────────
    let sectionScore = 0;
    const missingSections = [];
    const foundSections   = [];
    REQUIRED_SECTIONS.forEach(sec => {
      const found = sec.patterns.some(p => lower.includes(p));
      if (found) {
        sectionScore += 4;
        foundSections.push(sec.key);
      } else {
        missingSections.push(sec.key);
      }
    });

    if (missingSections.length > 0) {
      missingSections.forEach(sec => {
        const severity = ['experience','education','skills'].includes(sec) ? 'critical' : 'high';
        issues.push({
          category: 'Resume Structure',
          severity,
          title: `Missing "${sec.charAt(0).toUpperCase() + sec.slice(1)}" Section`,
          desc:  `ATS systems scan for standard section headers. The "${sec}" section is not clearly labeled in your resume.`,
          fix:   `Add a clearly labeled "${sec.charAt(0).toUpperCase() + sec.slice(1)}" section header. Use the exact word — avoid creative alternatives.`,
        });
      });
    }
    if (foundSections.length >= 4) strengths.push({ icon: '📋', text: `${foundSections.length}/5 required sections detected` });

    breakdown['Sections'] = { score: sectionScore, max: 20, items: foundSections };
    totalScore += sectionScore;

    // ── 3. Action Verbs (10 pts) ─────────────────────────────────
    const foundVerbs = getActionVerbUsage(text);
    let verbScore    = Math.min(10, Math.round(foundVerbs.length * 0.67));

    if (foundVerbs.length < 5) {
      issues.push({
        category: 'Language Quality',
        severity: foundVerbs.length < 2 ? 'high' : 'medium',
        title:    `Weak Action Verbs (${foundVerbs.length} found, need 8+)`,
        desc:     'ATS systems and recruiters look for strong action verbs that demonstrate impact. Your resume uses passive language.',
        fix:      `Start bullet points with strong verbs like: Led, Developed, Implemented, Achieved, Optimized, Designed, Launched, Managed.`,
      });
    } else {
      strengths.push({ icon: '💪', text: `${foundVerbs.length} strong action verbs used` });
    }

    breakdown['Action Verbs'] = { score: verbScore, max: 10, items: foundVerbs.slice(0, 8) };
    totalScore += verbScore;

    // ── 4. Quantified Achievements (15 pts) ──────────────────────
    const quantLines = getQuantifiedAchievements(text);
    let quantScore   = Math.min(15, quantLines.length * 3);

    if (quantLines.length < 3) {
      issues.push({
        category: 'Impact & Metrics',
        severity: 'high',
        title:    `Too Few Quantified Achievements (${quantLines.length} found, need 5+)`,
        desc:     'Numbers and metrics make achievements concrete and believable. Your resume lacks measurable impact statements.',
        fix:      'Add numbers to your achievements: "Increased sales by 35%", "Managed team of 8 engineers", "Reduced load time by 2 seconds".',
      });
    } else {
      strengths.push({ icon: '📊', text: `${quantLines.length} quantified achievements detected` });
    }

    breakdown['Metrics & Numbers'] = { score: quantScore, max: 15, items: [] };
    totalScore += quantScore;

    // ── 5. Resume Length (10 pts) ────────────────────────────────
    const lengthCat = getLengthCategory(wordCount);
    let lengthScore = lengthCat.ok ? 10 : (wordCount < 200 ? 2 : wordCount < 400 ? 5 : 7);

    if (!lengthCat.ok) {
      issues.push({
        category: 'Resume Length',
        severity: wordCount < 200 ? 'critical' : 'medium',
        title:    `Resume Length is ${lengthCat.label} (${wordCount} words)`,
        desc:     `Ideal resumes are 400-800 words (1-2 pages). Yours has ${wordCount} words which is ${lengthCat.label.toLowerCase()}.`,
        fix:      wordCount < 400
          ? 'Expand your experience descriptions with bullet points, add more skills, and include a professional summary section.'
          : 'Trim your resume to 1-2 pages. Remove redundant phrases, older roles >10 years, and irrelevant experience.',
      });
    } else {
      strengths.push({ icon: '📏', text: `Resume length is ideal (${wordCount} words)` });
    }

    breakdown['Resume Length'] = { score: lengthScore, max: 10, items: [lengthCat.label] };
    totalScore += lengthScore;

    // ── 6. File Format (5 pts) ───────────────────────────────────
    const ext = fileName.split('.').pop()?.toLowerCase();
    let formatScore = 5;
    if (ext === 'pdf') {
      strengths.push({ icon: '📄', text: 'PDF format is widely ATS-compatible' });
    } else if (ext === 'docx' || ext === 'doc') {
      strengths.push({ icon: '📄', text: 'DOCX format is ATS-compatible' });
    }

    breakdown['File Format'] = { score: formatScore, max: 5, items: [ext || 'unknown'] };
    totalScore += formatScore;

    // ── 7. Formatting Issues (10 pts) ────────────────────────────
    let fmtScore = 10;
    FORMAT_ISSUES.forEach(fi => {
      const matches = text.match(fi.pattern);
      if (matches && matches.length > 3) {
        fmtScore -= (fi.severity === 'medium' ? 4 : 2);
        issues.push({
          category: 'Formatting',
          severity: fi.severity,
          title:    fi.msg,
          desc:     'Certain formatting characters can confuse ATS parsers, causing your resume to be misread or garbled in the system.',
          fix:      'Use simple, clean formatting. Replace special characters with standard text.',
        });
      }
    });

    // Check for very long lines (possible table columns merged)
    const longLines = text.split('\n').filter(l => l.trim().length > 200);
    if (longLines.length > 2) {
      fmtScore -= 3;
      issues.push({
        category: 'Formatting',
        severity: 'medium',
        title:    'Possible Multi-Column Layout Detected',
        desc:     'Very long lines suggest a multi-column or table layout. ATS systems often read columns left-to-right across both, creating jumbled text.',
        fix:      'Switch to a single-column layout. ATS works best with a simple top-to-bottom structure.',
      });
    }

    fmtScore = Math.max(0, fmtScore);
    breakdown['Formatting'] = { score: fmtScore, max: 10, items: [] };
    totalScore += fmtScore;

    // ── 8. Keyword Density (10 pts) ──────────────────────────────
    const freq    = countWordFrequency(text);
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(e => e[0]);
    const powerKWs = POWER_KEYWORDS.filter(k => lower.includes(k));
    let kwScore    = Math.min(10, powerKWs.length * 2);

    if (powerKWs.length < 3) {
      issues.push({
        category: 'Keywords',
        severity: 'medium',
        title:    `Low Industry Keyword Count (${powerKWs.length} found)`,
        desc:     'ATS systems rank resumes by keyword relevance. Your resume lacks common industry keywords.',
        fix:      `Include keywords like: results-driven, cross-functional, agile, stakeholder, ROI, KPI, data-driven, strategic, leadership, collaboration.`,
      });
    } else {
      strengths.push({ icon: '🏷️', text: `${powerKWs.length} industry keywords detected` });
    }

    breakdown['Keywords'] = { score: kwScore, max: 10, items: powerKWs };
    totalScore += kwScore;

    // ── 9. Experience Dates (5 pts) ──────────────────────────────
    const years = text.match(YEAR_PATTERN) || [];
    let dateScore = 0;
    if (years.length >= 2) { dateScore = 5; strengths.push({ icon: '📅', text: `${years.length} date references found in experience` }); }
    else {
      issues.push({
        category: 'Work Experience',
        severity: 'high',
        title:    'Missing Employment Dates',
        desc:     'ATS systems require dates for each position to calculate experience duration. No clear date ranges were detected.',
        fix:      'Add start and end dates for each role: "Jan 2020 – Mar 2023" or "2020 – 2023".',
      });
    }

    breakdown['Dates & Timeline'] = { score: dateScore, max: 5, items: years.slice(0, 6) };
    totalScore += dateScore;

    // ── Cap score at 100 ─────────────────────────────────────────
    totalScore = Math.min(100, totalScore);

    // ── Grade ─────────────────────────────────────────────────────
    let grade, gradeColor;
    if (totalScore >= 85)     { grade = 'Excellent'; gradeColor = '#22c55e'; }
    else if (totalScore >= 70){ grade = 'Good';      gradeColor = '#84cc16'; }
    else if (totalScore >= 55){ grade = 'Fair';      gradeColor = '#f59e0b'; }
    else if (totalScore >= 40){ grade = 'Poor';      gradeColor = '#ef4444'; }
    else                      { grade = 'Critical';  gradeColor = '#dc2626'; }

    // Sort issues by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build action plan from top issues
    const actionPlan = issues.slice(0, 5).map(issue => ({
      priority: issues.indexOf(issue) + 1,
      action: issue.fix,
      impact: issue.severity === 'critical' ? '🔥 Critical Fix' : issue.severity === 'high' ? '⚡ High Impact' : '✅ Recommended',
      category: issue.category,
    }));

    return {
      score: totalScore,
      grade,
      gradeColor,
      breakdown,
      issues,
      strengths,
      actionPlan,
      meta: { wordCount, verbCount: foundVerbs.length, quantCount: quantLines.length, fileName },
    };
  }

  return { analyze };
})();
