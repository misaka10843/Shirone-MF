import test from "node:test";
import assert from "node:assert/strict";
import {normalizeBangumiGame,matchVisualNovel,enrichGame,parseGameSnapshot} from "../src/utils/game-collection.ts";
const row={type:4,rate:8,subject:{id:10,type:4,name:"Game",images:{large:"https://example.com/cover.png"}}};
test("Bangumi preserves paused/dropped progress and personal score scale",()=>{
 assert.equal(normalizeBangumiGame(row).status,"onHold");
 assert.equal(normalizeBangumiGame({...row,type:5}).status,"dropped");
 assert.equal(normalizeBangumiGame(row).rating,4);
 assert.equal(normalizeBangumiGame({...row,subject:{...row.subject,type:2}}),null);
});
test("VNDB requires unique exact title/alias or explicit ID, never borrows another collection",()=>{
 const vn={id:"v10",title:"Other",aliases:["Game"],developers:[{name:"Studio"}]};
 assert.equal(matchVisualNovel([vn],["Game"]),vn);
 assert.equal(matchVisualNovel([vn,{...vn,id:"v20"}],["Game"]),null);
 assert.equal(matchVisualNovel([vn],["Similar Game"]),null);
 const game=normalizeBangumiGame(row), merged=enrichGame(game,vn);
 assert.equal(merged.status,game.status);assert.equal(merged.rating,4);
 assert.equal(merged.sources.vndb,"https://vndb.org/v10");
 assert.equal(parseGameSnapshot({schemaVersion:1,accountRef:"someone",items:[merged]},"me").length,0);
 assert.equal(parseGameSnapshot({schemaVersion:1,accountRef:"me",items:[{...merged,status:"fake"}]},"me").length,0);
});
