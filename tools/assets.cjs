const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.join(__dirname,'..');
async function main(){
 fs.mkdirSync(path.join(root,'assets/vendor'),{recursive:true});
 for(const [from,to] of [['bootstrap/dist/css/bootstrap.min.css','bootstrap.min.css'],['bootstrap/dist/js/bootstrap.bundle.min.js','bootstrap.bundle.min.js']]) fs.copyFileSync(require.resolve(from),path.join(root,'assets/vendor',to));
 const photos=[['students','photo-1523240795612-9a054b0db644',1100,1250],['library','photo-1507842217343-583bb7270b66',1400,933],['campus','photo-1541339907198-e08756dedf3f',1400,933]];
 for(const [name,id,width,height] of photos){
  const response=await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`);
  if(!response.ok) throw Error(`Image download failed: ${name} ${response.status}`);
  await sharp(Buffer.from(await response.arrayBuffer())).resize(width,height,{fit:'cover'}).webp({quality:82}).toFile(path.join(root,`assets/img/${name}.webp`));
 }
 const mark=fs.readFileSync(path.join(root,'assets/img/logo-mark.svg'));
 await sharp(mark).resize(180,180).png().toFile(path.join(root,'assets/img/apple-touch-icon.png'));
 await sharp(mark).resize(32,32).png().toFile(path.join(root,'assets/img/favicon.png'));
 const base=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#152c29"/><circle cx="1140" cy="-30" r="260" fill="#24413b"/><circle cx="1130" cy="640" r="300" fill="#24413b"/><rect x="68" y="68" width="76" height="76" rx="20" fill="#c9f06b"/><path d="M84 91q13-5 22 3 9-8 22-3v32q-13-5-22 3-9-8-22-3Z M106 94v32" fill="none" stroke="#152c29" stroke-width="3"/><text x="166" y="107" font-family="Arial,sans-serif" font-size="38" font-weight="bold" fill="#fff">researchhub</text><text x="169" y="134" font-family="Arial,sans-serif" font-size="14" letter-spacing="5" fill="#c9f06b">UNITED KINGDOM</text><text x="68" y="245" font-family="Arial,sans-serif" font-size="16" letter-spacing="4" fill="#c9f06b">YOUR RELIABLE WRITING ASSISTANT</text><text x="64" y="325" font-family="Arial,sans-serif" font-size="57" font-weight="bold" fill="#fff">Academic writing.</text><text x="64" y="395" font-family="Arial,sans-serif" font-size="57" font-weight="bold" fill="#fff">Research support.</text><text x="68" y="462" font-family="Arial,sans-serif" font-size="22" fill="#cbd8ce">Tailored to UK university requirements.</text><rect x="68" y="522" width="240" height="48" rx="8" fill="#c9f06b"/><text x="87" y="553" font-family="Arial,sans-serif" font-size="17" font-weight="bold" fill="#152c29">Research Hub UK</text></svg>`);
 const photo=await sharp(path.join(root,'assets/img/students.webp')).resize(340,440,{fit:'cover'}).composite([{input:Buffer.from('<svg width="340" height="440"><rect width="340" height="440" rx="100" fill="white"/></svg>'),blend:'dest-in'}]).png().toBuffer();
 await sharp(base).composite([{input:photo,left:805,top:110}]).webp({quality:90}).toFile(path.join(root,'assets/img/og-image.webp'));
 fs.copyFileSync(require.resolve('bootstrap/LICENSE'),path.join(root,'assets/vendor/bootstrap-LICENSE.txt'));
 console.log('Local Bootstrap, three WebP photographs, logo, favicon and OG image ready.');
}
main().catch(e=>{console.error(e);process.exit(1)});
