import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base=process.env.TEST_URL||'https://alarongh.github.io/panda-pizza-rush/';
const response=await fetch(base);assert.equal(response.status,200);
const html=await response.text();const references=[...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)].map(m=>m[1]);
assert.ok(references.some(r=>r.endsWith('.js')));assert.ok(references.some(r=>r.endsWith('.css')));
const results=[];
for(const ref of references){
  const url=new URL(ref,base);assert.equal(url.pathname.startsWith('/panda-pizza-rush/'),true);
  const remote=await fetch(url);assert.equal(remote.status,200,`${url}`);
  const bytes=Buffer.from(await remote.arrayBuffer());const local=await readFile(`dist/${ref.slice(2)}`);
  const hash=data=>createHash('sha256').update(data).digest('hex');assert.equal(hash(bytes),hash(local),`Published bytes differ: ${ref}`);
  results.push({path:url.pathname,status:remote.status,bytes:bytes.length,sha256:hash(bytes)});
}
assert.equal(html.includes('Telegram.WebApp'),false);
console.log(JSON.stringify({base,status:response.status,results},null,2));
await writeFile('artifacts/public-assets.json',JSON.stringify({base,status:response.status,results},null,2));
