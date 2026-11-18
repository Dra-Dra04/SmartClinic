## 2.5. Thiết kế module trợ lý AI y tế sử dụng RAG

Module trợ lý AI hỗ trợ bệnh nhân tra cứu thông tin sức khỏe phổ thông, quy trình khám và cách chuẩn bị trước khi sử dụng dịch vụ. Hệ thống áp dụng RAG (Retrieval-Augmented Generation), kết hợp truy xuất tài liệu với mô hình ngôn ngữ để tạo câu trả lời dựa trên nguồn tham chiếu. Trợ lý đồng thời hỗ trợ tra cứu dịch vụ và lịch khám, nhưng không thay thế chẩn đoán hoặc quyết định điều trị của bác sĩ.

### 2.5.1. Kiến trúc tổng thể module RAG

Module được tổ chức thành hai luồng: xử lý tri thức và xử lý hội thoại. Luồng xử lý tri thức tiếp nhận tài liệu, kiểm duyệt, trích xuất văn bản, chia đoạn và tạo vector để lập chỉ mục tìm kiếm. Luồng hội thoại tiếp nhận câu hỏi, xác định nguồn dữ liệu phù hợp, truy xuất ngữ cảnh và sinh phản hồi. Hai luồng dùng chung định danh tài liệu và phiên bản để duy trì khả năng truy nguyên nguồn.

Kiến trúc gồm giao diện chat trên Web/PWA và ứng dụng di động, dịch vụ điều phối RAG tại backend, SQL Server, kho vector Pinecone và dịch vụ mô hình ngôn ngữ. SQL Server lưu thông tin tài liệu, trạng thái phê duyệt, lịch sử hội thoại và trích dẫn; Pinecone phục vụ tìm kiếm các đoạn văn bản theo độ tương đồng ngữ nghĩa. Tệp tài liệu gốc được quản lý tại vùng lưu trữ có phân quyền. Client chỉ gọi API backend, không truy cập trực tiếp kho vector hoặc giữ khóa dịch vụ AI.

Luồng xử lý chính được khái quát như sau:

**Câu hỏi → Kiểm tra yêu cầu → Truy xuất nguồn phù hợp → Tạo ngữ cảnh → Sinh và kiểm tra phản hồi → Trả lời kèm trích dẫn.**

Dịch vụ điều phối quản lý quyền truy cập, lựa chọn công cụ và xử lý lỗi. Các bước trích xuất, tạo embedding và lập chỉ mục được thực hiện bằng tác vụ nền, giúp hoạt động cập nhật tri thức không làm gián đoạn hội thoại của người dùng.

### 2.5.2. Thiết kế kho tri thức và quy trình xử lý tài liệu y tế

Kho tri thức bao gồm tài liệu hướng dẫn quy trình khám, thông tin chuẩn bị trước xét nghiệm, kiến thức sức khỏe và nội dung chuyên môn được cơ sở phê duyệt. Mỗi tài liệu được quản lý bằng mã định danh, tên, nguồn phát hành, phiên bản, thời điểm cập nhật, trạng thái kiểm duyệt và hiệu lực sử dụng. Hồ sơ bệnh án cá nhân không được đưa vào kho tri thức dùng chung.

Quy trình xử lý bắt đầu khi quản trị viên tải tài liệu PDF hoặc DOCX lên hệ thống. Backend kiểm tra định dạng, dung lượng và thông tin nguồn trước khi lưu. Sau khi nội dung được phê duyệt, hệ thống trích xuất văn bản, loại bỏ thành phần lặp không cần thiết và chuẩn hóa khoảng trắng, ký tự. Tài liệu quét không có lớp văn bản phải được nhận diện và chuyển qua bước OCR, kiểm tra chất lượng trước khi lập chỉ mục.

Văn bản được chia thành các đoạn theo tiêu đề, mục hoặc đơn vị nội dung tương đối trọn vẹn. Các đoạn liền kề có phần giao nhau để giảm mất ngữ cảnh ở vị trí phân tách. Thông tin quan trọng như đối tượng áp dụng, điều kiện thực hiện, đơn vị đo và lưu ý phải được giữ cùng nội dung liên quan. Mỗi đoạn có mã riêng và thông tin vị trí nguồn; PDF lưu số trang, còn DOCX ưu tiên tiêu đề mục và vị trí đoạn vì số trang có thể thay đổi theo cách dàn trang.

Tài liệu được quản lý qua các trạng thái nháp, chờ duyệt, đã duyệt, đang lập chỉ mục, sẵn sàng và ngừng sử dụng. Tài liệu chỉ tham gia truy xuất khi đã duyệt, còn hiệu lực và hoàn tất lập chỉ mục. Khi thay thế hoặc gỡ tài liệu, hệ thống cập nhật trạng thái tại SQL Server và đồng bộ kho vector, đồng thời giữ lịch sử phiên bản phục vụ đối chiếu.

### 2.5.3. Thiết kế cơ chế Embedding và lưu trữ vector

Embedding chuyển nội dung văn bản thành vector số, biểu diễn các đặc trưng ngữ nghĩa để so sánh câu hỏi với tài liệu. Mỗi đoạn tri thức được tạo embedding và lưu vào Pinecone cùng mã đoạn, mã tài liệu, phiên bản, chuyên mục, vị trí nguồn và trạng thái hiệu lực. Nội dung văn bản và metadata gốc được quản lý có liên kết tại SQL Server hoặc vùng lưu trữ tài liệu để phục vụ kiểm tra, dựng ngữ cảnh và trích dẫn.

Hệ thống sử dụng cùng mô hình và cấu hình embedding cho tài liệu và câu hỏi. Số chiều của chỉ mục vector phải khớp với đầu ra của mô hình; độ tương đồng cosine được sử dụng để xếp hạng các đoạn gần nghĩa. Cấu hình mô hình, số chiều, kích thước đoạn và số lượng kết quả truy xuất được quản lý tập trung. Khi đổi mô hình embedding, dữ liệu được lập chỉ mục lại trước khi chuyển sang sử dụng, tránh so sánh các vector không cùng không gian biểu diễn.

Tác vụ lập chỉ mục sử dụng định danh ổn định theo tài liệu, phiên bản và đoạn văn bản để cập nhật mà không tạo bản sao khi chạy lại. Trạng thái tác vụ được lưu để theo dõi lỗi và tiếp tục xử lý. Việc đồng bộ giữa SQL Server và Pinecone có thể xảy ra chậm; vì vậy, trạng thái tài liệu được kiểm tra lại ở SQL Server trước khi một đoạn được sử dụng để trả lời.

### 2.5.4. Thiết kế quy trình truy xuất và sinh câu trả lời

Khi nhận câu hỏi, backend kiểm tra quyền truy cập hội thoại, độ dài đầu vào và phạm vi yêu cầu. Nội dung được chuẩn hóa ở mức cần thiết, đồng thời giữ nguyên các dấu hiệu quan trọng như phủ định, thời gian và đối tượng được đề cập. Một phần lịch sử hội thoại gần nhất được sử dụng để hiểu câu hỏi tiếp nối, nhưng không thay thế tài liệu làm căn cứ trả lời.

Với câu hỏi về kiến thức hoặc quy trình, hệ thống tạo embedding, tìm các đoạn tương đồng trong Pinecone và lọc theo phạm vi tài liệu được phép sử dụng. Kết quả được kiểm tra hiệu lực, loại trùng và lựa chọn theo mức độ liên quan. Số đoạn và ngưỡng lựa chọn được hiệu chỉnh bằng bộ câu hỏi đánh giá; điểm tương đồng không được diễn giải thành xác suất câu trả lời đúng. Nếu nguồn không đủ hoặc có mâu thuẫn chưa giải quyết, hệ thống chuyển sang phản hồi giới hạn thay vì tự bổ sung kết luận.

Với câu hỏi về giá dịch vụ hoặc lịch trống, dịch vụ điều phối gọi công cụ đọc dữ liệu nghiệp vụ từ SQL Server. Công cụ có tham số và quyền truy cập được kiểm tra, không cho mô hình tự thực thi SQL tùy ý. Sau khi tập hợp ngữ cảnh, backend gửi câu hỏi, nguồn tham chiếu và chỉ dẫn trả lời đến mô hình ngôn ngữ. Phản hồi được kiểm tra trước khi hiển thị; nội dung hội thoại và nguồn sử dụng được lưu để tra cứu. Nếu người dùng muốn đặt lịch, thao tác phải được xác nhận và xử lý qua API đặt lịch có kiểm soát sức chứa.

### 2.5.5. Thiết kế cơ chế trích dẫn nguồn và kiểm soát an toàn

Mỗi câu trả lời sử dụng tài liệu được gắn trích dẫn gồm tên tài liệu, phiên bản và số trang hoặc mục. Backend xây dựng thông tin nguồn từ metadata của các đoạn thực sự được truy xuất; mô hình không tự tạo tên tài liệu hoặc đường dẫn. Người dùng có thể mở phần tham chiếu được phép xem để đối chiếu. Với kết quả tra cứu lịch hoặc giá, phản hồi nêu nguồn dữ liệu nghiệp vụ và thời điểm truy vấn, giúp phân biệt với nội dung tài liệu tĩnh.

Cơ chế an toàn được áp dụng ở đầu vào, ngữ cảnh và đầu ra. Nội dung người dùng và tài liệu truy xuất được xem là dữ liệu tham khảo, không có quyền thay đổi chỉ dẫn hệ thống hoặc cấp quyền thực thi công cụ. Trợ lý chỉ sử dụng những công cụ được cho phép; yêu cầu truy cập hồ sơ của người khác phải bị từ chối. Các nội dung vượt phạm vi, như yêu cầu chẩn đoán xác định, kê đơn hoặc tự điều chỉnh điều trị, được chuyển thành phản hồi giới hạn và hướng dẫn liên hệ nhân viên y tế.

Trước khi trả lời, hệ thống kiểm tra sự phù hợp giữa nội dung phản hồi và nguồn tham chiếu, khả năng lộ dữ liệu cá nhân và các khẳng định vượt quá căn cứ. Khi thiếu nguồn, dịch vụ lỗi hoặc không đủ điều kiện trả lời, trợ lý thông báo rõ giới hạn thay vì suy đoán. Chất lượng module được đánh giá bằng bộ câu hỏi tiếng Việt về độ liên quan của truy xuất, độ chính xác của trích dẫn và khả năng xử lý yêu cầu không an toàn. Kết quả đánh giá hỗ trợ điều chỉnh dữ liệu và cấu hình, không được xem là bảo đảm tuyệt đối rằng mọi phản hồi đều chính xác.
