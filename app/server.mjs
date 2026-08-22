import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import {FilePathSource, Input, MP3} from 'mediabunny';
import {createHmac, timingSafeEqual} from 'node:crypto';
import {mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = '/explainer';
const port = Number(process.env.APP_PORT || 4188);
const host = process.env.APP_HOST || '127.0.0.1';
const episodeFile = path.join(root, 'data/episode.json');
const ids = ['hook','definition','purpose','mechanism','example','real-use','variants','payoff'];
const music = Array.from({length: 5}, (_, i) => `audio/Tech_music_background${i + 1}.mp3`);
const voices = [
  ['n_haiphong_male_quyen12334_zero_shot_education_vc','Quyền · Nam Hải Phòng'],
  ['n_hanoi_male_protrainer_education_vc','Nam Hà Nội · Giáo dục'],
  ['n_hanoi_male_thangchuyennghiep_advertise_vc','Thắng · Nam Hà Nội'],
  ['n_namdinh_male_haichuyen20251209185109485_book_vc','Hải · Nam Nam Định'],
  ['n_hanoi_male_sizonguyen_education_vc','Sĩ Zô · Nam Hà Nội'],
  ['n_hanoi_female_nguyetnga2_book_vc','Nguyệt Nga · Nữ Hà Nội'],
  ['hn_female_ngochuyen_full_48k-fhg','Ngọc Huyền · Nữ Hà Nội · Review'],
  ['hn_male_manhdung_full_24k-st','Mạnh Dũng 2.0 · Nam Hà Nội · Quảng cáo'],
  ['hn_male_minhquan_yt_24k-pre','Minh Quân Pro · Nam Hà Nội · Công nghệ'],
  ['sg_female_tuongvy_call_44k-fhg','Tường Vy · Nữ Sài Gòn · Hướng dẫn'],
];
const defaultCharacters = {
  hook:'Speaking1.png', definition:'pointing left1.png', purpose:'Speaking2.png',
  mechanism:'pointing right1.png', example:'pointing left2.png',
  'real-use':'Speaking3.png', variants:'questioning2.png', payoff:'Speaking1.png',
};
const username = process.env.APP_USERNAME || 'admin';
const password = process.env.APP_PASSWORD || 'admin123';
const secret = process.env.SESSION_SECRET || 'change-this-session-secret';
// Dùng chung cookie với cổng chính để người dùng chỉ phải đăng nhập một lần.
const cookieName = 'dqtech_session';

await Promise.all(['output','public/audio/scenes','public/images/uploads','public/images/thumbnail'].map((dir) => mkdir(path.join(root, dir), {recursive: true})));
const characters = (await readdir(path.join(root, 'public/characters'))).filter((f) => f.toLowerCase().endsWith('.png')).sort();
const logos = (await readdir(path.join(root,'public/logo'))).filter((file)=>/\.(png|jpe?g|webp|svg)$/i.test(file)).sort().map((file)=>`logo/${file}`);
app.use(express.json({limit: '3mb'}));
app.use((req,res,next) => {
  if (req.url === basePath) return res.redirect(`${basePath}/`);
  if (req.url.startsWith(`${basePath}/`)) req.url = req.url.slice(basePath.length);
  next();
});

const sign = (user, expires) => {
  const payload = `${user}.${expires}`;
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
};
const authenticated = (req) => {
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((v) => v.trim().split('=')).filter(([k,v]) => k && v));
  const [user, expires, signature] = String(cookies[cookieName] || '').split('.');
  if (!user || !expires || !signature || Number(expires) < Date.now() || user !== username) return false;
  const expected = sign(user, expires).split('.').at(-1);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};
app.get('/login', (_req,res) => res.sendFile(path.join(root,'app/public/login.html')));
app.get('/login.css', (_req,res) => res.sendFile(path.join(root,'app/public/login.css')));
app.get('/login-logo.png', (_req,res) => res.sendFile(path.join(root,'app/public/DQTENCH (no background).png')));
app.post('/api/login', (req,res) => {
  const supplied = Buffer.from(String(req.body?.password || '')), expected = Buffer.from(password);
  if (String(req.body?.username || '') !== username || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return res.status(401).json({error:'Sai tên đăng nhập hoặc mật khẩu.'});
  const maxAge = 60 * 60 * 12, expires = Date.now() + maxAge * 1000;
  res.setHeader('Set-Cookie',`${cookieName}=${sign(username,expires)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
  res.json({ok:true});
});
app.post('/api/logout', (_req,res) => {res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);res.json({ok:true})});
app.use((req,res,next) => {
  if (req.path === '/api/health' || authenticated(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({error:'Phiên đăng nhập đã hết hạn.'});
  return res.redirect(`${basePath}/login`);
});
app.use(express.static(path.join(root,'app/public')));
app.use('/media',express.static(path.join(root,'public')));
app.use('/characters',express.static(path.join(root,'public/characters')));
app.get('/brand-logo.png',(_req,res)=>res.sendFile(path.join(root,'app/public/DQTENCH (no background).png')));

const clean = (value) => String(value ?? '').trim();
const pencilImagePrompt = (scene) => `Square 1:1 pencil sketch of ${clean(scene.visualDescription)}. Handwritten note-taking infographic on textured white paper, graphite lines, hand-drawn arrows, circles and underlines, short handwritten keywords only, clean centered composition, no logo or watermark.`;
const normalizeImagePrompt = (scene) => {
  const current=clean(scene.imagePrompt);
  return !current||/(?:vertical|9\s*:\s*16|cinematic|realistic\s*3d)/i.test(current)?pencilImagePrompt(scene):current;
};
const normalize = (body) => {
  if (!body || !clean(body.topic)) throw new Error('Chủ đề không được để trống.');
  if (!Array.isArray(body.scenes) || body.scenes.length !== 8) throw new Error('Video phải có đúng 8 scene.');
  const scenes = body.scenes.map((scene,index) => {
    if (scene.id !== ids[index]) throw new Error(`Scene ${index + 1} phải có ID ${ids[index]}.`);
    if (!clean(scene.title) || !clean(scene.narration)) throw new Error(`Scene ${index + 1} thiếu title hoặc narration.`);
    return {...scene,title:clean(scene.title),narration:clean(scene.narration),visualDescription:clean(scene.visualDescription),imagePrompt:normalizeImagePrompt(scene),image:clean(scene.image),audio:clean(scene.audio),character:characters.includes(clean(scene.character))?clean(scene.character):undefined,audioDuration:Number(scene.audioDuration)||undefined};
  });
  const logoValue=typeof body.visualSettings?.logo==='string'?body.visualSettings.logo:body.visualSettings?.logo?.src;
  const selectedLogo=logoValue==null?'logo/logo.png':clean(logoValue);
  return {...body,topic:clean(body.topic),audience:clean(body.audience),language:clean(body.language),style:clean(body.style),promptTemplate:clean(body.promptTemplate),scenes,voiceCode:clean(body.voiceCode)||voices[0][0],speedRate:Math.max(.7,Math.min(1.4,Number(body.speedRate)||1)),backgroundMusic:music.includes(body.backgroundMusic)?body.backgroundMusic:'',audioSettings:{musicWithVoice:Math.max(0,Math.min(1,Number(body.audioSettings?.musicWithVoice??.12))),voice:Math.max(0,Math.min(1.5,Number(body.audioSettings?.voice??1)))},visualSettings:{logo:selectedLogo===''?'':logos.includes(selectedLogo)?selectedLogo:'logo/logo.png'}};
};
const readEpisode = async () => normalize(JSON.parse(await readFile(episodeFile,'utf8')));
const saveEpisode = async (body) => {const episode=normalize(body);await writeFile(episodeFile,`${JSON.stringify(episode,null,2)}\n`);return episode};
const makePrompts = (episode) => episode.scenes.map((scene)=>({...scene,imagePrompt:pencilImagePrompt(scene)}));
app.get('/api/health',(_req,res)=>res.json({status:'ok'}));
app.get('/api/config',(_req,res)=>res.json({music,voices,characters,logos,defaultCharacters,defaultVoice:process.env.VBEE_VOICE_CODE||voices[0][0]}));
app.get('/api/episode',async(_req,res,next)=>{try{res.json(await readEpisode())}catch(e){next(e)}});
app.put('/api/episode',async(req,res,next)=>{try{res.json(await saveEpisode(req.body))}catch(e){next(e)}});
app.post('/api/prompts',(req,res,next)=>{try{const episode=normalize(req.body);res.json({...episode,scenes:makePrompts(episode)})}catch(e){next(e)}});
app.post('/api/content/generate',async(req,res,next)=>{try{
  const topic=clean(req.body?.topic).slice(0,120);
  if(!topic)throw new Error('Hãy nhập từ khóa hoặc chủ đề cần giải thích.');
  const apiKey=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;
  if(!apiKey)throw new Error('Chưa cấu hình GEMINI_API_KEY trong .env.');
  const labels=['Hook','Định nghĩa','Mục đích','Cách hoạt động','Ví dụ','Ứng dụng','Biến thể','Câu kết'];
  const basePrompt=`Viết nội dung tiếng Việt cho video giải thích khái niệm "${topic}" có thời lượng render mục tiêu khoảng 60 giây. Video gồm đúng 8 scene theo thứ tự: Hook, Định nghĩa, Mục đích, Cách hoạt động, Ví dụ, Ứng dụng thực tế, Các biến thể, Câu kết. Tổng narration của 8 scene bắt buộc từ 215 đến 235 từ tiếng Việt. Scene 1-7 nên dài 27-32 từ; scene 8 dài 12-18 từ. Mỗi narration tự nhiên, dễ đọc thành voice-over, chỉ truyền đạt một ý và nối tiếp logic với scene trước. Không mở đầu hai scene bằng cùng cấu trúc, không lặp lại tên chủ đề hoặc thông tin quá nhiều. Scene 5 phải có ví dụ hay dữ liệu cụ thể. Scene 8 ngắn và dễ nhớ. title của mỗi scene bắt buộc là một cụm nội dung chính bằng tiếng Việt gồm 2-4 từ. title phải tóm tắt đúng ý riêng của scene, ví dụ "Ngắt điện an toàn", "Bảo vệ quá tải", "Dòng điện ổn định"; tuyệt đối không dùng tên cấu trúc như "Hook", "Định nghĩa", "Mục đích", "Cách hoạt động", "Ví dụ", "Ứng dụng", "Biến thể" hoặc "Câu kết" làm title. visualDescription mô tả rõ hình minh họa, không mô tả chữ trong ảnh. Chỉ trả dữ liệu đúng schema JSON.`;
  const schema={type:'OBJECT',required:['topic','scenes'],properties:{topic:{type:'STRING'},scenes:{type:'ARRAY',minItems:8,maxItems:8,items:{type:'OBJECT',required:['title','narration','visualDescription'],properties:{title:{type:'STRING'},narration:{type:'STRING'},visualDescription:{type:'STRING'}}}}}};
  const model=process.env.GEMINI_TEXT_MODEL||'gemini-3.5-flash-lite';
  const endpoint=`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`;
  const countWords=(value)=>clean(value).split(/\s+/).filter(Boolean).length;
  let generated,totalWords=0,feedback='',invalidTitles=[],bestGenerated,bestTotalWords=0,bestScore=Infinity;
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(endpoint,{method:'POST',headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:`${basePrompt}${feedback}`}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.65}})});
    const result=await response.json();
    if(!response.ok)throw new Error(result?.error?.message||`Google Gemini HTTP ${response.status}`);
    const text=result?.candidates?.[0]?.content?.parts?.map((part)=>part.text||'').join('').trim();
    if(!text)throw new Error('Google Gemini không trả về nội dung JSON.');
    generated=JSON.parse(text);
    totalWords=Array.isArray(generated.scenes)?generated.scenes.reduce((sum,scene)=>sum+countWords(scene.narration),0):0;
    invalidTitles=Array.isArray(generated.scenes)?generated.scenes.map((scene,index)=>({index,title:clean(scene.title),words:countWords(scene.title)})).filter((item)=>item.words<2||item.words>4||labels.some((label)=>label.toLowerCase()===item.title.toLowerCase())):[];
    const durationPenalty=totalWords<215?215-totalWords:totalWords>235?totalWords-235:0,score=durationPenalty+invalidTitles.length*25;
    if(score<bestScore){bestScore=score;bestGenerated=generated;bestTotalWords=totalWords}
    if(totalWords>=215&&totalWords<=235&&invalidTitles.length===0)break;
    const wordFeedback=totalWords<215?'Tổng narration cần viết chi tiết hơn.':totalWords>235?'Tổng narration cần rút gọn hơn.':'';
    const titleFeedback=invalidTitles.length?` Title chưa đạt ở scene ${invalidTitles.map((item)=>item.index+1).join(', ')}; mỗi title phải là cụm nội dung chính 2-4 từ và không được trùng label.`:'';
    feedback=`\nBản trước có ${totalWords} từ. ${wordFeedback}${titleFeedback} Hãy viết lại toàn bộ và tuân thủ chính xác mọi giới hạn.`;
  }
  if(bestGenerated){generated=bestGenerated;totalWords=bestTotalWords}
  if(!Array.isArray(generated.scenes)||generated.scenes.length!==8)throw new Error('Google Gemini không trả về đủ 8 scene.');
  const fallbackTitles=['Vấn đề thực tế','Khái niệm cốt lõi','Lợi ích chính','Nguyên lý vận hành','Ví dụ cụ thể','Ứng dụng phổ biến','Các phiên bản','Điểm cần nhớ'];
  const compactTitle=(value,index)=>{const title=clean(value),words=title.split(/\s+/).filter(Boolean);if(words.length>=2&&!labels.some((label)=>label.toLowerCase()===title.toLowerCase())){if(words.length<=4)return title;const compact=words.filter((word)=>!/^(?:là|của|và|cho|để|một)$/i.test(word));return compact.slice(0,4).join(' ')}return fallbackTitles[index]};
  const scenes=generated.scenes.map((scene,index)=>{const base={id:ids[index],label:labels[index],title:compactTitle(scene.title,index),narration:clean(scene.narration),visualDescription:clean(scene.visualDescription)};return {...base,imagePrompt:pencilImagePrompt(base)}});
  const estimatedDuration=Math.round((totalWords/4.3+7.2)*10)/10;
  res.json({topic:clean(generated.topic)||topic,scenes,contentStats:{totalWords,estimatedDuration}});
}catch(e){next(e)}});
app.post('/api/social-caption',async(req,res,next)=>{try{
  const topic=clean(req.body?.topic).slice(0,120);
  if(!topic)throw new Error('Chưa có chủ đề để tạo caption.');
  const apiKey=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;
  if(!apiKey)throw new Error('Chưa cấu hình GEMINI_API_KEY trong .env.');
  const schema={type:'OBJECT',required:['caption','keywords','hashtags'],properties:{caption:{type:'STRING'},keywords:{type:'ARRAY',items:{type:'STRING'}},hashtags:{type:'ARRAY',items:{type:'STRING'}}}};
  const prompt=`Viết caption tiếng Việt để đăng mạng xã hội cho video ngắn giải thích chủ đề "${topic}". Caption tự nhiên, tạo tò mò, nêu giá trị người xem nhận được và có lời kêu gọi xem hoặc lưu video. Caption bắt buộc dài từ 42 đến tối đa 50 từ, không tính từ khóa và hashtag. Trả thêm 4-6 từ khóa tìm kiếm và 5-7 hashtag liên quan; bắt buộc có hashtag DQTECH. Hashtag không chứa khoảng trắng.`;
  const model=process.env.GEMINI_TEXT_MODEL||'gemini-3.5-flash-lite';
  let generated,caption='',wordCount=0,feedback='';
  for(let attempt=0;attempt<2;attempt++){
    const response=await fetch(`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:`${prompt}${feedback}`}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.7}})});
    const result=await response.json();
    if(!response.ok)throw new Error(result?.error?.message||`Google Gemini HTTP ${response.status}`);
    const text=result?.candidates?.[0]?.content?.parts?.map((part)=>part.text||'').join('').trim();
    if(!text)throw new Error('Google Gemini không trả về caption.');
    generated=JSON.parse(text);caption=clean(generated.caption);wordCount=caption.split(/\s+/).filter(Boolean).length;
    if(wordCount>=42&&wordCount<=50)break;
    feedback=`\nCaption trước có ${wordCount} từ. Hãy viết lại để caption nằm trong 42-50 từ.`;
  }
  if(wordCount>50)caption=caption.split(/\s+/).slice(0,50).join(' ').replace(/[,:;-]+$/,'')+'…';
  const keywords=(generated.keywords||[]).map(clean).filter(Boolean).slice(0,6),hashtags=(generated.hashtags||[]).map((tag)=>`#${clean(tag).replace(/^#+/,'').replace(/\s+/g,'')}`).filter((tag)=>tag.length>1).slice(0,7);
  if(!hashtags.some((tag)=>tag.toLowerCase()==='#dqtech'))hashtags.unshift('#DQTECH');
  res.json({caption,keywords,hashtags,text:`${caption}\n\n${hashtags.slice(0,7).join(' ')}`});
}catch(e){next(e)}});

const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024},fileFilter:(_req,file,cb)=>cb(null,file.mimetype.startsWith('image/'))});
const imageExtension=(mime,original='')=>mime.includes('jpeg')?'jpg':mime.includes('webp')?'webp':mime.includes('svg')?'svg':path.extname(original).toLowerCase().replace('.','')||'png';
const removeSceneImages=async(id)=>{const directory=path.join(root,'public/images/uploads');const files=await readdir(directory);await Promise.all(files.filter((file)=>file===id||file.startsWith(`${id}.`)||file.startsWith(`${id}-`)).map((file)=>rm(path.join(directory,file),{force:true})))};
app.post('/api/scenes/:id/image',upload.single('image'),async(req,res,next)=>{try{if(!ids.includes(req.params.id)||!req.file)throw new Error('Ảnh hoặc scene không hợp lệ.');const extension=imageExtension(req.file.mimetype,req.file.originalname);await removeSceneImages(req.params.id);const relative=`images/uploads/${req.params.id}.${extension}`;await writeFile(path.join(root,'public',relative),req.file.buffer);const episode=await readEpisode(),scene=episode.scenes.find((s)=>s.id===req.params.id);scene.image=relative;await saveEpisode(episode);res.json({path:relative})}catch(e){next(e)}});
app.post('/api/thumbnail',upload.single('thumbnail'),async(req,res,next)=>{try{if(!req.file)throw new Error('Chưa có dữ liệu thumbnail.');const relative='images/thumbnail/thumbnail.png';await writeFile(path.join(root,'public',relative),req.file.buffer);const episodeNumber=Math.max(1,Number(req.body?.episodeNumber)||1),title=(clean(req.body?.title)||'Chủ đề là gì?').replace(/[\\/<>|*"\x00-\x1f]/g,'').slice(0,100);const fileName=`Tập ${episodeNumber}: ${title}.png`;res.json({path:relative,fileName,downloadUrl:`${basePath}/media/${relative}?v=${Date.now()}`})}catch(e){next(e)}});
const generateSceneImage=async(scene)=>{
  const apiKey=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;
  if(!apiKey)throw new Error('Chưa cấu hình GEMINI_API_KEY trong .env.');
  const sourcePrompt=clean(scene.imagePrompt)||clean(scene.visualDescription);
  const prompt=`${sourcePrompt}\nUse this final visual style even if earlier wording conflicts: square 1:1 pencil sketch on textured white notebook paper, hand-drawn technical diagram, natural graphite lines, handwritten note-taking layout, arrows, circles and underlines. Short handwritten keywords only; no long sentences, digital typography, logo or watermark. Centered subject with safe margins.`;
  const model=process.env.GEMINI_IMAGE_MODEL||'gemini-3.1-flash-image';
  const endpoint=`${process.env.GEMINI_API_URL||'https://generativelanguage.googleapis.com/v1/models'}/${encodeURIComponent(model)}:generateContent`;
  const aspectRatios={'1:1':'ASPECT_RATIO_ONE_BY_ONE','2:3':'ASPECT_RATIO_TWO_BY_THREE','3:2':'ASPECT_RATIO_THREE_BY_TWO','3:4':'ASPECT_RATIO_THREE_BY_FOUR','4:3':'ASPECT_RATIO_FOUR_BY_THREE','4:5':'ASPECT_RATIO_FOUR_BY_FIVE','5:4':'ASPECT_RATIO_FIVE_BY_FOUR','9:16':'ASPECT_RATIO_NINE_BY_SIXTEEN','16:9':'ASPECT_RATIO_SIXTEEN_BY_NINE','21:9':'ASPECT_RATIO_TWENTY_ONE_BY_NINE'};
  const imageSizes={'512':'IMAGE_SIZE_FIVE_TWELVE','1K':'IMAGE_SIZE_ONE_K','2K':'IMAGE_SIZE_TWO_K','4K':'IMAGE_SIZE_FOUR_K'};
  const aspectRatio=aspectRatios[process.env.GEMINI_IMAGE_ASPECT_RATIO]||process.env.GEMINI_IMAGE_ASPECT_RATIO||'ASPECT_RATIO_ONE_BY_ONE';
  const imageSize=imageSizes[process.env.GEMINI_IMAGE_SIZE]||process.env.GEMINI_IMAGE_SIZE||'IMAGE_SIZE_FIVE_TWELVE';
  const response=await fetch(endpoint,{method:'POST',headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['IMAGE'],responseFormat:{image:{aspectRatio,imageSize}}}})});
  const result=await response.json();
  if(!response.ok)throw new Error(result?.error?.message||`Image API HTTP ${response.status}`);
  const parts=result?.candidates?.[0]?.content?.parts||[];
  const imagePart=parts.find((part)=>part.inlineData?.data||part.inline_data?.data);
  const inlineData=imagePart?.inlineData||imagePart?.inline_data;
  const base64=inlineData?.data;
  if(!base64)throw new Error(result?.promptFeedback?.blockReason?`Google chặn prompt: ${result.promptFeedback.blockReason}`:'Google Image API không trả về dữ liệu ảnh.');
  const mime=inlineData?.mimeType||inlineData?.mime_type||'image/png';
  const extension=mime.includes('jpeg')?'jpg':mime.includes('webp')?'webp':'png';
  await removeSceneImages(scene.id);
  const relative=`images/uploads/${scene.id}.${extension}`;
  await writeFile(path.join(root,'public',relative),Buffer.from(base64,'base64'));
  return relative;
};
app.post('/api/images/:id/generate',async(req,res,next)=>{try{if(!ids.includes(req.params.id))throw new Error('Scene không hợp lệ.');const episode=await saveEpisode(req.body.episode||await readEpisode()),scene=episode.scenes.find((item)=>item.id===req.params.id);if(clean(req.body.prompt))scene.imagePrompt=clean(req.body.prompt);scene.image=await generateSceneImage(scene);await saveEpisode(episode);res.json({path:scene.image})}catch(e){next(e)}});
app.post('/api/images/generate-all',async(req,res,next)=>{try{const episode=await saveEpisode(req.body),generated=new Array(episode.scenes.length);let cursor=0;const worker=async()=>{while(cursor<episode.scenes.length){const index=cursor++;generated[index]=await generateSceneImage(episode.scenes[index])}};const settled=await Promise.allSettled(Array.from({length:2},worker)),failed=settled.find((item)=>item.status==='rejected');if(failed?.status==='rejected')throw failed.reason;episode.scenes.forEach((scene,index)=>scene.image=generated[index]);res.json({episode:await saveEpisode(episode)})}catch(e){next(e)}});

const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
async function speech(text,voiceCode,speedRate){const token=process.env.VBEE_ACCESS_TOKEN,appId=process.env.VBEE_APP_ID;if(!token||!appId)throw new Error('Thiếu VBEE_APP_ID hoặc VBEE_ACCESS_TOKEN trong .env');const response=await fetch('https://vbee.vn/api/v1/tts',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({app_id:appId,input_text:text,voice_code:voiceCode,audio_type:'mp3',speed_rate:speedRate,callback_url:'https://example.com/vbee-callback'})});const created=await response.json();if(!response.ok||created.status!==1)throw new Error(created.error_message||`Vbee HTTP ${response.status}`);if(created.result?.audio_link)return created.result.audio_link;const requestId=created.result?.request_id;for(let i=0;i<45;i++){await sleep(2000);const poll=await fetch(`https://vbee.vn/api/v1/tts/${requestId}`,{headers:{Authorization:`Bearer ${token}`}});if(!poll.ok)continue;const state=await poll.json();if(state.result?.status==='SUCCESS'&&state.result.audio_link)return state.result.audio_link;if(state.result?.status==='FAILURE')throw new Error('Vbee xử lý voice thất bại.')}throw new Error('Vbee quá thời gian chờ 90 giây.')}
async function duration(file){const input=new Input({formats:[MP3],source:new FilePathSource(file)});try{return await input.computeDuration()}finally{input.dispose()}}
app.post('/api/voice',async(req,res,next)=>{try{const episode=await saveEpisode(req.body),results=new Array(8);let cursor=0;const worker=async()=>{while(cursor<8){const index=cursor++,scene=episode.scenes[index],url=await speech(scene.narration,episode.voiceCode,episode.speedRate),download=await fetch(url);if(!download.ok)throw new Error(`Không tải được voice scene ${index+1}.`);const file=path.join(root,`public/audio/scenes/${scene.id}.mp3`);await writeFile(file,Buffer.from(await download.arrayBuffer()));results[index]={audio:`audio/scenes/${scene.id}.mp3`,audioDuration:await duration(file)}}};const settled=await Promise.allSettled(Array.from({length:3},worker)),failed=settled.find((x)=>x.status==='rejected');if(failed?.status==='rejected')throw failed.reason;episode.scenes.forEach((scene,index)=>Object.assign(scene,results[index]));res.json(await saveEpisode(episode))}catch(e){next(e)}});

const runRemotion=(args)=>new Promise((resolve,reject)=>{const child=spawn('npx',['remotion',...args],{cwd:root});let log='';child.stdout.on('data',(d)=>log=(log+d).slice(-6000));child.stderr.on('data',(d)=>log=(log+d).slice(-6000));child.on('close',(code)=>code===0?resolve():reject(new Error(`Render thất bại.\n${log}`)))});
const mediaExists=async(relative)=>{if(!clean(relative))return false;const publicRoot=path.join(root,'public'),target=path.resolve(publicRoot,relative);if(!target.startsWith(`${publicRoot}${path.sep}`))return false;try{return (await stat(target)).isFile()}catch{return false}};
app.post('/api/render',async(req,res,next)=>{try{
  const episode=await saveEpisode(req.body);
  const imageChecks=await Promise.all(episode.scenes.map((scene)=>mediaExists(scene.image))),audioChecks=await Promise.all(episode.scenes.map((scene)=>mediaExists(scene.audio)));
  const missingImages=episode.scenes.filter((_scene,index)=>!imageChecks[index]),missingAudio=episode.scenes.filter((_scene,index)=>!audioChecks[index]);
  if(missingImages.length||missingAudio.length){const details=[];if(missingImages.length)details.push(`chưa có ảnh: ${missingImages.map((scene)=>scene.label).join(', ')}`);if(missingAudio.length)details.push(`chưa có voice: ${missingAudio.map((scene)=>scene.label).join(', ')}`);throw new Error(`Chưa thể render — ${details.join('; ')}. Hãy hoàn tất media trước.`)}
  const episodeNumber=Math.max(1,Number(episode.thumbnail?.episodeNumber)||1);
  const defaultQuestion=`${episode.topic.replace(/[?.!]+$/,'')} là gì?`;
  const question=(clean(episode.thumbnail?.title)||defaultQuestion).replace(/[\\/<>|*"\x00-\x1f]/g,'').trim().slice(0,100);
  const file=`Tập ${episodeNumber} : ${question}.mp4`;
  await runRemotion(['render','src/index.ts','EXPLAINER-VIDEO',`output/${file}`]);
  res.json({ok:true,fileName:file,downloadUrl:`${basePath}/download/video?file=${encodeURIComponent(file)}`});
}catch(e){next(e)}});
app.get('/download/video',async(req,res)=>{const file=path.basename(clean(req.query.file));if(!file.endsWith('.mp4'))return res.status(400).send('Tên file không hợp lệ.');const target=path.join(root,'output',file);try{await stat(target);res.download(target,file)}catch{res.status(404).send('Video chưa tồn tại.')}});
app.use((error,_req,res,_next)=>res.status(400).json({error:error.message||'Có lỗi xảy ra.'}));
app.listen(port,host,()=>console.log(`DQ Tech Concept Creator: http://${host}:${port}`));
