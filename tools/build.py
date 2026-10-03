from pathlib import Path
from html.parser import HTMLParser
from html import escape
import re, json, shutil

ROOT=Path(__file__).resolve().parents[1]
settings=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
site_url=settings['url'].rstrip('/')
source=ROOT/'content'/'original.html'
source.parent.mkdir(exist_ok=True)
if not source.exists(): shutil.copyfile(ROOT/'index.html',source)
class Reader(HTMLParser):
    def __init__(self): super().__init__(); self.blocks=[]; self.tag=None; self.depth=0; self.parts=[]; self.bold=0; self.skip=0
    def handle_starttag(self,t,a):
        attrs=dict(a)
        if t in ('p','h1','h2','h3','h4','li') and not self.tag:
            self.tag=t; self.parts=[]
        elif self.tag:
            if t=='sup': self.skip+=1
            if t=='span' and ('c5' in attrs.get('class','').split() or 'c26' in attrs.get('class','').split()): self.parts.append('<strong>'); self.bold+=1
    def handle_endtag(self,t):
        if t=='sup': self.skip=max(0,self.skip-1)
        if self.tag and t=='span' and self.bold: self.parts.append('</strong>'); self.bold-=1
        if t==self.tag:
            v=''.join(self.parts).strip()
            if re.sub('<[^>]+>','',v).strip(): self.blocks.append((t,v))
            self.tag=None
    def handle_data(self,d):
        if self.tag and not self.skip: self.parts.append(escape(d.replace('\xa0',' ')))
r=Reader(); r.feed(source.read_text(encoding='utf-8'))
plain=lambda v: re.sub('<[^>]+>','',v).strip()
title=plain(r.blocks[1][1]).split('Meta Title:')[1].strip()
description=plain(r.blocks[2][1]).split('Meta Description:')[1].strip()
blocks=[(t,v) for t,v in r.blocks[4:] if not plain(v).startswith('===') and plain(v)!='[a]make it card design']
hero=blocks[:4]; blocks=blocks[4:]
major=['How our assignment service works','Need assignment help with a tight deadline in the UK?','What can you send us?','Why Choose Research Hub UK?']
sections=[]
for t,v in blocks:
    if t=='h2' or plain(v).strip() in major: sections.append({'title':v,'blocks':[]})
    elif sections: sections[-1]['blocks'].append((t,v))
ids=['services','speciality','subjects','levels','process','deadline','requirements','why-us','faqs']
def button(v): return '<a class="btn btn-primary" href="#contact">'+escape(plain(v).replace('Button:','').strip())+' <span aria-hidden="true">↗</span></a>'
def render_section(s,i):
    sid=ids[i]; intro=[]; cards=[]; current=None; services=[]; actions=[]; lists=[]
    for t,v in s['blocks']:
        if plain(v).startswith('Button:'): actions.append(button(v)); continue
        if t in ('h3','h4'):
            current={'title':v,'body':[]}; cards.append(current)
        elif t=='li': lists.append('<li>'+v+'</li>')
        elif sid=='services' and t=='p' and len(plain(v))<45: services.append(v)
        elif current: current['body'].append('<p>'+v+'</p>')
        else: intro.append('<p>'+v+'</p>')
    content=''.join(intro)
    if services:
        content+='<div class="service-grid">'+''.join('<a class="service-card" href="#contact"><span class="service-icon" aria-hidden="true">'+['✎','▤','▧','⌘'][n%4]+'</span><h3>'+v+'</h3><span class="arrow" aria-hidden="true">↗</span></a>' for n,v in enumerate(services))+'</div>'
    if cards:
        if sid=='faqs': content+='<div class="faq-list">'+''.join('<details><summary>'+c['title']+'</summary>'+''.join(c['body'])+'</details>' for c in cards)+'</div>'
        else: content+='<div class="card-grid '+('steps' if sid=='process' else '')+'">'+''.join('<article class="content-card"><span class="card-number" aria-hidden="true">'+f'{n+1:02}'+'</span><h3>'+c['title']+'</h3>'+''.join(c['body'])+'</article>' for n,c in enumerate(cards))+'</div>'
    if lists: content+='<ul class="check-list">'+''.join(lists)+'</ul>'
    content+=''.join(actions)
    visual='<img class="section-photo" src="assets/img/library.webp" width="1400" height="933" alt="Bookshelves and study tables in a university library" loading="lazy">' if sid=='levels' else ''
    return '<section id="'+sid+'" class="section '+('dark-section' if sid in ('deadline','why-us') else '')+'"><div class="container"><div class="section-heading"><span class="eyebrow">'+f'{i+1:02} / RESEARCH HUB UK'+'</span><h2>'+s['title']+'</h2></div>'+visual+content+'</div></section>'
logo='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" rx="16" fill="#c9f06b"/><path d="M12 17c7-3 11-1 16 3 5-4 9-6 16-3v23c-7-3-11-1-16 2-5-3-9-5-16-2Z" fill="none" stroke="#152c29" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 20v22M18 25l5 2m-5 5 5 2m10-7 5-2m-5 9 5-2" stroke="#152c29" stroke-width="2.5" stroke-linecap="round"/></svg>'
(ROOT/'assets/img').mkdir(parents=True,exist_ok=True)
(ROOT/'assets/img/logo-mark.svg').write_text(logo)
(ROOT/'assets/img/favicon.svg').write_text(logo)
brand='<a class="brand" href="./" aria-label="Research Hub UK home"><img src="assets/img/logo-mark.svg" width="48" height="48" alt=""><span>research<span class="brand-accent">hub</span><small>UNITED KINGDOM</small></span></a>'
schema={'@context':'https://schema.org','@type':'Organization','name':'Research Hub UK','description':description,'url':site_url+'/','logo':site_url+'/assets/img/logo-mark.svg'}
head=f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)}</title><meta name="description" content="{escape(description,quote=True)}"><meta name="robots" content="index, follow, max-image-preview:large"><meta name="theme-color" content="#152c29"><meta property="og:type" content="website"><meta property="og:locale" content="en_GB"><meta property="og:site_name" content="Research Hub UK"><meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(description,quote=True)}"><meta property="og:image" content="assets/img/og-image.webp"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Research Hub UK — academic writing and research support"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg"><link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png"><link rel="preload" as="image" href="assets/img/students.webp"><link rel="stylesheet" href="assets/vendor/bootstrap.min.css"><link rel="stylesheet" href="assets/css/theme.css"><script type="application/ld+json">{json.dumps(schema)}</script><script defer src="assets/vendor/bootstrap.bundle.min.js"></script><script defer src="assets/js/theme.js"></script></head><body>'''
nav='<a class="skip-link" href="#main">Skip to content</a><div class="announcement">Academic support, built around your university requirements <span>UK STUDENTS · ALL ACADEMIC LEVELS</span></div><header class="site-header"><nav class="container navbar navbar-expand-lg" aria-label="Main navigation">'+brand+'<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navigation" aria-controls="navigation" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="navigation"><ul class="navbar-nav ms-auto"><li><a class="nav-link" href="#services">Our services</a></li><li><a class="nav-link" href="#subjects">Subjects</a></li><li><a class="nav-link" href="#process">How it works</a></li><li><a class="nav-link" href="#why-us">Why us</a></li><li><a class="nav-link" href="#faqs">FAQs</a></li></ul><a class="btn btn-dark nav-cta" href="#contact">Send Your Requirements ↗</a></div></nav></header>'
herohtml='<main id="main"><section class="hero"><div class="container hero-grid"><div class="hero-copy"><span class="eyebrow"><span class="status-dot"></span> YOUR NEXT CHAPTER STARTS HERE</span><h1>'+hero[0][1]+'</h1><div class="hero-intro">'+''.join('<p>'+v+'</p>' for t,v in hero[1:3])+'</div><div class="hero-actions">'+button(hero[3][1])+'<a class="text-link" href="#services">Explore our services <span aria-hidden="true">↓</span></a></div><div class="hero-proof"><span><b>6+</b> years of experience</span><span><b>40+</b> academic subjects</span><span><b>24/7</b> support</span></div></div><div class="hero-visual"><div id="study-slider" class="carousel slide" aria-roledescription="carousel" aria-label="Academic life"><div class="carousel-inner"><div class="carousel-item active"><img src="assets/img/students.webp" width="1100" height="1250" alt="Students collaborating on research in a university study space" fetchpriority="high"><div class="image-caption"><span>01 / ACADEMIC SUPPORT</span><strong>Room to think.<br>Support to move forward.</strong></div></div><div class="carousel-item"><img src="assets/img/library.webp" width="1400" height="933" alt="University library with books and quiet study tables" loading="lazy"><div class="image-caption"><span>02 / RESEARCH &amp; EVIDENCE</span><strong>A clearer direction.<br>From brief to research.</strong></div></div><div class="carousel-item"><img src="assets/img/campus.webp" width="1400" height="933" alt="Historic university buildings and a green campus courtyard" loading="lazy"><div class="image-caption"><span>03 / YOUR UNIVERSITY JOURNEY</span><strong>Every subject.<br>Every academic level.</strong></div></div></div><div class="slider-controls"><button data-bs-target="#study-slider" data-bs-slide="prev" aria-label="Previous slide">←</button><span>YOUR UNIVERSITY JOURNEY</span><button data-bs-target="#study-slider" data-bs-slide="next" aria-label="Next slide">→</button></div></div><div class="floating-note"><span aria-hidden="true">✦</span><div><strong>Your brief. Your direction.</strong><small>Tailored to UK university standards</small></div></div><div class="visual-tag">RESEARCH. WRITE. REFINE.</div></div></div></section><div class="discipline-strip"><div class="container"><span>BUILT AROUND YOUR BRIEF</span><b>Harvard</b><b>OSCOLA</b><b>APA</b><b>MLA</b><b>Chicago</b><span>UK ACADEMIC CONVENTIONS</span></div></div>'
contact='''<section id="contact" class="section contact-section"><div class="container contact-grid"><div><span class="eyebrow">LET’S LOOK AT YOUR BRIEF</span><h2>Send Your Requirements</h2><p>Assignment brief · Subject · Academic level · Word count · Deadline · Referencing style</p><a class="text-link" href="#requirements">What can you send us? ↑</a></div><form id="brief-form"><div class="row g-3"><div class="col-sm-6"><label for="name">Your name</label><input class="form-control" id="name" name="name" required maxlength="120" autocomplete="name"></div><div class="col-sm-6"><label for="email">Email address</label><input class="form-control" id="email" name="email" type="email" required autocomplete="email"></div><div class="col-sm-6"><label for="subject">Subject</label><input class="form-control" id="subject" name="subject" required maxlength="200"></div><div class="col-sm-6"><label for="deadline-input">Deadline</label><input class="form-control" id="deadline-input" name="deadline" type="date" required></div><div class="col-12"><label for="brief">Your requirements</label><textarea class="form-control" id="brief" name="brief" rows="4" required maxlength="10000" placeholder="Academic level, word count, referencing style and assignment details"></textarea></div></div><button class="btn btn-primary" type="submit">Prepare My Requirements ↗</button><p class="form-note">Prepare a copy of your brief to send to the team. This form does not upload files or submit an order.</p><p id="form-status" role="status" aria-live="polite"></p></form></div></section></main>'''
footer='<footer class="site-footer"><div class="container"><div class="footer-top">'+brand+'<p>Professional assignment, essay, coursework, dissertation and research support for students studying at UK universities.</p><a class="back-top" href="#main">Back to top ↑</a></div><div class="footer-bottom"><span>© <span id="year">2026</span> Research Hub UK</span><nav aria-label="Footer navigation"><a href="#services">Services</a><a href="#subjects">Subjects</a><a href="#faqs">FAQs</a><a href="#contact">Contact</a></nav></div></div></footer></body></html>'
head=head.replace('content="assets/img/og-image.webp"','content="'+site_url+'/assets/img/og-image.webp"')
head=head.replace('</head>','<link rel="canonical" href="'+site_url+'/"><meta property="og:url" content="'+site_url+'/"><meta name="twitter:title" content="'+escape(title,quote=True)+'"><meta name="twitter:description" content="'+escape(description,quote=True)+'"><meta name="twitter:image" content="'+site_url+'/assets/img/og-image.webp"></head>')
email_contact=escape(settings['email'])
whatsapp_contact=escape(settings['whatsappDisplay'])
if not settings['contactsAreDemo']:
    email_contact='<a href="mailto:'+escape(settings['email'],quote=True)+'">'+email_contact+'</a>'
    whatsapp_contact='<a href="https://wa.me/'+re.sub(r'\D','',settings['whatsappDisplay'])+'" target="_blank" rel="noopener noreferrer">'+whatsapp_contact+'</a>'
contact=contact.replace('<a class="text-link" href="#requirements">','<div class="demo-contacts"><span class="eyebrow">'+('DEMO CONTACT DETAILS' if settings['contactsAreDemo'] else 'CONTACT THE TEAM')+'</span><p>Email: '+email_contact+'<br>WhatsApp: '+whatsapp_contact+'</p>'+('<small>Placeholder details — replace with your real contacts before launch.</small>' if settings['contactsAreDemo'] else '')+'</div><a class="text-link" href="#requirements">')
(ROOT/'index.html').write_text(head+nav+herohtml+''.join(render_section(s,i) for i,s in enumerate(sections))+contact+footer,encoding='utf-8')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+site_url+'/sitemap.xml\n',encoding='utf-8')
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+site_url+'/</loc></url></urlset>\n',encoding='utf-8')
print(f'Built {len(sections)} sections from {len(r.blocks)} source blocks; original retained in content/original.html')
