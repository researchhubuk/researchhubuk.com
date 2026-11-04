const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('content/subjects-original.html', 'utf8').split(/<h1\b/)[1];
const original = '<h1' + source.slice(0, source.indexOf('</body>'));
const page = fs.readFileSync('subjects/index.html', 'utf8');
const main = page.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const normalize = s => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const blocks = [...original.matchAll(/<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)]
 .map(m => normalize(m[2]).replace(/^Button:\s*/, '')).filter(Boolean);
for (const text of blocks) assert.ok(normalize(main).includes(text), `Missing copy: ${text}`);
const headings = html => [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => [m[1], normalize(m[2])]);
assert.deepEqual(headings(main), headings(original), 'Heading order and levels must match');
const exportHtml = fs.readFileSync('content/subjects-original.html', 'utf8');
const boldClasses = new Set([...exportHtml.matchAll(/\.([\w-]+)\{([^}]*font-weight:\s*(?:700|bold)[^}]*)\}/g)].map(m => m[1]));
// Button labels use the site's button weight instead of document strong tags.
const copyOnly = original.replace(/<p\b[^>]*>[\s\S]*?<\/p>/g, block => normalize(block).startsWith('Button:') ? '' : block);
const expectedBold = [...copyOnly.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/g)]
 .filter(m => (m[1].match(/class="([^"]*)"/)?.[1] || '').split(/\s+/).some(c => boldClasses.has(c)))
 .map(m => normalize(m[2]));
assert.deepEqual([...main.matchAll(/<strong>([\s\S]*?)<\/strong>/g)].map(m => normalize(m[1])), expectedBold, 'All source bold spans must retain strong markup in order');
const links = html => [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => [m[1], normalize(m[2])]);
const expected = links(original).map(([href, label]) => {
 href = new URL(href.replace(/&amp;/g, '&')).searchParams.get('q');
 href = href.replace(/^https:\/\/researchhubuk\.github\.io\/researchhubuk\.com\//, '../');
 return [href.replace(/&/g, '&amp;'), label];
});
assert.deepEqual(links(main).slice(1), expected, 'Every supplied link and button must match');
assert.equal((main.match(/class="btn btn-primary"/g) || []).length, 2);
assert.equal((main.match(/<article class="content-card">/g) || []).length, 8);
assert.equal((main.match(/<details>/g) || []).length, 7);
assert.match(page, /<title>Academic Subject Areas Covered by Research Hub UK<\/title>/);
assert.match(page, /rel="canonical" href="https:\/\/researchhubuk.com\/subjects\/"/);
console.log(`PASS: ${blocks.length} content blocks, ${headings(main).length} headings with exact levels, ${expectedBold.length} bold spans, ${expected.length} links including both buttons, 8 category cards and 7 FAQs.`);
