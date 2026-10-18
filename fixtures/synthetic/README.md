# Bộ bài giả lập (bước 0.13)

PDF tự viết, nội dung hư cấu, kèm đáp án đúng (`*.answer.json`, theo `packages/schema`). Không chứa câu trích từ bài có bản quyền.

- Sinh lại: `pnpm synthetic:build` (kết quả cố định từng byte; nguồn ở `apps/worker/src/synthetic/`).
- Kiểm thử: `apps/worker/src/synthetic/synthetic.test.ts` đối chiếu đáp án với chính PDF (trang in, số cột, trang không có text layer, câu trích, con số).
- `known_issues`: lỗ hổng của worker mà bộ bài đã phát hiện nhưng chưa sửa; test tương ứng được đánh dấu "expected fail".
