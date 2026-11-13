/* Saffron Table — shared behaviour */
(function () {
  /* Mobile menu */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    function setMenu(open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
  }

  /* Toast */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(html, ms) {
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, ms || 4200);
  }
  window.STshowToast = showToast;

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Menu page tabs */
  var tabBtns = document.querySelectorAll('[data-menu-tab]');
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.menu-panel').forEach(function (p) { p.classList.remove('active'); });
        var panel = document.getElementById('panel-' + btn.getAttribute('data-menu-tab'));
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* Gallery filter + lightbox */
  var galItems = Array.prototype.slice.call(document.querySelectorAll('.gal-item'));
  var filters = document.querySelectorAll('[data-gal-filter]');
  if (galItems.length) {
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-gal-filter');
        galItems.forEach(function (item) {
          item.classList.toggle('hide', f !== 'all' && item.getAttribute('data-cat') !== f);
        });
      });
    });
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var current = [];
    var idx = 0;
    function visibleItems() { return galItems.filter(function (i) { return !i.classList.contains('hide'); }); }
    function openLb(item) {
      current = visibleItems();
      idx = current.indexOf(item);
      render();
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    function render() {
      var img = current[idx].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = current[idx].getAttribute('data-caption') || img.alt;
    }
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

  /* FAQ accordion */
  document.querySelectorAll('.faq button.q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq').forEach(function (f) { f.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* Shared form helpers */
  function fieldVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function setInvalid(form, name, bad) {
    var f = form.querySelector('[data-field="' + name + '"]');
    if (f) f.classList.toggle('invalid', bad);
    return !bad;
  }
  window.STform = { fieldVal: fieldVal, setInvalid: setInvalid };

  /* Reservation form */
  var resForm = document.getElementById('resForm');
  if (resForm) {
    var dateInput = document.getElementById('rDate');
    if (dateInput) {
      var today = new Date();
      var iso = today.toISOString().split('T')[0];
      dateInput.min = iso;
    }
    resForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = fieldVal('rName'), phone = fieldVal('rPhone'), date = fieldVal('rDate'),
          time = fieldVal('rTime'), guests = fieldVal('rGuests'), occasion = fieldVal('rOccasion'),
          notes = fieldVal('rNotes');
      var ok = true;
      ok = setInvalid(resForm, 'name', !name) && ok;
      ok = setInvalid(resForm, 'phone', phone.replace(/\D/g, '').length < 7) && ok;
      ok = setInvalid(resForm, 'date', !date) && ok;
      ok = setInvalid(resForm, 'time', !time) && ok;
      ok = setInvalid(resForm, 'guests', !guests) && ok;
      if (!ok) {
        var firstBad = resForm.querySelector('.field.invalid input, .field.invalid select');
        if (firstBad) firstBad.focus();
        return;
      }
      var d = new Date(date + 'T12:00:00');
      var niceDate = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      document.getElementById('sumName').textContent = name;
      document.getElementById('sumWhen').textContent = niceDate + ' · ' + time;
      document.getElementById('sumGuests').textContent = guests + (occasion ? ' · ' + occasion : '');
      document.getElementById('sumPhone').textContent = phone;
      var sumNotes = document.getElementById('sumNotesRow');
      if (notes) { document.getElementById('sumNotes').textContent = notes; sumNotes.style.display = ''; }
      else { sumNotes.style.display = 'none'; }
      var panel = document.getElementById('resDone');
      panel.classList.add('show');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showToast('<b>Table request received</b> — we\u2019ll call ' + phone + ' to confirm.');
    });
    document.getElementById('resAgain').addEventListener('click', function () {
      resForm.reset();
      document.getElementById('resDone').classList.remove('show');
      document.getElementById('rName').focus();
    });
  }

  /* Contact form → composes a message the visitor sends from their own email app */
  var cForm = document.getElementById('contactForm');
  if (cForm) {
    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = fieldVal('cName'), email = fieldVal('cEmail'), topic = fieldVal('cTopic'), msg = fieldVal('cMessage');
      var ok = true;
      ok = setInvalid(cForm, 'name', !name) && ok;
      ok = setInvalid(cForm, 'email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = setInvalid(cForm, 'message', msg.length < 10) && ok;
      if (!ok) {
        var firstBad = cForm.querySelector('.field.invalid input, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var body = ['Message for Saffron Table', '------------------------', 'Name: ' + name, 'Email: ' + email,
        topic ? 'Topic: ' + topic : null, '', msg].filter(function (l) { return l !== null; }).join('\n');
      document.getElementById('cText').textContent = body;
      document.getElementById('cMail').href = 'mailto:hello@saffrontable.example?subject=' +
        encodeURIComponent('Website message — ' + (topic || 'General')) + '&body=' + encodeURIComponent(body);
      var panel = document.getElementById('contactDone');
      panel.classList.add('show');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showToast('Message ready — open it in your email app or copy it to send.');
    });
    document.getElementById('cCopy').addEventListener('click', function () {
      var text = document.getElementById('cText').textContent;
      function copied() { showToast('Message copied — paste it into an email to send it.'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(copied, function () { fallback(); });
      } else { fallback(); }
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

  /* Footer year */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
