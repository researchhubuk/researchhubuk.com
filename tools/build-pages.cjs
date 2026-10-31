const fs = require('node:fs');
const intro = "<section class=\"section page-intro\"><div class=\"container\">\n        <nav class=\"breadcrumbs\" aria-label=\"Breadcrumb\"><a href=\"./\">Home</a><span aria-hidden=\"true\">/</span><span>Contact</span></nav>\n        <span class=\"eyebrow\">CONTACT RESEARCH HUB UK</span><h1>Let's talk about your academic work.</h1>\n        <p class=\"page-lead\">Have a question or a brief to discuss? Contact our team by email or WhatsApp, or prepare your requirements below.</p>\n        <div class=\"page-actions\"><a class=\"btn btn-primary\" href=\"mailto:clients.researchhubuk@gmail.com\">Email Our Team ↗</a><a class=\"btn btn-dark\" href=\"https://wa.me/8801313633953\" target=\"_blank\" rel=\"noopener noreferrer\">Chat on WhatsApp ↗</a></div>\n        </div></section>";
const outro = "<section id=\"contact-details\" class=\"section\"><div class=\"container\"><div class=\"section-heading\"><span class=\"eyebrow\">BEFORE YOU GET IN TOUCH</span><h2>What should you send?</h2></div><p>Include the details you already have so we can understand your task.</p><ul class=\"check-list\"><li>Assignment brief or research topic</li><li>Subject and academic level</li><li>Word count and deadline</li><li>Marking criteria and module guidance</li><li>Referencing style</li><li>Existing draft or research notes</li></ul><p>Send supporting files directly by email or WhatsApp. The form above prepares a text file for you to send to the team.</p></div></section>";
(function buildPages(){
 const documentAbout = require('./about-content.cjs')();
 let source=fs.readFileSync('index.html','utf8');
 source=source.replace('id="contact" class="section contact-section"','id="contact" class="section contact-section home-contact"');
 source=source.replace(/assets\/css\/theme\.css(?:\?[^"\s]*)?/g,'assets/css/theme.css?v=20261031-home-contact-link-underline-fix');
 source=source.replaceAll('href="#why-us">About Us','href="about.html">About Us').replaceAll('href="#contact">Contact</a>','href="contact.html">Contact</a>').replaceAll('href="#contact">Send Your Requirements','href="contact.html">Send Your Requirements');
 let footer=source.slice(source.indexOf('<footer'));
 if(!footer.includes('>About Us</a>')) footer=footer.replace('<a href="contact.html">Contact','<a href="about.html">About Us</a><a href="contact.html">Contact');
 source=source.slice(0,source.indexOf('<footer'))+footer;
 const cleanLinks = html => html.replace(/(href|content)="([^"\s#]*?)(about|contact)(?:\.html|-us\/?)?"/g, '$1="$2$3-us/"').replace(/href="index\.html#/g, 'href="./#');
 fs.writeFileSync('index.html',cleanLinks(source));
 let shell=source.slice(0,source.indexOf('<main')).replaceAll(' aria-current="page"','').replace(/\s*<link rel="preload" as="image"[^>]+>/g,'').replace('</head>','<link rel="stylesheet" href="assets/css/pages.css?v=20261031-mission-vision-simple">\n</head>');
 const contact=source.match(/<section id="contact"[\s\S]*?<\/section>/)[0].replace(' home-contact','').replace('href="#requirements"','href="#contact-details"');
 for(const [filename,title,description,content] of [
 ['about.html','About Us',documentAbout.description,documentAbout.html],
 ['contact.html','Contact','Contact Research Hub UK by email or WhatsApp to discuss your assignment, dissertation or research requirements.',intro+contact+outro]]){
 let head=shell.replace(/<title>[\s\S]*?<\/title>/,`<title>${title} | Research Hub UK</title>`)
 .replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*/g,`$1${description}`)
 .replace(/(<meta (?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*/g,`$1${title} | Research Hub UK`)
 .replaceAll('href="https://researchhubuk.com/"',`href="https://researchhubuk.com/${filename}"`)
 .replace('property="og:url" content="https://researchhubuk.com/"',`property="og:url" content="https://researchhubuk.com/${filename}"`)
 .replace(`class="nav-link" href="${filename}"`,`class="nav-link" href="${filename}" aria-current="page"`);
 head=head.replace(`class="nav-link" href="${filename.replace('.html','')}"`,`class="nav-link" href="${filename.replace('.html','')}" aria-current="page"`);
 head=head.replace(`class="nav-link" href="${filename.replace('.html','-us')}"`,`class="nav-link" href="${filename.replace('.html','-us')}" aria-current="page"`);
 head=head.replace(`class="nav-link" href="${filename.replace('.html','-us/')}"`,`class="nav-link" href="${filename.replace('.html','-us/')}" aria-current="page"`);
 if(filename === 'about.html') head=head.replace(/<title>[\s\S]*?<\/title>/, `<title>${documentAbout.title}</title>`).replace(/(<meta (?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*/g, `$1${documentAbout.title}`);
 let page=head+'<main id="main">'+content+'</main>'+footer;
 page=page.replace(/href="#(services|speciality|subjects|faqs)"/g,'href="index.html#$1"');
 page=cleanLinks(page);
 fs.writeFileSync(filename,page);
 // Real directories work on GitHub Pages without Apache rewrite support.
 const directory=filename.replace('.html','-us');
 fs.mkdirSync(directory,{recursive:true});
 const directoryPage=page.replace(/\b(href|src)="([^\"]*)"/g,(match,attribute,url)=>{
  if(!url || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) return match;
  return `${attribute}="../${url.replace(/^\.\//,'')}"`;
 });
 fs.writeFileSync(`${directory}/index.html`,directoryPage);
 }
 fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['','about-us/','contact-us/'].map(n=>`<url><loc>https://researchhubuk.com/${n}</loc></url>`).join('')+'</urlset>\n');
 console.log('Built About Us and Contact pages with homepage header and footer.');
})();
