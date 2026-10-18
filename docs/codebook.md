# Codebook v1.0

> Sổ mã hóa của hệ thống: định nghĩa vận hành của **mọi trường** trong schema (Mục 5.2, [docs/data-schema.md](data-schema.md)).
> Đây là đầu vào trực tiếp cho prompt Gemini (bước 0.11 trở đi) và là tài liệu để người dùng hiểu từng con số trên web.
> Phiên bản: `codebook_version = 1.0.1` (bước 0.10, bổ sung ở 0.11). Mọi thay đổi ghi ở [Nhật ký thay đổi](#nhật-ký-thay-đổi-codebook) cuối file.

**Người soạn:** Claude Code. **Chủ dự án cần đọc lướt và sửa:** các định nghĩa ở Phần C (lý thuyết), Phần D (khái niệm, thang đo) và Phần K (đóng góp, khoảng trống) cho đúng cách hiểu trong miền nghiên cứu của mình. Các phần khác chủ yếu là quy ước kỹ thuật.

**Ví dụ trong codebook đều tự viết**, không trích từ bài báo có bản quyền (repo public).

---

## A. Quy tắc chung

### A.1. Tầng dữ liệu (Mục 1.4)

| Tầng | Ý nghĩa | Cách kiểm tra | Huy hiệu có thể có |
| :--- | :--- | :--- | :--- |
| **T1 – Sự kiện** | Giá trị in sẵn trong bài: con số, tên gọi, mã giả thuyết | Máy tìm đúng giá trị trên trang PDF | ✓, ⚠, ẩn |
| **T2 – Phân loại** | Giá trị chọn từ danh mục cố định dựa trên mô tả của tác giả | Câu trích phải có trên trang; kiểm tra logic | ✓, ⚠, ẩn |
| **T3 – Diễn giải** | Nhận định của AI, không có đáp án in sẵn | Không kiểm chứng tự động được | ◇ |

### A.2. Bằng chứng

1. **Mọi giá trị do AI trích phải kèm bằng chứng**: `pdf_page` và `quote` (Phần M).
2. `pdf_page` là **số thứ tự trang trong file PDF** (trang đầu tiên của file = 1), **không phải** số trang in của tạp chí. Hệ thống tự quy đổi sang trang in (Mục 6.3).
3. `quote` là **một đoạn liên tục, chép nguyên văn** từ PDF, tối đa 50 từ. Không diễn đạt lại, không dịch, không sửa lỗi chính tả.
4. **Không nối các đoạn rời bằng "…" hoặc "...".** Cần hai đoạn thì đó là hai bằng chứng.
5. Giá trị nằm **trong bảng**: trích nguyên **dòng bảng** như được in (nhãn dòng rồi đến các con số), không tự viết thành câu. Ví dụ đúng: `H2 Perceived risk → Purchase intention −0.31 −5.12 <0.001 Supported`. Ví dụ sai: `H2 is supported with beta = -0.31 ... p < .001`.
6. Ưu tiên bằng chứng ở **phần Kết quả hoặc bảng kết quả**, không lấy ở phần Tóm tắt khi phần Kết quả có con số đầy đủ hơn.

### A.3. Không đoán

1. Bài **không báo cáo** một giá trị thì trả về `null` (hoặc mảng rỗng). Không ước lượng, không suy từ giá trị khác.
2. **Không quy đổi**: không đổi β thành r, không tính d từ F, không đổi phần trăm thành số người. Hệ thống làm việc tính toán (nếu có) bằng code, có ghi rõ là giá trị quy đổi.
3. **Không dùng hiểu biết bên ngoài bài**: không thêm thông tin về tác giả, tạp chí hay các nghiên cứu khác.

### A.4. Con số

1. Chép **đúng như in**, giữ dấu: `−.31` → `-0.31`; `.31` nghĩa là `0.31`; `4,120` (dấu phẩy ngăn nghìn) → `4120`.
2. Số thập phân kiểu châu Âu (`0,31`) → `0.31`.
3. Giá trị p giữ **nguyên dạng in** ở `p_reported_as` (`< .001`, `= .03`, `n.s.`), còn `p_value` chỉ điền khi bài in giá trị chính xác (`= .03` → `0.03`; `< .001` → để `null`).
4. Ký hiệu sao (`*`, `**`, `***`) trong bảng: đọc chú thích bảng để biết ngưỡng (ví dụ `*** p < .001`), ghi vào `p_reported_as`.

### A.5. Study

1. **Study** là một lần thu thập dữ liệu có mẫu riêng. Bài có "Study 1, Study 2a, Study 2b" thì có 3 Study.
2. `study_label` dùng **đúng nhãn của tác giả** ("Study 1", "Study 2a", "Pilot study", "Exploratory study"). Bài chỉ có một nghiên cứu thì ghi `"Study 1"`.
3. Một nghiên cứu thu thập hai đợt (time-lagged) trên **cùng mẫu** vẫn là **một Study**.
4. Thử nghiệm thang đo với chuyên gia (expert panel), pilot test: là Study riêng **nếu tác giả gọi là Study** hoặc báo cáo cỡ mẫu riêng.

### A.6. Tên khái niệm

1. Ghi **đúng tên tác giả dùng** (giữ tiếng Anh, giữ cách viết hoa của tác giả) ở trường `*_label_original`.
2. Việc ánh xạ về khái niệm chuẩn do hệ thống làm (Mục 5.3), theo nguyên tắc **"không chắc thì tách"**.

---

## B. Trường do hệ thống tạo (AI không trích)

Các trường này lấy từ Crossref, Zotero, Unpaywall, SJR hoặc do code tính. Liệt kê để codebook phủ đủ schema.

| Trường | Nguồn | Ghi chú |
| :--- | :--- | :--- |
| `paper_id` | Hệ thống | UUID của bài trong database |
| `doi` | Crossref / Zotero | Dạng `10.xxxx/...`, viết thường |
| `title` | Crossref / Zotero | |
| `authors` | Crossref / Zotero | Họ, tên, ORCID nếu có |
| `year` | Crossref | Năm xuất bản chính thức (bản in hoặc bản online đầu tiên theo Crossref) |
| `journal` | Crossref | |
| `volume` | Crossref | |
| `issue` | Crossref | |
| `pages` | Crossref | Dạng `502-520` hoặc số bài (article number) |
| `apa_citation` | citation-js từ Crossref | APA 7 |
| `bibtex` | citation-js từ Crossref | |
| `citekey` | Better BibTeX (Zotero) | |
| `file_hash` | Hệ thống | SHA-256 của file PDF |
| `zotero_*` | Zotero | `zotero_library_id`, `zotero_item_key`, `zotero_attachment_key`, `zotero_version` |
| `oa_status` | Unpaywall | gold / hybrid / green / bronze / closed |
| `journal_quartile` | SJR | Q1–Q4 |
| `quartile_year` | SJR | Năm của xếp hạng |
| `subject_category` | SJR | Chuyên ngành dùng để xếp hạng |
| `abs_rating` | Danh mục ABS (nhập tay một lần) | 1–4* |
| `abdc_rating` | Danh mục ABDC (nhập tay một lần) | A*, A, B, C |
| `indexed_in` | Scopus / WoS | scopus, wos, none |
| `journal_quality_flag` | Hệ thống | true khi tạp chí không có trong Scopus/SJR và ABDC |
| `license_source` | Chủ dự án / mặc định | oa / institution_subscription / personal_purchase / other |
| `retraction_status` | Crossref (Retraction Watch) | none / retracted / correction / expression_of_concern |
| `retraction_checked_at` | Hệ thống | Kiểm tra lại hằng tháng |
| `research_domain` | Hệ thống, theo collection Zotero | social_media / branding / ethics (miền khởi đầu, Mục 1.3) |
| `corpus_source` | Zotero | Collection, chuỗi tìm kiếm, CSDL, ngày (tùy chọn) |
| `screening_decision` | Chủ dự án (tùy chọn) | include / exclude |
| `exclusion_reason` | Chủ dự án (tùy chọn) | Văn bản ngắn |
| `study_id` | Hệ thống | |
| `path_id` | Hệ thống | |
| `matrix_id` | Hệ thống | |
| `cell_id` | Hệ thống | |
| `evidence_id` | Hệ thống | |
| `field_ref` | Hệ thống | Trường mà bằng chứng thuộc về |
| `printed_page` | Hệ thống | Quy đổi từ `pdf_page_index` (Mục 6.3) |
| `printed_page_method` | Hệ thống | page_labels / header_footer / crossref_offset / pdf_index |
| `verified` | Hệ thống | Kết quả máy đối chiếu |
| `verification_method` | Hệ thống | exact / fuzzy / neighbour_page / number / none |
| `match_score` | Hệ thống | 0–1 |
| `source` | Hệ thống | ai / zotero_annotation / human |
| `internal_check` | Hệ thống | Kết quả kiểm tra nội tại ma trận tương quan |
| `canonical_construct_id` | Hệ thống (Mục 5.3) | AI không tự gán |
| `iv_construct_id` | Hệ thống | Ánh xạ từ tên gốc |
| `dv_construct_id` | Hệ thống | Ánh xạ từ tên gốc |
| `construct_id` | Hệ thống | Ánh xạ từ tên gốc |
| `mediator_ids` | Hệ thống | Ánh xạ từ tên gốc |
| `moderator_ids` | Hệ thống | Ánh xạ từ tên gốc |
| `theory_id` | Hệ thống | Ánh xạ từ tên lý thuyết gốc (Phần C) |
| `comparability_note` | Hệ thống | Sinh từ `model_covariates` và `estimate_type` |
| `extraction_run_id` | Hệ thống | |
| `model_name` | Hệ thống | VD: `gemini-4-argon` |
| `prompt_version` | Hệ thống | |
| `schema_version` | Hệ thống | |
| `codebook_version` | Hệ thống | Phiên bản của file này |
| `extracted_at` | Hệ thống | |
| `badge` | Hệ thống (Mục 6.5) | auto_verified / needs_attention / ai_interpreted / hidden / human_reviewed / disputed |
| `check_results` | Hệ thống | Dữ liệu cho bảng "Vì sao ✓" |
| `natural_key` | Hệ thống | Khóa tự nhiên ổn định (Mục 6.7) |
| `completeness_status` | Hệ thống | complete / incomplete |
| `missing_items` | Hệ thống | Mã giả thuyết / bảng tìm thấy trong PDF nhưng chưa trích được |
| `stat_consistency` | Hệ thống | consistent / inconsistent / decision_error / not_checked |
| `recomputed_value` | Hệ thống | Giá trị tính lại (statcheck) |
| `error_source` | Hệ thống | extraction / original_paper |
| `locked` | Hệ thống | true khi chủ dự án đã sửa tay |
| `user_reports` | Người dùng | Báo lỗi từ web |
| `pdf_page_index` | Hệ thống | `pdf_page − 1` (lưu 0-based trong database) |

**Lớp khái niệm chuẩn (Mục 5.3)**, do hệ thống quản lý:

| Trường | Nguồn | Ghi chú |
| :--- | :--- | :--- |
| `canonical_name` | Danh sách khởi tạo (bước 0.14), mở rộng dần | Tên chuẩn bằng tiếng Anh, VD `Perceived Risk` |
| `canonical_definition` | Danh sách khởi tạo | Một định nghĩa phổ biến trong miền, kèm nguồn |
| `domain` | Danh sách khởi tạo | social_media / branding / ethics / consumer_behavior |
| `parent_construct_id` | Danh sách khởi tạo | Khái niệm bậc cao chứa khái niệm này (VD: Entertainment thuộc SMMA) |
| `mapping_method` | Hệ thống | exact / embedding / item_similarity / human |
| `mapping_confidence` | Hệ thống | 0–1; dưới ngưỡng thì **tách riêng**, không gộp |

---

## C. Phân loại bài & Lý thuyết (phân hệ 2, 3)

### C.1. Loại bài

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `paper_type` | T2 | Loại đóng góp chính của bài | `empirical_quant` (có dữ liệu định lượng và kiểm định), `empirical_qual` (phỏng vấn, case, netnography… không kiểm định thống kê), `mixed` (có cả định tính và định lượng, mỗi phần là kết quả chính), `conceptual` (xây khung lý thuyết, không có dữ liệu), `narrative_review` (tổng quan không theo quy trình hệ thống), `systematic_review` (có quy trình tìm kiếm và sàng lọc, VD theo PRISMA), `meta_analysis` (gộp effect size), `other` | Bài phát triển thang đo có nhiều Study định lượng và một bước định tính nhỏ để sinh item: `empirical_quant`. Chỉ dùng `mixed` khi phần định tính là kết quả chính. Bài tự gọi là "review" nhưng không có quy trình tìm kiếm: `narrative_review` |

### C.2. Lý thuyết (T3)

Mỗi lý thuyết được nhắc trong bài là một dòng.

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `theory_name_original` | T1 | Tên lý thuyết đúng như tác giả viết | Văn bản, VD `Stimulus–Organism–Response (S-O-R) framework` | Chỉ ghi lý thuyết có tên gọi; không ghi "prior literature" |
| `application_role` | T3 | Lý thuyết làm gì trong bài | `mentioned` (chỉ nhắc tên), `framing` (đóng khung vấn đề, không dùng để lập luận giả thuyết cụ thể), `hypothesis_derivation` (ít nhất một giả thuyết được lập luận trực tiếp từ lý thuyết này), `tested` (bài kiểm định chính các mệnh đề của lý thuyết), `extended` (bài bổ sung biến hoặc điều kiện vào lý thuyết và kiểm định phần bổ sung) | Có nhiều vai trò thì chọn vai trò **mạnh nhất** theo thứ tự `extended` > `tested` > `hypothesis_derivation` > `framing` > `mentioned` |
| `evidence` | – | Câu nêu vai trò của lý thuyết | Phần M | Với `hypothesis_derivation`: lấy câu lập luận giả thuyết có nhắc tên lý thuyết |

**Danh sách lý thuyết khởi tạo** của miền (S-O-R, Source Credibility, Uses & Gratifications, Parasocial Interaction, Social Identity, Consumer–Brand Relationship, Attribution Theory, Signaling Theory, Persuasion Knowledge Model, TPB…) được soạn ở bước 0.14: xem [docs/canonical-lists.md](canonical-lists.md) (nguồn dữ liệu: `packages/schema/src/canonical-data.ts`).

---

## D. Khái niệm & Đo lường (phân hệ 4, theo từng Study)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `construct_label_original` | T1 | Tên khái niệm đúng như tác giả dùng trong mô hình | Văn bản | Ghi tên đầy đủ, không ghi viết tắt (ghi `Perceived Risk`, không ghi `PR`); nếu bài chỉ dùng viết tắt thì ghi viết tắt |
| `definition` | T1 | Định nghĩa vận hành tác giả dùng cho khái niệm | Câu nguyên văn (cũng là `quote` của bằng chứng) | Có nhiều câu thì lấy câu tác giả dùng làm định nghĩa của bài ("In this study, X is defined as…"); không có định nghĩa thì `null` |
| `scale_source` | T1 | Nguồn của thang đo | Trích dẫn như in, VD `Kim & Ko (2012)` | Nhiều nguồn thì ghi tất cả, cách nhau bằng dấu chấm phẩy; tác giả tự phát triển: `self-developed` |
| `adapted` | T1 | Thang đo có được điều chỉnh không | `true` / `false` / `null` | Tác giả viết "adapted from", "modified", "based on" → `true`; "adopted from", "used the scale of" → `false`; không nói → `null` |
| `n_items` | T1 | Số item **cuối cùng** sau khi loại item | Số nguyên | Tác giả loại item sau EFA/CFA: ghi số còn lại |
| `items` | T1 | Nội dung các item | Mảng văn bản nguyên văn | Chỉ khi bài in item (thường ở phụ lục). Không in thì mảng rỗng |
| `scale_type` | T2 | Mô hình đo lường | `reflective` / `formative` / `null` | Chỉ ghi khi tác giả nói rõ hoặc khi bài dùng tiêu chí đặc thù của formative (VIF, trọng số outer weight) |
| `order` | T2 | Bậc của khái niệm | `first` / `higher` | `higher` khi khái niệm được đo qua các thành phần (VD: SMMA gồm entertainment, interaction…) |
| `alpha` | T1 | Cronbach's α | Số 0–1 | Có nhiều giá trị (nhiều Study) thì ghi theo từng Study |
| `CR` | T1 | Composite reliability (hoặc rho_c) | Số 0–1 | `rho_A` không ghi vào đây |
| `AVE` | T1 | Average variance extracted | Số 0–1 | |
| `HTMT_max` | T1 | HTMT lớn nhất liên quan đến khái niệm | Số | Chỉ khi bài in bảng HTMT |

---

## E. Thiết kế nghiên cứu & Study (phân hệ 5)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `study_label` | T1 | Nhãn Study của tác giả | Văn bản (A.5) | |
| `research_design` | T2 | Thiết kế chính của Study | `survey`, `lab_experiment`, `online_experiment`, `field_experiment`, `secondary_data`, `longitudinal_panel`, `qualitative`, `other` | Thực nghiệm phát qua Prolific / MTurk / Qualtrics panel: `online_experiment`. Survey có một câu hỏi dạng kịch bản nhưng **không** phân ngẫu nhiên điều kiện: `survey`. Dữ liệu bảng nhiều đợt cùng người: `longitudinal_panel` |
| `time_design` | T2 | Thời điểm thu thập | `cross_sectional`, `time_lagged`, `longitudinal` | `time_lagged`: biến độc lập và phụ thuộc đo ở các thời điểm khác nhau, cùng mẫu |
| `experimental_design` | T1 | Cấu trúc thiết kế thực nghiệm | Văn bản ngắn như in, VD `2 (disclosure: yes vs. no) × 2 (source: influencer vs. brand) between-subjects` | Không phải thực nghiệm: `null` |
| `manipulation_check` | T2 | Có kiểm tra thao tác và kết quả | `passed`, `failed`, `not_reported` | Tác giả báo cáo có ý nghĩa theo hướng dự kiến: `passed` |
| `attention_check` | T2 | Có câu kiểm tra mức chú ý | `true` / `false` | Chỉ `true` khi bài nói rõ có attention check |
| `exclusion_rate` | T1 | Tỷ lệ mẫu bị loại | Số 0–1 | Chỉ ghi khi bài in tỷ lệ hoặc in cả số ban đầu và số cuối (tính = loại / ban đầu). Đây là một trong số ít phép tính được phép, vì cả hai số đều có trong bài |
| `preregistered` | T2 | Study có đăng ký trước | `true` / `false` | Có link AsPredicted / OSF prereg: `true` |
| `open_data` | T2 | Dữ liệu được công khai | `true` / `false` | Có link dữ liệu (OSF, Mendeley Data…): `true`. "Available upon request": `false` |
| `analysis_method` | T2 | Phương pháp phân tích chính | `pls_sem`, `cb_sem`, `regression`, `anova_ancova`, `process_mediation`, `t_test`, `hlm_multilevel`, `fsqca`, `content_analysis`, `other` | Có nhiều phương pháp thì ghi mảng, phương pháp dùng để kiểm định giả thuyết đứng đầu |
| `software` | T1 | Phần mềm | Văn bản, VD `SmartPLS 4`, `AMOS 26`, `PROCESS macro (Model 4)` | |

---

## F. Mẫu & Bối cảnh (phân hệ 6, theo từng Study)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `n` | T1 | Cỡ mẫu **cuối cùng dùng để phân tích** | Số nguyên dương | Bài in cả số gửi đi, số thu về, số hợp lệ: lấy **số hợp lệ đưa vào phân tích**. Thực nghiệm: tổng các điều kiện sau loại mẫu |
| `unit_of_analysis` | T2 | Đơn vị phân tích | `individual`, `firm`, `dyad`, `team`, `brand`, `post` (bài đăng mạng xã hội), `other` | |
| `sample_type` | T2 | Nguồn mẫu | `students`, `mturk`, `prolific`, `consumer_panel` (Qualtrics, Dynata, Toluna…), `online_convenience` (chia sẻ link mạng xã hội), `employees`, `managers`, `social_media_users`, `secondary`, `other` | Có nhiều nguồn thì chọn nguồn chiếm đa số |
| `country_iso` | T1 | Quốc gia thu thập dữ liệu | Mảng mã ISO 3166-1 alpha-2, VD `["VN"]`, `["TR"]` | Mẫu toàn cầu không rõ nước: `[]` và ghi chú trong bằng chứng |
| `industry_code` | T2 | Ngành / bối cảnh sản phẩm | Văn bản ngắn theo ISIC (cấp section), VD `G` (bán lẻ), `I` (lưu trú, ăn uống), `J` (thông tin, truyền thông) | Không rõ: `null` |
| `market_type` | T2 | Thị trường | `b2c`, `b2b`, `c2c` | |
| `data_collection_period` | T1 | Thời gian thu thập | Văn bản như in, VD `March–April 2024` | |

---

## G. Kiểm soát sai lệch (phân hệ 7)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `cmb_procedural` | T2 | Biện pháp thủ tục giảm CMB | Mảng: `anonymity`, `separated_measurement` (tách thời điểm hoặc nguồn), `counterbalancing`, `reverse_items`, `different_scale_formats`, `other` | Chỉ ghi biện pháp tác giả nói là để giảm CMB |
| `cmb_statistical` | T2 | Kiểm định thống kê CMB | Mảng: `harman`, `marker_variable`, `ulmc` (unmeasured latent method construct), `clf` (common latent factor), `full_collinearity_vif`, `other` | |
| `cmb_weak_only` | T2 | Chỉ dùng Harman's single-factor test | `true` / `false` | `true` khi `cmb_statistical = ["harman"]` và không có biện pháp nào khác |
| `endogeneity_method` | T2 | Xử lý nội sinh | Mảng: `instrumental_variable`, `heckman`, `gaussian_copula`, `two_sls`, `control_function`, `none_reported` | |

---

## H. Đường quan hệ được kiểm định (phân hệ 8)

Mỗi **kiểm định** của một quan hệ X → Y trong một Study là một dòng, kể cả quan hệ không có mã giả thuyết.

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `hypothesis_code` | T1 | Mã giả thuyết của tác giả | `H1`, `H2a`… hoặc `null` | Kiểm định không có mã (biến kiểm soát, phân tích bổ sung): `null` |
| `iv_label_original` | T1 | Biến độc lập, đúng tên tác giả | Văn bản | Với thực nghiệm: ghi **điều kiện** so với nhóm đối chứng, VD `Disclosed AI influencer (vs. human influencer)` |
| `dv_label_original` | T1 | Biến phụ thuộc, đúng tên tác giả | Văn bản | |
| `mediator_labels` | T1 | Biến trung gian của kiểm định này | Mảng tên gốc | Chỉ điền cho `effect_type = indirect` |
| `moderator_labels` | T1 | Biến điều tiết của kiểm định này | Mảng tên gốc | Chỉ điền cho `effect_type = interaction` |
| `effect_type` | T2 | Loại hiệu ứng | `direct`, `indirect`, `interaction`, `total`, `control` | Biến kiểm soát: `control` |
| `estimate_type` | T2 | Loại hệ số | `std_beta`, `unstd_b`, `path_coefficient` (PLS-SEM, tác giả không nói chuẩn hóa hay không), `r`, `d`, `odds_ratio`, `eta_squared`, `other` | Bảng ghi "β": `std_beta`; ghi "B" hoặc "b": `unstd_b`; PLS-SEM ghi "path coefficient": `path_coefficient` |
| `estimate` | T1 | Giá trị hệ số | Số, giữ dấu | A.4 |
| `se` | T1 | Sai số chuẩn | Số | |
| `ci_low` | T1 | Cận dưới khoảng tin cậy | Số | |
| `ci_high` | T1 | Cận trên khoảng tin cậy | Số | |
| `ci_method` | T2 | Cách tính CI | `bootstrap`, `normal`, `other` | Bài ghi "bias-corrected bootstrap" hoặc "5,000 bootstrap samples": `bootstrap` |
| `p_value` | T1 | Giá trị p chính xác | Số 0–1 hoặc `null` | A.4 |
| `p_reported_as` | T1 | Giá trị p như in | Văn bản, VD `< .001`, `= .03`, `n.s.`, `***` + ngưỡng | |
| `t_or_z` | T1 | Thống kê t hoặc z | Số | |
| `r2_dv` | T1 | R² của biến phụ thuộc trong mô hình | Số 0–1 | |
| `f2` | T1 | Effect size f² | Số | |
| `status` | T2 | Kết quả kiểm định giả thuyết **theo tác giả** | `supported`, `not_supported`, `partially_supported`, `mixed` (khác nhau giữa các Study trong cùng một giả thuyết), `not_hypothesized` | Ghi theo kết luận của tác giả, kể cả khi máy thấy p không khớp (máy sẽ tự gắn ⚠) |
| `hypothesized_direction` | T1 | Chiều dự đoán trong giả thuyết | `positive`, `negative`, `non_directional`, `null` | `null` khi không có giả thuyết |
| `observed_sign` | T1 | Dấu của hệ số quan sát được | `positive`, `negative`, `null` | Lấy từ dấu của `estimate` |
| `significant` | T1 | Có ý nghĩa theo **ngưỡng tác giả dùng** | `true` / `false` | Tác giả dùng α = .10: theo ngưỡng của tác giả |
| `model_covariates` | T1 | Các biến khác có trong cùng mô hình hoặc phương trình | Mảng tên gốc | Dùng để hiểu giới hạn so sánh β giữa các bài; không có thông tin: `[]` |

---

## I. Trung gian & Điều tiết (phân hệ 9)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `indirect_effect` | T1 | Hiệu ứng gián tiếp (a × b) | Số | |
| `boot_ci` | T1 | Khoảng tin cậy bootstrap của hiệu ứng gián tiếp | `[low, high]` | |
| `mediation_type` | T2 | Loại trung gian theo Zhao, Lynch & Chen (2010) | `complementary` (gián tiếp và trực tiếp cùng có ý nghĩa, cùng dấu), `competitive` (cùng có ý nghĩa, ngược dấu), `indirect_only`, `direct_only`, `no_effect` | Tác giả dùng thuật ngữ Baron & Kenny ("full / partial mediation"): **không chép**, mà phân loại lại theo định nghĩa ở đây nếu đủ số liệu; không đủ thì `null` |
| `interaction_type` | T2 | Dạng tương tác | `two_way`, `three_way`, `moderated_mediation` | |
| `simple_slopes` | T1 | Hệ số tại các mức của biến điều tiết | Mảng `{level, estimate, p_reported_as}` | Mức như in, VD `−1 SD`, `+1 SD`, `disclosure = yes` |
| `index_moderated_mediation` | T1 | Chỉ số moderated mediation (Hayes) | Số kèm `boot_ci` | |

---

## J. Ma trận tương quan & Ô điều kiện thực nghiệm (phân hệ 10, 10b)

### J.1. Ma trận tương quan

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `variables` | T1 | Thứ tự các biến trong bảng | Mảng tên gốc theo đúng thứ tự in | |
| `cells` | T1 | Các hệ số tương quan | Mảng `{i, j, r}` (chỉ tam giác dưới) | Bảng in tam giác trên: chuyển vị cho thống nhất. Ô đường chéo không ghi vào `cells` |
| `diagonal_type` | T2 | Ý nghĩa của đường chéo | `one`, `sqrt_ave`, `alpha`, `empty` | Đọc chú thích bảng; bảng Fornell–Larcker có √AVE in đậm ở đường chéo |
| `descriptives` | T1 | Thống kê mô tả theo biến | Mảng `{variable, mean, sd, alpha, cr, ave}` | Chỉ ghi giá trị có in |
| `correlation_type` | T2 | Loại tương quan | `pearson`, `latent` (từ CFA / PLS), `polychoric`, `unknown` | Bảng Fornell–Larcker trong PLS-SEM: `latent` |
| `source_table` | T1 | Tên bảng | Văn bản, VD `Table 3` | |

### J.2. Ô điều kiện thực nghiệm

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `factors` | T1 | Các yếu tố và mức của ô | Mảng `{factor, level}` như in | |
| `condition_label` | T1 | Tên điều kiện như in | Văn bản | |
| `dv_label_original` | T1 | Biến phụ thuộc của ô | Văn bản | |
| `mean` | T1 | Trung bình | Số | |
| `sd` | T1 | Độ lệch chuẩn | Số > 0 | Bài chỉ in SE: để `sd = null`, ghi `se` |
| `se` | T1 | Sai số chuẩn | Số | |
| `test_stat` | T1 | Thống kê kiểm định so sánh các ô | `{type: "F" or "t", value}` | |
| `df` | T1 | Bậc tự do | VD `[1, 418]` | |
| `effect_size_reported` | T1 | Effect size như in | Số | |
| `effect_size_type` | T2 | Loại effect size | `eta_squared`, `partial_eta_squared`, `omega_squared`, `d`, `other` | Ghi "ηp²": `partial_eta_squared` |

---

## K. Đóng góp & Khoảng trống (phân hệ 11, T3)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `contribution_type` | T3 | Loại đóng góp theo Corley & Gioia (2011) | Hai chiều: `originality` ∈ {`incremental`, `revelatory`}; `utility` ∈ {`scientific`, `practical`, `both`} | `revelatory` chỉ khi bài đưa ra khái niệm hoặc cơ chế mới (VD phát triển khái niệm và thang đo mới); mở rộng mô hình sẵn có sang bối cảnh mới: `incremental` |
| `theoretical_contributions` | T1 | Đóng góp lý thuyết **tác giả tự nêu** | Mảng câu nguyên văn | Lấy ở mục "Theoretical contributions / implications" |
| `practical_implications` | T1 | Hàm ý thực tiễn tác giả nêu | Mảng câu nguyên văn | |
| `limitations` | T1 | Hạn chế tác giả nêu | Mảng câu nguyên văn | |
| `future_directions` | T1 | Hướng nghiên cứu tương lai tác giả nêu | Mảng câu nguyên văn | |
| `gap_type` | T3 | Loại khoảng trống bài lấp, theo Müller-Bloch & Kranz (2015) | `evidence` (kết quả trái ngược), `knowledge` (chưa ai nghiên cứu), `practical_knowledge` (thực tiễn khác lý thuyết), `methodological`, `empirical` (chưa kiểm định thực nghiệm), `theoretical`, `population` (nhóm đối tượng chưa được nghiên cứu) | Chọn loại tác giả nêu rõ nhất trong phần mở đầu |
| `problematization_hint` | T3 | Giả định nền của dòng nghiên cứu mà bài thách thức, theo Alvesson & Sandberg (2011) | Một câu ngắn, hoặc `null` | Phần lớn bài là gap-spotting: để `null`. Chỉ điền khi tác giả **chủ động** đặt lại câu hỏi về một giả định phổ biến |

---

## M. Bằng chứng (phân hệ 12)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `pdf_page` | T1 | Trang PDF chứa bằng chứng (1-based) | Số nguyên ≥ 1 | A.2 |
| `quote` | T1 | Đoạn nguyên văn làm căn cứ | ≤ 50 từ, một đoạn liên tục | A.2. Trên web, câu trích công khai giới hạn 50 từ (`exact_quote`) |
| `exact_quote` | T1 | Tên của `quote` khi lưu trong database | Như `quote` | |
| `section` | T2 | Phần của bài | `abstract`, `introduction`, `theory`, `method`, `results`, `discussion`, `appendix`, `other` | |
| `table_or_figure` | T1 | Tên bảng hoặc hình chứa bằng chứng | VD `Table 4`, `Figure 2` | Không nằm trong bảng/hình: `null` |
| `table_cell` | T1 | Vị trí ô trong bảng | `{row, column}` theo nhãn như in, VD `{row: "H2", column: "β"}` | |

---

## L. Trường cấu trúc trong các lượt gọi AI (`packages/schema`)

Các trường dưới đây là "khung" của từng lượt gọi Gemini (Mục 4.2): nhóm các giá trị ở trên, hoặc là khóa con của một đối tượng.

### L.1. Pass 1: cấu trúc bài (`PaperStructure`)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `paper_type_evidence` | – | Bằng chứng cho `paper_type` | Phần M | Ưu tiên câu mô tả phương pháp trong phần Tóm tắt hoặc Phương pháp |
| `studies` | – | Danh sách mọi Study (nhãn, thiết kế, bằng chứng) | Mảng | A.5; bài không có dữ liệu: `[]` |
| `design_evidence` | – | Bằng chứng cho `research_design` của một Study | Phần M | |
| `hypothesis_codes` | T1 | Mọi mã giả thuyết nêu trong bài, theo thứ tự xuất hiện | Mảng văn bản như in | Dùng để kiểm tra độ đầy đủ (Mục 6.3) |
| `tables` | – | Danh sách mọi bảng trong bài | Mảng | |
| `table_label` | T1 | Tên bảng như in | VD `Table 3` | |
| `kind` | T2 | Loại bảng | `results`, `correlation`, `descriptives`, `measurement`, `condition_means`, `hypotheses_summary`, `other` | Bảng gộp tương quan và thống kê mô tả: `correlation` |
| `theories` | – | Danh sách lý thuyết được dùng | Mảng (Phần C.2) | |

### L.2. Pass 1b: thảo luận (`PaperDiscussion`)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `originality` | T3 | Chiều "độ mới" của `contribution_type` | `incremental`, `revelatory` | Phần K |
| `utility` | T3 | Chiều "tính hữu ích" của `contribution_type` | `scientific`, `practical`, `both` | Phần K |
| `gap_evidence` | – | Bằng chứng cho `gap_type` | Phần M hoặc `null` | |

### L.3. Pass 2: chi tiết Study (`StudyDetail` và các phần)

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `design` | – | Nhóm các trường thiết kế (Phần E) kèm một bằng chứng | Đối tượng | |
| `sample` | – | Nhóm các trường mẫu và bối cảnh (Phần F) kèm bằng chứng | Đối tượng | |
| `n_evidence` | – | Bằng chứng riêng cho cỡ mẫu `n` | Phần M; bắt buộc khi `n` khác `null` | Lấy câu nêu số hợp lệ cuối cùng |
| `bias_control` | – | Nhóm các trường kiểm soát sai lệch (Phần G) | Đối tượng; `evidence = null` khi bài không bàn đến | |
| `measurements` | – | Danh sách khái niệm được đo trong Study (Phần D) | Mảng | |
| `definition_evidence` | – | Bằng chứng cho `definition` | Phần M | |
| `reliability_evidence` | – | Dòng bảng hoặc câu báo cáo α / CR / AVE | Phần M | |
| `parent_label_original` | T1 | Khái niệm bậc cao chứa khái niệm này, đúng tên tác giả | Văn bản hoặc `null` | VD `Social media marketing activities` cho thành phần `Entertainment` |
| `paths` | – | Danh sách mọi kiểm định trong Study (Phần H, I) | Mảng | Kể cả biến kiểm soát và kiểm định không có mã giả thuyết |
| `correlation_matrices` | – | Danh sách ma trận tương quan (Phần J.1) | Mảng | |
| `condition_cells` | – | Danh sách ô điều kiện thực nghiệm (Phần J.2) | Mảng | |

### L.4. Khóa con

| Trường | Tầng | Định nghĩa | Giá trị cho phép | Quy tắc khi mơ hồ |
| :--- | :--- | :--- | :--- | :--- |
| `i` | T1 | Chỉ số dòng trong `variables` (bắt đầu từ 0) | Số nguyên ≥ 0 | Luôn `i > j` (tam giác dưới) |
| `j` | T1 | Chỉ số cột trong `variables` | Số nguyên ≥ 0 | |
| `r` | T1 | Hệ số tương quan của ô (i, j) | Số từ −1 đến 1 | |
| `variable` | T1 | Tên biến của một dòng thống kê mô tả | Như in | |
| `cr` | T1 | CR trong thống kê mô tả | Số 0–1 | |
| `ave` | T1 | AVE trong thống kê mô tả | Số 0–1 | |
| `row` | T1 | Nhãn dòng của ô bảng | Như in | |
| `column` | T1 | Nhãn cột của ô bảng | Như in | |
| `factor` | T1 | Tên yếu tố thực nghiệm | Như in, VD `disclosure` | |
| `level` | T1 | Mức của yếu tố, hoặc mức của biến điều tiết trong `simple_slopes` | Như in, VD `yes`, `−1 SD` | |
| `type` | T1 | Loại thống kê kiểm định trong `test_stat` | `F`, `t` | |
| `value` | T1 | Giá trị của thống kê kiểm định | Số | |

---

## N. Bài học từ chạy thử (bước 0.8b) đã đưa vào codebook

| Quan sát khi chạy thử | Quy tắc trong codebook |
| :--- | :--- |
| AI ghép các ô bảng thành câu có "…" | A.2 (4) và (5): một đoạn liên tục; trích nguyên dòng bảng |
| Bài tổng quan không có quy trình hệ thống bị xếp vào `conceptual` | C.1: thêm giá trị `narrative_review` |
| Hệ số PLS-SEM ghi "path coefficient", AI chọn `other` | H: thêm giá trị `path_coefficient` |
| Bài phát triển thang đo có "Exploratory study" và panel chuyên gia | A.5 (2), (4): dùng đúng nhãn của tác giả; panel chuyên gia là Study khi có cỡ mẫu riêng |
| Cỡ mẫu có nhiều con số (gửi đi, thu về, hợp lệ) | F: `n` là số hợp lệ đưa vào phân tích |

---

## Nhật ký thay đổi codebook

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 1.0.1 | 2026-10-18 | Bước 0.11: thêm Phần L (trường cấu trúc của các lượt gọi AI và khóa con) để schema Zod và codebook khớp nhau hoàn toàn |
| 1.0.0 | 2026-10-18 | Bản đầu tiên (bước 0.10): phủ toàn bộ 13 phân hệ ở Mục 5.2; thêm `narrative_review`, `path_coefficient`; các quy tắc bằng chứng rút ra từ chạy thử bước 0.8b |
