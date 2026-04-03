/**
 * shared.js — Injects header + footer into all blog/content pages,
 * builds Table of Contents, handles FAQ toggles, mobile menu, contact form
 */

// ══════════════════════════════════════════════════
// HEADER HTML
// ══════════════════════════════════════════════════
const HEADER_HTML = `
<header id="site-header">
  <div class="hdr-inner">
    <a href="/index.html" class="hdr-logo">
      <span class="hdr-logo-icon">⬡</span>
      ATS<span class="logo-acc">Pro</span>
    </a>
    <ul class="hdr-nav" id="hdr-nav">
      <li><a href="/index.html">Home</a></li>
      <li><a href="/blog.html">Blog</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/contact.html">Contact</a></li>
    </ul>
    <a href="/index.html#upload-section" class="hdr-cta">Analyze Resume</a>
    <button class="hdr-burger" id="hdr-burger" aria-label="Menu">☰</button>
  </div>
</header>`;

// ══════════════════════════════════════════════════
// FOOTER HTML
// ══════════════════════════════════════════════════
const FOOTER_HTML = `
<footer id="site-footer">
  <div class="ftr-grid">
    <div class="ftr-brand">
      <a href="/index.html" class="hdr-logo" style="margin-right:0;margin-bottom:.5rem;display:inline-flex">
        <span class="hdr-logo-icon">⬡</span>
        ATS<span class="logo-acc">Pro</span>
      </a>
      <p>The free, private ATS resume checker that helps job seekers beat applicant tracking systems and land more interviews. Your data never leaves your browser.</p>
      <div class="ftr-trust">
        <span class="trust-badge">🔒 100% Private</span>
        <span class="trust-badge">⚡ Instant</span>
        <span class="trust-badge">🆓 Always Free</span>
      </div>
    </div>
    <div class="ftr-col">
      <h4>Tools</h4>
      <ul>
        <li><a href="/index.html#upload-section">ATS Score Checker</a></li>
        <li><a href="/index.html#jd-section">Job Description Matcher</a></li>
        <li><a href="/index.html#tips-section">Resume Tips</a></li>
      </ul>
    </div>
    <div class="ftr-col">
      <h4>Blog</h4>
      <ul>
        <li><a href="/articles/article-1.html">What is ATS?</a></li>
        <li><a href="/articles/article-3.html">10 ATS Mistakes</a></li>
        <li><a href="/articles/article-10.html">ATS Checklist 2026</a></li>
        <li><a href="/blog.html">All Articles →</a></li>
      </ul>
    </div>
    <div class="ftr-col">
      <h4>Company</h4>
      <ul>
        <li><a href="/about.html">About Us</a></li>
        <li><a href="/contact.html">Contact</a></li>
        <li><a href="/privacy.html">Privacy Policy</a></li>
        <li><a href="/terms.html">Terms of Service</a></li>
      </ul>
    </div>
  </div>
  <div class="ftr-bottom">
    <p class="ftr-copy">© 2026 ATSPro. Built with ❤️ for job seekers worldwide. contact: support@atspro.in</p>
    <div class="ftr-legal">
      <a href="/privacy.html">Privacy</a>
      <a href="/terms.html">Terms</a>
      <a href="/contact.html">Contact</a>
    </div>
  </div>
</footer>`;

// ══════════════════════════════════════════════════
// INJECT HEADER + FOOTER
// ══════════════════════════════════════════════════
function injectLayout() {
  // Header
  const headerEl = document.getElementById('site-header-placeholder');
  if (headerEl) {
    headerEl.outerHTML = HEADER_HTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', HEADER_HTML);
  }

  // Footer
  const footerEl = document.getElementById('site-footer-placeholder');
  if (footerEl) {
    footerEl.outerHTML = FOOTER_HTML;
  } else {
    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
  }

  // Mark active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.hdr-nav a').forEach(a => {
    if (a.getAttribute('href') === path || path.includes(a.getAttribute('href').replace('/index.html','')) && a.getAttribute('href') !== '/index.html') {
      a.classList.add('active');
    }
    if (path === '/' && a.getAttribute('href') === '/index.html') a.classList.add('active');
  });

  // Mobile burger
  setTimeout(() => {
    const burger = document.getElementById('hdr-burger');
    const nav    = document.getElementById('hdr-nav');
    if (burger && nav) {
      burger.addEventListener('click', () => {
        nav.classList.toggle('open');
        burger.textContent = nav.classList.contains('open') ? '✕' : '☰';
      });
    }
  }, 0);
}

// ══════════════════════════════════════════════════
// TABLE OF CONTENTS BUILDER
// ══════════════════════════════════════════════════
function buildTOC() {
  const tocList = document.getElementById('toc-list');
  if (!tocList) return;

  const headings = document.querySelectorAll('.article-content h2, .article-content h3');
  if (!headings.length) return;

  headings.forEach((h, i) => {
    if (!h.id) h.id = 'section-' + i;
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href        = '#' + h.id;
    a.textContent = h.textContent;
    a.style.paddingLeft = h.tagName === 'H3' ? '1.5rem' : '0.6rem';
    li.appendChild(a);
    tocList.appendChild(li);
  });

  // Highlight on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = tocList.querySelector(`a[href="#${id}"]`);
      if (link) link.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  headings.forEach(h => io.observe(h));
}

// ══════════════════════════════════════════════════
// FAQ TOGGLES
// ══════════════════════════════════════════════════
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-toggle').textContent = '+';
      });
      if (!isOpen) {
        item.classList.add('open');
        q.querySelector('.faq-toggle').textContent = '−';
      }
    });
  });
}

// ══════════════════════════════════════════════════
// CONTACT FORM
// ══════════════════════════════════════════════════
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    }, 1200);
  });
}

// ══════════════════════════════════════════════════
// SHARE BUTTONS
// ══════════════════════════════════════════════════
function initShareButtons() {
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  const tw = document.getElementById('share-tw');
  const li = document.getElementById('share-li');
  const wa = document.getElementById('share-wa');
  const cp = document.getElementById('share-cp');

  if (tw) tw.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  if (li) li.href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
  if (wa) wa.href = `https://wa.me/?text=${title}%20${url}`;
  if (cp) cp.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      cp.textContent = '✓ Copied!';
      setTimeout(() => { cp.textContent = '🔗 Copy Link'; }, 2000);
    });
  });
}

// ══════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ══════════════════════════════════════════════════
function initScrollAnim() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.article-card, .value-card, .related-card, .numbered-block').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    io.observe(el);
  });
}

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  injectLayout();
  buildTOC();
  initFAQ();
  initContactForm();
  initShareButtons();
  initScrollAnim();
});
