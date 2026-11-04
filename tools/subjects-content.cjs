const fs = require('node:fs');
const path = require('node:path');

// The supplied export is the content source; its metadata and Button labels
// describe page elements rather than visible document notes.
module.exports = () => {
 const source = fs.readFileSync(path.join(__dirname, '../content/subjects-original.html'), 'utf8');
 const plain = html => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
 const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => plain(m[1]));
 const title = paragraphs.find(t => t.startsWith('Meta Title:')).replace(/^Meta Title:\s*/, '');
 const description = paragraphs.find(t => t.startsWith('Meta Description:')).replace(/^Meta Description:\s*/, '');
 let body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)[1];
 body = body.slice(body.indexOf('<h1'));
 const boldClasses = new Set([...source.matchAll(/\.([\w-]+)\{([^}]*font-weight:\s*(?:700|bold)[^}]*)\}/g)].map(m => m[1]));
 body = body.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/g, (_, attributes, text) => {
  const classes = (attributes.match(/class="([^"]*)"/)?.[1] || '').split(/\s+/);
  return classes.some(name => boldClasses.has(name)) ? `<strong>${text}</strong>` : text;
 });
 body = body.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (_, tag, attributes) => {
  if (tag !== 'a') return `<${tag}>`;
  let href = (attributes.match(/href="([^"]*)"/)?.[1] || '').replace(/&amp;/g, '&');
  if (href.startsWith('https://www.google.com/url?')) href = new URL(href).searchParams.get('q');
  // Keep the supplied destinations, with internal links on this site's host.
  href = href.replace(/^https:\/\/researchhubuk\.github\.io\/researchhubuk\.com\//, './');
  return `<a href="${href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
 });
 body = body.replace(/<p>([\s\S]*?)<\/p>/g, (block, inner) => {
  if (!plain(inner)) return '';
  if (!plain(inner).startsWith('Button:')) return block;
  const link = inner.match(/<a href="([^"]*)">([\s\S]*?)<\/a>/);
  if (!link) throw new Error('Missing subject button destination');
  return `<div class="page-actions"><a class="btn btn-primary" href="${link[1]}">${plain(link[2])}</a></div>`;
 });
 const sections = body.split(/(?=<h2>)/);
 const intro = sections.shift();
 const content = sections.map((section, index) => {
  if (index === 0) {
   const first = section.indexOf('<h3>');
   const cards = section.slice(first).replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
    '<article class="content-card"><h3>$1</h3>$2</article>');
   section = section.slice(0, first) + '<div class="card-grid academic-layout-cards">' + cards + '</div>';
  } else if (plain(section).startsWith('Frequently Asked Questions')) {
   const first = section.indexOf('<h3>');
   const items = section.slice(first).replace(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
    '<details><summary><h3>$1</h3></summary>$2</details>');
   section = section.slice(0, first) + '<div class="faq-list document-faq-list">' + items + '</div>';
  } else {
   section = section.replace(/<ul>/g, '<ul class="check-list academic-requirements">');
  }
  const dark = index === 1 ? ' dark-section' : '';
  return `<section class="section document-section academic-document subjects-document${dark}"><div class="container">${section}</div></section>`;
 }).join('');
 return {title, description, html: '<section class="section page-intro document-section academic-document subjects-document"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a><span aria-hidden="true">/</span><span>Subjects</span></nav>' + intro + '</div></section>' + content};
};
