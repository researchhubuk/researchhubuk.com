const fs = require('node:fs');
const path = require('node:path');

// Keep the supplied export as the source of truth; document notes are not page copy.
module.exports = () => {
 const source = fs.readFileSync(path.join(__dirname, '../content/academic-original.html'), 'utf8');
 const plain = html => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
 const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => plain(m[1]));
 const title = paragraphs.find(t => t.startsWith('Meta Title:')).replace(/^Meta Title:\s*/, '');
 const description = paragraphs.find(t => t.startsWith('Meta Description:')).replace(/^Meta Description:\s*/, '');
 let body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)[1];
 body = body.slice(body.indexOf('<h1'));
 // Export styling is replaced with site styling; text and semantic lists/tables remain.
 const boldClasses = new Set([...source.matchAll(/\.([\w-]+)\{([^}]*font-weight:\s*(?:700|bold)[^}]*)\}/g)].map(m => m[1]));
 body = body.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/g, (match, attributes, text) => {
  const classes = (attributes.match(/class="([^"]*)"/)?.[1] || '').split(/\s+/);
  return classes.some(name => boldClasses.has(name)) ? '<strong>' + text + '</strong>' : text;
 })
  .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, '$1')
  .replace(/<(\/?[a-z][a-z0-9]*)\b[^>]*>/gi, '<$1>');
 body = body.replace(/<p>([\s\S]*?)<\/p>/g, (block, inner) => {
  const text = plain(inner);
  if (!text) return '';
  if (text.startsWith('Button:')) {
   const label = plain(inner).replace(/^Button:\s*/, '').trim();
   const whatsappButtons = new Set(['Help Me Choose a Service', 'Contact Research Hub UK', 'Get Assignment Planning Support', 'Get Writing &amp; Research Guidance', 'Get Help With Your Assessment Type']);
   if (whatsappButtons.has(label)) {
    return '<div class="page-actions"><a class="btn btn-primary" href="https://wa.me/8801313633953" target="_blank" rel="noopener noreferrer">' + label + '</a></div>';
   }
   const target = /Find Your Assignment Service|Explore Our Academic Services/.test(text) ? '#assignment-services' : 'contact-us/';
   return '<div class="page-actions"><a class="btn btn-primary" href="' + target + '">' + label + '</a></div>';
  }
  if (text === '[insert the service section from home page]') {
   const home = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
   const section = home.match(/<section id="services"[\s\S]*?<\/section>/)[0];
   const grid = section.slice(section.indexOf('<div class="service-grid">')).replace(/\s*<\/div>\s*<\/section>$/, '');
   return '<div id="assignment-services">' + grid.replace(/href="#[^"]*"/g, 'href="https://wa.me/8801313633953" target="_blank" rel="noopener noreferrer"') + '</div>';
  }
  return block;
 });
 // Adapt the document's groups to the homepage card and checklist patterns.
 const headingIndex = (text, from = 0) => {
  for (const m of body.slice(from).matchAll(/<h[2-4]>[\s\S]*?<\/h[2-4]>/g)) {
   if (plain(m[0]) === text) return from + m.index;
  }
  throw new Error('Missing document heading: ' + text);
 };
 const restyle = (start, end, transform) => {
  const first = headingIndex(start), last = headingIndex(end, first + 1);
  body = body.slice(0, first) + transform(body.slice(first, last)) + body.slice(last);
 };
 const cards = (html, level = 3, variant = '') => {
  // Keep introductory text and the final CTA outside the grid.
  const first = html.indexOf('<h' + level + '>');
  if (first < 0) throw new Error('Missing card headings');
  const cta = html.indexOf('<div class="page-actions">', first);
  const end = cta < 0 ? html.length : cta;
  const items = html.slice(first, end);
  let index = 0;
  const pattern = new RegExp('<h' + level + '>([\\s\\S]*?)<\\/h' + level + '>([\\s\\S]*?)(?=<h' + level + '>|$)', 'g');
  const grid = items.replace(pattern, (match, title, copy) => '<article class="content-card"><span class="card-number" aria-hidden="true">' + String(++index).padStart(2, '0') + '</span><h' + level + '>' + title + '</h' + level + '>' + copy + '</article>');
  return html.slice(0, first) + '<div class="card-grid academic-layout-cards ' + variant + '">' + grid + '</div>' + html.slice(end);
 };
 const checklist = html => {
  const first = html.indexOf('<h3>');
  const cta = html.indexOf('<div class="page-actions">', first);
  const end = cta < 0 ? html.length : cta;
  const items = html.slice(first, end).replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
   '<li><div><h3>$1</h3>$2</div></li>');
  return html.slice(0, first) + '<ul class="check-list academic-support-list">' + items + '</ul>' + html.slice(end);
 };
 restyle('Assignment help for different types of University assessments', 'What is included in our University assignment support?', html => cards(html, 3, 'steps'));
 restyle('What is included in our University assignment support?', 'Academic support based on your assignment stage', checklist);
 restyle('Coursework &amp; Assignment Help for UK Qualifications', 'How to Choose the Right University Assignment Service', checklist);
 restyle('Common University assignment challenges we can help you address', 'What to consider before requesting assignment help', html => cards(html, 4));
 restyle('What to consider before requesting assignment help', 'Why choose Research Hub UK for University assignment help?', html => {
  const pattern = /<p><strong>(Assessment Type:|Assignment Instructions:|Academic Level:|Assessment Criteria:|Current Progress:|Support Required:|Deadline:)<\/strong>([\s\S]*?)<\/p>/g;
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 7) throw new Error('Expected seven assignment checklist items');
  const start = matches[0].index, last = matches.at(-1);
  return html.slice(0, start) + '<ul class="check-list academic-requirements">' + matches.map(m => '<li><div><strong>' + m[1] + '</strong>' + m[2] + '</div></li>').join('') + '</ul>' + html.slice(last.index + last[0].length);
 });
 restyle('Why choose Research Hub UK for University assignment help?', 'FAQs About University assignment help services', html => {
  const heading = html.match(/^<h3>[\s\S]*?<\/h3>/)[0];
  const copy = html.slice(heading.length).replace(/<ul><li>(<h3>[\s\S]*?<\/h3>)<\/li><\/ul>/g, '$1');
  return heading.replace(/h3>/g, 'h2>') + cards(copy);
 });
 body = body.replace(/<h2>/g, '</div></section><section class="section document-section academic-document"><div class="container"><h2>');
 body = body.replace(/<section class="section document-section academic-document"><div class="container"><h2><strong>(What is included in our University assignment support\?|Why choose Research Hub UK for University assignment help\?)/g,
  '<section class="section document-section academic-document dark-section"><div class="container"><h2><strong>$1');
 body = body.replace('<h3><strong>Academic support based on your assignment stage</strong></h3>',
  '</div></section><section class="section document-section academic-document"><div class="container"><h3><strong>Academic support based on your assignment stage</strong></h3>');
 // Reuse the homepage FAQ markup and styling without changing document copy.
 body = body.replace(/(<h2>(?:<strong>)?FAQs About University assignment help services(?:<\/strong>)?<\/h2>)([\s\S]*?)(?=<h3>(?:<strong>)?Find the academic support that fits your assignment(?:<\/strong>)?<\/h3>)/, (match, heading, questions) => {
  const items = questions.replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
   '<details><summary>$1</summary>$2</details>');
  return '<div class="section-heading">' + heading + '</div><div class="faq-list">' + items + '</div>';
 });
 body = body.replace(/<table>([\s\S]*?)<\/table>/g, (table, content) => {
  const rows = [...content.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row => row[1]);
  if (!rows.length) return table;
  const header = rows.shift().replace(/<td>/g, '<th scope="col">').replace(/<\/td>/g, '</th>');
  return '<div class="academic-table-wrap"><table class="assignment-service-table"><caption class="visually-hidden">University assignment requirements and suggested services</caption><thead><tr>' + header + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row + '</tr>').join('') + '</tbody></table></div>';
 });
 return { title, description, html: '<section class="section page-intro document-section academic-document"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a><span aria-hidden="true">/</span><span>Academic Services</span></nav>' + body + '</div></section>' };
};
