# SmartMart AI - Chinh sach Bao mat va Bao ve Du lieu

> Ban mau van hanh cho website/ung dung SmartMart AI. Can cap nhat thong tin phap nhan, email lien he, nha cung cap ha tang va quy trinh noi bo truoc khi cong bo chinh thuc.

**Hieu luc tu:** [DD/MM/YYYY]  
**Phien ban:** 1.0  
**Don vi van hanh:** [Ten cong ty / cua hang]  
**Dia chi:** [Dia chi dang ky / dia chi lien he]  
**Email lien he ve du lieu ca nhan:** [privacy@example.com]  
**Hotline:** [So dien thoai]

## 1. Muc dich va pham vi

Chinh sach nay giai thich cach SmartMart AI thu thap, su dung, luu tru, chia se va bao ve du lieu khi nguoi dung truy cap website, dang nhap ung dung, su dung API hoac van hanh cac phan he ban hang, kho, tai chinh, bao cao va AI du bao.

Chinh sach ap dung cho:

- Nguoi dung noi bo: quan tri vien, quan ly, nhan vien ban hang, nhan vien kho.
- Khach hang cua cua hang duoc ghi nhan trong giao dich POS, cong no, doi tra hoac bao hanh neu co.
- Nha cung cap, doi tac giao hang, doi tac thanh toan va cac ben lien quan duoc luu trong he thong.
- Du lieu phat sinh tu viec su dung website, backend API, AI service, dashboard, log he thong va cong cu bao cao.

SmartMart AI la he thong quan ly van hanh noi bo cho sieu thi mini/cua hang ban le. He thong khong duoc thiet ke de thu thap du lieu tre em hoac phuc vu nguoi dung duoi 16 tuoi.

## 2. Nguyen tac xu ly du lieu

SmartMart AI xu ly du lieu theo cac nguyen tac sau:

- Minh bach: thong bao ro loai du lieu, muc dich xu ly va quyen cua chu the du lieu.
- Dung muc dich: chi dung du lieu cho van hanh cua hang, bao mat, bao cao, phan tich va cac nghia vu phap ly lien quan.
- Toi thieu hoa: chi thu thap truong du lieu can thiet cho tinh nang duoc su dung.
- Chinh xac: cho phep cap nhat, sua loi du lieu khi phat hien sai lech.
- Gioi han truy cap: phan quyen theo vai tro `ADMIN`, `MANAGER`, `STAFF`, `WAREHOUSE`.
- An toan: ap dung bien phap ky thuat va to chuc de giam rui ro mat mat, ro ri, sua doi hoac truy cap trai phep.
- Co the giai trinh: duy tri log, audit trail va quy trinh xu ly yeu cau ve du lieu.

## 3. Loai du lieu chung toi thu thap

### 3.1. Du lieu tai khoan nguoi dung noi bo

- Ho ten, ten dang nhap, email, vai tro, trang thai tai khoan.
- Mat khau da bam bang thuat toan mot chieu; SmartMart AI khong luu mat khau dang ro.
- Token dang nhap, refresh token, token bi thu hoi hoac blacklist.
- Lich su dang nhap, dang xuat, thoi gian truy cap, dia chi IP, user agent neu cau hinh log co bat.

### 3.2. Du lieu khach hang trong giao dich ban le

- Ten khach hang, so dien thoai, ghi chu don hang neu nguoi dung nhap vao.
- Hoa don, san pham da mua, phuong thuc thanh toan, cong no, lich su thanh toan cong no.
- Du lieu doi tra, don tam giu POS, bao cao doanh thu lien quan.

Khong nen nhap vao SmartMart AI cac thong tin nhay cam cua khach hang nhu so CCCD/CMND, du lieu suc khoe, tai khoan ngan hang chi tiet, thong tin sinh trac hoc hoac du lieu khong can thiet cho ban hang.

### 3.3. Du lieu nha cung cap va doi tac

- Ten nha cung cap, nguoi lien he, so dien thoai, email, dia chi.
- Lich su don mua, phieu nhap, hang hoa cung cap, cong no nha cung cap, lich su thanh toan.
- Bao gia, phieu tra hang, ghi chu nghiep vu.

### 3.4. Du lieu hang hoa, kho va tai chinh

- Danh muc, SKU, ma vach, hinh anh san pham, don vi tinh, gia von, gia ban.
- Ton kho theo lo, vi tri, han su dung, so luong truoc/sau bien dong, lich su dieu chinh.
- Bao cao doanh thu, chi phi, loi nhuan, giao dich tien mat/ngan hang/vi, ca lam viec va doi soat tien.

### 3.5. Du lieu AI, du bao va phan tich

- Lich su ban hang, chuoi doanh so theo ngay, san pham, so luong ban, ton kho, ngay le/chu ky mua sam.
- Ket qua train model, metrics, forecast 7/14/30 ngay, goi y nhap hang, goi y khuyen mai.
- Cau hoi, yeu cau phan tich va ngu canh du lieu duoc gui den tro ly AI neu tinh nang AI Insight/Gemini duoc bat.

He thong nen an danh hoac toi thieu hoa du lieu ca nhan truoc khi dua vao pipeline huan luyen/du bao khi khong can dinh danh ca nhan.

### 3.6. Du lieu ky thuat va cookie

- Log may chu, request ID, endpoint, ma loi, thoi gian phan hoi, thong tin thiet bi/trinh duyet.
- Cookie hoac local storage dung cho phien dang nhap, tuy chon giao dien va bao mat.
- Du lieu cache trong Redis, su kien Kafka va file bao cao/xuat du lieu tam thoi neu co.

SmartMart AI khong nen dung cookie quang cao hoac tracking ben thu ba neu khong co thong bao va co che dong y rieng.

## 4. Muc dich xu ly du lieu

Chung toi xu ly du lieu de:

- Xac thuc dang nhap, phan quyen va bao ve phien lam viec.
- Tao, xu ly va tra cuu hoa don ban hang, phieu nhap, phieu xuat huy, doi tra va cong no.
- Quan ly san pham, kho, lo hang, han su dung va bien dong ton kho.
- Tao dashboard, bao cao ban hang, bao cao tai chinh, bao cao ton kho va file xuat.
- Du bao nhu cau, de xuat nhap hang, canh bao het hang/can date, de xuat khuyen mai.
- Giam sat an ninh, phat hien loi, ngan chan truy cap trai phep, dieu tra hanh vi bat thuong.
- Dap ung yeu cau ho tro, bao tri, sao luu, khoi phuc du lieu va nghia vu phap ly.
- Cai thien do on dinh, hieu nang va chat luong tinh nang cua he thong.

## 5. Co so xu ly du lieu

Tuy tung boi canh, viec xu ly du lieu co the dua tren:

- Su dong y cua chu the du lieu khi phap luat yeu cau.
- Viec thuc hien hop dong, giao dich ban hang, giao dich mua hang hoac quan he lao dong/noi bo.
- Nghia vu phap ly ve ke toan, thue, an ninh mang, luu tru chung tu va giai quyet tranh chap.
- Loi ich hop phap cua don vi van hanh trong bao mat he thong, van hanh cua hang, ngan chan gian lan va toi uu ton kho.
- Yeu cau cua co quan nha nuoc co tham quyen theo quy dinh phap luat.

## 6. Chia se du lieu voi ben thu ba

SmartMart AI chi chia se du lieu khi can thiet va trong pham vi phu hop voi muc dich xu ly:

- Nha cung cap ha tang: hosting, database, object storage, CDN, backup, giam sat he thong.
- Nha cung cap dich vu AI/API: vi du Gemini hoac nha cung cap LLM khac neu tinh nang tro ly AI duoc bat.
- Doi tac thanh toan, giao hang, hoa don dien tu, ke toan hoac bao cao thue neu duoc tich hop.
- Co van ky thuat, bao tri, kiem thu bao mat, kiem toan hoac phap ly theo thoa thuan bao mat.
- Co quan nha nuoc co tham quyen khi co yeu cau hop le.

Ben thu ba chi duoc truy cap du lieu theo muc can thiet, phai co nghia vu bao mat va khong duoc dung du lieu cho muc dich rieng neu khong co can cu hop phap.

## 7. Chuyen du lieu ra nuoc ngoai

Neu SmartMart AI su dung ha tang cloud, dich vu AI, email, monitoring hoac backup co may chu nam ngoai Viet Nam, du lieu co the duoc chuyen hoac truy cap tu nuoc ngoai.

Truoc khi chuyen du lieu ca nhan ra nuoc ngoai, don vi van hanh can:

- Xac dinh loai du lieu duoc chuyen, muc dich chuyen va ben nhan du lieu.
- Danh gia rui ro va bien phap bao ve du lieu.
- Thuc hien ho so/danh gia tac dong chuyen du lieu ra nuoc ngoai neu phap luat yeu cau.
- Thong bao va/hoac xin dong y cua chu the du lieu khi can.
- Ky thoa thuan xu ly du lieu voi ben nhan, bao gom bao mat, gioi han muc dich va xu ly su co.

## 8. Luu tru va thoi han giu du lieu

Du lieu duoc luu trong thoi gian can thiet cho van hanh, bao cao va nghia vu phap ly. Thoi han cu the co the duoc cau hinh theo chinh sach noi bo:

| Nhom du lieu | Thoi han de xuat |
| --- | --- |
| Tai khoan nguoi dung noi bo | Trong thoi gian lam viec/su dung he thong va toi da 24 thang sau khi khoa tai khoan, tru khi can giu lau hon de dieu tra hoac tuan thu |
| Hoa don, don hang, phieu nhap, phieu tra, giao dich tai chinh | Theo thoi han luu tru chung tu ke toan/thue ap dung; toi thieu theo quy dinh noi bo |
| Du lieu khach hang va cong no | Den khi hoan tat giao dich/cong no va het thoi han khieu nai, bao cao, kiem toan |
| Inventory logs va audit logs | Toi thieu 24 thang hoac lau hon neu can truy vet ton kho, gian lan, tranh chap |
| Token, session, cache | Theo vong doi bao mat cua token/cache; xoa hoac het han tu dong |
| Du lieu train/forecast AI | Theo chu ky van hanh model; nen an danh/ket tap khi co the |
| File xuat tam thoi | Xoa sau khi tai xuong hoac trong vong [X] ngay |

Khi het thoi han, du lieu se duoc xoa, an danh hoa hoac luu tru tach biet neu can cho tuan thu phap ly.

## 9. Bao mat du lieu

SmartMart AI ap dung cac bien phap bao mat phu hop voi rui ro:

- Xac thuc bang JWT, refresh token va co che logout/blacklist token.
- Phan quyen API theo vai tro va nguyen tac it quyen nhat.
- Mat khau duoc bam mot chieu, khong luu dang ro.
- Ket noi production nen bat HTTPS/TLS.
- Bien moi truong va khoa API khong commit vao ma nguon.
- Sao luu database dinh ky va kiem tra khoi phuc.
- Ghi audit log cho hanh dong quan trong nhu tao/sua/xoa, dieu chinh ton, giao dich tai chinh, doi vai tro.
- Gioi han truy cap truc tiep vao database, Redis, Kafka va storage.
- Theo doi loi, truy cap bat thuong va canh bao he thong.
- Review dependency, cap nhat ban va, quet secret va kiem thu bao mat dinh ky.

Khong co he thong nao an toan tuyet doi. Khi phat hien su co co the anh huong den du lieu ca nhan, don vi van hanh se dieu tra, khac phuc, ghi nhan va thong bao theo yeu cau phap luat.

## 10. Quyen cua chu the du lieu

Trong pham vi phap luat ap dung, chu the du lieu co the co cac quyen sau:

- Duoc biet ve hoat dong xu ly du lieu.
- Dong y hoac rut lai su dong y khi viec xu ly dua tren dong y.
- Truy cap va yeu cau cung cap ban sao du lieu ca nhan.
- Yeu cau chinh sua du lieu khong chinh xac.
- Yeu cau xoa, han che xu ly hoac phan doi xu ly trong mot so truong hop.
- Yeu cau ngung cung cap/chia se du lieu cho ben thu ba khi co can cu hop le.
- Khieu nai, phan anh hoac yeu cau boi thuong theo quy dinh phap luat.

Yeu cau ve du lieu gui den: **[privacy@example.com]**. Don vi van hanh se xac minh danh tinh nguoi yeu cau va phan hoi trong thoi han phu hop voi phap luat hien hanh. Mot so yeu cau co the bi tu choi hoac gioi han neu du lieu can duoc luu de thuc hien nghia vu phap ly, bao ve quyen loi hop phap, dieu tra gian lan, bao mat he thong hoac giai quyet tranh chap.

## 11. Trach nhiem cua nguoi dung noi bo

Nguoi dung noi bo khi su dung SmartMart AI phai:

- Khong chia se tai khoan, mat khau, token hoac thiet bi dang nhap cho nguoi khac.
- Chi truy cap du lieu phu hop voi nhiem vu duoc giao.
- Khong xuat, sao chep, chup man hinh, tai len dich vu ben ngoai hoac gui du lieu cho nguoi khong co tham quyen.
- Kiem tra ky truoc khi nhap du lieu ca nhan cua khach hang/nha cung cap; khong nhap du lieu nhay cam khong can thiet.
- Dang xuat khi dung thiet bi dung chung.
- Bao ngay cho quan tri vien khi nghi ngo mat tai khoan, ro ri du lieu, truy cap bat thuong hoac sai sot nghiem trong.

## 12. Su dung AI va ra quyet dinh tu dong

Tinh nang AI cua SmartMart AI ho tro du bao ban hang, goi y nhap hang, canh bao rui ro ton kho va tom tat du lieu. Ket qua AI chi mang tinh ho tro ra quyet dinh, khong thay the danh gia cua quan ly cua hang.

Don vi van hanh can dam bao:

- Khong dua du lieu ca nhan nhay cam vao prompt, file train hoac tap du lieu AI neu khong can thiet.
- Kiem tra ket qua AI truoc khi ap dung vao mua hang, khuyen mai, tai chinh hoac nhan su.
- Luu vet nguon du lieu, model/metrics va thoi diem du bao de co the giai trinh.
- Co co che fallback khi AI service hoac nha cung cap AI ben ngoai khong kha dung.

## 13. Cookie, local storage va cong nghe tuong tu

Website/ung dung co the dung cookie, local storage hoac session storage de:

- Duy tri phien dang nhap va trang thai xac thuc.
- Luu tuy chon giao dien, ngon ngu, bo loc hoac cau hinh hien thi.
- Giam rui ro bao mat va cai thien hieu nang.

Nguoi dung co the xoa cookie/local storage trong trinh duyet, nhung mot so tinh nang nhu dang nhap, giu phien va tuy chon giao dien co the khong hoat dong dung.

## 14. Du lieu tre em

SmartMart AI khong huong den tre em va khong co muc dich thu thap du lieu tre em. Neu phat hien du lieu tre em duoc nhap vao he thong ma khong co can cu hop phap, don vi van hanh se xoa hoac an danh hoa du lieu do trong thoi gian hop ly.

## 15. Cap nhat chinh sach

Chinh sach nay co the duoc cap nhat khi tinh nang, nha cung cap, quy trinh bao mat hoac quy dinh phap luat thay doi. Ban moi se duoc cong bo trong website/ung dung hoac tai lieu noi bo kem ngay hieu luc. Neu thay doi anh huong dang ke den quyen rieng tu, don vi van hanh se thong bao ro rang hon cho nguoi dung lien quan.

## 16. Thong tin lien he

Moi cau hoi, yeu cau, khieu nai hoac thong bao su co lien quan den du lieu ca nhan gui ve:

- **Don vi phu trach:** [Ten bo phan / DPO neu co]
- **Email:** [privacy@example.com]
- **Dien thoai:** [So dien thoai]
- **Dia chi:** [Dia chi]

## 17. Can cu tham khao khi xay dung chinh sach

Chinh sach nay duoc soan theo cau truc thuc hanh pho bien cho website/SaaS va can doi voi boi canh SmartMart AI:

- Luat Bao ve Du lieu ca nhan Viet Nam, co hieu luc tu 01/01/2026.
- Nghi dinh 13/2023/ND-CP ve bao ve du lieu ca nhan.
- Cac nghia vu ve an ninh mang, luu tru va chuyen du lieu theo quy dinh Viet Nam ap dung tuy truong hop.
- Cac muc noi dung thuong co cua privacy policy cho website/SaaS: loai du lieu thu thap, muc dich su dung, cookie, chia se ben thu ba, luu tru, bao mat, quyen nguoi dung, tre em, lien he va cap nhat.

> Luu y: Tai lieu nay la ban mau ky thuat/chinh sach, khong phai tu van phap ly. Truoc khi cong bo cho khach hang hoac dua vao dieu khoan hop dong, nen duoc bo phan phap che hoac luat su ra soat theo mo hinh trien khai thuc te.
