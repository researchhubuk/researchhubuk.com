const fs = require('node:fs');
const path = require('node:path');

module.exports = () => {
 const source = fs.readFileSync(path.join(__dirname, '../content/terms-original.html'), 'utf8');
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
  href = href.replace(/^https:\/\/researchhubuk\.github\.io\/researchhubuk\.com\//, './');
  return `<a href="${href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
 });
 body = body.replace(/<p>([\s\S]*?)<\/p>/g, (block, inner) => {
  if (!plain(inner)) return '';
  if (!plain(inner).startsWith('Button:')) return block;
  const link = inner.match(/<a href="([^"]*)">([\s\S]*?)<\/a>/);
  if (!link) throw new Error('Missing terms button destination');
  return `<div class="page-actions"><a class="btn btn-primary" href="${link[1]}">${plain(link[2])}</a></div>`;
 });
 // Match Research Support's mix of cards, steps, checklists and dark panels.
 // Keep the source's wording, order, bold spans and heading levels intact.
 const cardLists = new Set(['About Research Hub UK', 'Enquiries and Service Requests', 'Service Availability and Scope']);
 const checkLists = new Set(['Nature of Our Academic Support Services', 'Student Responsibilities']);
 const paragraphCards = new Set(['Fees and Payment Terms', 'Deadlines and Service Delivery', 'Revisions and Additional Requests', 'Intellectual Property Rights', 'Changes to Our Services and Terms']);
 const splitSections = new Set(['Acceptance of Terms', 'Privacy and Confidentiality', 'Suspension or Termination of Services', 'Governing Law and Jurisdiction']);
 const sections = body.split(/(?=<h2>)/).map((content, index) => {
  const headingHtml = content.match(/^<h2>[\s\S]*?<\/h2>/)?.[0] || '';
  const heading = plain(headingHtml);
  let variant = '', dark = false;
  if (cardLists.has(heading)) {
   const steps = heading === 'Enquiries and Service Requests' ? ' terms-step-cards' : '';
   content = content.replace(/<ul>([\s\S]*?)<\/ul>/g, (_, items) => '<ul class="card-grid academic-layout-cards terms-list-cards' + steps + '">' + items.replace(/<li>/g, '<li class="content-card">') + '</ul>');
  } else if (checkLists.has(heading)) {
   content = content.replace(/<ul>/g, '<ul class="check-list academic-requirements">');
   if (heading === 'Nature of Our Academic Support Services') variant = ' research-includes-section';
  } else if (paragraphCards.has(heading)) {
   content = headingHtml + '<div class="card-grid academic-layout-cards terms-paragraph-cards">' + content.slice(headingHtml.length).replace(/<p>([\s\S]*?)<\/p>/g, '<article class="content-card"><p>$1</p></article>') + '</div>';
  } else if (splitSections.has(heading)) {
   content = '<div class="terms-split-heading">' + headingHtml + '</div><div class="terms-split-copy">' + content.slice(headingHtml.length) + '</div>';
   variant = ' terms-split-section';
  } else if (heading === 'Cancellation and Refund Policy') {
   content = headingHtml + '<div class="terms-policy-stack">' + content.slice(headingHtml.length).replace(/<p>([\s\S]*?)<\/p>/g, '<div class="terms-policy-item"><p>$1</p></div>') + '</div>';
   variant = ' terms-refund-section';
  } else if (heading === 'Academic Integrity and Responsible Use' || heading === 'Limitation of Liability') {
   dark = true;
   content = content.replace(/<ul>([\s\S]*?)<\/ul>/g, (_, items) => '<ul class="card-grid academic-layout-cards terms-list-cards">' + items.replace(/<li>/g, '<li class="content-card">') + '</ul>');
  } else if (heading === 'Website Use and Acceptable Behaviour') {
   content = content.replace(/<ul>/g, '<ul class="terms-boundary-list">');
  } else if (heading === 'Contact and Complaints') {
   content = content.replace(/<p><strong>Email:<\/strong>([\s\S]*?)<\/p>/, (_, address) => '<div class="page-actions"><a class="btn btn-primary" href="mailto:clients.researchhubuk@gmail.com"><strong>Email:</strong>' + address + '</a></div>');
   content = '<div class="terms-contact-panel">' + content + '</div>';
  }
  const breadcrumb = index === 0 ? '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a><span aria-hidden="true">/</span><span>Terms and Conditions</span></nav>' : '';
  return '<section class="section document-section academic-document terms-document' + (index === 0 ? ' page-intro' : '') + (dark ? ' dark-section' : '') + variant + '"><div class="container">' + breadcrumb + content + '</div></section>';
 });
 return {title, description, html: sections.join('')};
};
