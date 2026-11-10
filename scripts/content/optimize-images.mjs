import {existsSync,readdirSync,readFileSync,mkdirSync,writeFileSync,renameSync,unlinkSync,statSync} from "node:fs";
import {dirname,extname,join,relative,resolve} from "node:path";
import {pathToFileURL} from "node:url";
import sharp from "sharp";
import {resolveContentSource,WORKING_COPY_DIR} from "./resolve-source.mjs";

const posix=path=>path.replaceAll("\\","/");
function files(root){if(!existsSync(root))return [];return readdirSync(root,{withFileTypes:true}).flatMap(e=>e.name===".git"||e.name==="node_modules"?[]:e.isDirectory()?files(join(root,e.name)):e.isFile()?[join(root,e.name)]:[]);}
const raster=/\.(?:png|jpe?g|gif|avif)$/i;
const textual=/\.(?:md|mdx|yaml|yml|ts|js|mjs|json|css|styl|html|svelte|astro)$/i;

/** Preserve external URLs, fragments, query strings and encoded local paths. */
export function rewriteImageReferences(source, mappings){
 const variants=new Map();
 for(const [before,after] of mappings){
  for(const [old,next] of [[before,after],[encodeURI(before),encodeURI(after)]])variants.set(old,next);
 }
 const entries=[...variants].sort((a,b)=>b[0].length-a[0].length);
 // External URLs are not owned by this repository even if their path happens to match.
 return source.split(/(https?:\/\/[^\s"'<>`\])}]+)/g).map((part,index)=>{
  if(index%2)return part;
  for(const [old,next] of entries){
   const escaped=old.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
   part=part.replace(new RegExp(escaped+"(?=$|[\\s\\\"'<>`\\])}?#])","g"),()=>next);
  }
  return part;
 }).join("");
}

export async function optimizeContentImages(root){
 // libvips' operation cache can retain input file handles on Windows.
 sharp.cache(false);
 root=resolve(root);
 const originals=[...files(join(root,"public")),...files(join(root,"assets"))].filter(file=>raster.test(file)&&!/(?:^|[\\/])(?:favicon|icons)(?:[\\/]|$)/i.test(file));
 const mappings=[], converted=[];let before=0,after=0;
 for(const file of originals){
  const ext=extname(file), stem=file.slice(0,-ext.length);
  let target=stem+".webp";
  if(existsSync(target))target=stem+"-"+ext.slice(1).toLowerCase()+".webp";
  if(existsSync(target))throw new Error(`WebP output collision: ${relative(root,target)}`);
  const metadata=await sharp(file,{animated:true}).metadata();
  const data=await sharp(file,{animated:true}).rotate().keepIccProfile().webp({quality:85,lossless:metadata.format!=="jpeg"&&metadata.format!=="avif",effort:4}).toBuffer();
  const result=await sharp(data,{animated:true}).metadata();
  const losesAlpha=metadata.hasAlpha&&!result.hasAlpha&&!(await sharp(file,{animated:true}).stats()).isOpaque;
  if((metadata.pages??1)!==(result.pages??1)||losesAlpha)throw new Error(`Animation/alpha verification failed: ${relative(root,file)}`);
  mkdirSync(dirname(target),{recursive:true});writeFileSync(target+".tmp",data);renameSync(target+".tmp",target);
  const old=posix(relative(root,file)), next=posix(relative(root,target));
  mappings.push([old,next]);
  // Public assets are addressed without their public/ directory prefix.
  if(old.startsWith("public/"))mappings.push([old.slice(7),next.slice(7)]);
  converted.push(file);before+=statSync(file).size;after+=data.length;
 }
 // Rewrite all authored text before removing any original. A failed rewrite leaves originals available.
 let rewrites=0;
 for(const file of files(root).filter(file=>textual.test(file))){
  const original=readFileSync(file,"utf8"),updated=rewriteImageReferences(original,mappings);
  if(original!==updated){writeFileSync(file+".image-tmp",updated);renameSync(file+".image-tmp",file);rewrites++;}
 }
 for(const file of converted)unlinkSync(file);
 return {converted:converted.length,rewrites,before,after};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const source=resolveContentSource();
  if(source.mode!=="external"){console.log("[images] No external content repository; skipped.");}
  else{
   const root=source.source.type==="path"?resolve(source.source.path):resolve(WORKING_COPY_DIR);
   const options=join(root,"image-optimization.json");
   if(!existsSync(options)||JSON.parse(readFileSync(options,"utf8")).enable!==true)console.log("[images] Optimization not enabled by content repository; skipped.");
   else{const result=await optimizeContentImages(root);console.log(`[images] ${result.converted} WebP conversions, ${result.rewrites} reference files; ${result.before} → ${result.after} bytes.`);}
  }
 }catch(error){console.error(`[images] ${error.message}`);process.exitCode=1;}
}
