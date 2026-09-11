(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-product-slideshow]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.product-slide')];
    const controls = carousel.querySelector('.slideshow-controls');
    const toggle = carousel.querySelector('[data-slide-toggle]');
    const count = carousel.querySelector('[data-slide-count]');
    let current = 0;
    let paused = reduceMotion.matches;
    let visible = false;
    let ready = false;
    let loading = false;
    let timer;
    controls.hidden = false;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      count.textContent = `${current + 1} / ${slides.length} · ${slides[current].dataset.slideLabel}`;
    }
    function sync() {
      clearInterval(timer);
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${carousel.getAttribute('aria-label')}`);
      if (ready && visible && !paused && !document.hidden) {
        timer = setInterval(() => {
          if (!document.querySelector('.media-dialog[open]') && !carousel.querySelector('.product-slides:focus-within')) show(current + 1);
        }, 2000);
      }
    }
    async function prepare() {
      if (loading) return;
      loading = true;
      await Promise.allSettled(slides.map(slide => {
        const img = slide.querySelector('img');
        img.loading = 'eager';
        return img.decode();
      }));
      ready = true;
      sync();
    }
    toggle.addEventListener('click', () => { paused = !paused; sync(); });
    carousel.querySelector('[data-slide-prev]').addEventListener('click', () => { paused = true; show(current - 1); sync(); });
    carousel.querySelector('[data-slide-next]').addEventListener('click', () => { paused = true; show(current + 1); sync(); });
    document.addEventListener('visibilitychange', sync);
    reduceMotion.addEventListener('change', () => { paused = reduceMotion.matches; sync(); });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) prepare();
        sync();
      }, { threshold: 0.1 });
      observer.observe(carousel);
    } else {
      visible = true;
      prepare();
    }
    sync();
  });
  const loops = [...document.querySelectorAll('[data-loop-demo]')];
  loops.forEach(video => {
    video.muted = true;
    if (reduceMotion.matches) {
      video.autoplay = false;
      video.pause();
    }
  });
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { threshold: 0.15 });
    loops.forEach(video => visibility.observe(video));
  }
  const links = [...document.querySelectorAll('[data-gallery]')];
  const dialog = document.querySelector('.media-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const picture = document.querySelector('#lightbox-image');
  const caption = document.querySelector('#lightbox-caption');
  const counter = document.querySelector('#lightbox-count');
  const original = document.querySelector('#lightbox-original');
  let current = 0;
  let trigger;
  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    picture.src = link.href;
    picture.alt = link.querySelector('img').alt;
    caption.textContent = `${link.dataset.title} — ${picture.alt}`;
    counter.textContent = `${current + 1} / ${links.length}`;
    original.href = link.href;
  }
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    trigger = link;
    show(index);
    dialog.showModal();
    document.body.classList.add('viewer-open');
  }));
  document.querySelector('#lightbox-close').addEventListener('click', () => dialog.close());
  document.querySelector('#lightbox-prev').addEventListener('click', () => show(current - 1));
  document.querySelector('#lightbox-next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    picture.removeAttribute('src');
    if (trigger) trigger.focus();
  });
})();
