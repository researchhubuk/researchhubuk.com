'use strict';
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click', () => {
  const nav = document.querySelector('#navigation');
  if (!window.bootstrap) return;
  const collapse = bootstrap.Collapse.getOrCreateInstance(nav, {toggle:false});
  if (nav.classList.contains('collapsing')) nav.addEventListener('shown.bs.collapse', () => collapse.hide(), {once:true});
  else if (nav.classList.contains('show')) collapse.hide();
}));
document.querySelector('#brief-form').addEventListener('submit', event => {
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
