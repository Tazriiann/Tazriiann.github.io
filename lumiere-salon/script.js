/* Lumière Salon & Spa — shared behaviour.
   Every interaction is animated: menu, page changes, filters (FLIP),
   lightbox, carousel, FAQ, forms and the booking wizard. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu (animated both ways) ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Smooth page transitions ---------- */
  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
    if (a.target === '_blank') return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduceMotion) return;
      e.preventDefault();
      document.body.classList.add('page-leave');
      setTimeout(function () { window.location.href = href; }, 260);
    });
  });

  /* ---------- Toast ---------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(html, ms) {
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, ms || 4200);
  }
  window.LUMshowToast = showToast;

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Live open / closed status ---------- */
  // Hours: Mon closed · Tue–Fri 9–19 · Sat 9–18 · Sun 10–16
  var HOURS = { 0: [10, 16], 1: null, 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 18] };
  var DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function fmtHour(h) {
    var hr = h % 12; if (hr === 0) hr = 12;
    return hr + ':00 ' + (h < 12 ? 'AM' : 'PM');
  }
  function openStatus(now) {
    var day = now.getDay(), hrs = HOURS[day], t = now.getHours() + now.getMinutes() / 60;
    if (hrs && t >= hrs[0] && t < hrs[1]) return { open: true, text: 'Open now · closes ' + fmtHour(hrs[1]) };
    if (hrs && t < hrs[0]) return { open: false, text: 'Closed · opens today at ' + fmtHour(hrs[0]) };
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7, h2 = HOURS[d];
      if (h2) return { open: false, text: 'Closed · opens ' + (i === 1 ? 'tomorrow' : DAYNAMES[d]) + ' at ' + fmtHour(h2[0]) };
    }
    return { open: false, text: 'Closed' };
  }
  var statusEls = document.querySelectorAll('[data-open-status]');
  if (statusEls.length) {
    var st = openStatus(new Date());
    statusEls.forEach(function (el) {
      var txt = el.querySelector('[data-status-text]');
      if (txt) txt.textContent = st.text; else el.textContent = st.text;
      el.classList.toggle('closed', !st.open);
    });
  }

  /* ---------- FLIP filter helper ---------- */
  function flipFilter(items, showFn, done) {
    var visible = items.filter(function (i) { return !i.classList.contains('is-hidden'); });
    var leaving = visible.filter(function (i) { return !showFn(i); });
    var stayingOrEntering = items.filter(showFn);
    if (reduceMotion || !items[0] || typeof items[0].animate !== 'function') {
      items.forEach(function (i) { i.classList.toggle('is-hidden', !showFn(i)); });
      if (done) done();
      return;
    }
    function runFlip() {
      var first = {};
      visible.forEach(function (i) { if (!i.classList.contains('is-hidden')) first[items.indexOf(i)] = i.getBoundingClientRect(); });
      // measure before toggle for staying items
      var firstAll = {};
      items.forEach(function (i) { if (!i.classList.contains('is-hidden')) firstAll[items.indexOf(i)] = i.getBoundingClientRect(); });
      items.forEach(function (i) { i.classList.toggle('is-hidden', !showFn(i)); });
      stayingOrEntering.forEach(function (i) {
        var idx = items.indexOf(i), last = i.getBoundingClientRect(), f = firstAll[idx];
        if (f) {
          var dx = f.left - last.left, dy = f.top - last.top;
          if (dx || dy) i.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }], { duration: 480, easing: 'cubic-bezier(.22,.9,.28,1)' });
        } else {
          i.animate([{ opacity: 0, transform: 'scale(.92) translateY(14px)' }, { opacity: 1, transform: 'scale(1) translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,.9,.28,1)' });
        }
      });
      if (done) done();
    }
    if (leaving.length) {
      var anims = leaving.map(function (i) {
        return i.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 190, easing: 'ease-in' }).finished;
      });
      Promise.all(anims).then(runFlip, runFlip);
    } else { runFlip(); }
  }

  /* ---------- Services filter ---------- */
  var svcItems = Array.prototype.slice.call(document.querySelectorAll('.svc-card'));
  var svcBtns = document.querySelectorAll('[data-svc-filter]');
  if (svcItems.length && svcBtns.length) {
    svcBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('active')) return;
        svcBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-svc-filter');
        flipFilter(svcItems, function (i) { return f === 'all' || i.getAttribute('data-cat') === f; });
      });
    });
  }

  /* ---------- Gallery filter + lightbox ---------- */
  var galItems = Array.prototype.slice.call(document.querySelectorAll('.gal-item'));
  var galBtns = document.querySelectorAll('[data-gal-filter]');
  if (galItems.length) {
    galBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('active')) return;
        galBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-gal-filter');
        flipFilter(galItems, function (i) { return f === 'all' || i.getAttribute('data-cat') === f; });
      });
    });
    var lb = document.getElementById('lightbox');
    if (lb) {
      var lbImg = document.getElementById('lbImg');
      var lbCap = document.getElementById('lbCap');
      var current = [], idx = 0;
      function visibleItems() { return galItems.filter(function (i) { return !i.classList.contains('is-hidden'); }); }
      function render() {
        var img = current[idx].querySelector('img');
        lbImg.style.opacity = '0';
        var pre = new Image();
        pre.onload = function () { lbImg.src = img.src; lbImg.alt = img.alt; lbImg.style.opacity = '1'; };
        pre.src = img.src;
        if (pre.complete) { lbImg.src = img.src; lbImg.alt = img.alt; lbImg.style.opacity = '1'; }
        lbCap.textContent = current[idx].getAttribute('data-caption') || img.alt;
      }
      function openLb(item) {
        current = visibleItems(); idx = current.indexOf(item); render();
        lb.classList.add('open'); document.body.style.overflow = 'hidden';
      }
      function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
      function step(d) { idx = (idx + d + current.length) % current.length; render(); }
      galItems.forEach(function (item) { item.addEventListener('click', function () { openLb(item); }); });
      document.getElementById('lbClose').addEventListener('click', closeLb);
      document.getElementById('lbPrev').addEventListener('click', function () { step(-1); });
      document.getElementById('lbNext').addEventListener('click', function () { step(1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      });
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq button.q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq').forEach(function (f) { f.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', String(!wasOpen));
    });
  });

  /* ---------- Reviews carousel ---------- */
  var track = document.getElementById('carTrack');
  if (track) {
    var slides = track.children.length, cIdx = 0, timer = null;
    var dotsWrap = document.getElementById('carDots');
    var dots = [];
    for (var i = 0; i < slides; i++) {
      var d = document.createElement('button');
      d.className = 'dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Show review ' + (i + 1));
      (function (n) { d.addEventListener('click', function () { goTo(n); restart(); }); })(i);
      dotsWrap.appendChild(d); dots.push(d);
    }
    function goTo(n) {
      cIdx = (n + slides) % slides;
      track.style.transform = 'translateX(-' + (cIdx * 100) + '%)';
      dots.forEach(function (dt, j) { dt.classList.toggle('active', j === cIdx); });
    }
    function restart() { clearInterval(timer); if (!reduceMotion) timer = setInterval(function () { goTo(cIdx + 1); }, 5500); }
    document.getElementById('carPrev').addEventListener('click', function () { goTo(cIdx - 1); restart(); });
    document.getElementById('carNext').addEventListener('click', function () { goTo(cIdx + 1); restart(); });
    var car = document.getElementById('carousel');
    car.addEventListener('pointerenter', function () { clearInterval(timer); });
    car.addEventListener('pointerleave', restart);
    var touchX = null;
    car.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 42) { goTo(cIdx + (dx < 0 ? 1 : -1)); restart(); }
      touchX = null;
    }, { passive: true });
    restart();
  }

  /* ---------- Form helpers ---------- */
  function fieldVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function setInvalid(form, name, bad) {
    var f = form.querySelector('[data-field="' + name + '"]');
    if (f) f.classList.toggle('invalid', bad);
    return !bad;
  }

  /* ---------- Contact form ---------- */
  var cForm = document.getElementById('contactForm');
  if (cForm) {
    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = fieldVal('cName'), email = fieldVal('cEmail'), topic = fieldVal('cTopic'), msg = fieldVal('cMessage');
      var ok = true;
      ok = setInvalid(cForm, 'name', !name) && ok;
      ok = setInvalid(cForm, 'email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = setInvalid(cForm, 'message', msg.length < 10) && ok;
      if (!ok) { var b = cForm.querySelector('.field.invalid input, .field.invalid textarea'); if (b) b.focus(); return; }
      var body = ['Message for Lumière Salon & Spa', '--------------------------------', 'Name: ' + name, 'Email: ' + email, topic ? 'Topic: ' + topic : null, '', msg].filter(function (l) { return l !== null; }).join('\n');
      document.getElementById('cText').textContent = body;
      document.getElementById('cMail').href = 'mailto:hello@lumiere-salon.example?subject=' + encodeURIComponent('Website message — ' + (topic || 'General')) + '&body=' + encodeURIComponent(body);
      var panel = document.getElementById('contactDone');
      panel.classList.add('show');
      setTimeout(function () { panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); }, 60);
      showToast('Message ready — open it in your email app or copy it to send.');
    });
    document.getElementById('cCopy').addEventListener('click', function () {
      var text = document.getElementById('cText').textContent;
      function copied() { showToast('Message copied — paste it into an email to send it.'); }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(copied, function () { fallback(); }); } else { fallback(); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); copied(); } catch (err) { showToast('Select the message text and copy it manually.'); }
        document.body.removeChild(ta);
      }
    });
    document.getElementById('cAgain').addEventListener('click', function () {
      cForm.reset();
      document.getElementById('contactDone').classList.remove('show');
      document.getElementById('cName').focus();
    });
  }

  /* ---------- Booking wizard ---------- */
  var wiz = document.getElementById('wizard');
  if (wiz) {
    var state = { service: null, servicePrice: 0, serviceDur: '', stylist: null, date: null, dateLabel: '', time: null, step: 1 };
    var panels = { 1: document.getElementById('wizStep1'), 2: document.getElementById('wizStep2'), 3: document.getElementById('wizStep3'), 4: document.getElementById('wizStep4') };
    var segs = wiz.querySelectorAll('.steps-bar .seg');
    var labels = wiz.querySelectorAll('.steps-labels span');
    var errBox = document.getElementById('wizError');
    var backBtn = document.getElementById('wizBack');
    var nextBtn = document.getElementById('wizNext');
    var donePanel = document.getElementById('bookDone');
    var navRow = document.getElementById('wizNav');

    function showError(msg) {
      if (!msg) { errBox.classList.remove('show'); errBox.textContent = ''; return; }
      errBox.textContent = msg;
      errBox.classList.remove('show');
      void errBox.offsetWidth;
      errBox.classList.add('show');
    }
    function goToStep(n, back, instant) {
      Object.keys(panels).forEach(function (k) { panels[k].classList.remove('active', 'enter', 'enter-back'); });
      state.step = n;
      var p = panels[n];
      p.classList.add('active');
      void p.offsetWidth;
      p.classList.add(back ? 'enter-back' : 'enter');
      segs.forEach(function (s, i) { s.classList.toggle('done', i < n); });
      labels.forEach(function (l, i) { l.classList.toggle('on', i === n - 1); });
      backBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
      nextBtn.innerHTML = n === 4 ? 'Confirm appointment <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : 'Continue <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      showError('');
      if (!instant) wiz.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    function shakePanel() {
      var p = panels[state.step];
      if (p && !reduceMotion) p.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease' });
    }
    function validateStep() {
      if (state.step === 1 && !state.service) { showError('Please choose a service to continue.'); shakePanel(); return false; }
      if (state.step === 2 && !state.stylist) { showError('Please choose a stylist — or “First available”.'); shakePanel(); return false; }
      if (state.step === 3 && (!state.date || !state.time)) { showError(!state.date ? 'Please pick a day for your appointment.' : 'Please pick a time for your appointment.'); shakePanel(); return false; }
      if (state.step === 4) {
        var ok = true;
        ok = setInvalid(wiz, 'bkname', !fieldVal('bkName')) && ok;
        ok = setInvalid(wiz, 'bkphone', fieldVal('bkPhone').replace(/\D/g, '').length < 7) && ok;
        if (!ok) { showError('Please add your name and a phone number so we can confirm.'); shakePanel(); return false; }
      }
      return true;
    }
    /* Service + stylist pickers */
    wiz.querySelectorAll('[data-pick-service]').forEach(function (card) {
      card.addEventListener('click', function () {
        wiz.querySelectorAll('[data-pick-service]').forEach(function (c) { c.classList.remove('selected'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('selected'); card.setAttribute('aria-pressed', 'true');
        state.service = card.getAttribute('data-pick-service');
        state.servicePrice = card.getAttribute('data-price');
        state.serviceDur = card.getAttribute('data-duration');
        showError('');
      });
    });
    wiz.querySelectorAll('[data-pick-stylist]').forEach(function (card) {
      card.addEventListener('click', function () {
        wiz.querySelectorAll('[data-pick-stylist]').forEach(function (c) { c.classList.remove('selected'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('selected'); card.setAttribute('aria-pressed', 'true');
        state.stylist = card.getAttribute('data-pick-stylist');
        showError('');
      });
    });
    /* Date chips — next 14 days, closed Mondays */
    var dateWrap = document.getElementById('dateChips');
    var timeWrap = document.getElementById('timeChips');
    var timeHint = document.getElementById('timeHint');
    var now = new Date();
    var added = 0, offset = 0;
    while (added < 12 && offset < 21) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      offset++;
      if (d.getDay() === 1) continue; // closed Mondays
      added++;
      (function (dateObj) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'date-chip';
        var wd = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
        var label = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        btn.innerHTML = '<small>' + wd + '</small>' + dateObj.getDate() + ' ' + dateObj.toLocaleDateString('en-GB', { month: 'short' });
        btn.addEventListener('click', function () {
          dateWrap.querySelectorAll('.date-chip').forEach(function (c) { c.classList.remove('selected'); });
          btn.classList.add('selected');
          state.date = dateObj; state.dateLabel = label; state.time = null;
          buildTimes(dateObj.getDay());
          showError('');
        });
        dateWrap.appendChild(btn);
      })(d);
    }
    function buildTimes(day) {
      timeWrap.innerHTML = '';
      var slots = day === 0 ? ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM'] :
        day === 6 ? ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'] :
        ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM'];
      timeHint.textContent = 'Available times — ' + state.dateLabel;
      slots.forEach(function (s, i) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'time-chip'; btn.textContent = s;
        if (!reduceMotion) btn.style.animation = 'panelIn .45s cubic-bezier(.22,.9,.28,1) ' + (i * 55) + 'ms both';
        btn.addEventListener('click', function () {
          timeWrap.querySelectorAll('.time-chip').forEach(function (c) { c.classList.remove('selected'); });
          btn.classList.add('selected');
          state.time = s; showError('');
        });
        timeWrap.appendChild(btn);
      });
    }
    timeHint.textContent = 'Pick a day first — times will appear here.';
    /* Nav */
    backBtn.addEventListener('click', function () { if (state.step > 1) goToStep(state.step - 1, true); });
    nextBtn.addEventListener('click', function () {
      if (!validateStep()) return;
      if (state.step < 4) { goToStep(state.step + 1, false); return; }
      // Confirm
      document.getElementById('sumService').textContent = state.service + ' — ' + state.servicePrice + ' · ' + state.serviceDur;
      document.getElementById('sumStylist').textContent = state.stylist;
      document.getElementById('sumWhen').textContent = state.dateLabel + ' · ' + state.time;
      document.getElementById('sumName').textContent = fieldVal('bkName');
      document.getElementById('sumPhone').textContent = fieldVal('bkPhone');
      var notes = fieldVal('bkNotes');
      var notesRow = document.getElementById('sumNotesRow');
      if (notes) { document.getElementById('sumNotes').textContent = notes; notesRow.style.display = ''; } else { notesRow.style.display = 'none'; }
      Object.keys(panels).forEach(function (k) { panels[k].classList.remove('active'); });
      navRow.style.display = 'none';
      errBox.classList.remove('show');
      segs.forEach(function (s) { s.classList.add('done'); });
      labels.forEach(function (l) { l.classList.remove('on'); });
      donePanel.classList.add('show');
      setTimeout(function () { donePanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }, 60);
      showToast('<b>Appointment requested</b> — we\u2019ll call ' + fieldVal('bkPhone') + ' to confirm.');
    });
    document.getElementById('bookAgain').addEventListener('click', function () {
      state.service = null; state.stylist = null; state.date = null; state.time = null;
      wiz.querySelectorAll('.pick-card.selected').forEach(function (c) { c.classList.remove('selected'); });
      dateWrap.querySelectorAll('.selected').forEach(function (c) { c.classList.remove('selected'); });
      timeWrap.innerHTML = ''; timeHint.textContent = 'Pick a day first — times will appear here.';
      wiz.querySelectorAll('input, textarea').forEach(function (el) { el.value = ''; el.closest('.field') && el.closest('.field').classList.remove('invalid'); });
      donePanel.classList.remove('show');
      navRow.style.display = '';
      goToStep(1, true);
    });
    /* Preselect from ?service= / ?stylist= */
    var params = new URLSearchParams(window.location.search);
    var preService = params.get('service'), preStylist = params.get('stylist');
    if (preService) {
      wiz.querySelectorAll('[data-pick-service]').forEach(function (c) {
        if (c.getAttribute('data-pick-service') === preService) c.click();
      });
    }
    if (preStylist) {
      wiz.querySelectorAll('[data-pick-stylist]').forEach(function (c) {
        if (c.getAttribute('data-pick-stylist') === preStylist) c.click();
      });
    }
    goToStep(1, true, true);
    labels.forEach(function (l, i) { l.classList.toggle('on', i === 0); });
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
