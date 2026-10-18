/**
 * Schema định nghĩa cấu trúc phân tách bài báo khoa học chuẩn cho Gemini API
 */

const paperExtractionSchema = {
  type: "object",
  properties: {
    paper_id: {
      type: "string",
      description: "Mã định danh duy nhất của bài báo, dạng tác giả chính + năm + từ khóa ngắn, vd: nguyen-2023-ai-trust"
    },
    metadata: {
      type: "object",
      properties: {
        title: { type: "string", description: "Tiêu đề đầy đủ của bài báo" },
        authors: {
          type: "array",
          items: { type: "string" },
          description: "Danh sách tên đầy đủ của các tác giả"
        },
        year: { type: "integer", description: "Năm xuất bản" },
        journal: { type: "string", description: "Tên tạp chí khoa học hoặc kỷ yếu hội thảo" },
        doi: { type: "string", description: "Mã DOI của bài báo (nếu có)" },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Các từ khóa chính của bài báo"
        },
        apa_citation: {
          type: "string",
          description: "Chuỗi trích dẫn đầy đủ chuẩn mực theo định dạng APA 7th Edition"
        },
        bibtex: {
          type: "string",
          description: "Mã trích dẫn định dạng BibTeX để dùng cho LaTeX/Overleaf/Zotero"
        }
      },
      required: ["title", "authors", "year", "journal", "apa_citation", "bibtex"]
    },
    theoretical_framework: {
      type: "array",
      items: {
        type: "object",
        properties: {
          theory_name: { type: "string", description: "Tên lý thuyết nền tảng (VD: Theory of Planned Behavior, RBV, TAM, UTAUT...)" },
          application_role: { type: "string", description: "Cách tác giả vận dụng lý thuyết này vào mô hình nghiên cứu" },
          evidence_page: { type: "integer", description: "Số trang trong bài báo đề cập đến lý thuyết này" }
        },
        required: ["theory_name", "application_role"]
      },
      description: "Danh sách các lý thuyết nền tảng được sử dụng"
    },
    constructs_and_definitions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Tên khái niệm / biến số nghiên cứu (VD: Perceived Ease of Use, Brand Loyalty)" },
          definition: { type: "string", description: "Định nghĩa khái niệm hoặc định nghĩa thao tác (operational definition)" },
          scale_source: { type: "string", description: "Nguồn gốc thang đo tác giả kế thừa từ ai (VD: Davis (1989))" },
          exact_quote: { type: "string", description: "Câu văn nguyên bản trích từ bài báo định nghĩa biến này" },
          evidence_page: { type: "integer", description: "Số trang chứa định nghĩa này" }
        },
        required: ["name", "definition"]
      },
      description: "Danh sách các khái niệm, biến số và định nghĩa đo lường"
    },
    methodology: {
      type: "object",
      properties: {
        research_type: { 
          type: "string", 
          enum: ["Quantitative", "Qualitative", "Mixed-methods", "Systematic Review / Meta-analysis", "Conceptual"],
          description: "Phương pháp tiếp cận chính"
        },
        sample_size: { type: "integer", description: "Cỡ mẫu (N) khảo sát (nếu có)" },
        target_respondents: { type: "string", description: "Đối tượng khảo sát hoặc nguồn dữ liệu" },
        context_and_location: { type: "string", description: "Bối cảnh ngành và quốc gia/khu vực nghiên cứu" },
        data_collection_method: { type: "string", description: "Cách thức thu thập dữ liệu (online survey, phỏng vấn, báo cáo tài chính...)" },
        analysis_techniques: {
          type: "array",
          items: { type: "string" },
          description: "Các kỹ thuật hoặc công cụ phân tích (VD: PLS-SEM, SmartPLS, CB-SEM AMOS, Multiple Regression, Stata, Content Analysis...)"
        },
        evidence_page: { type: "integer", description: "Số trang mô tả phương pháp nghiên cứu" }
      },
      required: ["research_type", "context_and_location", "analysis_techniques"]
    },
    hypotheses_and_results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string", description: "Mã giả thuyết (VD: H1, H2a, H2b...)" },
          hypothesis_statement: { type: "string", description: "Nội dung giả thuyết nghiên cứu" },
          independent_variable: { type: "string", description: "Biến độc lập (IV)" },
          dependent_variable: { type: "string", description: "Biến phụ thuộc (DV)" },
          role: { 
            type: "string", 
            enum: ["Direct Effect", "Mediating Effect", "Moderating Effect", "Control Variable"],
            description: "Tính chất mối quan hệ"
          },
          status: { 
            type: "string", 
            enum: ["Supported", "Rejected", "Partially Supported", "Not Tested"],
            description: "Kết quả kiểm định giả thuyết"
          },
          statistical_summary: { type: "string", description: "Chỉ số thống kê tóm tắt (VD: beta = 0.34, p < 0.01 hoặc t-value = 3.42)" },
          evidence_page: { type: "integer", description: "Số trang chứa bảng kết quả" }
        },
        required: ["code", "hypothesis_statement", "independent_variable", "dependent_variable", "status"]
      },
      description: "Danh sách các giả thuyết nghiên cứu và kết quả kiểm định"
    },
    key_contributions: {
      type: "object",
      properties: {
        theoretical_contributions: { type: "string", description: "Đóng góp mới về mặt lý thuyết của bài báo" },
        practical_implications: { type: "string", description: "Hàm ý thực tiễn và khuyến nghị quản trị cho doanh nghiệp / nhà hoạch định" }
      },
      required: ["theoretical_contributions", "practical_implications"]
    },
    limitations_and_future_directions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          limitation: { type: "string", description: "Hạn chế mà tác giả thừa nhận" },
          future_direction: { type: "string", description: "Hướng nghiên cứu tiếp theo mà tác giả gợi mở (Research Gap)" },
          evidence_page: { type: "integer", description: "Số trang" }
        },
        required: ["limitation", "future_direction"]
      },
      description: "Các hạn chế và hướng nghiên cứu tương lai (mỏ vàng tìm research gap)"
    }
  },
  required: [
    "paper_id",
    "metadata",
    "theoretical_framework",
    "constructs_and_definitions",
    "methodology",
    "hypotheses_and_results",
    "key_contributions",
    "limitations_and_future_directions"
  ]
};

module.exports = { paperExtractionSchema };
