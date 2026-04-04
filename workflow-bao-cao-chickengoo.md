# WORKFLOW TRIỂN KHAI HE THONG CHICKENGOO DA NEN TANG

## 1. Tong quan du an

He thong gom 4 thanh phan chinh:

- Backend API: Node.js + Express + Prisma
- Admin Web: React + Vite
- App khach hang: Flutter (thu muc `gugugaga`)
- App tai xe: Flutter (thu muc `gugugaga shipper`)

Ten thu muc du an su dung trong bao cao:

- `Backend`
- `Admin`
- `gugugaga`
- `gugugaga shipper`

Muc tieu: xay dung luong dat mon tu khach hang, quan tri van hanh tu admin, va giao hang boi tai xe theo quy trinh thong nhat.

## 2. Workflow theo tien trinh thuc hien

| Phase                     | Muc tieu                | Cong viec chinh                                                                     | Tep/module lien quan                                                                                                                                   | Dau ra can dat                                 |
| ------------------------- | ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| P1 - Khoi tao va cau hinh | Dung bo khung du an     | Cai dat dependency, cau hinh bien moi truong, ket noi DB                            | `Backend/package.json`, `Admin/package.json`, `gugugaga/pubspec.yaml`, `gugugaga shipper/pubspec.yaml`, `Backend/schema.prisma`                        | Moi thanh phan chay duoc o local               |
| P2 - Backend core         | Hoan thien API nen tang | Dinh nghia model Prisma, tao route group admin/user/shipper/public, middleware auth | `Backend/server.js`, `Backend/admin.route.js`, `Backend/user.route.js`, `Backend/shipper.route.js`, `Backend/public.route.js`, `Backend/schema.prisma` | API auth + danh muc + don hang hoat dong       |
| P3 - Admin web            | Quan tri van hanh       | Dang nhap admin, quan ly products/orders/users/branches/drivers, goi API qua Axios  | `Admin/src/main.jsx`, `Admin/src/App.jsx`, `Admin/src/axios.js`, `Admin/src/useAuthUser.js`, `Admin/src/authService.js`                                | Admin co the quan ly du lieu va trang thai don |
| P4 - App khach hang       | Dat mon va theo doi don | Dang ky/dang nhap, xem danh muc/san pham/combo, thao tac gio hang, tao don          | `gugugaga/lib/main.dart`, `gugugaga/lib/constants.dart`, `gugugaga/lib/api_service.dart`                                                               | User tao duoc don va xem duoc lich su/chi tiet |
| P5 - App tai xe           | Xu ly giao hang         | Dang nhap shipper, nhan don duoc gan, cap nhat trang thai, gui vi tri               | `gugugaga shipper/lib/main.dart`, `gugugaga shipper/lib/constants.dart`, `gugugaga shipper/lib/api_service.dart`                                       | Tai xe cap nhat duoc trang thai giao hang      |
| P6 - Tich hop va kiem thu | Dong bo 4 thanh phan    | Test E2E theo role (admin-user-shipper), doi soat trang thai don                    | API + 3 client                                                                                                                                         | Luong dat mon -> giao hang thong suot          |
| P7 - Demo va bao cao      | Hoan tat nop bai        | Chay demo, chup anh minh hoa, tong hop ket qua                                      | Tai lieu bao cao                                                                                                                                       | Bao cao day du quy trinh + bang chung          |

## 3. Luong nghiep vu chinh

### 3.1 Luong Quan tri (Admin)

1. Admin dang nhap qua endpoint auth nhom admin.
2. He thong cap token va frontend luu phien dang nhap.
3. Admin quan ly `categories`, `products`, `orders`, `users`, `branches`, `drivers`.
4. Thay doi du lieu duoc dong bo ve backend va cap nhat UI qua React Query cache.

### 3.2 Luong Khach hang

1. User dang ky/dang nhap.
2. User tai du lieu danh muc/san pham/combo/chi nhanh tu public-user API.
3. User them mon vao gio (`Cart`, `CartItem`).
4. User tao don (`Order`, `OrderItem`) va chon thanh toan (`paymentMethod`).
5. User theo doi danh sach don va chi tiet trang thai don (`statusOrder`).

### 3.3 Luong Tai xe

1. Tai xe dang nhap bang tai khoan driver.
2. Tai xe nhan danh sach don duoc phan cong.
3. Tai xe cap nhat trang thai giao (vi du: dang giao, da giao).
4. Tai xe gui vi tri hien tai ve server de theo doi.

## 4. Lien ket voi mo hinh du lieu Prisma

Bang/quan he cot loi:

- `User`, `Driver`, `Branch`
- `Category`, `Product`, `Combo`, `ComboItem`
- `Cart`, `CartItem`
- `Order`, `OrderItem`
- `Bill`, `BillItem`

Enum quan trong:

- `Role`
- `statusDriver`
- `statusOrder`
- `paymentMethod`

Y nghia tong quat: User tao don theo chi nhanh, don co the gan cho driver, va don chua san pham hoac combo thong qua `OrderItem`.

## 5. Checklist chup anh minh hoa (chen vao bao cao)

### A. Backend

- [ ] Anh 1: Cau truc route tong (`admin/user/shipper/public`) trong backend
- [ ] Anh 2: File `schema.prisma` the hien model cot loi
- [ ] Anh 3: Ket qua test API dang nhap admin/user/shipper (Postman/Swagger)
- [ ] Anh 4: API tao don thanh cong (response co ma don + status)

### B. Admin web

- [ ] Anh 5: Man hinh dang nhap admin
- [ ] Anh 6: Dashboard/quan ly san pham
- [ ] Anh 7: Quan ly don hang va cap nhat trang thai
- [ ] Anh 8: Quan ly tai xe/chi nhanh/nguoi dung

### C. App khach hang Flutter

- [ ] Anh 9: Man hinh danh muc/san pham/combo
- [ ] Anh 10: Man hinh gio hang co nhieu mon
- [ ] Anh 11: Xac nhan tao don thanh cong
- [ ] Anh 12: Lich su don va chi tiet don

### D. App tai xe Flutter

- [ ] Anh 13: Man hinh danh sach don duoc gan
- [ ] Anh 14: Cap nhat trang thai giao hang
- [ ] Anh 15: Man hinh vi tri ban do/GPS dang gui

### E. Tong hop tich hop

- [ ] Anh 16: Don tao tu app khach xuat hien tren admin
- [ ] Anh 17: Don duoc gan cho tai xe va cap nhat trang thai
- [ ] Anh 18: Trang thai cuoi cung dong bo tren ca admin va app khach

## 6. Tieu chi nghiem thu cuoi

- [ ] Dang nhap phan quyen dung theo role (`Role`).
- [ ] CRUD san pham/danh muc hoat dong on dinh tren admin.
- [ ] Luong dat hang hoan chinh: tao gio -> tao don -> theo doi don.
- [ ] Tai xe nhan don va cap nhat trang thai khong loi.
- [ ] Vi tri tai xe duoc gui va luu nhan.
- [ ] Tat ca API chinh phan hoi dung schema va status code.
- [ ] Bao cao co anh minh hoa day du theo checklist.

## 7. Goi y bo cuc viet bao cao

- Phan 1: Gioi thieu kien truc he thong (so do tong quan 4 thanh phan)
- Phan 2: Quy trinh trien khai theo P1 -> P7 (bang workflow)
- Phan 3: Luong nghiep vu (admin, khach hang, tai xe)
- Phan 4: Minh hoa thuc te bang anh chup man hinh
- Phan 5: Ket qua, han che, huong phat trien tiep theo

## 8. Bat dau voi moi quy trinh (lam lan luot, can than)

Quy tac chung truoc khi bat dau:

- Chi chay 1 quy trinh chinh tai 1 thoi diem, khong lam dong thoi ca 4 phan.
- Sau moi quy trinh, chup anh minh hoa ngay va danh dau checklist.
- Neu quy trinh hien tai chua dat tieu chi dau ra, khong chuyen sang quy trinh tiep theo.

### 8.1 Quy trinh 1 - Backend (thu muc `Backend`)

Muc tieu: Co API on dinh de 3 client con lai su dung.

Buoc thuc hien:

1. Kiem tra cau hinh moi truong va ket noi DB.
2. Kiem tra schema Prisma va migration.
3. Khoi dong server tu `server.js`.
4. Test lan luot route `public`, `user`, `admin`, `shipper`.
5. Test luong auth (nhan token, goi endpoint can auth).
6. Test luong tao don va cap nhat trang thai don.

Dieu kien chuyen tiep:

- API auth va API don hang phan hoi dung.
- Cac endpoint chinh khong loi 5xx.
- Da co bo anh minh hoa backend (Anh 1 -> Anh 4).

### 8.2 Quy trinh 2 - Admin Web (thu muc `Admin`)

Muc tieu: Quan tri du lieu va van hanh don hang duoc.

Buoc thuc hien:

1. Kiem tra cau hinh base URL API trong client.
2. Khoi dong app React tu entry `main.jsx`.
3. Kiem tra guard dang nhap trong `App.jsx`.
4. Dang nhap admin va lay thong tin user hien tai.
5. Kiem tra quan ly products/categories.
6. Kiem tra quan ly orders/users/branches/drivers.

Dieu kien chuyen tiep:

- Dang nhap thanh cong va giu phien on dinh.
- CRUD chinh hoat dong dung.
- Da co bo anh minh hoa admin (Anh 5 -> Anh 8).

### 8.3 Quy trinh 3 - App khach hang (thu muc `gugugaga`)

Muc tieu: Hoan tat luong dat mon tu dau den cuoi.

Buoc thuc hien:

1. Kiem tra endpoint user/public trong `api_service.dart`.
2. Khoi dong app Flutter tu `main.dart`.
3. Test dang ky/dang nhap user.
4. Test tai danh muc/san pham/combo/chi nhanh.
5. Test them/sua/xoa gio hang.
6. Tao don va theo doi lich su + chi tiet don.

Dieu kien chuyen tiep:

- Tao don thanh cong, co ma don va trang thai ban dau.
- Lich su don hien dung theo user dang nhap.
- Da co bo anh minh hoa app khach (Anh 9 -> Anh 12).

### 8.4 Quy trinh 4 - App tai xe (thu muc `gugugaga shipper`)

Muc tieu: Tai xe nhan don, giao don, gui vi tri dung quy trinh.

Buoc thuc hien:

1. Kiem tra endpoint shipper trong `api_service.dart`.
2. Khoi dong app Flutter tu `main.dart`.
3. Dang nhap tai khoan driver.
4. Tai danh sach don duoc phan cong.
5. Cap nhat trang thai giao (dang giao -> da giao).
6. Gui vi tri hien tai ve backend.

Dieu kien chuyen tiep:

- Don duoc cap nhat trang thai thanh cong.
- Backend ghi nhan du lieu vi tri.
- Da co bo anh minh hoa app tai xe (Anh 13 -> Anh 15).

### 8.5 Quy trinh 5 - Tich hop toan he thong

Muc tieu: Xac nhan dong bo trang thai giua 4 thanh phan.

Buoc thuc hien:

1. Tao 1 don moi tu app khach hang.
2. Kiem tra don xuat hien tren admin.
3. Gan don cho tai xe tu admin (neu co flow gan tay).
4. Tai xe cap nhat trang thai tren app shipper.
5. Kiem tra trang thai cuoi cung tren admin + app khach.

Dieu kien hoan tat:

- Luong dat mon -> giao hang thong suot, khong lech trang thai.
- Hoan tat bo anh minh hoa tich hop (Anh 16 -> Anh 18).
