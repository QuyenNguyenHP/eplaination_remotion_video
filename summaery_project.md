# Project Summary — Remotion Concept Explainer

Project Remotion tạo video dọc giải thích một khái niệm qua 8 scene. Giao diện triển khai được đặt gọn trong một thư mục `app/`, không tách frontend/backend.

## Cấu trúc

```text
eplaination_remotion_video/
├── data/
│   └── episode.json       # Nội dung, ảnh, voice và cấu hình video
├── public/
│   ├── audio/             # Voice từng scene và nhạc nền
│   ├── characters/        # Nhân vật tùy chọn
│   └── images/            # Ảnh minh họa và logo
├── app/
│   ├── server.mjs         # Login, upload, Vbee, save và render API
│   └── public/            # Giao diện DQ Tech
├── src/
│   ├── index.ts           # Remotion entrypoint
│   ├── Root.tsx           # Đăng ký composition
│   ├── ExplainerVideo.tsx # Timeline và bố cục 8 scene
│   ├── SoundWave.tsx
│   ├── OutroScene.tsx
│   └── types.ts
├── output/                # Video/frame đã render
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## Cấu trúc video

1. Hook
2. What is it?
3. Purpose
4. How it works
5. Example
6. Real use
7. Variants
8. Payoff
9. Outro cố định

Video 1080×1920, 30 FPS. Mỗi scene mặc định 4 giây. Nếu `audioDuration` có giá trị, duration bằng thời lượng voice cộng 0,65 giây.

## Chỉnh nội dung

Chỉnh trực tiếp `data/episode.json`:

- `topic`, `audience`, `language`, `style`;
- `title`, `narration`, `image` và `character` của từng scene;
- `audio` và `audioDuration` nếu có voice;
- `backgroundMusic` và `audioSettings`.

Tất cả đường dẫn media tính từ `public/`, ví dụ:

```json
{
  "image": "images/uploads/hook.png",
  "audio": "audio/scenes/hook.mp3",
  "character": "Speaking1.png",
  "backgroundMusic": "audio/Tech_music_background1.mp3"
}
```

## Chạy

```bash
npm install
npm run dev
```

`npm run dev` mở Remotion Studio. Chọn composition `EXPLAINER-VIDEO` để preview.

Chạy giao diện web:

```bash
npm run app
```

Mở `http://127.0.0.1:4188`. Tài khoản mặc định là `admin` / `admin123`; khi triển khai phải đặt `APP_USERNAME`, `APP_PASSWORD` và `SESSION_SECRET` trong `.env`.

```env
APP_HOST=127.0.0.1
APP_PORT=4188
APP_USERNAME=admin
APP_PASSWORD=change-me
SESSION_SECRET=change-this-secret
VBEE_APP_ID=...
VBEE_ACCESS_TOKEN=...
VBEE_VOICE_CODE=...
```

Render video:

```bash
npm run render
```

Kết quả: `output/explainer.mp4`.

Render một frame kiểm tra:

```bash
npm run render:frame
```

Kết quả: `output/preview.png`.

Kiểm tra TypeScript:

```bash
npm run typecheck
```
