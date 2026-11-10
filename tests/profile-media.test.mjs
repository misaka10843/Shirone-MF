import test from "node:test";
import assert from "node:assert/strict";
import {personalityAvatar,musicPlatform} from "../src/utils/profile-media.ts";
test("personality subtypes resolve to their corresponding avatar without accepting arbitrary URLs",()=>{
 assert.match(personalityAvatar("INFJ-T"),/INFJ_male\.png/);
 assert.match(personalityAvatar("enfp-a","female"),/ENFP_female\.png/);
 assert.equal(personalityAvatar("https://example.com"),undefined);
});
test("music logos recognize all five platforms and reject lookalike domains",()=>{
 for(const url of ["https://open.spotify.com/playlist/example","https://y.qq.com/n/ryqq/playlist/123","https://www.kugou.com/song/example","https://music.163.com/#/playlist?id=123","https://music.apple.com/cn/playlist/example"]){assert.ok(musicPlatform(url));}
 assert.equal(musicPlatform("https://music.apple.com.evil.example/"),undefined);
 assert.equal(musicPlatform("javascript:alert(1)"),undefined);
});
