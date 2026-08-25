# Chạy ứng dụng bằng Docker

Build image:

```bash
docker build -t concept-explainer .
```

Chạy container bằng biến môi trường trong `.env`:

```bash
docker run --name concept-explainer \
  --env-file .env \
  -e APP_HOST=0.0.0.0 \
  -p 4188:4188 \
  -v "$PWD/data:/app/data" \
  -v "$PWD/output:/app/output" \
  -v "$PWD/public/audio/scenes:/app/public/audio/scenes" \
  -v "$PWD/public/images/uploads:/app/public/images/uploads" \
  -v "$PWD/public/images/thumbnail:/app/public/images/thumbnail" \
  --shm-size=2gb \
  concept-explainer
```

Mở <http://localhost:4188/explainer/>.

Nếu cổng `4188` đã được sử dụng, đổi phần publish port thành `-p 4190:4188` rồi mở <http://localhost:4190/explainer/>. Luôn giữ `-e APP_HOST=0.0.0.0` sau `--env-file .env`, vì `.env` dùng `127.0.0.1` cho chế độ chạy trực tiếp ngoài Docker.

Các volume phía trên giữ lại episode, voice, ảnh upload, thumbnail và video đã render khi container được tạo lại. `--shm-size=2gb` cung cấp thêm shared memory cho Chrome trong lúc render.

Không đưa `.env` vào image. Hãy truyền các biến `APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET`, `GEMINI_API_KEY`, `VBEE_APP_ID` và `VBEE_ACCESS_TOKEN` bằng `--env-file` hoặc secret manager của nền tảng triển khai.
