const $ = (s) => document.querySelector(s);
const BASE_PATH = "/explainer";
let episode = null,
  config = null;
const masterPrompt = `Hãy viết nội dung cho một video ngắn giải thích khái niệm “[Modbus]”.

Yêu cầu nội dung:

- Viết bằng tiếng Việt tự nhiên, dễ hiểu, phù hợp giọng đọc video ngắn.
- Video có đúng 8 scene theo thứ tự: Hook, Định nghĩa, Mục đích, Cách hoạt động, Ví dụ, Ứng dụng thực tế, Các biến thể, Câu kết.
- Toàn bộ 8 scene phải tạo thành một mạch giải thích liên tục, giống như một người đang kể và dẫn dắt người xem từ khái niệm cơ bản đến ứng dụng thực tế.
- Video có thời lượng render mục tiêu khoảng 60 giây.
- Tổng narration của 8 scene bắt buộc từ 215–235 từ tiếng Việt.
- Narration của scene 1–7 dài khoảng 27–32 từ; scene 8 dài khoảng 12–18 từ và mỗi scene chỉ truyền đạt một ý chính.
- Scene sau nên nối tiếp logic với scene trước, có thể sử dụng các cách chuyển ý tự nhiên như: “Hiểu đơn giản…”, “Nhờ vậy…”, “Khi hoạt động…”, “Ví dụ…”, “Trong thực tế…”, “Tùy cách kết nối…”.
- Không bắt buộc phải nhắc lại từ “[Modbus]” ở mỗi scene. Chỉ sử dụng tên khái niệm khi thực sự cần thiết để câu rõ nghĩa.
- Hạn chế tối đa việc lặp lại cùng một từ hoặc cùng một cấu trúc câu giữa các scene.
- Tránh các câu máy móc kiểu “Modbus là…”, “Modbus dùng để…”, “Modbus có…”, nếu có thể diễn đạt tự nhiên hơn.
- Không lặp lại cùng một thông tin ở nhiều scene.
- Ưu tiên câu ngắn, nhịp nói tự nhiên, dễ đọc thành voice-over.
- Không sử dụng quá nhiều thuật ngữ kỹ thuật trong cùng một câu. Nếu cần thuật ngữ, giải thích bằng ngôn ngữ đơn giản.

Yêu cầu từng scene:

- title của mỗi scene phải là cụm nội dung chính gồm 2–4 từ, tóm tắt đúng ý của scene.
- Không được dùng các tên bước “Hook”, “Định nghĩa”, “Mục đích”, “Cách hoạt động”, “Ví dụ”, “Ứng dụng”, “Biến thể” hoặc “Câu kết” làm title.
- Ví dụ title hợp lệ: “Ngắt điện an toàn”, “Bảo vệ quá tải”, “Dòng điện ổn định”.

- Scene 1 – Hook: tạo sự tò mò hoặc đặt một câu hỏi thực tế liên quan đến việc các thiết bị công nghiệp giao tiếp với nhau.
- Scene 2 – Định nghĩa: giải thích khái niệm bằng ngôn ngữ đơn giản, không quá học thuật.
- Scene 3 – Mục đích: giải thích vấn đề mà công nghệ này giúp giải quyết, tránh lặp lại định nghĩa.
- Scene 4 – Cách hoạt động: mô tả nguyên lý chính theo cách dễ hình dung, không đi quá sâu vào kỹ thuật.
- Scene 5 – Ví dụ: phải có một ví dụ cụ thể, dữ liệu cụ thể hoặc tình huống thực tế giúp người xem hình dung cách nó hoạt động.
- Scene 6 – Ứng dụng thực tế: nêu các môi trường hoặc thiết bị thường sử dụng công nghệ này.
- Scene 7 – Các biến thể: giới thiệu các phiên bản hoặc cách triển khai phổ biến và điểm khác nhau cơ bản.
- Scene 8 – Câu kết: một câu ngắn, dễ nhớ, có tính tổng kết và không lặp nguyên văn nội dung trước đó.

Yêu cầu hình ảnh:

- visualDescription mô tả rõ nội dung hình minh họa của từng scene.
- Hình ảnh giữa các scene nên có sự tiếp nối về bối cảnh và phong cách để tạo cảm giác cùng một video.
- Hình ảnh theo phong cách vẽ phác thảo bằng bút chì trên giấy trắng hoặc giấy ghi chú, có texture giấy tự nhiên.
- Bố cục giống một trang take note thủ công: có mũi tên vẽ tay, đường nối, gạch chân, khoanh tròn và các nét ghi chú handwriting hỗ trợ giải thích nội dung.
- Chỉ dùng từ khóa viết tay thật ngắn khi cần; không tạo câu dài hoặc đoạn văn trong hình.
- imagePrompt phải viết bằng tiếng Anh.
- imagePrompt phải mô tả ảnh vuông 1:1, phù hợp khung visual gần vuông của video, theo phong cách pencil sketch và handwritten note-taking infographic.
- imagePrompt ngắn gọn trong khoảng 25–45 từ tiếng Anh để tránh tốn token; chỉ mô tả chủ thể, bối cảnh, bố cục và phong cách cần thiết.
- Mỗi imagePrompt phải tập trung vào đúng ý của scene và tránh tạo bố cục quá giống nhau giữa các scene.
- Không logo, không watermark, không đoạn văn dài, không typography kỹ thuật số hoặc chữ in máy.

Trước khi trả kết quả, hãy tự kiểm tra:

- Có đúng 8 scene.
- Narration của các scene có liên kết logic với nhau.
- Không có hai scene mở đầu bằng cùng một cấu trúc câu.
- Không lặp từ “[Modbus]” quá nhiều lần.
- Không lặp lại cùng một thông tin ở hai scene.
- Scene 5 có ví dụ hoặc dữ liệu cụ thể.
- Scene 8 ngắn và dễ nhớ.
- JSON hợp lệ.

Chỉ trả về JSON hợp lệ, không markdown, không giải thích.

Trả về đúng cấu trúc:
{
  "topic": "Tên chủ đề",
  "scenes": [
    {
      "id": "hook",
      "label": "Hook",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "definition",
      "label": "Định nghĩa",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "purpose",
      "label": "Mục đích",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "mechanism",
      "label": "Cách hoạt động",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "example",
      "label": "Ví dụ",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "real-use",
      "label": "Ứng dụng",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "variants",
      "label": "Biến thể",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    },
    {
      "id": "payoff",
      "label": "Câu kết",
      "title": "Tiêu đề ngắn",
      "narration": "Lời thoại.",
      "visualDescription": "Mô tả hình.",
      "imagePrompt": "Prompt ảnh tiếng Anh."
    }
  ]
}`;
const status = (text, type = "") => {
  $("#status").textContent = text;
  $("#status").className = type;
};
let blockingTasks = 0;
const lockUI = (message) => {
  blockingTasks += 1;
  $("#busy-message").textContent = message || "Đang xử lý…";
  $("#busy-overlay").hidden = false;
  document.body.style.overflow = "hidden";
};
const unlockUI = () => {
  blockingTasks = Math.max(0, blockingTasks - 1);
  if (blockingTasks === 0) {
    $("#busy-overlay").hidden = true;
    document.body.style.overflow = "";
  }
};
window.addEventListener("beforeunload", (event) => {
  if (blockingTasks > 0) {
    event.preventDefault();
    event.returnValue = "";
  }
});
const request = async (url, options = {}) => {
  const response = await fetch(`${BASE_PATH}${url}`, options);
  if (response.status === 401) {
    location.href = `${BASE_PATH}/login`;
    throw new Error("Phiên đăng nhập đã hết hạn.");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");
  return data;
};
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const bindRange = (id, out) => {
  const input = $(id),
    output = $(out),
    draw = () => (output.value = `${input.value}%`);
  input.oninput = draw;
  draw();
};
const bindValue = (id, out, suffix = "%") => {
  const input = $(id), output = $(out), draw = () => (output.value = `${input.value}${suffix}`);
  input.oninput = draw;
  draw();
};
const defaultCharacterFor = (scene) =>
  scene.character ||
  config.defaultCharacters?.[scene.id] ||
  config.characters[0] ||
  "";
const thumbnailQuestion = (topic) => {
  const value = String(topic || "").trim().replace(/[?.!]+$/, "");
  return value ? `${value} là gì?` : "Khái niệm này là gì?";
};
const THUMBNAIL_CONCEPT = Object.freeze({
  width: 1080,
  height: 1920,
  aspectRatio: "9:16",
  brand: "DQTECH",
  series: "CONCEPT EXPLAINER",
  durationText: "HIỂU NHANH TRONG 60 GIÂY",
  footer: "CÔNG NGHỆ • TỰ ĐỘNG HÓA • NĂNG LƯỢNG",
  colorA: "#f44911",
  colorB: "#0991df",
});
const mergeJson = (input) => ({
  ...episode,
  ...input,
  audience: input.audience || episode.audience || "Người mới bắt đầu",
  language: input.language || episode.language || "Vietnamese",
  style:
    input.style || episode.style || "modern technology editorial illustration",
  promptTemplate: episode.promptTemplate,
  backgroundMusic: episode.backgroundMusic,
  voiceCode: episode.voiceCode,
  speedRate: episode.speedRate,
  audioSettings: episode.audioSettings,
  scenes: input.scenes.map((scene, index) => ({
    ...episode.scenes[index],
    ...scene,
    image: episode.scenes[index]?.image || "",
    character: episode.scenes[index]?.character || "",
    audio: undefined,
    audioDuration: undefined,
  })),
});
const renderScenes = () => {
  $("#scenes").innerHTML = episode.scenes
    .map(
      (s, i) =>
        `<article class="scene-editor" data-index="${i}"><div class="scene-title"><strong>0${i + 1}</strong><div><small>${esc(s.label)}</small><h3>${esc(s.title)}</h3></div></div><label class="image-picker"><span>Hình ảnh scene</span><input class="scene-image" type="file" accept="image/*"/><img class="scene-preview ${s.image ? "visible" : ""}" src="${s.image ? `${BASE_PATH}/media/${encodeURI(s.image)}?v=${Date.now()}` : ""}"/><b>${s.image ? "Thay hình ảnh" : "Chọn hình ảnh"}</b></label><label>Chọn nhân vật<select class="character"><option value="">Nhân vật mặc định</option>${config.characters.map((c) => `<option value="${esc(c)}" ${c === s.character ? "selected" : ""}>${esc(c.replace(/\.png$/i, ""))}</option>`).join("")}</select></label><div class="character-box visible"><img src="${BASE_PATH}/characters/${encodeURIComponent(defaultCharacterFor(s))}" alt="Nhân vật đã chọn"/></div><label>Prompt sinh ảnh<textarea class="image-prompt">${esc(s.imagePrompt)}</textarea></label><div class="scene-image-actions"><button class="generate-scene">Tạo ảnh scene này</button><button class="copy-prompt ghost">Copy prompt</button></div></article>`,
    )
    .join("");
  document.querySelectorAll(".scene-editor").forEach((card) => {
    const i = Number(card.dataset.index),
      character = card.querySelector(".character"),
      box = card.querySelector(".character-box"),
      characterImg = box.querySelector("img");
    card.querySelector(".image-prompt").oninput = (e) =>
      (episode.scenes[i].imagePrompt = e.target.value);
    card.querySelector(".generate-scene").onclick = async () => {
      const button = card.querySelector(".generate-scene");
      try {
        lockUI(`Đang tạo ảnh scene ${i + 1}/8…`);
        button.disabled = true;
        card.classList.add("generating");
        status(`Đang tạo ảnh scene ${i + 1}/8…`, "loading");
        await save();
        const result = await request(
          `/api/images/${episode.scenes[i].id}/generate`,
          {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              prompt: episode.scenes[i].imagePrompt,
              episode,
            }),
          },
        );
        episode.scenes[i].image = result.path;
        renderScenes();
        status(`Đã tạo ảnh scene ${i + 1}.`, "ok");
      } catch (e) {
        status(e.message, "error");
      } finally {
        unlockUI();
        button.disabled = false;
        card.classList.remove("generating");
      }
    };
    card.querySelector(".copy-prompt").onclick = async () => {
      await navigator.clipboard.writeText(episode.scenes[i].imagePrompt);
      status(`Đã copy prompt ảnh scene ${i + 1}.`, "ok");
    };
    character.onchange = () => {
      episode.scenes[i].character = character.value;
      characterImg.src = `${BASE_PATH}/characters/${encodeURIComponent(character.value || defaultCharacterFor(episode.scenes[i]))}`;
      box.classList.add("visible");
    };
    card.querySelector(".scene-image").onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const preview = card.querySelector(".scene-preview");
      const localUrl = URL.createObjectURL(file);
      preview.src = localUrl;
      preview.classList.add("visible");
      try {
        lockUI(`Đang tải ảnh scene ${i + 1}/8…`);
        await save();
        const form = new FormData();
        form.append("image", file);
        status(`Đang upload ảnh ${i + 1}/8…`, "loading");
        const result = await request(
          `/api/scenes/${episode.scenes[i].id}/image`,
          { method: "POST", body: form },
        );
        episode.scenes[i].image = result.path;
        renderScenes();
        status(`Đã chọn ảnh scene ${i + 1}.`, "ok");
      } catch (e) {
        status(e.message, "error");
      } finally {
        unlockUI();
      }
    };
  });
};
const readAudio = () => {
  episode.voiceCode = $("#voice").value;
  episode.backgroundMusic = $("#music").value;
  episode.audioSettings = {
    musicWithVoice: Number($("#music-volume").value) / 100,
    voice: Number($("#voice-volume").value) / 100,
  };
  episode.visualSettings = {
    logo: $("#video-logo").value,
  };
  episode.thumbnail = {
    title: $("#thumbnail-title").value.trim() || thumbnailQuestion(episode.topic),
    episodeNumber: Math.max(1, Number($("#thumbnail-episode").value) || 1),
    character: $("#thumbnail-character").value,
    image: episode.thumbnail?.image || "",
  };
  episode.socialCaption = $("#social-caption").value;
  return episode;
};
const fill = () => {
  $("#voice").innerHTML = config.voices
    .map(([code, label]) => `<option value="${esc(code)}">${esc(label)}</option>`)
    .join("");
  $("#voice").value = episode.voiceCode || config.defaultVoice;
  if (!$("#voice").value) $("#voice").value = config.voices[0]?.[0] || "";
  $("#music").innerHTML =
    '<option value="">Không dùng nhạc</option>' +
    config.music
      .map((m, i) => `<option value="${m}">Nhạc công nghệ ${i + 1}</option>`)
      .join("");
  $("#music").value = episode.backgroundMusic || "";
  $("#music-volume").value = Math.round(
    (episode.audioSettings?.musicWithVoice ?? 0.12) * 100,
  );
  $("#voice-volume").value = Math.round(
    (episode.audioSettings?.voice ?? 1) * 100,
  );
  bindRange("#music-volume", "#music-value");
  bindRange("#voice-volume", "#voice-value");
  const selectedLogo = typeof episode.visualSettings?.logo === "string"
    ? episode.visualSettings.logo
    : "logo/logo.png";
  $("#video-logo").innerHTML = '<option value="">Không dùng logo</option>' + config.logos.map((src)=>`<option value="${esc(src)}">${esc(src.split('/').at(-1))}</option>`).join("");
  $("#video-logo").value = selectedLogo;
  const refreshLogoPreview = () => {
    const src = $("#video-logo").value;
    $("#video-logo-preview").src = src ? `${BASE_PATH}/media/${encodeURI(src)}` : "";
    $("#video-logo-preview").classList.toggle("visible", Boolean(src));
  };
  $("#video-logo").onchange = refreshLogoPreview;
  refreshLogoPreview();
  const savedThumbnailTitle = episode.thumbnail?.title;
  $("#thumbnail-title").value = !savedThumbnailTitle || savedThumbnailTitle === episode.topic
    ? thumbnailQuestion(episode.topic)
    : savedThumbnailTitle;
  $("#thumbnail-episode").value = episode.thumbnail?.episodeNumber || 1;
  $("#thumbnail-character").innerHTML = config.characters.map((name)=>`<option value="${esc(name)}">${esc(name.replace(/\.png$/i,""))}</option>`).join("");
  $("#thumbnail-character").value = episode.thumbnail?.character || config.defaultCharacters?.hook || config.characters[0] || "";
  const refreshThumbnailCharacter = () => {
    const character = $("#thumbnail-character").value;
    $("#thumbnail-character-preview").src = character ? `${BASE_PATH}/characters/${encodeURIComponent(character)}` : "";
  };
  $("#thumbnail-character").onchange = refreshThumbnailCharacter;
  refreshThumbnailCharacter();
  $("#social-caption").value = episode.socialCaption || "";
  if (episode.thumbnail?.image) {
    $("#thumbnail-preview").src = `${BASE_PATH}/media/${encodeURI(episode.thumbnail.image)}?v=${Date.now()}`;
    $("#thumbnail-preview").classList.add("visible");
    $("#download-thumbnail").href = `${BASE_PATH}/media/${encodeURI(episode.thumbnail.image)}?download=1`;
    $("#download-thumbnail").download = `Tập ${episode.thumbnail?.episodeNumber || 1}: ${episode.thumbnail?.title || thumbnailQuestion(episode.topic)}.png`;
    $("#download-thumbnail").hidden = false;
  }
  renderScenes();
};
const load = async () => {
  try {
    status("Đang tải…", "loading");
    [episode, config] = await Promise.all([
      request("/api/episode"),
      request("/api/config"),
    ]);
    fill();
    status("Sẵn sàng.", "ok");
  } catch (e) {
    status(e.message, "error");
  }
};
const save = async () =>
  (episode = await request("/api/episode", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readAudio()),
  }));
const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Không tải được ảnh nhân vật."));
  image.src = src;
});
const drawWrappedText = (context, text, x, y, maxWidth, lineHeight, maxLines = 3) => {
  const words = text.trim().split(/\s+/), lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
};
const createThumbnail = async () => {
  const button = $("#create-thumbnail");
  try {
    lockUI("Đang tạo và lưu thumbnail…");
    button.disabled = true;
    status("Đang tạo và lưu thumbnail…", "loading");
    const title = $("#thumbnail-title").value.trim() || thumbnailQuestion(episode.topic);
    const episodeNumber = Math.max(1, Number($("#thumbnail-episode").value) || 1);
    const character = $("#thumbnail-character").value;
    const characterImage = await loadImage(`${BASE_PATH}/characters/${encodeURIComponent(character)}`);
    const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    canvas.width = THUMBNAIL_CONCEPT.width;
    canvas.height = THUMBNAIL_CONCEPT.height;
    const background = context.createLinearGradient(0, 0, 0, THUMBNAIL_CONCEPT.height);
    background.addColorStop(0, "#070510");
    background.addColorStop(0.52, "#100b18");
    background.addColorStop(1, "#031523");
    context.fillStyle = background;
    context.fillRect(0, 0, 1080, 1920);
    context.strokeStyle = "#ffffff0d"; context.lineWidth = 1;
    for (let x = 0; x <= 1080; x += 90) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 1920); context.stroke(); }
    for (let y = 0; y <= 1920; y += 90) { context.beginPath(); context.moveTo(0, y); context.lineTo(1080, y); context.stroke(); }
    const glowA = context.createRadialGradient(120, 420, 20, 120, 420, 720);
    glowA.addColorStop(0, "#f449115c"); glowA.addColorStop(1, "#f4491100");
    context.fillStyle = glowA; context.fillRect(0, 0, 1080, 1220);
    const glowB = context.createRadialGradient(850, 1500, 20, 850, 1500, 760);
    glowB.addColorStop(0, "#0991df70"); glowB.addColorStop(1, "#0991df00");
    context.fillStyle = glowB; context.fillRect(0, 760, 1080, 1160);
    context.strokeStyle = "#ffffff26"; context.lineWidth = 2;
    context.beginPath(); context.roundRect(30, 30, 1020, 1860, 30); context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#ffffff"; context.font = "900 34px Arial";
    context.fillText(THUMBNAIL_CONCEPT.brand, 68, 112);
    context.fillStyle = "#8ed7ff"; context.font = "700 22px Arial";
    context.fillText(THUMBNAIL_CONCEPT.series, 68, 150);
    const badge = context.createLinearGradient(780, 74, 1010, 142);
    badge.addColorStop(0, THUMBNAIL_CONCEPT.colorA); badge.addColorStop(1, THUMBNAIL_CONCEPT.colorB);
    context.fillStyle = badge; context.beginPath(); context.roundRect(790, 72, 220, 76, 38); context.fill();
    context.fillStyle = "white"; context.font = "900 31px Arial"; context.textAlign = "center";
    context.fillText(`TẬP ${episodeNumber}`, 900, 120);

    context.fillStyle = "#0a0813dd";
    context.beginPath(); context.roundRect(58, 240, 964, 650, 38); context.fill();
    context.strokeStyle = "#ffffff20"; context.lineWidth = 2; context.stroke();
    const accent = context.createLinearGradient(88, 0, 610, 0);
    accent.addColorStop(0, THUMBNAIL_CONCEPT.colorA); accent.addColorStop(1, THUMBNAIL_CONCEPT.colorB);
    context.fillStyle = accent; context.beginPath(); context.roundRect(88, 288, 330, 12, 6); context.fill();
    context.textAlign = "left";
    context.fillStyle = "#8ed7ff"; context.font = "800 27px Arial";
    context.fillText("GIẢI THÍCH KHÁI NIỆM", 88, 360);
    const titleLength = title.trim().length;
    context.fillStyle = "white";
    context.font = `900 ${titleLength > 48 ? 72 : titleLength > 30 ? 84 : 102}px Arial`;
    drawWrappedText(context, title.toUpperCase(), 88, 485, 880, titleLength > 48 ? 90 : 112, 4);
    context.fillStyle = "#c7c2d4"; context.font = "600 29px Arial";
    context.fillText(THUMBNAIL_CONCEPT.durationText, 88, 830);

    context.fillStyle = "#0991df24"; context.beginPath(); context.arc(540, 1425, 445, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#0991df55"; context.lineWidth = 3; context.beginPath(); context.arc(540, 1425, 410, 0, Math.PI * 2); context.stroke();
    const scale = Math.min(900 / characterImage.width, 900 / characterImage.height);
    const width = characterImage.width * scale, height = characterImage.height * scale;
    context.shadowColor = "#0991df88"; context.shadowBlur = 40;
    context.drawImage(characterImage, 540 - width / 2, 1850 - height, width, height);
    context.shadowBlur = 0;
    const footer = context.createLinearGradient(0, 1740, 1080, 1920);
    footer.addColorStop(0, `${THUMBNAIL_CONCEPT.colorA}e8`); footer.addColorStop(1, `${THUMBNAIL_CONCEPT.colorB}e8`);
    context.fillStyle = footer; context.fillRect(0, 1810, 1080, 110);
    context.fillStyle = "white"; context.textAlign = "center"; context.font = "800 25px Arial";
    context.fillText(THUMBNAIL_CONCEPT.footer, 540, 1877);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", .92));
    if (!blob) throw new Error("Không thể xuất thumbnail.");
    const form = new FormData();
    form.append("thumbnail", blob, "thumbnail.png");
    form.append("episodeNumber", String(episodeNumber));
    form.append("title", title);
    const result = await request("/api/thumbnail", {method:"POST", body:form});
    episode.thumbnail = {title, episodeNumber, character, image:result.path};
    await save();
    $("#thumbnail-preview").src = `${result.downloadUrl}&preview=${Date.now()}`;
    $("#thumbnail-preview").classList.add("visible");
    $("#download-thumbnail").href = result.downloadUrl;
    $("#download-thumbnail").download = result.fileName;
    $("#download-thumbnail").hidden = false;
    status("Đã tạo và ghi đè thumbnail.png.", "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    unlockUI();
    button.disabled = false;
  }
};
const generateSocialCaption = async () => {
  const button = $("#generate-caption");
  try {
    lockUI("Google Gemini đang tạo caption…");
    button.disabled = true;
    status(`Đang tạo caption cho “${episode.topic}”…`, "loading");
    const result = await request("/api/social-caption", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:episode.topic})});
    $("#social-caption").value = result.text;
    episode.socialCaption = result.text;
    await save();
    status("Đã tạo caption, từ khóa và hashtag.", "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    unlockUI();
    button.disabled = false;
  }
};
$("#create-thumbnail").onclick = createThumbnail;
$("#generate-caption").onclick = generateSocialCaption;
$("#copy-caption").onclick = async () => {
  const text = $("#social-caption").value.trim();
  if (!text) return status("Chưa có caption để copy.", "error");
  await navigator.clipboard.writeText(text);
  status("Đã copy caption, từ khóa và hashtag.", "ok");
};
$("#master-prompt").value = masterPrompt;
$("#copy-master").onclick = async () => {
  await navigator.clipboard.writeText(masterPrompt);
  status("Đã copy prompt mẫu. Hãy thay [Modbus] bằng chủ đề của bạn.", "ok");
};
$("#apply-json").onclick = () => {
  try {
    const value = JSON.parse($("#json-input").value.replace(/[“”]/g, '"'));
    if (!Array.isArray(value.scenes) || value.scenes.length !== 8)
      throw new Error("JSON phải có đúng 8 scene.");
    episode = mergeJson(value);
    episode.scenes = episode.scenes.map((scene) => ({...scene, image:"", audio:undefined, audioDuration:undefined}));
    renderScenes();
    status(`Đã áp dụng chủ đề “${episode.topic}”.`, "ok");
  } catch (e) {
    status(`JSON không hợp lệ: ${e.message}`, "error");
  }
};
const generateJsonFromTopic = async () => {
  const topic = $("#topic-input").value.trim();
  const button = $("#generate-json");
  if (!topic) {
    status("Hãy nhập từ khóa hoặc chủ đề.", "error");
    $("#topic-input").focus();
    return;
  }
  try {
    lockUI(`Google Gemini đang viết 8 scene cho “${topic}”…`);
    button.disabled = true;
    status(`Google Gemini đang viết 8 scene cho “${topic}”…`, "loading");
    const generated = await request("/api/content/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({topic}),
    });
    episode = mergeJson(generated);
    episode.scenes = episode.scenes.map((scene) => ({
      ...scene,
      image: "",
      audio: undefined,
      audioDuration: undefined,
    }));
    episode.thumbnail = {
      title: thumbnailQuestion(episode.topic),
      episodeNumber: episode.thumbnail?.episodeNumber || 1,
      character: episode.thumbnail?.character || config.defaultCharacters?.hook || config.characters[0] || "",
      image: "",
    };
    episode.socialCaption = "";
    $("#thumbnail-title").value = thumbnailQuestion(episode.topic);
    $("#thumbnail-preview").classList.remove("visible");
    $("#download-thumbnail").hidden = true;
    $("#social-caption").value = "";
    $("#json-input").value = JSON.stringify(generated, null, 2);
    renderScenes();
    await save();
    await generateSocialCaption();
    const stats = generated.contentStats;
    status(`Đã tạo JSON và caption cho “${episode.topic}”.${stats ? ` Tổng ${stats.totalWords} từ, thời lượng dự kiến ${stats.estimatedDuration} giây.` : ""}`, "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    unlockUI();
    button.disabled = false;
  }
};
$("#generate-json").onclick = generateJsonFromTopic;
$("#topic-input").onkeydown = (event) => {
  if (event.key === "Enter") generateJsonFromTopic();
};
$("#generate-all-images").onclick = async () => {
  const button = $("#generate-all-images");
  try {
    lockUI("Đang tạo tự động 8 ảnh…");
    button.disabled = true;
    status("Đang tạo 8 ảnh tự động…", "loading");
    await save();
    const result = await request("/api/images/generate-all", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(episode),
    });
    episode = result.episode || episode;
    renderScenes();
    status("Đã tạo đủ 8 ảnh.", "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    unlockUI();
    button.disabled = false;
  }
};
$("#save").onclick = async () => {
  try {
    status("Đang lưu…", "loading");
    await save();
    status("Đã lưu nội dung.", "ok");
  } catch (e) {
    status(e.message, "error");
  }
};
$("#audio").onclick = async () => {
  try {
    lockUI("Đang tạo voice cho 8 scene…");
    $("#audio").disabled = true;
    status("Đang tạo 8 voice…", "loading");
    episode = await request("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readAudio()),
    });
    status("Đã tạo đủ 8 voice.", "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    unlockUI();
    $("#audio").disabled = false;
  }
};
$("#render").onclick = async () => {
  const missingImages = episode.scenes.filter((scene) => !scene.image);
  const missingAudio = episode.scenes.filter((scene) => !scene.audio);
  if (missingImages.length || missingAudio.length) {
    const messages = [];
    if (missingImages.length) messages.push(`chưa có ảnh: ${missingImages.map((scene) => scene.label).join(", ")}`);
    if (missingAudio.length) messages.push(`chưa có voice: ${missingAudio.map((scene) => scene.label).join(", ")}`);
    status(`Chưa thể render — ${messages.join("; ")}.`, "error");
    return;
  }
  try {
    lockUI("Đang render video, quá trình này có thể mất vài phút…");
    $("#render").disabled = true;
    $("#download").hidden = true;
    status("Đang render video…", "loading");
    const result = await request("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readAudio()),
    });
    $("#download").href = result.downloadUrl;
    $("#download").hidden = false;
    status(`Video đã hoàn tất: ${result.fileName || "video.mp4"}`, "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    unlockUI();
    $("#render").disabled = false;
  }
};
$("#logout").onclick = async () => {
  await fetch(`${BASE_PATH}/api/logout`, { method: "POST" });
  location.href = `${BASE_PATH}/login`;
};
load();
