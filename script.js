/* The page is readable without JavaScript; this file adds progressive motion. */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('.motion-toggle');
  let paused = reducedMotion.matches;
  let motionOverride = false;
  let drawSphere = () => {};

  function updateMotion() {
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Play animations' : 'Pause animations');
    motionButton.querySelector('.motion-label').textContent = paused ? 'Play motion' : 'Pause motion';
    drawSphere();
  }
  motionButton.addEventListener('click', () => {
    motionOverride = true;
    paused = !paused;
    updateMotion();
  });
  reducedMotion.addEventListener('change', () => {
    if (!motionOverride) { paused = reducedMotion.matches; updateMotion(); }
  });
  updateMotion();

  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.inert = !open;
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false); menuButton.focus();
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  // Small geometric fields are decorative, never live monetary data.
  for (const [selector, count] of [['.supply-grid', 256], ['.matrix-grid', 36]]) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const cell = document.createElement('i');
      cell.style.setProperty('--delay', `${-((i * 17) % 59) / 10}s`);
      fragment.append(cell);
    }
    document.querySelector(selector).append(fragment);
  }

  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
    document.querySelectorAll('.reveal').forEach(item => reveals.observe(item));
    root.classList.add('js-ready');
  }

  const visual = document.querySelector('.principle-visual');
  const chapters = [...document.querySelectorAll('.chapter')];
  const stageDetails = {
    scarce: ['01 / 03', 'SCARCITY IS A RULE, NOT A PROMISE.'],
    earned: ['02 / 03', 'HARD TO PRODUCE. SIMPLE TO CHECK.'],
    yours: ['03 / 03', 'DIRECT OWNERSHIP STARTS WITH KEYS.']
  };
  // On small screens each chapter gets its own full-width illustration.
  for (const chapter of chapters) {
    const illustration = document.createElement('div');
    illustration.className = 'mobile-illustration';
    illustration.setAttribute('aria-hidden', 'true');
    const sourceClass = { scarce: '.scarcity-art', earned: '.earned-art', yours: '.ownership-art' };
    const panel = visual.querySelector(sourceClass[chapter.dataset.visual]).cloneNode(true);
    const gradient = panel.querySelector('#flow');
    if (gradient) {
      gradient.id = 'mobile-flow';
      panel.querySelector('.flow-pulse').setAttribute('stroke', 'url(#mobile-flow)');
    }
    illustration.append(panel);
    const caption = document.createElement('div');
    caption.className = 'visual-bottomline';
    caption.textContent = stageDetails[chapter.dataset.visual][1];
    illustration.append(caption);
    chapter.prepend(illustration);
  }
  let scrollQueued = false;
  function updateScroll() {
    const maxScroll = root.scrollHeight - window.innerHeight;
    document.querySelector('.scroll-progress').style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
    let closest = chapters[0];
    let distance = Infinity;
    for (const chapter of chapters) {
      const bounds = chapter.getBoundingClientRect();
      const delta = Math.abs(bounds.top + bounds.height / 2 - window.innerHeight / 2);
      if (delta < distance) { closest = chapter; distance = delta; }
    }
    const stage = closest.dataset.visual;
    if (visual.dataset.stage !== stage) {
      visual.dataset.stage = stage;
      visual.querySelector('.visual-count').textContent = stageDetails[stage][0];
      visual.querySelector('.visual-caption').textContent = stageDetails[stage][1];
    }
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const canvas = document.querySelector('#hero-canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  let width = 600;
  let rotation = 0.35;
  let lastTime = 0;
  let frameId = null;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  const points = [];
  const latitudeCount = 27;
  const longitudeCount = 50;
  for (let lat = 1; lat < latitudeCount; lat++) {
    const phi = Math.PI * lat / latitudeCount;
    for (let lon = 0; lon < longitudeCount; lon++) {
      const theta = Math.PI * 2 * lon / longitudeCount;
      points.push({ x: Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta), lat, lon });
    }
  }
  function render(time) {
    frameId = null;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    if (!paused) {
      rotation += delta * .085;
      pointerX += (targetX - pointerX) * .04;
      pointerY += (targetY - pointerY) * .04;
    }
    context.clearRect(0, 0, width, width);
    const radius = width * .335;
    const c = Math.cos(rotation + pointerX * .08);
    const s = Math.sin(rotation + pointerX * .08);
    const tilt = -.16 + pointerY * .05;
    const projected = points.map(point => {
      const x = point.x * c - point.z * s;
      const z = point.x * s + point.z * c;
      const y = point.y * Math.cos(tilt) - z * Math.sin(tilt);
      const depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
      return { x: width / 2 + x * radius, y: width / 2 + y * radius, z: depth };
    });
    context.lineWidth = .55;
    for (let i = 0; i < projected.length; i++) {
      const point = projected[i];
      if (point.z < -.15) continue;
      const alpha = .10 + (point.z + .15) * .24;
      context.strokeStyle = `rgba(219,194,142,${alpha})`;
      const nextLon = projected[i - points[i].lon + (points[i].lon + 1) % longitudeCount];
      context.beginPath();
      context.moveTo(point.x, point.y); context.lineTo(nextLon.x, nextLon.y);
      if (i + longitudeCount < projected.length) {
        const nextLat = projected[i + longitudeCount];
        context.moveTo(point.x, point.y); context.lineTo(nextLat.x, nextLat.y);
      }
      context.stroke();
      if ((points[i].lat + points[i].lon) % 3 === 0) {
        context.beginPath();
        context.fillStyle = `rgba(236,215,170,${alpha + .1})`;
        context.arc(point.x, point.y, .7 + point.z * .5, 0, Math.PI * 2);
        context.fill();
      }
    }
    if (!paused && visible && !document.hidden) frameId = requestAnimationFrame(render);
  }
  drawSphere = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    lastTime = 0;
    render(performance.now());
  };
  function resizeCanvas() {
    width = canvas.getBoundingClientRect().width;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(width * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    drawSphere();
  }
  new ResizeObserver(resizeCanvas).observe(canvas);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) drawSphere();
      else if (frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
    }, { rootMargin: '80px' }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
    else if (visible) drawSphere();
  });
  canvas.parentElement.addEventListener('pointermove', event => {
    const bounds = canvas.getBoundingClientRect();
    targetX = (event.clientX - bounds.left) / bounds.width - .5;
    targetY = (event.clientY - bounds.top) / bounds.height - .5;
  }, { passive: true });
  canvas.parentElement.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  resizeCanvas();
})();
