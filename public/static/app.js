// VYRO Development — interactions
(function () {
  'use strict';

  var LANG_COOKIE = 'vyro_lang';
  var THEME_KEY = 'vyro_theme';
  var currentLang = window.__VYRO_LANG__ || 'en';

  // ---- Theme (dark/light) ----
  var htmlEl = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    }
    // else: keep server-rendered default (data-theme already set)
  })();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = htmlEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  // ---- Language switcher ----
  var langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      var target = langToggle.getAttribute('data-other') || (currentLang === 'ar' ? 'en' : 'ar');
      document.cookie = LANG_COOKIE + '=' + target + '; path=/; max-age=' + 60 * 60 * 24 * 365;
      var url = new URL(window.location.href);
      url.searchParams.set('lang', target);
      window.location.href = url.toString();
    });
  }

  // ---- Header scroll state ----
  var header = document.getElementById('site-header');
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Mobile nav toggle ----
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Scroll reveal ----
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---- Cursor glow (desktop only) ----
  var glow = document.querySelector('.cursor-glow');
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (glow && !isTouch) {
    var rafId = null;
    var mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.style.opacity = '1';
      if (rafId === null) {
        rafId = requestAnimationFrame(function () {
          glow.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%, -50%)';
          rafId = null;
        });
      }
    });
    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
    });
  }

  // ---- Work card click-through (whole card opens project URL) ----
  document.querySelectorAll('.work-card').forEach(function (card) {
    var url = card.getAttribute('data-url');
    if (!url) return;

    function openProject(e) {
      if (e.target.closest('.work-card-link')) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    card.addEventListener('click', openProject);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // ================= Feedback widget =================
  var feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    var selectedEmoji = '';
    var emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var already = btn.classList.contains('selected');
        emojiButtons.forEach(function (b) { b.classList.remove('selected'); });
        if (!already) {
          btn.classList.add('selected');
          selectedEmoji = btn.getAttribute('data-emoji') || '';
        } else {
          selectedEmoji = '';
        }
      });
    });

    var messageEl = document.getElementById('feedback-message');
    var nameEl = document.getElementById('feedback-name');
    var contactEl = document.getElementById('feedback-contact');
    var recordBtn = document.getElementById('voice-record-btn');
    var voiceTimer = document.getElementById('voice-timer');
    var voicePreview = document.getElementById('voice-preview');
    var voiceClearBtn = document.getElementById('voice-clear-btn');
    var submitBtn = document.getElementById('feedback-submit-btn');
    var thanksEl = document.getElementById('feedback-thanks');

    var mediaRecorder = null;
    var recordedChunks = [];
    var recordedBlob = null;
    var recordStartTime = 0;
    var timerInterval = null;
    var isRecording = false;

    function formatTime(ms) {
      var totalSec = Math.floor(ms / 1000);
      var m = Math.floor(totalSec / 60).toString().padStart(2, '0');
      var s = (totalSec % 60).toString().padStart(2, '0');
      return m + ':' + s;
    }

    function resetVoice() {
      recordedBlob = null;
      recordedChunks = [];
      if (voicePreview) {
        voicePreview.src = '';
        voicePreview.hidden = true;
      }
      if (voiceClearBtn) voiceClearBtn.hidden = true;
      if (voiceTimer) { voiceTimer.hidden = true; voiceTimer.textContent = '00:00'; }
    }

    if (recordBtn) {
      recordBtn.addEventListener('click', async function () {
        if (isRecording) {
          if (mediaRecorder) mediaRecorder.stop();
          return;
        }

        if (!navigator.mediaDevices || !window.MediaRecorder) {
          alert('Voice recording is not supported in this browser.');
          return;
        }

        try {
          var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recordedChunks = [];
          var mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
          mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

          mediaRecorder.addEventListener('dataavailable', function (e) {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
          });

          mediaRecorder.addEventListener('stop', function () {
            isRecording = false;
            clearInterval(timerInterval);
            stream.getTracks().forEach(function (t) { t.stop(); });

            recordBtn.classList.remove('recording');
            var label = recordBtn.querySelector('span');
            if (label) label.textContent = recordBtn.getAttribute('data-record-label') || 'Record a voice message';

            recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            if (voicePreview) {
              voicePreview.src = URL.createObjectURL(recordedBlob);
              voicePreview.hidden = false;
            }
            if (voiceClearBtn) voiceClearBtn.hidden = false;
          });

          mediaRecorder.start();
          isRecording = true;
          recordStartTime = Date.now();
          recordBtn.classList.add('recording');
          var labelEl = recordBtn.querySelector('span');
          if (labelEl) labelEl.textContent = recordBtn.getAttribute('data-stop-label') || 'Stop recording';

          if (voiceTimer) {
            voiceTimer.hidden = false;
            voiceTimer.textContent = '00:00';
          }
          timerInterval = setInterval(function () {
            var elapsed = Date.now() - recordStartTime;
            if (voiceTimer) voiceTimer.textContent = formatTime(elapsed);
            // Safety cap: stop after 60s
            if (elapsed > 60000 && mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 250);
        } catch (err) {
          alert('Microphone access was denied or is unavailable.');
        }
      });
    }

    if (voiceClearBtn) {
      voiceClearBtn.addEventListener('click', resetVoice);
    }

    feedbackForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var message = messageEl ? messageEl.value.trim() : '';

      if (!message && !selectedEmoji && !recordedBlob) {
        alert(currentLang === 'ar' ? 'يرجى كتابة رسالة أو اختيار تقييم أو تسجيل صوت.' : 'Please write a message, choose a rating, or record a voice note.');
        return;
      }

      submitBtn.disabled = true;
      var originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';

      try {
        var voiceR2Key = null;
        var voiceUrl = null;

        if (recordedBlob) {
          var uploadRes = await fetch('/api/feedback/voice', {
            method: 'POST',
            headers: { 'Content-Type': recordedBlob.type || 'audio/webm' },
            body: recordedBlob,
          });
          if (uploadRes.ok) {
            var uploadData = await uploadRes.json();
            voiceR2Key = uploadData.r2Key;
            voiceUrl = uploadData.url;
          }
        }

        var res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            emoji: selectedEmoji,
            lang: currentLang,
            voiceR2Key: voiceR2Key,
            voiceUrl: voiceUrl,
            name: nameEl ? nameEl.value.trim() : '',
            emailPhone: contactEl ? contactEl.value.trim() : '',
          }),
        });

        if (res.ok) {
          feedbackForm.reset();
          emojiButtons.forEach(function (b) { b.classList.remove('selected'); });
          selectedEmoji = '';
          resetVoice();
          if (thanksEl) {
            thanksEl.hidden = false;
            setTimeout(function () { thanksEl.hidden = true; }, 5000);
          }
        } else {
          alert(currentLang === 'ar' ? 'حدث خطأ ما. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
        }
      } catch (err) {
        alert(currentLang === 'ar' ? 'حدث خطأ ما. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }

  // ================= Contact form =================
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var contactNameEl = document.getElementById('contact-name');
    var contactEmailPhoneEl = document.getElementById('contact-emailphone');
    var contactMessageEl = document.getElementById('contact-message');
    var contactSubmitBtn = document.getElementById('contact-submit-btn');
    var contactThanksEl = document.getElementById('contact-thanks');

    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = contactNameEl ? contactNameEl.value.trim() : '';
      var emailPhone = contactEmailPhoneEl ? contactEmailPhoneEl.value.trim() : '';
      var message = contactMessageEl ? contactMessageEl.value.trim() : '';

      if (!name || !emailPhone || !message) {
        alert(currentLang === 'ar' ? 'يرجى تعبئة الاسم والبريد/الهاتف والرسالة.' : 'Please fill in your name, email/phone, and message.');
        return;
      }

      contactSubmitBtn.disabled = true;
      var originalHtml = contactSubmitBtn.innerHTML;
      contactSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';

      try {
        var res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            emailPhone: emailPhone,
            message: message,
            lang: currentLang,
          }),
        });

        if (res.ok) {
          contactForm.reset();
          if (contactThanksEl) {
            contactThanksEl.hidden = false;
            setTimeout(function () { contactThanksEl.hidden = true; }, 6000);
          }
        } else {
          var data = await res.json().catch(function () { return {}; });
          alert(data.error || (currentLang === 'ar' ? 'حدث خطأ ما. حاول مرة أخرى.' : 'Something went wrong. Please try again.'));
        }
      } catch (err) {
        alert(currentLang === 'ar' ? 'حدث خطأ ما. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
      } finally {
        contactSubmitBtn.disabled = false;
        contactSubmitBtn.innerHTML = originalHtml;
      }
    });
  }
})();
