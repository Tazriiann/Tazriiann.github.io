(function () {
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header state ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");
  function setMenu(open) {
    mobileMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger.addEventListener("click", function () {
    setMenu(!mobileMenu.classList.contains("open"));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("click", function (e) {
    if (mobileMenu.classList.contains("open") && !mobileMenu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });

  /* ---------- marquee: duplicate content for a seamless loop ---------- */
  var track = document.getElementById("marqueeTrack");
  if (track && !reduceMotion) track.innerHTML += track.innerHTML + track.innerHTML + track.innerHTML;

  /* ---------- scroll reveal (fail-safe) ----------
     Elements anywhere near the viewport are shown immediately; only
     elements far below the fold start hidden, and the observer reveals
     them well before they scroll into view. Content can never be
     stranded invisible — in a full-height capture everything is "near"
     and renders at once. */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px 700px 0px" });
    var nearLimit = window.innerHeight + 2800;
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top <= nearLimit) {
        el.classList.add("in");
      } else {
        el.classList.add("armed");
        io.observe(el);
      }
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- class filter ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var classCards = document.querySelectorAll(".class-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.getAttribute("data-filter");
      classCards.forEach(function (card) {
        card.classList.toggle("hide", f !== "all" && card.getAttribute("data-cat") !== f);
      });
    });
  });

  /* ---------- timetable ---------- */
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  /* keys: JS day index (0=Sun). lvl: 1 gentle – 4 max */
  var SCHEDULE = {
    0: [ ["6:30 AM","Rhythm Ride","Maya Chen","Spin Studio",3], ["8:00 AM","Iron Strength","Arif Rahman","Strength Floor",3], ["10:00 AM","Yoga & Mobility","Sara Ahmed","Mobility Zone",1], ["5:30 PM","Pulse HIIT","Daniel Costa","Studio A",4], ["7:00 PM","Boxing Lab","Sara Ahmed","Boxing Corner",4] ],
    1: [ ["6:00 AM","Pulse HIIT","Daniel Costa","Studio A",4], ["7:00 AM","Iron Strength","Arif Rahman","Strength Floor",3], ["12:30 PM","Kettlebell Club","Arif Rahman","Studio A",3], ["6:00 PM","Rhythm Ride","Maya Chen","Spin Studio",3], ["7:30 PM","Yoga & Mobility","Sara Ahmed","Mobility Zone",1] ],
    2: [ ["6:30 AM","Rhythm Ride","Maya Chen","Spin Studio",3], ["8:00 AM","Kettlebell Club","Arif Rahman","Studio A",3], ["5:30 PM","Iron Strength","Arif Rahman","Strength Floor",3], ["6:45 PM","Boxing Lab","Sara Ahmed","Boxing Corner",4], ["8:00 PM","Yoga & Mobility","Sara Ahmed","Mobility Zone",1] ],
    3: [ ["6:00 AM","Iron Strength","Arif Rahman","Strength Floor",3], ["7:15 AM","Pulse HIIT","Daniel Costa","Studio A",4], ["12:30 PM","Rhythm Ride","Maya Chen","Spin Studio",3], ["6:00 PM","Kettlebell Club","Arif Rahman","Studio A",3], ["7:30 PM","Boxing Lab","Sara Ahmed","Boxing Corner",4] ],
    4: [ ["6:30 AM","Pulse HIIT","Daniel Costa","Studio A",4], ["8:00 AM","Iron Strength","Arif Rahman","Strength Floor",3], ["5:30 PM","Rhythm Ride","Maya Chen","Spin Studio",3], ["6:45 PM","Yoga & Mobility","Sara Ahmed","Mobility Zone",1], ["8:00 PM","Boxing Lab","Sara Ahmed","Boxing Corner",4] ],
    5: [ ["7:30 AM","Rhythm Ride","Maya Chen","Spin Studio",3], ["9:00 AM","Iron Strength","Arif Rahman","Strength Floor",3], ["10:30 AM","Yoga & Mobility","Sara Ahmed","Mobility Zone",1], ["4:30 PM","Pulse HIIT","Daniel Costa","Studio A",4], ["6:00 PM","Kettlebell Club","Arif Rahman","Studio A",3] ],
    6: [ ["7:00 AM","Pulse HIIT","Daniel Costa","Studio A",4], ["8:30 AM","Boxing Lab","Sara Ahmed","Boxing Corner",4], ["10:00 AM","Iron Strength","Arif Rahman","Strength Floor",3], ["11:30 AM","Rhythm Ride","Maya Chen","Spin Studio",3], ["5:00 PM","Yoga & Mobility","Sara Ahmed","Mobility Zone",1] ]
  };
  var LVL_LABEL = { 1: "Gentle", 2: "Moderate", 3: "Hard", 4: "Max" };
  var dayOrder = [6, 0, 1, 2, 3, 4, 5]; /* week starts Saturday (BD) */
  var todayIdx = new Date().getDay();
  var tabsWrap = document.getElementById("dayTabs");
  var ttTable = document.getElementById("ttTable");

  function meterHTML(lvl) {
    return '<span class="meter lvl-' + lvl + '" aria-hidden="true"><i></i><i></i><i></i><i></i></span> ' + LVL_LABEL[lvl];
  }
  function renderDay(idx) {
    var rows = SCHEDULE[idx] || [];
    if (!rows.length) {
      ttTable.innerHTML = '<div class="tt-empty">No coached classes this day — the gym floor is open as usual.</div>';
      return;
    }
    ttTable.innerHTML = rows.map(function (r) {
      return '<div class="tt-row">' +
        '<div class="tt-time">' + r[0] + '</div>' +
        '<div class="tt-main"><b>' + r[1] + '</b><span>with ' + r[2] + ' · ' + r[3] + '</span></div>' +
        '<div class="meter-wrap" style="color:var(--muted);font-size:.83rem;font-weight:700">' + meterHTML(r[4]) + '</div>' +
        '</div>';
    }).join("");
  }
  dayOrder.forEach(function (idx) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "day-tab" + (idx === todayIdx ? " active" : "");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", idx === todayIdx ? "true" : "false");
    b.innerHTML = SHORT[idx] + (idx === todayIdx ? "<small>Today</small>" : "<small>&nbsp;</small>");
    b.addEventListener("click", function () {
      tabsWrap.querySelectorAll(".day-tab").forEach(function (t) {
        t.classList.remove("active"); t.setAttribute("aria-selected", "false");
      });
      b.classList.add("active"); b.setAttribute("aria-selected", "true");
      renderDay(idx);
    });
    tabsWrap.appendChild(b);
  });
  renderDay(todayIdx);

  /* ---------- pricing toggle ---------- */
  var billBtns = document.querySelectorAll(".billing-toggle button");
  billBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      billBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var mode = btn.getAttribute("data-billing");
      document.querySelectorAll("[data-monthly]").forEach(function (el) {
        el.textContent = el.getAttribute(mode === "annual" ? "data-annual" : "data-monthly");
      });
    });
  });

  /* ---------- pricing CTA preselects the plan in the trial form ---------- */
  var planSelect = document.getElementById("fPlan");
  document.querySelectorAll("[data-plan]").forEach(function (link) {
    link.addEventListener("click", function () {
      var plan = link.getAttribute("data-plan");
      for (var i = 0; i < planSelect.options.length; i++) {
        if (planSelect.options[i].text === plan) { planSelect.selectedIndex = i; break; }
      }
    });
  });

  /* ---------- BMI calculator ---------- */
  var bmiForm = document.getElementById("bmiForm");
  var bmiResult = document.getElementById("bmiResult");
  bmiForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var h = parseFloat(document.getElementById("bmiHeight").value);
    var w = parseFloat(document.getElementById("bmiWeight").value);
    bmiResult.classList.add("show");
    if (!h || !w || h < 100 || h > 250 || w < 25 || w > 400) {
      bmiResult.innerHTML = "<span>Please enter a height between 100–250 cm and a weight between 25–400 kg.</span>";
      return;
    }
    var bmi = w / Math.pow(h / 100, 2);
    var cat, advice;
    if (bmi < 18.5) { cat = "Underweight range"; advice = "A strength programme with a calorie-surplus nutrition target is the classic fix — our coaches build exactly that."; }
    else if (bmi < 25) { cat = "Healthy range"; advice = "Nice base. From here it's about performance: strength, conditioning and consistency. Any of our classes will move you forward."; }
    else if (bmi < 30) { cat = "Overweight range"; advice = "Very workable starting point. Most members in this range see visible change in 8–12 weeks of classes plus light nutrition tweaks."; }
    else { cat = "Obese range"; advice = "The best day to start was yesterday; the second-best is today. Low-impact classes like Rhythm Ride and Yoga & Mobility are perfect first steps."; }
    bmiResult.innerHTML = "<b>BMI " + bmi.toFixed(1) + "</b><span><strong style='color:var(--ink)'>" + cat + ".</strong> " + advice + "</span>";
  });

  /* ---------- gallery lightbox ---------- */
  var galBtns = Array.prototype.slice.call(document.querySelectorAll("#galGrid button"));
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbIndex = 0, lastFocus = null;
  function showLb(i) {
    lbIndex = (i + galBtns.length) % galBtns.length;
    var btn = galBtns[lbIndex];
    lbImg.src = btn.getAttribute("data-full");
    lbImg.alt = btn.querySelector("img").alt;
    lbCap.textContent = btn.getAttribute("data-cap") || "";
  }
  function openLb(i, btn) {
    lastFocus = btn;
    showLb(i);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    document.getElementById("lbClose").focus();
  }
  function closeLb() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  galBtns.forEach(function (btn, i) {
    btn.addEventListener("click", function () { openLb(i, btn); });
  });
  document.getElementById("lbClose").addEventListener("click", closeLb);
  document.getElementById("lbPrev").addEventListener("click", function () { showLb(lbIndex - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { showLb(lbIndex + 1); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
  });

  /* ---------- opening hours: highlight today ---------- */
  document.querySelectorAll("#hoursList .hours-row").forEach(function (row) {
    if (parseInt(row.getAttribute("data-days"), 10) === todayIdx) row.classList.add("today");
  });

  /* ---------- free-trial form ---------- */
  var form = document.getElementById("trialForm");
  var errBox = document.getElementById("formErr");
  var done = document.getElementById("formDone");
  var lastDetailsText = "";
  function val(id) { return document.getElementById(id).value.trim(); }
  function prettyDate(iso) {
    if (!iso) return "First available day";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return DAYS[d.getDay()] + ", " + d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = val("fName"), phone = val("fPhone"), email = val("fEmail"),
        goal = val("fGoal"), plan = val("fPlan"), cls = val("fClass"),
        date = val("fDate"), msg = val("fMsg");
    var problems = [];
    if (name.length < 2) problems.push("your name");
    if (!/^[+\d][\d\s-]{7,}$/.test(phone)) problems.push("a valid phone number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("a valid email address");
    if (!goal) problems.push("your main goal");
    if (problems.length) {
      errBox.textContent = "Almost there — we still need " + problems.join(", ") + ".";
      errBox.classList.add("show");
      errBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      return;
    }
    errBox.classList.remove("show");
    var rows = [
      ["Name", name], ["Phone", phone], ["Email", email], ["Goal", goal],
      ["Plan", plan], ["Class", cls], ["Preferred day", prettyDate(date)]
    ];
    if (msg) rows.push(["Notes", msg]);
    document.getElementById("doneSummary").innerHTML = rows.map(function (r) {
      return "<div><span>" + r[0] + "</span><b>" + r[1].replace(/</g, "&lt;") + "</b></div>";
    }).join("");
    var lines = rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
    lastDetailsText = "PulseFit Studio — free workout booking\n" + lines;
    document.getElementById("doneMail").href =
      "mailto:hello@pulsefitstudio.example?subject=" +
      encodeURIComponent("Free workout booking — " + name) +
      "&body=" + encodeURIComponent("Hi PulseFit team,\n\nI'd like to book my free workout.\n\n" + lines + "\n\nThanks!");
    form.style.display = "none";
    done.classList.add("show");
    done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });
  document.getElementById("editBtn").addEventListener("click", function () {
    done.classList.remove("show");
    form.style.display = "";
    form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });
  document.getElementById("copyBtn").addEventListener("click", function () {
    var note = document.getElementById("copiedNote");
    function showNote() {
      note.classList.add("show");
      setTimeout(function () { note.classList.remove("show"); }, 2400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastDetailsText).then(showNote, showNote);
    } else { showNote(); }
  });

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
