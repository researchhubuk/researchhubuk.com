'use strict';
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click', () => {
  const nav = document.querySelector('#navigation');
  if (!window.bootstrap) return;
  const collapse = bootstrap.Collapse.getOrCreateInstance(nav, {toggle:false});
  if (nav.classList.contains('collapsing')) nav.addEventListener('shown.bs.collapse', () => collapse.hide(), {once:true});
  else if (nav.classList.contains('show')) collapse.hide();
}));
document.querySelector('#brief-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const brief = ['Research Hub UK — Academic Support Requirements', ...['name','email','subject','deadline','brief'].map(key => `${key === 'brief' ? 'Requirements' : key[0].toUpperCase()+key.slice(1)}: ${data.get(key)}`)].join('\n\n');
  const file = new Blob([brief], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'research-hub-requirements.txt'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#form-status').textContent = 'Your requirements file is ready. Send it to the Research Hub UK team through your existing contact channel. Nothing has been submitted online.';
});

// Rotate homepage highlights every six seconds alongside manual navigation.
(() => {
  const slider = document.querySelector('.feature-slider');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.feature-slide')];
  let active = 0;
  function showSlide(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== active;
      slide.classList.toggle('is-active', i === active);
    });
    // Replay the shared illustration entrance on desktop and mobile.
    const artwork = slider.querySelectorAll('.feature-slider-art, .feature-mobile-art');
    artwork.forEach(image => { image.style.animation = 'none'; });
    void slider.offsetWidth;
    artwork.forEach(image => { image.style.removeProperty('animation'); });
  }
  window.setInterval(() => showSlide(active + 1), 6000);
  slider.querySelectorAll('[data-feature-direction]').forEach(button => {
    button.addEventListener('click', () => showSlide(active + Number(button.dataset.featureDirection)));
  });
  slider.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(active + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let touchStart;
  slider.addEventListener('touchstart', event => {
    touchStart = {x:event.changedTouches[0].clientX, y:event.changedTouches[0].clientY};
  }, {passive:true});
  slider.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showSlide(active + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, {passive:true});
})();

// Reserve exactly the space occupied by the mobile announcement and header.
(() => {
  const header = document.querySelector('.site-header');
  const announcement = document.querySelector('.announcement');
  if (!header) return;
  const updateSliderSpace = () => {
    const nav = header.querySelector('.navbar');
    let headerHeight = header.offsetHeight;
    if (nav && window.matchMedia('(max-width: 991px)').matches) {
      const styles = getComputedStyle(nav);
      const brand = nav.querySelector('.brand');
      const toggle = nav.querySelector('.navbar-toggler');
      const rowHeight = Math.max(brand ? brand.offsetHeight : 0, toggle ? toggle.offsetHeight : 0);
      const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const border = header.offsetHeight - header.clientHeight;
      headerHeight = Math.max(parseFloat(styles.minHeight) || 0, rowHeight + padding) + border;
    }
    const occupied = headerHeight + (announcement ? announcement.offsetHeight : 0);
    document.documentElement.style.setProperty('--mobile-top-height', occupied + 'px');
  };
  updateSliderSpace();
  window.addEventListener('resize', updateSliderSpace, {passive:true});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(updateSliderSpace);
    observer.observe(header);
    if (announcement) observer.observe(announcement);
  }
})();
