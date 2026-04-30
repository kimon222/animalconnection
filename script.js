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

    /* Anything already in view on load (or above the reveal threshold) should appear immediately */
    function revealIfVisible(el) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.92 && rect.bottom > -vh * 0.08) {
        el.classList.add('revealed');
        observer.unobserve(el);
      }
    }
    reveals.forEach(revealIfVisible);
    window.addEventListener(
      'load',
      function () {
        reveals.forEach(revealIfVisible);
      },
      { once: true }
    );
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

  /* ── Contact forms (Resend via /api/contact on Vercel) ── */
  function wireContactForm(form) {
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var honey = form.querySelector('.c-form-honeypot');
      if (honey && honey.value) return;

      var btn = form.querySelector('button[type="submit"]');
      var data = new FormData(form);
      var payload = {
        name: data.get('name'),
        email: data.get('email'),
        phone: data.get('phone'),
        message: data.get('message'),
      };

      if (btn) btn.disabled = true;
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (parseErr) {
              console.error('Contact API non-JSON response', res.status, text);
            }
            if (!res.ok) {
              console.error('Contact API error', res.status, data || text);
              var hint;
              if (res.status === 404) {
                hint =
                  'Form endpoint not found — deploy on Vercel with the project root that contains the api/ folder.';
              } else if (data && data.error === 'missing_api_key') {
                hint = 'RESEND_API_KEY is not set for this deployment (check Vercel → Settings → Environment Variables).';
              } else if (data && data.code === 'resend') {
                hint =
                  (data.resendMessage ? data.resendMessage + ' ' : '') +
                  'If using onboarding@resend.dev: remove RESEND_TO in Vercel (or set it to your Resend login email) — that variable overrides the app default. Then redeploy.';
              } else {
                hint = 'Request failed (' + res.status + ').';
              }
              throw new Error(hint);
            }
            return data;
          });
        })
        .then(function () {
          alert('Message sent!');
          form.reset();
        })
        .catch(function (err) {
          console.error(err);
          alert(
            err && err.message
              ? err.message
              : 'Something went wrong. Please try again or email animalconnectionsf@gmail.com.'
          );
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  wireContactForm(document.getElementById('contact-form'));
  wireContactForm(document.getElementById('home-contact-form'));

  /* ── Init ── */
  updateHeader();
  updateProgress();
})();
