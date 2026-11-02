from pathlib import Path
from zipfile import ZipFile
from copy import deepcopy
from lxml import etree as E
import hashlib,json

root=Path('E:/DATN/SmartClinicProject')
src=Path('C:/Users/LongNguyen/Downloads/Dự kiến kế hoạch CNTT_Nguyễn Việt Anh_141025.docx')
out=root/'outputs/Ke_hoach_du_kien_DATN_SmartClinic.docx'
out.parent.mkdir(exist_ok=True)
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns={'w':W}
def tag(n): return '{'+W+'}'+n
z=ZipFile(src); tree=E.fromstring(z.read('word/document.xml')); body=tree.find('w:body',ns)
ps=body.findall('w:p',ns); tables=body.findall('w:tbl',ns)
def put(p,text):
    rs=p.findall('w:r',ns)
    rp=deepcopy(rs[0].find('w:rPr',ns)) if rs and rs[0].find('w:rPr',ns) is not None else None
    for child in list(p):
        if child.tag!=tag('pPr'): p.remove(child)
    r=E.SubElement(p,tag('r'))
    if rp is not None: r.append(rp)
    for i,line in enumerate(text.split('\n')):
        if i: E.SubElement(r,tag('br'))
        E.SubElement(r,tag('t')).text=line
def cell(tc,text):
    paragraphs=tc.findall('w:p',ns)
    put(paragraphs[0],text)
    for p in paragraphs[1:]: tc.remove(p)

put(ps[1],'BẢNG KẾ HOẠCH DỰ KIẾN THỰC HIỆN ĐỒ ÁN TỐT NGHIỆP')
put(ps[2],'ĐỢT …, NĂM HỌC … – …')
put(ps[4],'Tên đề tài: Xây dựng hệ thống quản lý phòng khám và đặt lịch khám đa nền tảng tích hợp trợ lý AI y tế sử dụng RAG')
put(ps[5],'Thời gian thực hiện: 15 tuần — Từ ngày …/…/…… đến ngày …/…/……')
put(ps[7],'Phạm vi: Web nghiệp vụ cho quản trị viên, lễ tân, bác sĩ; ứng dụng bệnh nhân đa nền tảng; backend và trợ lý AI dùng chung.')
put(ps[8],'Ghi chú: Thời gian tính từ tuần bắt đầu thực hiện đề tài. Viết báo cáo và kiểm thử được tiến hành xuyên suốt; thanh toán trực tuyến, kho thuốc và khám từ xa thuộc hướng mở rộng.')
put(ps[9],'Hà Nội, ngày … tháng … năm ……')
for tc,text in zip(tables[1].findall('.//w:tc',ns),['Họ và tên sinh viên: ………………………','Lớp: …………','Ngành: CNTT']): cell(tc,text)
cell(tables[2].findall('.//w:tc',ns)[1],'…………………………………………')
rows=[
('Khảo sát quy trình phòng khám; xác định yêu cầu của bệnh nhân, lễ tân, bác sĩ và quản trị viên; chốt phạm vi đề tài.','1\nTuần 1','Tài liệu yêu cầu, quy trình nghiệp vụ, danh sách chức năng theo vai trò và tiêu chí nghiệm thu.'),
('Nghiên cứu ASP.NET Core, SQL Server, phát triển web/mobile và RAG; lựa chọn tài liệu y tế, thử nghiệm truy xuất trên tập tài liệu mẫu.','1\nTuần 2','Cơ sở lý thuyết; kiến trúc công nghệ đề xuất; danh mục nguồn tài liệu và bản thử nghiệm RAG ban đầu.'),
('Phân tích và thiết kế hệ thống: use case, luồng xử lý, cơ sở dữ liệu, API, phân quyền; thiết kế giao diện bằng Figma và quy trình xử lý tài liệu RAG.','2\nTuần 3–4','Biểu đồ phân tích, ERD, đặc tả API, prototype web/mobile; thiết kế phiên đăng nhập và kho tri thức.'),
('Xây dựng backend và giao diện nền tảng: tài khoản, JWT, refresh token, hết phiên, phân quyền; quản lý bệnh nhân, bác sĩ, chuyên khoa, phòng và dịch vụ.','2\nTuần 5–6','Đăng nhập và phân quyền hoạt động; quản lý hồ sơ, danh mục; web/mobile kết nối API dùng chung.'),
('Phát triển lịch làm việc, khung giờ, đặt/đổi/hủy và xác nhận lịch; chống đặt vượt sức chứa; tiếp nhận, hàng chờ và thông báo cơ bản.','2\nTuần 7–8','Luồng đặt lịch và tiếp nhận hoàn chỉnh; dữ liệu đồng bộ đa nền tảng; kiểm thử đặt lịch đồng thời.'),
('Xây dựng chức năng khám bệnh: tra cứu hồ sơ theo quyền, ghi kết quả khám, lập đơn thuốc, hẹn tái khám; bệnh nhân xem lịch sử và kết quả được công bố.','2\nTuần 9–10','Luồng từ tiếp nhận đến hoàn tất khám; hồ sơ, đơn thuốc và lịch sử chỉnh sửa; báo cáo lượt khám cơ bản.'),
('Hoàn thiện AI RAG: quản trị và duyệt tài liệu; trích xuất, chia đoạn, embedding, truy xuất; hội thoại có dẫn nguồn, lịch sử và phản hồi.','2\nTuần 11–12','Trợ lý AI tích hợp; kho tri thức có nguồn và phiên bản; bộ câu hỏi đánh giá, xử lý trường hợp thiếu căn cứ.'),
('Kiểm thử tích hợp, phân quyền, phiên đăng nhập và đa nền tảng; đánh giá truy xuất, độ bám nguồn, thời gian phản hồi; so sánh có/không có RAG và sửa lỗi.','1\nTuần 13','Bộ test case, báo cáo kiểm thử và đánh giá RAG; bản hệ thống ổn định với dữ liệu minh họa.'),
('Triển khai bản demo, kiểm tra sao lưu/phục hồi; hoàn thiện báo cáo, hướng dẫn sử dụng, slide và kịch bản trình diễn; chuẩn bị bảo vệ.','2\nTuần 14–15','Mã nguồn, bản demo, cơ sở dữ liệu mẫu, báo cáo đồ án, tài liệu cài đặt/sử dụng và slide bảo vệ.')]
t=tables[3]; old=t.findall('w:tr',ns); template=deepcopy(old[1])
for r in old[1:]: t.remove(r)
header=old[0]; pr=header.find('w:trPr',ns)
if pr is None: pr=E.SubElement(header,tag('trPr'))
E.SubElement(pr,tag('tblHeader'))
for i,(task,duration,result) in enumerate(rows,1):
    r=deepcopy(template)
    for h in r.findall('.//w:trHeight',ns): h.getparent().remove(h)
    for tc,txt in zip(r.findall('w:tc',ns),[str(i),task,duration,result]): cell(tc,txt)
    trpr=r.find('w:trPr',ns)
    if trpr is None: trpr=E.SubElement(r,tag('trPr'))
    E.SubElement(trpr,tag('cantSplit'))
    t.append(r)
# Keep the source layout and font; set the document title's semantic style.
ppr=ps[1].find('w:pPr',ns)
if ppr is None: ppr=E.SubElement(ps[1],tag('pPr'))
style=ppr.find('w:pStyle',ns)
if style is None: style=E.SubElement(ppr,tag('pStyle'))
style.set(tag('val'),'Title')
with ZipFile(out,'w') as dest:
    for info in z.infolist():
        data=E.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True) if info.filename=='word/document.xml' else z.read(info.filename)
        dest.writestr(deepcopy(info),data)
inventory={i.filename:hashlib.sha256(z.read(i.filename)).hexdigest() for i in z.infolist()}
(root/'.tmp-plan/artifact.md').write_text('Reference: '+str(src)+'\nSHA256: '+hashlib.sha256(src.read_bytes()).hexdigest()+'\nA4 portrait; two source sections; margins top 1.199, bottom 1.000, left 1.501, right 1.000 cm. Times New Roman 13 pt. Institutional heading, national heading, metadata, four-column plan, date and signatures preserved. Source plan grid 703/4510/837/4118 twips. Replace identity/date slots with blanks and topic/plan with SmartClinic scope. Clone plan rows to nine stages totaling 15 weeks. Preserve all package parts except document.xml. Source render blocked: bundled LibreOffice absent; Word COM sandbox logon unavailable.\n'+json.dumps(inventory,indent=2),encoding='utf-8')
with ZipFile(out) as final:
    assert all(final.read(k)==z.read(k) for k in inventory if k!='word/document.xml')
print(out)

