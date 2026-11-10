import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import sharp from "sharp";
import {optimizeContentImages,rewriteImageReferences} from "../scripts/content/optimize-images.mjs";
test("rewrite local, encoded, relative and query references without changing external URLs",()=>{
 const input='![a](/images/a b.png?raw=1) "../images/a%20b.png#x" https://other.example/images/a%20b.png';
 assert.equal(rewriteImageReferences(input,[["images/a b.png","images/a b.webp"]]),'![a](/images/a b.webp?raw=1) "../images/a%20b.webp#x" https://other.example/images/a%20b.png');
});
test("conversion retains transparent pixels, rewrites content, protects icons and is idempotent",async()=>{
 const root=mkdtempSync(join(tmpdir(),"shirone-images-"));
 try{
  mkdirSync(join(root,"public/images"),{recursive:true});mkdirSync(join(root,"public/icons"));
  const bytes=await sharp({create:{width:8,height:8,channels:4,background:{r:255,g:0,b:0,alpha:.25}}}).png().toBuffer();
  writeFileSync(join(root,"public/images/a.png"),bytes);writeFileSync(join(root,"public/icons/a.png"),bytes);
  writeFileSync(join(root,"post.md"),'![a](/images/a.png)');
  const result=await optimizeContentImages(root);assert.equal(result.converted,1);
  assert.equal(readFileSync(join(root,"post.md"),"utf8"),'![a](/images/a.webp)');
  assert.equal((await sharp(join(root,"public/images/a.webp")).metadata()).hasAlpha,true);
  assert.equal(existsSync(join(root,"public/icons/a.png")),true);
  assert.equal((await optimizeContentImages(root)).converted,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test("animated GIF conversion preserves frame count, timings and loop",async()=>{
 const root=mkdtempSync(join(tmpdir(),"shirone-animation-"));
 try{
  mkdirSync(join(root,"public/images"),{recursive:true});
  const pixels=Buffer.alloc(8*16*4);
  for(let i=0;i<8*16;i++){pixels[i*4+(i<64?0:1)]=255;pixels[i*4+3]=255;}
  const gif=await sharp(pixels,{raw:{width:8,height:16,channels:4,pageHeight:8}}).gif({delay:[100,200],loop:2}).toBuffer();
  writeFileSync(join(root,"public/images/motion.gif"),gif);
  await optimizeContentImages(root);
  const result=await sharp(join(root,"public/images/motion.webp"),{animated:true}).metadata();
  assert.equal(result.pages,2);assert.deepEqual(result.delay,[100,200]);assert.equal(result.loop,2);
 }finally{rmSync(root,{recursive:true,force:true});}
});
