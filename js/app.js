/*
 * EZ Home prototype: screen flow.
 * Each screen is a render function keyed by its URL hash (#describe, #match, ...).
 * State is kept in sessionStorage so a refresh keeps the tester's place.
 * Test answers (confidence, deciding detail) are logged to the console and localStorage only.
 */
(function () {
  "use strict";

  var EZ = window.EZ;
  var app = document.getElementById("app");
  var STORE_KEY = "ezhome-state";
  var LOG_KEY = "ezhome-test-log";

  /* Screen order. `step` drives "Step n of 9"; report is a branch of step 8. */
  var SCREENS = {
    describe:   { step: 1, title: "Describe the job", back: null },
    match:      { step: 2, title: "Your job type", back: "describe" },
    providers:  { step: 3, title: "Compare providers", back: "match" },
    window:     { step: 4, title: "Pick an arrival time", back: "providers" },
    booked:     { step: 5, title: "Booking confirmed", back: "window" },
    arrival:    { step: 6, title: "Day of the job", back: "booked" },
    change:     { step: 7, title: "Change request", back: "arrival" },
    complete:   { step: 8, title: "Job finished", back: "change" },
    report:     { step: 8, title: "Report a problem", back: "complete" },
    done:       { step: 9, title: "All done", back: null }
  };
  var TOTAL_STEPS = 9;

  /* ---------- State ---------- */
  var state = load();

  function blankState() {
    return {
      job: { description: "", location: "", access: "", day: "", time: "", outcome: "" },
      category: null,
      providerId: null,
      windowDay: null,
      windowTime: null,
      confidence: null,
      changeDecision: null,
      outcome: null,
      report: null
    };
  }
  function load() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
      if (saved && saved.job) return saved;
    } catch (e) { /* ignore */ }
    return blankState();
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function logAnswer(key, value) {
    var entry = { question: key, answer: value, at: new Date().toISOString() };
    console.log("[EZ Home test]", entry);
    try {
      var log = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
      log.push(entry);
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch (e) { /* ignore */ }
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n) { return "$" + n; }
  function provider() {
    for (var i = 0; i < EZ.providers.length; i++) if (EZ.providers[i].id === state.providerId) return EZ.providers[i];
    return null;
  }
  function day(id) {
    for (var i = 0; i < EZ.days.length; i++) if (EZ.days[i].id === id) return EZ.days[i];
    return null;
  }
  function timeOfDay(id) {
    for (var i = 0; i < EZ.times.length; i++) if (EZ.times[i].id === id) return EZ.times[i];
    return null;
  }
  function finalPrice() {
    var p = provider();
    return p.estimate + (state.changeDecision === "approved" ? EZ.change.amount : 0);
  }
  function stars(n) {
    var full = Math.round(n);
    return '<span class="stars" aria-label="' + n + ' out of 5 stars">' + "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full) + "</span>";
  }
  /* Push a window 10 minutes later, e.g. "9:30 – 10:00 AM" -> "9:40 – 10:10 AM".
     Windows always start on :00 or :30, so only the minutes change. */
  function delayWindow(w) {
    return w.replace(/:00/g, ":10").replace(/:30/g, ":40");
  }

  /* Small inline icons (Lucide-style strokes). Decorative, hidden from screen readers. */
  var ICON_PATHS = {
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    back: '<polyline points="15 18 9 12 15 6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    support: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    tag: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    forward: '<polyline points="9 18 15 12 9 6"/>'
  };
  function icon(name, size) {
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICON_PATHS[name] + "</svg>";
  }

  function topBar(name) {
    var s = SCREENS[name];
    var back = s.back
      ? '<button type="button" class="back-link" data-go="' + s.back + '">' + icon("back") + "Back</button>"
      : "<span></span>";
    var pct = Math.round((s.step / TOTAL_STEPS) * 100);
    return '<div class="screen-top">' + back +
      '<div class="progress">Step ' + s.step + " of " + TOTAL_STEPS +
      '<span class="progress__bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span></div></div>';
  }
  function timeBanner(when, what) {
    return '<div class="time-banner">' + icon("clock", 22) + "<div><strong>" + esc(when) + "</strong><br>" + esc(what) + "</div></div>";
  }

  /* ---------- Routing ---------- */
  function go(name) {
    if (location.hash === "#" + name) render();
    else location.hash = name;
  }

  /* Screens that need earlier answers send the tester back to the start. */
  function guard(name) {
    var needsJob = ["match", "providers", "window", "booked", "arrival", "change", "complete", "report", "done"];
    if (needsJob.indexOf(name) > -1 && !state.job.description) return "describe";
    if (["providers", "window", "booked", "arrival", "change", "complete", "report", "done"].indexOf(name) > -1 && state.category !== "mounting") return "match";
    if (["window", "booked", "arrival", "change", "complete", "report", "done"].indexOf(name) > -1 && !state.providerId) return "providers";
    if (["booked", "arrival", "change", "complete", "report", "done"].indexOf(name) > -1 && !state.windowTime) return "window";
    if (["complete", "report", "done"].indexOf(name) > -1 && !state.changeDecision) return "change";
    if (name === "done" && !state.outcome) return "complete";
    return null;
  }

  function render() {
    var name = location.hash.replace("#", "") || "describe";
    if (!SCREENS[name]) name = "describe";
    var redirect = guard(name);
    if (redirect) { location.replace("#" + redirect); return; }

    app.innerHTML = RENDER[name]();
    document.title = SCREENS[name].title + " · EZ Home";
    window.scrollTo(0, 0);
    var h1 = app.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
    if (BIND[name]) BIND[name]();
  }

  /* Global click handling for [data-go] navigation buttons. */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]");
    if (t) { e.preventDefault(); go(t.getAttribute("data-go")); }
  });
  document.getElementById("restart").addEventListener("click", function () {
    state = blankState();
    save();
    go("describe");
  });
  window.addEventListener("hashchange", render);

  /* ---------- Job matching (FR-2) ---------- */
  /* Returns the matched text as the customer typed it (e.g. "AC"), or null. */
  function findWord(text, kw) {
    var safe = kw.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
    var m = new RegExp("(^|[^a-z])(" + safe + ")(?=[^a-z]|$)", "i").exec(text);
    return m ? m[2] : null;
  }
  function hasWord(text, kw) { return findWord(text, kw) !== null; }
  function matchJob(text) {
    for (var i = 0; i < EZ.outOfScope.length; i++) {
      var o = EZ.outOfScope[i];
      for (var k = 0; k < o.keywords.length; k++) {
        var found = findWord(text, o.keywords[k]);
        if (found) return { type: "out", area: o.area, word: found };
      }
    }
    var best = null, bestScore = 0;
    EZ.categories.forEach(function (c) {
      var score = c.keywords.filter(function (kw) { return hasWord(text, kw); }).length;
      if (score > bestScore) { best = c; bestScore = score; }
    });
    return best ? { type: "in", category: best } : { type: "unknown" };
  }
  function category(id) {
    for (var i = 0; i < EZ.categories.length; i++) if (EZ.categories[i].id === id) return EZ.categories[i];
    return null;
  }

  /* ================================================================
   * Screen renderers
   * ================================================================ */
  var RENDER = {};
  var BIND = {};

  /* 1. Describe the job (FR-1) */
  RENDER.describe = function () {
    var j = state.job;
    var dayOpts = EZ.days.map(function (d) {
      return '<label class="choice"><input type="radio" name="day" value="' + d.id + '"' + (j.day === d.id ? " checked" : "") + "><span>" + d.label + "</span></label>";
    }).join("");
    var timeOpts = EZ.times.map(function (t) {
      return '<label class="choice"><input type="radio" name="time" value="' + t.id + '"' + (j.time === t.id ? " checked" : "") + "><span>" + t.label + "<small>" + t.hint + "</small></span></label>";
    }).join("");

    return '<div class="narrow">' + topBar("describe") +
      "<h1>What do you need done?</h1>" +
      '<p class="lead">Tell us about your job in your own words. We\'ll match you with providers who have done this exact kind of work before, with prices up front.</p>' +
      '<div class="scenario"><p><strong>Your test scenario:</strong> ' + esc(EZ.scenario.intro) + "</p>" +
      '<p><button type="button" class="btn btn--link" id="fill-example">Fill in an example answer for me</button></p></div>' +
      '<div id="errors"></div>' +
      '<form id="describe-form" novalidate>' +
      field("description", "Describe the job", "For example: what needs to be mounted, fixed or assembled, and where.",
        '<textarea id="description" name="description" rows="4">' + esc(j.description) + "</textarea>", "Describe the job so providers know what to expect.") +
      field("location", "Address or neighborhood", "Only your neighborhood is shown to providers until you book.",
        '<input type="text" id="location" name="location" autocomplete="street-address" value="' + esc(j.location) + '">', "Enter your address or neighborhood.") +
      field("access", "Parking or building access", "Optional. For example: street parking, buzzer number, stairs.",
        '<input type="text" id="access" name="access" value="' + esc(j.access) + '">', "", true) +
      '<fieldset class="field" id="field-day"><legend>Which day works best? <span class="req">(required)</span></legend>' +
      '<div class="choices">' + dayOpts + "</div>" +
      '<p class="field-error" id="day-error">Choose a day.</p></fieldset>' +
      '<fieldset class="field" id="field-time"><legend>What time of day? <span class="req">(required)</span></legend>' +
      '<div class="choices">' + timeOpts + "</div>" +
      '<p class="field-error" id="time-error">Choose a time of day.</p></fieldset>' +
      field("outcome", "What should it look like when it's done?", "This becomes part of the written agreement, so the provider knows what \"finished\" means to you.",
        '<textarea id="outcome" name="outcome" rows="3">' + esc(j.outcome) + "</textarea>", "Describe what the finished job should look like.") +
      '<div class="actions"><button type="submit" class="btn btn--primary">Continue ' + icon("forward") + "</button></div>" +
      "</form></div>";
  };
  function field(id, label, hint, control, error, optional) {
    return '<div class="field" id="field-' + id + '"><label for="' + id + '">' + label + " " +
      '<span class="req">' + (optional ? "(optional)" : "(required)") + "</span></label>" +
      '<span class="hint" id="' + id + '-hint">' + hint + "</span>" +
      control.replace(/(id="[^"]+")/, '$1 aria-describedby="' + id + "-hint " + id + '-error"') +
      (error ? '<p class="field-error" id="' + id + '-error">' + error + "</p>" : "") + "</div>";
  }
  BIND.describe = function () {
    var form = document.getElementById("describe-form");
    document.getElementById("fill-example").addEventListener("click", function () {
      var ex = EZ.scenario.example;
      form.description.value = ex.description;
      form.location.value = ex.location;
      form.access.value = ex.access;
      form.outcome.value = ex.outcome;
      form.querySelector('input[name="day"][value="' + ex.day + '"]').checked = true;
      form.querySelector('input[name="time"][value="' + ex.time + '"]').checked = true;
      clearErrors();
    });

    function clearErrors() {
      form.querySelectorAll(".has-error").forEach(function (f) { f.classList.remove("has-error"); });
      form.querySelectorAll("[aria-invalid]").forEach(function (f) { f.removeAttribute("aria-invalid"); });
      document.getElementById("errors").innerHTML = "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();
      var checked = function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ""; };
      var job = {
        description: form.description.value.trim(),
        location: form.location.value.trim(),
        access: form.access.value.trim(),
        day: checked("day"),
        time: checked("time"),
        outcome: form.outcome.value.trim()
      };
      var missing = [];
      [["description", "Describe the job"], ["location", "Address or neighborhood"], ["day", "Which day works best"], ["time", "What time of day"], ["outcome", "What it should look like when it's done"]]
        .forEach(function (pair) {
          if (!job[pair[0]]) {
            missing.push(pair);
            var f = document.getElementById("field-" + pair[0]);
            f.classList.add("has-error");
            var input = document.getElementById(pair[0]);
            if (input) input.setAttribute("aria-invalid", "true");
          }
        });
      state.job = job;
      save();

      if (missing.length) {
        var box = document.getElementById("errors");
        box.innerHTML = '<div class="error-summary" role="alert" tabindex="-1"><h2>Please fill in ' +
          (missing.length === 1 ? "1 more answer" : missing.length + " more answers") + " to continue</h2><ul>" +
          missing.map(function (m) { return '<li><a href="#" data-focus="' + m[0] + '">' + m[1] + "</a></li>"; }).join("") +
          "</ul></div>";
        box.querySelectorAll("[data-focus]").forEach(function (a) {
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            var id = a.getAttribute("data-focus");
            var target = document.getElementById(id) || form.querySelector('input[name="' + id + '"]');
            target.focus();
          });
        });
        box.firstChild.focus();
        return;
      }
      var m = matchJob(job.description + " " + job.outcome);
      state.match = m.type === "out" ? { type: "out", area: m.area, word: m.word } : m.type === "in" ? { type: "in" } : { type: "unknown" };
      state.category = m.type === "in" ? m.category.id : null;
      save();
      go("match");
    });
  };

  /* 2. Matched to a task category (FR-2) */
  RENDER.match = function () {
    var j = state.job;
    var m = state.match || { type: "unknown" };
    var supported = '<ul>' + EZ.categories.map(function (c) { return "<li><strong>" + c.name + "</strong>: " + c.examples + "</li>"; }).join("") + "</ul>";

    if (m.type === "out") {
      return '<div class="narrow">' + topBar("match") +
        "<h1>Sorry, EZ Home can't help with this job yet</h1>" +
        '<div class="notice notice--warning">' + icon("alert", 22) + "<div><p>Your description mentions <strong>“" + esc(m.word) + "”</strong>, so this sounds like <strong>" + esc(m.area.toLowerCase()) + "</strong>.</p>" +
        "<p>EZ Home only books small handyman jobs right now. Plumbing, electrical, heating and cooling, and appliance repairs need a licensed specialist, so we can't book them yet.</p></div></div>" +
        '<div class="card card--flat"><h2>Jobs EZ Home can book today</h2>' + supported + "</div>" +
        "<p>If we got this wrong, or you have one of these jobs, change your description.</p>" +
        '<div class="actions"><button type="button" class="btn btn--primary" data-go="describe">' + icon("back") + "Change my description</button></div></div>";
    }

    if (m.type === "none") {
      return '<div class="narrow">' + topBar("match") +
        "<h1>Sorry, this job isn't on our list yet</h1>" +
        "<p class=\"lead\">EZ Home starts with a short list of small handyman jobs, so we can give firm prices before anyone arrives.</p>" +
        '<div class="card card--flat"><h2>Jobs EZ Home can book today</h2>' + supported + "</div>" +
        '<div class="actions"><button type="button" class="btn btn--primary" data-go="describe">' + icon("back") + "Change my description</button></div></div>";
    }

    if (m.type === "unknown" || !state.category) {
      return '<div class="narrow">' + topBar("match") +
        "<h1>Which kind of job is this?</h1>" +
        "<p class=\"lead\">We couldn't tell from your description. Pick the closest match, or go back and add more detail.</p>" +
        '<div class="card card--flat"><p class="review__meta">You wrote:</p><p>“' + esc(j.description) + "”</p></div>" +
        '<form id="pick-cat"><fieldset class="field"><legend>Choose a job type</legend><div class="choices choices--list">' +
        EZ.categories.map(function (c) {
          return '<label class="choice"><input type="radio" name="cat" value="' + c.id + '"><span>' + c.name + "<small>" + c.examples + "</small></span></label>";
        }).join("") +
        '<label class="choice"><input type="radio" name="cat" value="none"><span>None of these<small>Something else</small></span></label>' +
        '</div><p class="field-error" id="cat-error">Choose a job type to continue.</p></fieldset>' +
        '<div class="actions"><button type="submit" class="btn btn--primary">Continue ' + icon("forward") + '</button>' +
        '<button type="button" class="btn btn--secondary" data-go="describe">Change my description</button></div></form></div>';
    }

    var cat = category(state.category);
    if (!cat.bookable) {
      return '<div class="narrow">' + topBar("match") +
        "<h1>This test only covers shelf mounting</h1>" +
        '<div class="notice notice--info">' + icon("info", 22) + "<div><p>We matched your job to <strong>" + esc(cat.name) + "</strong>. EZ Home handles that kind of job, but this prototype only has providers for the shelf scenario.</p>" +
        "<p>To continue, change your description to the shelf job: <em>" + esc(EZ.scenario.intro) + "</em></p></div></div>" +
        '<div class="actions"><button type="button" class="btn btn--primary" data-go="describe">' + icon("back") + "Change my description</button></div></div>";
    }

    var d = day(j.day), t = timeOfDay(j.time);
    return '<div class="narrow">' + topBar("match") +
      '<h1 class="match-title">' + icon("check", 28) + "We matched your job to Shelf &amp; TV Mounting</h1>" +
      '<p class="lead">You\'ll only see providers who do this kind of work. Check that we have your details right. Providers use them to price the job.</p>' +
      '<div class="card"><h2>Your job details</h2><dl class="summary-list">' +
      "<div><dt>The job</dt><dd>" + esc(j.description) + "</dd></div>" +
      "<div><dt>When it's done</dt><dd>" + esc(j.outcome) + "</dd></div>" +
      "<div><dt>Where</dt><dd>" + esc(j.location) + (j.access ? "<br><span class=\"review__meta\">" + esc(j.access) + "</span>" : "") + "</dd></div>" +
      "<div><dt>Preferred time</dt><dd>" + esc(d ? d.label : "") + ", " + esc(t ? t.label.toLowerCase() : "") + "</dd></div>" +
      '</dl><p><button type="button" class="btn btn--link" data-go="describe">Edit these details</button></p></div>' +
      '<div class="actions"><button type="button" class="btn btn--primary" data-go="providers">See matched providers ' + icon("forward") + "</button></div></div>";
  };
  BIND.match = function () {
    var form = document.getElementById("pick-cat");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = form.querySelector('input[name="cat"]:checked');
      if (!c) {
        form.querySelector(".field").classList.add("has-error");
        form.querySelector('input[name="cat"]').focus();
        return;
      }
      if (c.value === "none") {
        state.match = { type: "none" };
        state.category = null;
      } else {
        state.match = { type: "in" };
        state.category = c.value;
      }
      save();
      render();
    });
  };

  /* 3. Compare providers (FR-3) */
  RENDER.providers = function () {
    var cards = EZ.providers.map(function (p) {
      var reviews = p.reviews.map(function (r) {
        return '<div class="review"><div class="review__meta"><span class="review__job">' + esc(r.job) + "</span> · " + esc(r.when) + "</div>" +
          "<div>" + stars(r.stars) + "</div><p>“" + esc(r.text) + "” <span class=\"review__meta\">— " + esc(r.who) + "</span></p></div>";
      }).join("");
      return '<article class="card provider" id="card-' + p.id + '" aria-labelledby="pname-' + p.id + '">' +
        '<div class="provider__head"><div class="avatar" aria-hidden="true">' + p.initials + "</div><div>" +
        '<h2 class="provider__name" id="pname-' + p.id + '" tabindex="-1">' + esc(p.name) + "</h2>" +
        '<span class="provider__tag">' + esc(p.tag) + "</span></div></div>" +

        '<div class="provider__section"><div class="provider__label">' + icon("tool", 16) + "Experience with this job</div>" +
        '<div class="big-number">' + p.jobsThisType + "</div><div>" + esc(p.jobNoun) + " done through EZ Home</div>" +
        '<div class="review__meta">' + p.years + " years as a handyman</div></div>" +

        '<div class="provider__section"><div class="provider__label">' + icon("star", 16) + "Reviews from similar jobs</div>" + reviews +
        '<p class="review__meta" style="margin-top:12px;margin-bottom:0">Overall: ' + p.rating + " out of 5 from " + p.ratingCount + " jobs of all kinds</p></div>" +

        '<div class="provider__section"><div class="provider__label">' + icon("calendar", 16) + "Availability</div>" +
        "<div><strong>" + esc(p.availability) + "</strong></div></div>" +

        '<div class="provider__section provider__price"><div class="provider__label">' + icon("tag", 16) + "Upfront estimate for your job</div>" +
        '<div class="big-number">' + money(p.estimate) + "</div><div class=\"review__meta\">" + esc(p.estimateNote) + ". Can only change if you approve it.</div></div>" +

        '<div class="provider__cta"><button type="button" class="btn btn--primary btn--block" data-pick="' + p.id + '">Choose ' + esc(p.first) + "</button></div>" +
        "</article>";
    }).join("");

    /* Phone-only side-by-side summary; the full cards stack below it. */
    var avg = function (p) {
      var sum = p.reviews.reduce(function (a, r) { return a + r.stars; }, 0);
      return (sum / p.reviews.length).toFixed(1);
    };
    var quick = '<div class="quick-compare"><table><caption>Quick comparison</caption><thead><tr><td></td>' +
      EZ.providers.map(function (p) { return '<th scope="col"><a href="#card-' + p.id + '" data-jump="' + p.id + '">' + esc(p.first) + "</a></th>"; }).join("") +
      "</tr></thead><tbody>" +
      '<tr><th scope="row">Jobs like yours</th>' + EZ.providers.map(function (p) { return "<td>" + p.jobsThisType + "</td>"; }).join("") + "</tr>" +
      '<tr><th scope="row">Similar-job reviews</th>' + EZ.providers.map(function (p) { return "<td>" + avg(p) + " avg</td>"; }).join("") + "</tr>" +
      '<tr><th scope="row">Earliest day</th>' + EZ.providers.map(function (p) { return "<td>" + esc(day(p.days[0]).label.replace(/^\w+, /, "")) + "</td>"; }).join("") + "</tr>" +
      '<tr><th scope="row">Estimate</th>' + EZ.providers.map(function (p) { return "<td><strong>" + money(p.estimate) + "</strong></td>"; }).join("") + "</tr>" +
      '</tbody></table><p class="review__meta">Tap a name to see full details and reviews.</p></div>';

    return topBar("providers") +
      "<h1>Choose a provider for your shelves</h1>" +
      '<p class="lead">These 3 providers do shelf and TV mounting and are available near ' + esc(state.job.location) + ". Each one has read your job description and given a price for it. Choosing one doesn't book anything yet; you'll pick an arrival time next.</p>" +
      '<div class="card card--flat"><h2>What every estimate covers</h2><div class="scope-cols"><ul class="check-list">' +
      EZ.scope.includes.map(function (s) { return "<li>" + icon("check") + "<span>" + esc(s) + "</span></li>"; }).join("") +
      '</ul><div><ul class="x-list">' + EZ.scope.excludes.map(function (s) { return "<li>" + icon("x") + "<span>Not included: " + esc(s.toLowerCase()) + "</span></li>"; }).join("") +
      '</ul><p class="review__meta" style="margin-top:12px">Time on site: ' + esc(EZ.scope.duration.toLowerCase()) + "</p></div></div></div>" +
      quick + '<div class="providers">' + cards + "</div>";
  };
  BIND.providers = function () {
    /* In-page jumps would change the hash and trigger the router, so scroll manually. */
    app.querySelectorAll("[data-jump]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var card = document.getElementById("card-" + a.getAttribute("data-jump"));
        card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        card.querySelector("h2").focus({ preventScroll: true });
      });
    });
    app.querySelectorAll("[data-pick]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (state.providerId !== b.getAttribute("data-pick")) { state.windowDay = null; state.windowTime = null; }
        state.providerId = b.getAttribute("data-pick");
        save();
        logAnswer("provider chosen", provider().name + " (" + provider().tag + ")");
        go("window");
      });
    });
  };

  /* 4. Pick an arrival window (US-6) */
  RENDER.window = function () {
    var p = provider();
    var chosenDay = state.windowDay || (p.days.indexOf(state.job.day) > -1 ? state.job.day : p.days[0]);
    var prefNote = p.days.indexOf(state.job.day) > -1
      ? ""
      : '<div class="notice notice--info">' + icon("info", 22) + "<p>" + esc(p.first) + " isn't free on " + esc(day(state.job.day).label) + ", the day you asked for. Here are the days " + esc(p.first) + " can come.</p></div>";

    var dayTabs = p.days.map(function (id) {
      return '<label class="choice"><input type="radio" name="wday" value="' + id + '"' + (id === chosenDay ? " checked" : "") + "><span>" + day(id).label + "</span></label>";
    }).join("");

    var groups = EZ.times.map(function (t) {
      var opts = EZ.windows[t.id].map(function (w) {
        var checked = state.windowDay === chosenDay && state.windowTime === w;
        return '<label class="choice"><input type="radio" name="wtime" value="' + esc(w) + '"' + (checked ? " checked" : "") + "><span>" + esc(w) + "</span></label>";
      }).join("");
      return '<div class="windows-group"><h3>' + t.label + (t.id === state.job.time ? " (your preference)" : "") + '</h3><div class="choices">' + opts + "</div></div>";
    }).join("");

    return '<div class="narrow">' + topBar("window") +
      "<h1>When should " + esc(p.first) + " arrive?</h1>" +
      '<p class="lead">Pick a 30-minute arrival window. ' + esc(p.first) + " will arrive within that half hour, so you don't have to wait around all morning.</p>" +
      prefNote +
      '<form id="window-form" novalidate>' +
      '<fieldset class="field day-tabs"><legend>Day</legend><div class="choices">' + dayTabs + "</div></fieldset>" +
      '<fieldset class="field" id="field-wtime"><legend>Arrival window</legend>' + groups +
      '<p class="field-error">Choose an arrival window to continue.</p></fieldset>' +
      '<div class="notice notice--info">' + icon("clock", 22) + "<p>The job takes " + esc(EZ.scope.duration.toLowerCase()) + ". You'll get a message if " + esc(p.first) + " is running late.</p></div>" +
      '<div class="actions"><button type="submit" class="btn btn--primary">Book ' + esc(p.first) + " for " + money(p.estimate) + "</button></div>" +
      '<p class="review__meta">Nothing is charged now. You pay ' + esc(p.first) + " directly after the job, based on the agreed estimate.</p>" +
      "</form></div>";
  };
  BIND.window = function () {
    var form = document.getElementById("window-form");
    form.querySelectorAll('input[name="wday"]').forEach(function (r) {
      r.addEventListener("change", function () {
        state.windowDay = r.value;
        state.windowTime = null;
        save();
        render();
        var again = document.querySelector('input[name="wday"][value="' + r.value + '"]');
        if (again) again.focus();
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = form.querySelector('input[name="wtime"]:checked');
      var d = form.querySelector('input[name="wday"]:checked');
      if (!t) {
        var f = document.getElementById("field-wtime");
        f.classList.add("has-error");
        f.querySelector("input").focus();
        return;
      }
      state.windowDay = d.value;
      state.windowTime = t.value;
      save();
      go("booked");
    });
  };

  /* 5. Booking confirmation: the value moment (FR-5) */
  RENDER.booked = function () {
    var p = provider(), d = day(state.windowDay);
    var rating = [1, 2, 3, 4, 5].map(function (n) {
      return '<label class="choice"><input type="radio" name="conf" value="' + n + '"' + (state.confidence == n ? " checked" : "") + "><span>" + n + "</span></label>";
    }).join("");

    return topBar("booked") +
      '<div class="confirm-hero"><div class="check-circle">' + icon("check", 30) + "</div>" +
      "<h1>You're booked with " + esc(p.name) + "</h1>" +
      '<p class="ref">Booking ' + EZ.bookingRef + ". " + esc(p.first) + " has reviewed your job description and agreed to this scope and price.</p></div>" +

      '<div class="booking-grid">' +
      '<section class="card booking-item"><h2>' + icon("user", 16) + "Who is coming</h2>" +
      '<div class="value">' + esc(p.name) + "</div><p>" + p.jobsThisType + " " + esc(p.jobNoun) + " on EZ Home</p></section>" +
      '<section class="card booking-item"><h2>' + icon("clock", 16) + "When</h2>" +
      '<div class="value">' + esc(d.long) + "</div><p>Arrives between <strong>" + esc(state.windowTime) + "</strong></p></section>" +
      "</div>" +

      '<section class="card booking-item"><h2>' + icon("list", 16) + "What " + esc(p.first) + " will do</h2>" +
      '<div class="scope-cols"><div><ul class="check-list">' +
      EZ.scope.includes.map(function (s) { return "<li>" + icon("check") + "<span>" + esc(s) + "</span></li>"; }).join("") +
      '</ul></div><div><p><strong>Not included</strong></p><ul class="x-list">' +
      EZ.scope.excludes.map(function (s) { return "<li>" + icon("x") + "<span>" + esc(s) + "</span></li>"; }).join("") +
      '</ul><p style="margin-top:12px"><strong>Done means:</strong> ' + esc(state.job.outcome) + "</p></div></div></section>" +

      '<section class="card booking-item"><h2>' + icon("lock", 16) + "Agreed price</h2>" +
      '<div class="value price-lock">' + money(p.estimate) + "</div>" +
      '<div class="notice notice--success" style="margin:12px 0 0">' + icon("shield", 22) + "<div><p><strong>This price can only change if you approve it.</strong> If " + esc(p.first) + " finds something unexpected, you'll see the reason and the new price in the app, and you decide before any extra work starts.</p></div></div></section>" +

      '<section class="card booking-item"><h2>' + icon("support", 16) + "If something goes wrong</h2>" +
      "<p>After the job you'll get a completion record with photos. If the work isn't right, report it there. EZ Home support will review this written agreement with you and help sort it out, so you aren't left to argue with the provider alone.</p></section>" +

      '<section class="card"><form id="conf-form"><fieldset><legend><h2 style="margin:0 0 4px">Quick question: how confident do you feel about ' + esc(p.first) + " doing this job well?</h2></legend>" +
      '<p class="review__meta">Optional. Pick a number from 1 to 5.</p>' +
      '<div class="rating-scale">' + rating + '</div><div class="rating-ends"><span>1 = not at all</span><span>5 = very confident</span></div>' +
      '<p id="conf-thanks" class="review__meta" role="status" style="margin-top:8px"></p></fieldset></form></section>' +

      '<div class="notice notice--info">' + icon("info", 22) + "<p>That's the booking done. Next, the prototype skips ahead to " + esc(d.long) + ", the day of the job.</p></div>" +
      '<div class="actions"><button type="button" class="btn btn--primary" data-go="arrival">Next: the day of the job ' + icon("forward") + "</button></div>";
  };
  BIND.booked = function () {
    document.querySelectorAll('input[name="conf"]').forEach(function (r) {
      r.addEventListener("change", function () {
        state.confidence = Number(r.value);
        save();
        logAnswer("confidence in provider (1-5)", state.confidence);
        document.getElementById("conf-thanks").textContent = "Thanks, noted.";
      });
    });
  };

  /* 6. Arrival update with one delay notice (FR-6) */
  RENDER.arrival = function () {
    var p = provider(), d = day(state.windowDay);
    var late = delayWindow(state.windowTime);
    return '<div class="narrow">' + topBar("arrival") +
      timeBanner(d.long + ", just before your arrival window", "Skipped ahead to the day of the job") +
      "<h1>" + esc(p.first) + " is 15 minutes away</h1>" +
      '<div class="card"><div class="status-now"><div class="avatar" aria-hidden="true">' + p.initials + "</div><div>" +
      '<div class="big-number">On the way</div><div>New arrival window: <strong>' + esc(late) + "</strong> (10 minutes later than booked)</div></div></div></div>" +

      '<div class="card"><h2>Updates today</h2><ol class="timeline">' +
      '<li class="is-latest"><time>Just now</time><strong>' + esc(p.first) + " is on the way, about 15 minutes out.</strong></li>" +
      '<li class="is-delay"><time>40 minutes ago</time><strong>Running 10 minutes late. New window: ' + esc(late) + ".</strong>" + esc(p.first) + "'s earlier job ran over. You don't need to do anything.</li>" +
      "<li><time>This morning</time><strong>Reminder: " + esc(p.first) + " arrives " + esc(state.windowTime) + " today.</strong>Please clear the wall and have the shelves and brackets ready.</li>" +
      "<li><time>When you booked</time><strong>Booking confirmed (" + EZ.bookingRef + ").</strong>Agreed price " + money(p.estimate) + ".</li>" +
      "</ol></div>" +
      '<div class="actions"><button type="button" class="btn btn--primary" data-go="change">Next: ' + esc(p.first) + " arrives and starts work " + icon("forward") + "</button></div></div>";
  };

  /* 7. Change request mid-job (FR-7) */
  RENDER.change = function () {
    var p = provider(), c = EZ.change;
    var decided = state.changeDecision;
    var newTotal = p.estimate + c.amount;

    var table = '<table class="price-compare"><caption class="visually-hidden">Original estimate compared with requested change</caption><tbody>' +
      '<tr><th scope="row">Original agreed estimate</th><td>' + money(p.estimate) + "</td></tr>" +
      '<tr class="is-change"><th scope="row">Requested change: ' + esc(c.title.toLowerCase()) + "</th><td>+" + money(c.amount) + "</td></tr>" +
      "</tbody><tfoot><tr><th scope=\"row\">New total if you approve</th><td>" + money(newTotal) + "</td></tr></tfoot></table>";

    var decisionArea;
    if (!decided) {
      decisionArea = '<h2>What happens next</h2><div class="outcomes">' +
        '<div class="outcome"><h3>If you approve</h3><p>' + esc(c.ifApproved) + "</p></div>" +
        '<div class="outcome"><h3>If you decline</h3><p>' + esc(c.ifDeclined) + "</p></div></div>" +
        '<div class="actions"><button type="button" class="btn btn--primary" data-decide="approved">Approve +' + money(c.amount) + " (new total " + money(newTotal) + ')</button>' +
        '<button type="button" class="btn btn--secondary" data-decide="declined">Decline, keep ' + money(p.estimate) + "</button></div>";
    } else {
      var approved = decided === "approved";
      decisionArea = '<div class="notice ' + (approved ? "notice--success" : "notice--info") + '" role="status">' + icon(approved ? "check" : "info", 22) + "<div>" +
        "<p><strong>You " + (approved ? "approved" : "declined") + " the change.</strong> " + esc(approved ? c.ifApproved : c.ifDeclined) + "</p>" +
        "<p>This decision is saved to your job record next to the original estimate.</p>" +
        '<p><button type="button" class="btn btn--link" id="undo">Change my answer</button></p></div></div>' +
        '<div class="actions"><button type="button" class="btn btn--primary" data-go="complete">Next: ' + esc(p.first) + " finishes the job " + icon("forward") + "</button></div>";
    }

    return '<div class="narrow">' + topBar("change") +
      timeBanner(day(state.windowDay).long + ", about 30 minutes into the job", "The work is in progress") +
      "<h1>" + esc(p.first) + " is asking to change the job</h1>" +
      '<p class="lead">' + esc(p.first) + " has paused this part of the work and won't add anything to your bill unless you approve it.</p>" +
      '<div class="card"><div class="provider__label">' + icon("support", 16) + "Message from " + esc(p.first) + "</div>" +
      "<p>“" + esc(c.reason) + "”</p>" + table + decisionArea + "</div></div>";
  };
  BIND.change = function () {
    app.querySelectorAll("[data-decide]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.changeDecision = b.getAttribute("data-decide");
        save();
        logAnswer("change request", state.changeDecision);
        render();
      });
    });
    var undo = document.getElementById("undo");
    if (undo) undo.addEventListener("click", function () { state.changeDecision = null; save(); render(); });
  };

  /* 8. Completion record (FR-8, FR-9, FR-11) */
  RENDER.complete = function () {
    var p = provider(), c = EZ.change;
    var approved = state.changeDecision === "approved";
    var total = finalPrice();
    var diff = total - p.estimate;
    var d = day(state.windowDay);

    var workDone = EZ.scope.done.slice();
    if (approved) workDone.splice(2, 0, "Added 2 heavy-duty anchors to center the middle shelf (you approved this)");
    else workDone.splice(2, 0, "Mounted the middle shelf on the stud, about 3 inches left of center (you declined extra anchors)");

    var priceRows = '<tr><th scope="row">Original agreed estimate</th><td>' + money(p.estimate) + "</td></tr>" +
      (approved
        ? '<tr class="is-change"><th scope="row">Change you approved: ' + esc(c.title.toLowerCase()) + "</th><td>+" + money(c.amount) + "</td></tr>"
        : '<tr class="is-struck"><th scope="row">Change you declined: ' + esc(c.title.toLowerCase()) + "</th><td>+" + money(c.amount) + "</td></tr>");

    var flag = diff > 0
      ? '<div class="notice notice--warning">' + icon("alert", 22) + "<p>The final price is <strong>" + money(diff) + " more</strong> than the original estimate, because of the change you approved during the job. No other charges were added.</p></div>"
      : '<div class="notice notice--success">' + icon("check", 22) + "<p>The final price <strong>matches the original estimate</strong>. No extra charges were added.</p></div>";

    return '<div class="narrow">' + topBar("complete") +
      timeBanner(d.long + ", later that day", p.first + " has finished and left") +
      "<h1>Check the finished job</h1>" +
      '<p class="lead">' + esc(p.first) + " sent this record of the work. Look it over, then confirm the job is complete or report a problem.</p>" +

      '<section class="card"><h2>Photos of the finished work</h2><div class="photos">' +
      '<figure><img src="images/after-1.svg" alt="Three floating shelves mounted one above another on a light wall, holding books and a plant." width="400" height="300"><figcaption>All three shelves, mounted</figcaption></figure>' +
      '<figure><img src="images/after-2.svg" alt="Close-up of a spirit level resting on a shelf, bubble centered." width="400" height="300"><figcaption>Level check on each shelf</figcaption></figure>' +
      '<figure><img src="images/after-3.svg" alt="Clean floor under the shelves with no dust or packaging left." width="400" height="300"><figcaption>Area cleaned up</figcaption></figure>' +
      "</div></section>" +

      '<section class="card"><h2>Work done</h2><ul class="check-list">' +
      workDone.map(function (s) { return "<li>" + icon("check") + "<span>" + esc(s) + "</span></li>"; }).join("") +
      '</ul><p class="review__meta" style="margin-top:12px">On site for 1 hour 50 minutes.</p></section>' +

      '<section class="card"><h2>Final price</h2><table class="price-compare"><caption class="visually-hidden">Final price compared with the estimate</caption><tbody>' + priceRows +
      '</tbody><tfoot><tr><th scope="row">Final price to pay ' + esc(p.first) + "</th><td>" + money(total) + "</td></tr></tfoot></table>" + flag + "</section>" +

      '<div class="notice notice--info">' + icon("clock", 22) + "<p>You have <strong>48 hours</strong> to confirm or report a problem. If you don't respond, the job is marked complete automatically.</p></div>" +
      '<div class="actions"><button type="button" class="btn btn--primary" id="confirm-job">' + icon("check") + "Confirm job complete</button>" +
      '<button type="button" class="btn btn--danger" data-go="report">' + icon("alert") + "Report a problem</button></div></div>";
  };
  BIND.complete = function () {
    document.getElementById("confirm-job").addEventListener("click", function () {
      state.outcome = "confirmed";
      state.report = null;
      save();
      logAnswer("completion", "confirmed");
      go("done");
    });
  };

  /* 9. Report a problem (FR-10, US-10) */
  RENDER.report = function () {
    var p = provider();
    var reasons = ["Work isn't finished", "Work isn't done well", "Something was damaged", "Price is different from what we agreed", "Something else"];
    return '<div class="narrow">' + topBar("report") +
      "<h1>Report a problem with this job</h1>" +
      '<p class="lead">Your report goes to the <strong>EZ Home support team</strong>, not just to ' + esc(p.first) + ". They'll look at what was agreed and what was done, then help resolve it.</p>" +
      '<div id="errors"></div>' +
      '<form id="report-form" novalidate>' +
      '<fieldset class="field" id="field-reason"><legend>What went wrong? <span class="req">(required)</span></legend><div class="choices choices--list">' +
      reasons.map(function (r) { return '<label class="choice"><input type="radio" name="reason" value="' + esc(r) + '"><span>' + esc(r) + "</span></label>"; }).join("") +
      '</div><p class="field-error">Choose what went wrong.</p></fieldset>' +
      field("details", "Tell us what happened", "For example: which shelf, what you expected, and what you see now.",
        '<textarea id="details" name="details" rows="4"></textarea>', "Tell us what happened so support can help.") +
      '<div class="field"><label for="photos">Add photos <span class="req">(optional)</span></label>' +
      '<span class="hint">Photos stay on your device in this prototype.</span><input type="file" id="photos" accept="image/*" multiple></div>' +

      '<div class="card card--flat"><h2>Support automatically gets your full job record</h2><p>You don\'t need to explain the background. Support will see:</p><ul class="sent-list">' +
      ["The written scope you agreed to on booking", "The original estimate of " + money(p.estimate),
        "The change request and your answer (" + (state.changeDecision === "approved" ? "approved +" + money(EZ.change.amount) : "declined") + ")",
        "All messages and arrival updates", "The completion record and " + p.first + "'s photos"]
        .map(function (s) { return "<li>" + icon("check") + "<span>" + esc(s) + "</span></li>"; }).join("") +
      "</ul></div>" +
      '<div class="actions"><button type="submit" class="btn btn--primary">Send report to EZ Home support</button>' +
      '<button type="button" class="btn btn--secondary" data-go="complete">Cancel</button></div></form></div>';
  };
  BIND.report = function () {
    var form = document.getElementById("report-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.querySelectorAll(".has-error").forEach(function (f) { f.classList.remove("has-error"); });
      var reason = form.querySelector('input[name="reason"]:checked');
      var details = form.details.value.trim();
      var firstBad = null;
      if (!reason) { document.getElementById("field-reason").classList.add("has-error"); firstBad = firstBad || form.querySelector('input[name="reason"]'); }
      if (!details) { document.getElementById("field-details").classList.add("has-error"); firstBad = firstBad || form.details; }
      if (firstBad) { firstBad.focus(); return; }
      state.outcome = "reported";
      state.report = { reason: reason.value, details: details };
      save();
      logAnswer("problem reported", state.report);
      go("done");
    });
  };

  /* 10. End screen */
  RENDER.done = function () {
    var p = provider();
    var reported = state.outcome === "reported";
    var options = ["Experience with this exact kind of job", "Reviews from similar jobs", "The price", "When they were available", "Something else"];

    var head = reported
      ? "<h1>Report sent to EZ Home support</h1>" +
        '<p class="ref">Case ' + EZ.caseRef + ". The job stays open until this is resolved.</p>" +
        '<div class="card"><h2>What happens next</h2><ol class="steps-next">' +
        "<li>A support specialist reviews your job record and your report within 1 business day.</li>" +
        "<li>They contact you and " + esc(p.first) + " to agree on a fix: a free return visit, a lower price, or another fix.</li>" +
        "<li>The job closes only once you're satisfied or support has made a decision.</li></ol></div>"
      : "<h1>Job complete. Thanks!</h1>" +
        '<p class="ref">Booking ' + EZ.bookingRef + " is closed. The final price was " + money(finalPrice()) + ", paid directly to " + esc(p.first) + ".</p>" +
        '<div class="card"><p>Your written agreement, any changes you approved, and the completion record with photos are saved with this booking.</p></div>';

    return '<div class="narrow">' + topBar("done") +
      '<div class="confirm-hero"><div class="check-circle">' + icon("check", 30) + "</div>" + head + "</div>" +
      '<section class="card"><form id="why-form"><fieldset class="field" style="margin-bottom:0"><legend><h2 style="margin:0 0 4px">One last question: what mattered most when you chose ' + esc(p.first) + "?</h2></legend>" +
      '<p class="review__meta">Optional. Pick one.</p><div class="choices choices--list">' +
      options.map(function (o) { return '<label class="choice"><input type="radio" name="why" value="' + esc(o) + '"><span>' + esc(o) + "</span></label>"; }).join("") +
      '</div><p id="why-thanks" class="review__meta" role="status" style="margin-top:8px"></p></fieldset></form></section>' +
      '<p>That\'s the end of the prototype. Thank you for testing it.</p>' +
      '<div class="actions"><button type="button" class="btn btn--secondary" id="again">Start over</button></div></div>';
  };
  BIND.done = function () {
    document.querySelectorAll('input[name="why"]').forEach(function (r) {
      r.addEventListener("change", function () {
        logAnswer("detail that mattered most", r.value);
        document.getElementById("why-thanks").textContent = "Thanks, noted.";
      });
    });
    document.getElementById("again").addEventListener("click", function () {
      document.getElementById("restart").click();
    });
  };

  render();
})();
