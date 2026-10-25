import { getOverview } from "@/lib/data";

export const dynamic = "force-dynamic";
/** The public address for takedown and correction requests (step 4.8). */
const TAKEDOWN_EMAIL = "tranthanhtung37@gmail.com";

export const metadata = { title: "Giới thiệu và cách đọc dữ liệu" };

const BADGES = [
  { mark: "✓", name: "Đã kiểm chứng", cls: "badge-auto_verified", text: "Máy tìm thấy câu trích và giá trị trong PDF, đúng trang, đúng dòng hoặc ô; các kiểm tra phụ (dấu, vị trí cột của ma trận, chỉ số) đều đạt. Vẫn có thể sai nếu cả AI và máy cùng đọc nhầm." },
  { mark: "⚠", name: "Nên xem kỹ", cls: "badge-needs_attention", text: "Có kiểm tra chưa qua hoặc máy không xác nhận được (số chỉ nằm trong hình, câu trích không có trên trang dẫn, bảng khó đọc). Giá trị có thể đúng; hãy mở PDF đối chiếu." },
  { mark: "◇", name: "AI diễn giải", cls: "badge-ai_interpreted", text: "Phần AI tóm tắt hoặc phân loại (lý thuyết, đóng góp, khoảng trống). Máy không kiểm được, không có \"đúng / sai\" tự động." },
  { mark: "★", name: "Đã sửa tay", cls: "", text: "Chủ dự án đã sửa hoặc xác nhận; được khóa, trích xuất lại không ghi đè." },
];

const AUDITS = [
  ["Lần 1 (20/10/2026)", "30 trường ✓, Codex và Gemini", "30 / 30 đúng giá trị; 30% câu trích sai dòng (đã sửa)", "Claude đọc trang PDF"],
  ["Lần 2 (21/10/2026)", "30 trường ✓ + 10 ⚠", "20 đúng, 4 gắn nhầm ô (một lỗi hệ thống ở bài ABE, đã sửa), 6 không kết luận được, 0 sai giá trị", "Claude chấm, tác tử khác kiểm chéo 10 trường: trùng 10 / 10"],
  ["Lần 3 (23/10/2026)", "30 trường ✓ + 10 ⚠ của 13 bài do tác tử Claude trích", "28 đúng, 2 không phán đoán được, 0 sai; ⚠: 6 đúng, 4 không xác nhận được", "4 tác tử Sonnet chấm mù (không thấy câu trích)"],
];

export default async function AboutPage() {
  const o = await getOverview();
  return (
    <article className="about" data-testid="about">
      <h1>Giới thiệu và cách đọc dữ liệu</h1>

      <h2>Đây là gì</h2>
      <p>
        Một công cụ <strong>tham khảo</strong> phục vụ nghiên cứu của chủ dự án: gom các con số và thiết kế nghiên cứu của bài báo học thuật (marketing, đạo đức, hành vi người tiêu dùng; định lượng, tiếng Anh) vào một ma trận có thể tìm và lọc.
        Công cụ không thay cho việc đọc bài gốc. <strong>Người dùng có trách nhiệm tự đối chiếu với bài gốc</strong> trước khi dùng số liệu trong nghiên cứu.
      </p>
      <p data-testid="about-open">
        <strong>Ai cũng dùng được, không cần đăng nhập</strong>: tìm quan hệ, thư viện, ma trận, xem bằng chứng và xuất Excel, Word đều mở. Chỉ chủ dự án đăng nhập, để vào trang quản trị và xem các PDF chưa có giấy phép mở.
      </p>

      <h2>Quyền riêng tư</h2>
      <p data-testid="about-privacy">
        Web <strong>không dùng cookie theo dõi</strong>, không yêu cầu tài khoản và không lưu địa chỉ IP. Chỉ có hai thứ được đếm: số lượt dùng mỗi ngày theo loại (tìm quan hệ, mở bằng chứng, xuất bảng, xem hoặc tải PDF...) dưới dạng con số tổng, không gắn với ai; và, khi bật, thống kê lượt xem trang không cookie của nhà cung cấp. Giới hạn tốc độ chống lạm dụng dùng mã băm của địa chỉ trong tối đa một giờ rồi bỏ.
      </p>

      <h2>Kho hiện có</h2>
      <p data-testid="about-overview">
        {o.papers} bài, {o.fields.toLocaleString("vi-VN")} giá trị đang hiển thị: <span className="badge badge-auto_verified">✓ {o.verified.toLocaleString("vi-VN")}</span> ·{" "}
        <span className="badge badge-needs_attention">⚠ {o.attention.toLocaleString("vi-VN")}</span> · <span className="badge badge-ai_interpreted">◇ {o.interpreted.toLocaleString("vi-VN")}</span>.
        Giá trị không khớp PDF bị ẩn với khách, nên số trên chưa gồm chúng.
      </p>

      <h2>Dữ liệu từ đâu, được làm thế nào</h2>
      <ol>
        <li>Bài báo lấy từ thư viện Zotero cá nhân của chủ dự án; thông tin thư mục (tác giả, năm, tạp chí, DOI) lấy từ Crossref, không để AI sinh.</li>
        <li>Một AI (tác tử Claude, hoặc Codex, hoặc Gemini tùy bài) đọc PDF và điền các trường: thiết kế, mẫu, thang đo, đường quan hệ, ma trận tương quan, kèm <em>câu trích</em> và số trang làm bằng chứng.</li>
        <li>Máy đối chiếu từng giá trị với PDF: câu trích có trên trang không, số có trong dòng bảng không, dấu có đúng không, ô ma trận có đúng cột không, các thống kê có khớp nhau không (ví dụ t với p).</li>
        <li>Kết quả được gắn huy hiệu. Bấm một giá trị trong trang bài sẽ mở PDF đúng trang và tô khung chỗ bằng chứng khi định vị được.</li>
      </ol>
      <p>Không ai đọc bài, mã hóa hay duyệt từng giá trị. Chất lượng dựa trên một lượt trích xuất, các lớp kiểm tra của máy và huy hiệu bên dưới.</p>

      <h2>Cách đọc huy hiệu</h2>
      <table className="about-table">
        <tbody>
          {BADGES.map((b) => (
            <tr key={b.mark}>
              <th scope="row">
                <span className={`badge ${b.cls}`}>{b.mark}</span> {b.name}
              </th>
              <td>{b.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Tổng hợp trong trang “Tìm theo quan hệ” mặc định chỉ đếm kiểm định ✓ hoặc ★ và luôn nói rõ có bao nhiêu kiểm định ⚠ bị bỏ ra ngoài.</p>

      <h2>Độ chính xác đã đo</h2>
      <p>Ba lần kiểm mẫu ngẫu nhiên, người chấm là AI (không phải người đọc bài):</p>
      <div className="matrix-scroll">
        <table className="about-table" data-testid="about-audits">
          <thead>
            <tr>
              <th>Lần</th>
              <th>Mẫu</th>
              <th>Kết quả</th>
              <th>Người chấm</th>
            </tr>
          </thead>
          <tbody>
            {AUDITS.map((a) => (
              <tr key={a[0]}>
                {a.map((c, i) => (i === 0 ? <th scope="row" key={i}>{c}</th> : <td key={i}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Mỗi mẫu 30 trường ✓ không thấy lỗi sai giá trị chỉ cho phép kết luận tỷ lệ sai không quá khoảng 11% (cận trên khoảng tin cậy 95%). Mẫu bắt được lỗi lớn, chưa chứng minh độ chính xác cao.
      </p>

      <h2>Giới hạn đã biết</h2>
      <ul>
        <li>Số chỉ nằm trong hình hoặc ảnh thường là ⚠ hoặc bị ẩn: máy không đọc được.</li>
        <li>Bài scan được nhận dạng chữ (OCR) trên máy, độ nhiễu cao hơn và không có khung tô sáng trong PDF; nhiều trường ⚠ hơn.</li>
        <li>Ma trận có hai bảng con cùng nhãn trên một trang đôi khi hiện câu trích của bảng đầu cho ô của bảng sau, dù giá trị đúng.</li>
        <li>Phần “Lý thuyết”, đóng góp và khoảng trống là AI diễn giải (◇), không kiểm được bằng máy.</li>
        <li>Con số tổng hợp chỉ mô tả các bài trong kho; đây không phải kết luận của cả lĩnh vực và không thay cho meta-analysis. Không có ý nghĩa thống kê không có nghĩa là không có tác động.</li>
      </ul>

      <h2>Nội dung và bản quyền</h2>
      <p>
        Web chỉ hiển thị dữ kiện (con số, thiết kế, thang đo) và các câu trích ngắn kèm số trang để đối chiếu; không đăng lại bài báo. Chủ dự án xem được PDF mọi bài; khách chỉ tải được PDF có giấy phép mở.
        Nếu bạn là tác giả hoặc chủ bản quyền và muốn gỡ hoặc sửa một mục, hãy gửi email tới{" "}
        <a href={`mailto:${TAKEDOWN_EMAIL}?subject=Yêu cầu gỡ hoặc sửa một mục trên Research Data`} data-testid="takedown-contact">
          {TAKEDOWN_EMAIL}
        </a>{" "}
        kèm đường dẫn của trang bài và nội dung cần gỡ hoặc sửa; chủ dự án sẽ xem xét và trả lời.
      </p>
    </article>
  );
}
