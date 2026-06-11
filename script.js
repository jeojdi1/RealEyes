/* ============================================================
   RealEyes — interaction layer
   ============================================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r=document) => r.querySelector(s);

  // ----------------------------------------------------------
  // Phase 1: Terminal boot typing
  // ----------------------------------------------------------
  const bootLog = $('#bootLog');
  const BOOT_LINES = [
    'realeyes//opt v1.0.4  (c) RealEyes Optical Systems',
    '',
    '[ 0.041s ] kernel boot ........................ ok',
    '[ 0.118s ] optic calibration .................. ok',
    '[ 0.204s ] neural link ............... synchronised',
    '[ 0.396s ] channel encryption ............. aes-256',
    '[ 0.612s ] biometric mesh .................... 192z',
    '[ 0.844s ] uplink ......................... stable',
    '[ 1.002s ] subject acquisition .............. ready',
    '',
    '> launching feed_'
  ];

  function typeBoot() {
    if (!bootLog) return;
    if (reduceMotion) { bootLog.textContent = BOOT_LINES.join('\n'); return; }
    let li = 0, ci = 0, out = '';
    const tick = () => {
      if (li >= BOOT_LINES.length) return;
      const line = BOOT_LINES[li];
      if (ci < line.length) {
        out += line[ci++];
        bootLog.textContent = out;
        // typing speed varies a little for realism
        const c = line[ci - 1];
        const delay = c === ' ' || c === '.' ? 6 : 14;
        setTimeout(tick, delay);
      } else {
        out += '\n';
        bootLog.textContent = out;
        li++; ci = 0;
        setTimeout(tick, line === '' ? 60 : 120);
      }
    };
    tick();
  }
  typeBoot();

  // ----------------------------------------------------------
  // Phase 2: Live readouts (start after boot fades — ~2.6s)
  // ----------------------------------------------------------
  const subject = $('#subject');
  const sig = $('#sig');
  const dist = $('#dist');
  const bpm = $('#bpm');
  const pupil = $('#pupil');
  const gsr = $('#gsr');
  const loyaltyNum = $('#loyaltyNum');
  const loyaltyFill = $('#loyaltyFill');
  const loyaltyState = $('#loyaltyState');
  const batt = $('#batt');
  const threat = $('#threat');
  const glitch = $('#glitch');
  const traits = $('#traits');
  const lensMotion = $('#lensMotion');
  const feed = document.querySelector('.feed');
  const timecodeEl = $('#timecode');
  const frameEl = $('#frame');
  const geoLat = $('#geoLat');
  const geoLon = $('#geoLon');

  const STATES = [
    { min: 80, label: 'TRUSTED',     color: '#0EA5E9' },
    { min: 55, label: 'AMBIGUOUS',   color: '#38BDF8' },
    { min: 30, label: 'COMPROMISED', color: '#F59E0B' },
    { min: 0,  label: 'HOSTILE',     color: '#DC2626' },
  ];
  const stateFor = (v) => STATES.find(s => v >= s.min) || STATES[STATES.length - 1];

  // Timecode + frame counter (00:00:00:00 hh:mm:ss:ff @ 30fps feel)
  let frameTick = 0;
  function startClock() {
    if (reduceMotion) {
      if (timecodeEl) timecodeEl.textContent = '00:01:24:12';
      if (frameEl) frameEl.textContent = '002532';
      return;
    }
    setInterval(() => {
      frameTick++;
      const totalFrames = frameTick;
      const ff = String(totalFrames % 30).padStart(2, '0');
      const s  = Math.floor(totalFrames / 30);
      const ss = String(s % 60).padStart(2, '0');
      const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
      const hh = String(Math.floor(s / 3600) % 60).padStart(2, '0');
      if (timecodeEl) timecodeEl.textContent = `${hh}:${mm}:${ss}:${ff}`;
      if (frameEl) frameEl.textContent = String(totalFrames).padStart(6, '0');
    }, 1000 / 30);
  }

  // Coordinate jitter
  function startGeoJitter() {
    if (reduceMotion) return;
    const baseLat = 34.0522, baseLon = -118.2437;
    setInterval(() => {
      const lat = (baseLat + (Math.random() - .5) * 0.0006).toFixed(4);
      const lon = (Math.abs(baseLon) + (Math.random() - .5) * 0.0006).toFixed(4);
      if (geoLat) geoLat.textContent = lat + '°N';
      if (geoLon) geoLon.textContent = lon + '°W';
    }, 600);
  }

  // Battery drift
  function startBatt() {
    if (reduceMotion) return;
    let b = 96;
    setInterval(() => {
      b = Math.max(72, b - (Math.random() < 0.3 ? 1 : 0));
      if (batt) batt.textContent = b + '%';
    }, 5000);
  }

  // The dramatic loyalty drop sequence
  const SUBJECT_FRAMES = ['— · —', 'SCANNING…', 'SCANNING…', 'A. KARIMI', 'A. KARIMI'];

  function runLoyaltySequence() {
    if (reduceMotion) {
      if (subject) subject.textContent = 'A. KARIMI';
      if (sig) sig.textContent = 'LOCKED';
      if (dist) dist.textContent = '2.4 m';
      if (bpm) bpm.textContent = '118';
      if (pupil) pupil.textContent = '0.42mm';
      if (gsr) gsr.textContent = '4.8 µS';
      if (loyaltyNum) loyaltyNum.textContent = '19';
      if (loyaltyFill) loyaltyFill.style.width = '19%';
      if (loyaltyState) { loyaltyState.textContent = 'HOSTILE'; loyaltyState.style.color = '#DC2626'; }
      return;
    }

    // Subject acquisition flicker
    let i = 0;
    const subjInt = setInterval(() => {
      if (subject) subject.textContent = SUBJECT_FRAMES[i];
      if (++i >= SUBJECT_FRAMES.length) clearInterval(subjInt);
    }, 280);

    setTimeout(() => {
      if (sig) { sig.textContent = 'LOCKED'; sig.style.color = '#0EA5E9'; }
      if (dist) dist.textContent = '2.4 m';
    }, 1300);

    // Loyalty 87 → 19 over ~4s, BPM 72 → 134, pupil 0.04 → 0.62, GSR 0.4 → 5.1
    const start = performance.now();
    const duration = 4200;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const loyalty = Math.round(87 + (19 - 87) * eased);
      const bpmVal = Math.round(72 + (134 - 72) * eased + (Math.random() - .5) * 2);
      const pupilVal = (0.04 + (0.62 - 0.04) * eased).toFixed(2);
      const gsrVal = (0.4 + (5.1 - 0.4) * eased).toFixed(1);

      if (loyaltyNum) loyaltyNum.textContent = String(loyalty);
      if (loyaltyFill) loyaltyFill.style.width = loyalty + '%';
      const st = stateFor(loyalty);
      if (loyaltyState) { loyaltyState.textContent = st.label; loyaltyState.style.color = st.color; }
      if (loyaltyFill) loyaltyFill.style.background = `linear-gradient(90deg, ${st.color}, #7DD3FC)`;

      if (bpm) bpm.textContent = String(bpmVal);
      if (pupil) pupil.textContent = pupilVal + 'mm';
      if (gsr) gsr.textContent = gsrVal + ' µS';

      if (t < 1) requestAnimationFrame(tick);
      else {
        if (threat) { threat.classList.add('is-on'); setTimeout(() => threat.classList.remove('is-on'), 1600); }
        if (glitch) { glitch.classList.add('is-on'); setTimeout(() => glitch.classList.remove('is-on'), 800); }
        if (traits) {
          traits.classList.add('is-on');
          setTimeout(() => traits.classList.remove('is-on'), 4200);
        }
      }
    }
    requestAnimationFrame(tick);
  }

  // Kick off the readout layer once boot phase fades (~2.6s)
  setTimeout(() => { startClock(); startGeoJitter(); startBatt(); }, reduceMotion ? 0 : 2600);

  // The lens search animation ends ~8.3s (2.7s delay + 5.6s duration).
  // On animationend → flash red borders, then run loyalty + threat + traits.
  function onLockArrival() {
    if (feed) feed.classList.add('is-locked');
    // brief delay so the red flash registers before threat/traits
    setTimeout(runLoyaltySequence, 280);
  }

  if (lensMotion && !reduceMotion) {
    lensMotion.addEventListener('animationend', (e) => {
      if (e.animationName === 'lensSearch') onLockArrival();
    }, { once: false });

    // Loop the dramatic sequence every 22s after lock
    setTimeout(() => {
      setInterval(runLoyaltySequence, 22000);
    }, 10000);
  } else if (reduceMotion) {
    // Reduced motion: skip the show, just show final state
    if (feed) feed.classList.add('is-locked');
    runLoyaltySequence();
  }

  // ----------------------------------------------------------
  // Reveal-on-scroll
  // ----------------------------------------------------------
  const revealTargets = document.querySelectorAll(
    '.section-tag, .section-title, .section-sub, ' +
    '.protocol__step, .purpose__grid li, .purpose__quote, ' +
    '.specs__grid, .cta__copy, .cta__form, ' +
    '.manifesto__line, .footage__frame'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = (i % 3) * 80 + 'ms';
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => revealIO.observe(el));

  // ----------------------------------------------------------
  // Dissection: horizontal exploded view driven by scroll
  // ----------------------------------------------------------
  const stage = $('#dissectStage');
  const stack = $('#stack');
  const layers = document.querySelectorAll('.layer');
  const progressLabel = document.querySelector('.stack__progress-label');

  if (stage && stack && layers.length) {
    const N = layers.length;

    // Mark stack as spread when section enters viewport
    const spreadIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) stack.classList.add('is-spread');
        else stack.classList.remove('is-spread');
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    spreadIO.observe(stage);

    function update() {
      const rect = stage.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;

      stack.style.setProperty('--p', progress.toFixed(3));

      // Active layer based on scroll progress
      const idx = Math.min(N - 1, Math.max(0, Math.floor(progress * N * 0.999)));
      layers.forEach((l, i) => l.classList.toggle('is-active', i === idx));

      if (progressLabel) {
        progressLabel.textContent = String(idx + 1).padStart(2, '0') + ' / 05';
      }

      // Subtle parallax rotation of the whole rail based on progress
      const rail = stack.querySelector('.stack__rail');
      if (rail) {
        const ry = -18 + (progress - 0.5) * 10;   // -23 → -13deg
        const rx = 8 - progress * 4;              // 8 → 4deg
        rail.style.transform = `rotateY(${ry}deg) rotateX(${rx}deg)`;
      }
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  // ----------------------------------------------------------
  // Footage: REC timer when video plays
  // ----------------------------------------------------------
  const video = document.querySelector('.footage__video');
  const recChip = Array.from(document.querySelectorAll('.footage__chip')).find(el => /REC/.test(el.textContent));
  if (video && recChip) {
    const baseText = recChip.textContent;
    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      const mm = String(Math.floor(t / 60)).padStart(2, '0');
      const ss = String(Math.floor(t % 60)).padStart(2, '0');
      recChip.textContent = `REC · ${mm}:${ss}`;
    });
    video.addEventListener('ended', () => { recChip.textContent = baseText; });
  }

  // ----------------------------------------------------------
  // Smooth anchor scroll with sticky nav offset
  // ----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - 60;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

})();
