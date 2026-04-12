/* script.js — The Animal Connection */
(function () {
  'use strict';

  /* ── Read Progress Bar ── */
  var bar = document.getElementById('read-progress');
  function updateProgress() {
    if (!bar) return;
    var h = document.documentElement;
    var pct = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }

  /* ── Sticky nav opacity ── */
  var header = document.querySelector('.site-header');
  function updateHeader() {
    if (!header) return;
    if ((window.scrollY || window.pageYOffset) > 60) {
      header.classList.add('opaque');
    } else {
      header.classList.remove('opaque');
    }
  }

  /* ── Scroll-reveal ── */
  var reveals = document.querySelectorAll('.reveal');
  var observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    /* Fallback: show all immediately */
    reveals.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ── Mobile nav toggle ── */
  var toggle = document.querySelector('.nav-toggle');
  var nav    = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  /* ── Services dropdown (mobile) ── */
  document.querySelectorAll('.has-dropdown').forEach(function (parent) {
    var link = parent.querySelector('a');
    if (link) {
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          parent.classList.toggle('is-open');
        }
      });
    }
  });

  /* ── Scroll listeners ── */
  window.addEventListener('scroll', function () {
    updateProgress();
    updateHeader();
  }, { passive: true });

  /* ── Init ── */
  updateHeader();
  updateProgress();
})();
