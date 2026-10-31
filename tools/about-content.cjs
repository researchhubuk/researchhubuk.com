const fs = require('node:fs');

// The exported document is content only; its annotations do not control tools.
function buildAboutContent() {
 const original = fs.readFileSync('content/about-original.html', 'utf8');
 const body = original.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)[1];
 const cleanInline = html => html.replace(/<span\b([^>]*)>/g, (_, attrs) => /class="[^"]*\bc9\b/.test(attrs) ? '<span class="document-bold">' : '<span>');
 const plain = html => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
 const blocks = [...body.matchAll(/<(h[1-6]|p|ul)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(m => ({tag:m[1], attrs:m[2], html:m[3]}));
 const metadata = {};
 const sections = [];
 let current;
 const start = (heading, hero = false) => {
  current = {heading, hero, intro:[], cards:[], actions:[]};
  sections.push(current);
 };
 for (const block of blocks) {
  const text = plain(block.html);
  if (!text || /^=+$/.test(text)) continue;
  if (text.startsWith('Meta Title:')) { metadata.title = text.replace(/^Meta Title:\s*/, ''); continue; }
  if (text.startsWith('Meta Description:')) { metadata.description = text.replace(/^Meta Description:\s*/, ''); continue; }
  if (text.startsWith('Button:')) {
   const parts = block.html.split(/<br\s*\/?\s*>/);
   const label = plain(parts[0]).replace(/^Button:\s*/, '');
   const target = label === 'Learn About Our Support' ? '#our-mission' : label === 'Explore Our Services' ? './#services' : 'contact-us';
   current.actions.push(`<a class="btn btn-primary" href="${target}">${label}<span aria-hidden="true">↗</span></a>`);
   if (text.includes('Our Service Areas')) start('<h2>Our Service Areas</h2>');
   continue;
  }
  if (block.tag === 'h1' || block.tag === 'h2' || text === 'Our Core Strengths') {
   const tag = text === 'Our Core Strengths' ? 'h2' : block.tag;
   const id = text === 'Our Mission' ? 'our-mission' : (block.attrs.match(/id="([^"]+)"/) || [])[1];
   start(`<${tag}${id ? ` id="${id}"` : ''}>${cleanInline(block.html)}</${tag}>`, tag === 'h1');
   continue;
  }
  if (!current) throw new Error('Document content precedes its heading');
  if (block.tag === 'h3') {
   current.cards.push(`<article class="document-card"><h3${block.attrs.match(/id="[^"]+"/) ? ' '+block.attrs.match(/id="[^"]+"/)[0] : ''}>${cleanInline(block.html)}</h3>`);
  } else {
   const html = block.tag === 'ul'
    ? '<ul class="document-locations">'+cleanInline(block.html).replace(/\sclass="(?!document-bold)[^"]*"/g, '')+'</ul>'
    : `<p>${cleanInline(block.html)}</p>`;
   if(current.cards.length) current.cards[current.cards.length - 1] += html;
   else current.intro.push(html);
  }
 }
 const html = sections.map((s, i) => {
  if (plain(s.heading) === 'Our Vision') return '';
  if (plain(s.heading) === 'Our Mission') {
   const vision = sections.find(section => plain(section.heading) === 'Our Vision');
   return `<section class="section document-section purpose-section"><div class="container purpose-grid">${[s, vision].map((item, index) => `<article class="purpose-card purpose-card-${index === 0 ? 'mission' : 'vision'}">${item.heading}<div class="purpose-copy">${item.intro.join('')}</div></article>`).join('')}</div></section>`;
  }
  const why = plain(s.heading) === 'Why Choose Research Hub UK?';
  const faq = plain(s.heading) === 'FAQs About Research Hub UK';
  const strengths = plain(s.heading) === 'Our Core Strengths';
  const services = plain(s.heading) === 'Our Services';
  if (plain(s.heading) === 'Our Service Areas') {
   return `<section id="service-areas" class="section document-section"><div class="container"><div class="section-heading"><span class="eyebrow" aria-hidden="true">${String(i+1).padStart(2,'0')} / RESEARCH HUB UK</span>${s.heading}</div><div class="document-intro">${s.intro.join('')}</div></div></section>`;
  }
  let cards = '';
  if (faq) {
   cards = `<div class="faq-list document-faq-list">${s.cards.map(card => {
    const heading = card.match(/<h3\b[^>]*>[\s\S]*?<\/h3>/)[0];
    const answer = card.slice(card.indexOf('</h3>') + 5);
    return `<details><summary>${heading}</summary>${answer}</details>`;
   }).join('')}</div>`;
  } else if (services) {
   const images = [
    ['assignment-help.webp', 'Student writing assignment notes beside an open textbook'],
    ['dissertation-writing.webp', 'Student drafting a dissertation beside a laptop and reference book'],
    ['research-proposal.webp', 'Student preparing research notes beside a reference book'],
    ['proofreading.webp', 'Red pen resting on a document with proofreading corrections'],
    ['btec-assignment-help.webp', 'Student working on a qualification assignment with books and notes'],
    ['phd-thesis.webp', 'Handwritten research notes beside a reference book'],
   ];
   cards = `<div class="service-grid">${s.cards.map((card, index) => {
    const [file, alt] = images[index];
    return card.replace('<article class="document-card">', `<a class="service-card" href="contact-us"><img class="service-image" src="assets/img/service/${file}" alt="${alt}" width="300" height="150" loading="lazy">`) + '<span class="arrow" aria-hidden="true">↗</span></a>';
   }).join('')}</div>`;
  } else if (s.cards.length) {
   cards = `<div class="${why || strengths ? 'card-grid' : 'document-cards'}">${s.cards.map((card, index) => {
    if (why || strengths) return card.replace('<article class="document-card">', `<article class="content-card"><span class="card-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>`) + '</article>';
    return card.replace('class="document-card"', 'class="document-card content-card"') + '</article>';
   }).join('')}</div>`;
  }
  return `<section${why ? ' id="why-us"' : faq ? ' id="faqs"' : strengths ? ' id="levels"' : services ? ' id="about-services"' : ''} class="section document-section${why ? ' dark-section' : ''}${s.hero ? ' page-intro document-hero' : ''}"><div class="container">${s.hero ? '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a><span aria-hidden="true">/</span><span>About Us</span></nav>' : ''}<div class="${why || faq || strengths || services ? 'section-heading' : 'document-heading'}"><span class="eyebrow" aria-hidden="true">${String(i+1).padStart(2,'0')} / RESEARCH HUB UK</span>${s.heading}</div><div class="document-intro">${s.intro.join('')}</div>${cards}${s.actions.length ? `<div class="page-actions">${s.actions.join('')}</div>` : ''}</div></section>`;
 }).join('\n');
 return {html, ...metadata};
}
module.exports = buildAboutContent;
