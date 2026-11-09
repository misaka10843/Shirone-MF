import assert from "node:assert/strict";
import test from "node:test";
import { selectPostBackdrop } from "../src/utils/post-card-backdrop.ts";
test("backdrop off and an empty fallback pool generate no image",()=>{
 assert.equal(selectPostBackdrop("post","/cover.webp",undefined),"");
 assert.equal(selectPostBackdrop("post","",{enable:true,fallbackImages:[]}),"");
});
test("explicit covers win and fallback sampling is stable per post",()=>{
 const config={enable:true,fallbackImages:["/a.webp","/b.webp"]};
 assert.equal(selectPostBackdrop("post","/cover.webp",config),"/cover.webp");
 assert.equal(selectPostBackdrop("post","",config),selectPostBackdrop("post","",config));
 assert.ok(config.fallbackImages.includes(selectPostBackdrop("post","",config)));
});
