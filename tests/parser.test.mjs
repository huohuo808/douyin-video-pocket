import test from 'node:test';
import assert from 'node:assert/strict';
import app,{shareURL,videoId,routerData,findVideo,normalize} from '../worker/index.js';
const id='7708667389918858496';
test('识别中文分享文案和作品编号',()=>{assert.equal(shareURL('推荐视频 https://v.douyin.com/abc/ 复制打开抖音').hostname,'v.douyin.com');assert.equal(videoId(new URL('https://www.douyin.com/?modal_id='+id)),id);assert.throws(()=>shareURL('https://douyin.com.evil.test/video/'+id));assert.throws(()=>shareURL('https://user@www.douyin.com/video/'+id));});
test('解析包含转义字符与花括号的路由数据，优先高码率',()=>{const item={aweme_id:id,desc:'嵌套 } 字符 " 和 \\ 都应保留',author:{nickname:'作者'},video:{duration:12000,bit_rate:[{bit_rate:100,play_addr:{url_list:['https://example.invalid/low']}},{bit_rate:800,play_addr:{url_list:['https://example.invalid/high'],width:1920,height:1080}}]}};const root={loaderData:{page:{videoInfoRes:{item_list:[item]}}}};const html='<script>window._ROUTER_DATA = '+JSON.stringify(root)+'; window.next={};</script>';const result=normalize(findVideo(routerData(html),id),id);assert.equal(result.title,item.desc);assert.equal(result.width,1920);assert.equal(result.url,'https://example.invalid/high');assert.equal(result.duration,12);assert.throws(()=>findVideo(root,'1111111111111111111'));});
test('API 拒绝非法链接与非作品下载请求',async()=>{const r=await app.fetch(new Request('https://local/api/parse',{method:'POST',body:JSON.stringify({text:'https://127.0.0.1/private'})}));assert.equal(r.status,400);const media=await app.fetch(new Request('https://local/api/media?id=invalid'));assert.equal(media.status,400);});

test('无水印地址覆盖所有候选，不保留带水印回退',async()=>{
 const {cleanPlaybackURL}=await import('../worker/index.js');
 assert.equal(cleanPlaybackURL('https://aweme.snssdk.com/aweme/v1/playwm/?video_id=abc&ratio=720p'),'https://aweme.snssdk.com/aweme/v1/play/?video_id=abc&ratio=720p');
 assert.equal(cleanPlaybackURL('https://evil.test/aweme/v1/playwm/?video_id=abc'),null);
 const d=normalize({video:{bit_rate:[{bit_rate:800,play_addr:{url_list:['https://aweme.snssdk.com/aweme/v1/playwm/?video_id=high']}}],play_addr:{url_list:['https://aweme.snssdk.com/aweme/v1/playwm/?video_id=backup']}}},id);
 assert.equal(d.watermarkFree,true);assert.equal(d.alternatives.length,2);assert.ok(d.alternatives.every(u=>new URL(u).pathname==='/aweme/v1/play/'));
});

test('识别转义分享链接，拒绝把图文背景音乐当成视频',()=>{
 assert.equal(shareURL(String.raw`复制打开抖音 https\://v.douyin.com/gBjXk_8ZguQ/ cNj:/`).pathname,'/gBjXk_8ZguQ/');
 const audio='https://sf6-cdn-tos.douyinstatic.com/obj/ies-music/example.mp3';
 const note={images:[{width:1440,height:2026}],video:{play_addr:{url_list:['https://aweme.snssdk.com/aweme/v1/playwm/?video_id='+encodeURIComponent(audio)]}}};
 assert.throws(()=>normalize(note,id),/图文作品.*没有可下载的原视频/);
});
