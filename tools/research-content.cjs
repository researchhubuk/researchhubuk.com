const fs = require('node:fs');
const path = require('node:path');

module.exports = () => {
 const source = fs.readFileSync(path.join(__dirname, '../content/research-original.html'), 'utf8');
 const plain = html => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
 const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => plain(m[1]));
 const title = paragraphs.find(p => p.startsWith('Meta Title:')).replace(/^Meta Title:\s*/, '');
 const description = paragraphs.find(p => p.startsWith('Meta Description:')).replace(/^Meta Description:\s*/, '');
 const bold = new Set([...source.matchAll(/\.([\w-]+)\{[^}]*font-weight:\s*(?:700|bold)[^}]*\}/g)].map(m => m[1]));
 let body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)[1];
 body = body.slice(body.indexOf('<h1')).replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/g, (_, attrs, text) => {
  const classes = (attrs.match(/class="([^"]*)"/)?.[1] || '').split(/\s+/);
  return classes.some(c => bold.has(c)) ? '<strong>' + text + '</strong>' : text;
 }).replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, '$1').replace(/<(\/?[a-z][a-z0-9]*)\b[^>]*>/gi, '<$1>');
 body = body.replace(/<p>([\s\S]*?)<\/p>/g, (block, inner) => {
  const text = plain(inner);
  if (!text) return '';
  if (text.startsWith('Button:')) {
   const label = text.replace(/^Button:\s*/, '');
   const href = 'contact-us/';
   return '<div class="page-actions"><a class="btn btn-primary" href="' + href + '">' + label + '</a></div>';
  }
  if (text === '[Insert the service section from the homepage]') {
   const home = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
   const section = home.match(/<section id="services"[\s\S]*?<\/section>/)[0];
   const grid = section.slice(section.indexOf('<div class="service-grid">')).replace(/\s*<\/div>\s*<\/section>$/, '');
   return '<div id="research-services">' + grid.replace(/<article class="service-card">([\s\S]*?)<\/article>/g, '<a class="service-card" href="contact-us/">$1</a>') + '</div>';
  }
  return block;
 });
 const cards = (content, steps = false) => {
  const start = content.indexOf('<h3>');
  const cta = content.indexOf('<div class="page-actions">', start);
  const end = cta < 0 ? content.length : cta;
  let n = 0;
  const items = content.slice(start, end).replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g, (_, heading, copy) =>
   '<article class="content-card"><span class="card-number" aria-hidden="true">' + String(++n).padStart(2, '0') + '</span><h3>' + heading + '</h3>' + copy + '</article>');
  return content.slice(0, start) + '<div class="card-grid academic-layout-cards' + (steps ? ' steps' : '') + '">' + items + '</div>' + content.slice(end);
 };
 const sections = body.split(/(?=<h2>)/).map((content, index) => {
  const heading = plain(content.match(/^<h2>[\s\S]*?<\/h2>/)?.[0] || '');
  let dark = false;
  if (heading === 'Our Research Support Services in the UK') content = cards(content, true);
  if (heading === 'Research Support for Different Academic Levels in the UK') content = content.replace('<ul>', '<ul class="check-list academic-requirements">');
  if (heading === 'How Our Research Support Works in the United Kingdom') {
   let n = 0;
   content = content.replace(/<(?:ol|ul)>([\s\S]*?)<\/(?:ol|ul)>/, (_, items) => '<div class="card-grid academic-layout-cards steps">' + items.replace(/<li>([\s\S]*?)<\/li>/g, (_, item) => '<article class="content-card"><span class="card-number" aria-hidden="true">' + String(++n).padStart(2, '0') + '</span><p>' + item + '</p></article>') + '</div>');
  }
  if (heading === 'What Our Research Support Includes?') {
   const start = content.indexOf('<h3>'), cta = content.indexOf('<div class="page-actions">', start);
   const items = content.slice(start, cta).replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g, '<li><div><h3>$1</h3>$2</div></li>');
   content = content.slice(0, start) + '<ul class="check-list academic-support-list">' + items + '</ul>' + content.slice(cta);
  }
  if (heading === 'Why Choose Research Hub UK for Research Support?') { dark = true; content = cards(content); }
  if (heading === 'FAQs About Research Support Services') {
   const start = content.indexOf('<h3>');
   content = '<div class="section-heading">' + content.slice(0, start) + '</div><div class="faq-list">' + content.slice(start).replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g, '<details><summary>$1</summary>$2</details>') + '</div>';
  }
  const breadcrumb = index === 0 ? '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a><span aria-hidden="true">/</span><span>Research Support</span></nav>' : '';
  return '<section class="section document-section academic-document' + (index === 0 ? ' page-intro' : '') + (dark ? ' dark-section' : '') + (heading === 'What Our Research Support Includes?' ? ' research-includes-section' : '') + '"><div class="container">' + breadcrumb + content + '</div></section>';
 });
 return { title, description, html: sections.join('') };
};
