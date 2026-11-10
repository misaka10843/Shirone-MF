import test from "node:test";
import assert from "node:assert/strict";
import {gameAccountEndpoint,normalizeGameAccount,readGameAccountSnapshot} from "../src/utils/game-accounts.ts";
test("UID account providers normalize public profiles across four distinct game schemas",()=>{
 const cases=[
  ["genshin",{playerInfo:{nickname:"A",level:56,showAvatarInfoList:[{}],finishAchievementNum:540}}],
  ["starrail",{detailInfo:{nickname:"B",level:60,avatarDetailList:[{},{}],recordInfo:{achievementCount:10}}}],
  ["zzz",{PlayerInfo:{SocialDetail:{ProfileDetail:{Nickname:"C",Level:50},Desc:"Hi"},ShowcaseDetail:{AvatarList:[{}]}}}],
  ["endfield",{playerInfo:{businessCard:{name:"D",adventureLevel:60,worldLevel:7},charData:[{},{}]}}],
 ];
 for(const [game,value] of cases){const result=normalizeGameAccount(game,"123456789",value);assert.equal(result.status,"ready");assert.ok(result.nickname);assert.ok(result.level);assert.ok(Date.parse(result.nextFetchAt)>Date.parse(result.fetchedAt));}
 assert.equal(normalizeGameAccount("genshin","123456789",{playerInfo:{level:56}}),null);
});
test("UID changes never reuse another account and unsupported sources never fabricate stats",()=>{
 assert.throws(()=>gameAccountEndpoint("genshin","../123"));
 assert.equal(gameAccountEndpoint("arknights","926405128"),undefined);
 const snapshot={schemaVersion:1,items:[{game:"genshin",uid:"123456789",status:"ready",nickname:"Old user",level:56}]};
 const result=readGameAccountSnapshot(snapshot,[{game:"genshin",uid:"987654321"},{game:"arknights",uid:"926405128"}]);
 assert.equal(result[0].status,"unavailable");assert.equal(result[0].nickname,undefined);
 assert.equal(result[1].status,"unsupported");assert.equal(result[1].level,undefined);
});
