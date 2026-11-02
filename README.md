# คู่มือ CRUD หนังสือ: ติดตั้ง ใช้งาน และดัดแปลงเป็นระบบอื่น

คู่มือนี้เขียนสำหรับคนเริ่มต้น ใช้ **Windows + PowerShell** เป็นหลัก คัดลอกคำสั่งทีละบรรทัดแล้วกด Enter รอคำสั่งก่อนหน้าทำงานเสร็จก่อน ข้อความอย่าง `YOUR_NAME` และ URL สมมติต้องเปลี่ยนเป็นของตนเอง

**Repository นี้มีเฉพาะ Backend** ใช้ NestJS 11 + TypeScript + Prisma 6.19.x + SQLite ไม่มีหน้าเว็บ React/Next.js อยู่ในนี้ เปิด `http://localhost:3000` แล้วเห็น `Hello World!` ถือว่าปกติ Frontend พอร์ต 3001 ต้องเปิดจากอีกโปรเจกต์หรือสร้างตามคู่มือ

ตัวอย่าง Product, หน้า HTML และ Backend JavaScript ในเอกสาร **ยังไม่ได้เพิ่มเข้าแอปหลัก** ต้องทำตามบทนั้นก่อนจึงจะเรียกใช้ได้

## เลือกอ่านตามงานที่ต้องทำ

| ต้องการ | อ่าน |
| --- | --- |
| ดึงจาก Git แล้วเปิดให้ได้ | ขั้นตอนใน README นี้ |
| ดูว่าไฟล์ไหนแก้อะไร / คำสั่ง run | ขั้นตอนใน README นี้ |
| เพิ่มฟิลด์ เปลี่ยนหนังสือเป็นสินค้า เพิ่ม CRUD ที่สอง เปลี่ยน DB | [คู่มือ Modify](docs/MODIFY.md) |
| แก้หน้าเว็บ เชื่อม Backend เปลี่ยน API URL พร้อมตัวอย่างหน้า CRUD | [คู่มือ Frontend](docs/FRONTEND.md) |
| ใช้ JavaScript Backend แทน NestJS/TypeScript | [คู่มือ JavaScript + Express](docs/JAVASCRIPT-BACKEND.md) |
| เปิด Swagger, ลองแนบไฟล์, เพิ่ม CRUD ใหม่ และเจนโค้ดเรียก API | [คู่มือ Swagger และ OpenAPI](docs/SWAGGER.md) |
| ย้ายเครื่อง ข้อมูลหาย รูปหาย หรือเปิดไม่ได้ | หัวข้อ Git และแก้ปัญหาด้านล่าง |

## 1. เข้าใจก่อนว่าแต่ละส่วนคืออะไร

| คำ | ความหมาย |
| --- | --- |
| Frontend | หน้าเว็บ ปุ่ม ตาราง ฟอร์มที่ผู้ใช้เห็น |
| Backend | รับคำขอ ตรวจข้อมูล อ่าน/เขียนฐานข้อมูล ส่งผลกลับ |
| API / endpoint | ที่อยู่ที่หน้าเว็บเรียก เช่น `GET /books` |
| CRUD | Create เพิ่ม / Read อ่าน / Update แก้ไข / Delete ลบ |
| DB / Database | ที่เก็บข้อมูลจริง |
| Prisma | ตัวช่วยให้โค้ด Backend คุยกับ DB |
| Schema / model | แบบกำหนดตารางและชนิดของช่องข้อมูล |
| DTO | แบบของข้อมูลที่รับเข้า; ในโค้ดเดิมส่วนใหญ่ระบุชนิด TypeScript |
| Dependency | แพ็กเกจที่โปรแกรมใช้ ติดตั้งผ่าน npm |
| Terminal | ช่องพิมพ์คำสั่ง VS Code เปิดจาก Terminal → New Terminal |
| Port | ช่องทางของโปรแกรม เช่น Backend 3000 / Frontend 3001 |
| localhost | เครื่องที่กำลังเปิดเว็บ ไม่ได้หมายถึงอีกเครื่องหรือเซิร์ฟเวอร์กลาง |

```text
ผู้ใช้ → หน้าเว็บ เช่น http://localhost:3001
      → fetch('http://localhost:3000/books')
      → book.controller.ts (รับ URL / method)
      → book.service.ts (เงื่อนไขการทำงาน / query)
      → PrismaService → prisma/dev.db
      ← ส่ง JSON กลับให้หน้าเว็บนำไปแสดง
```

## 2. ติดตั้งบนเครื่องใหม่หลังดึงจาก Git

### 2.1 เครื่องมือที่ต้องลงครั้งเดียวต่อเครื่อง

1. [Node.js](https://nodejs.org/en/download) ใช้สาย **22 รุ่น 22.12 ขึ้นไป** หรือ **24.x** ให้ทั้งสองเครื่องใช้รุ่นเดียวกัน npm มาพร้อม Node แล้ว อ้างอิงรุ่นจาก [Prisma v6 system requirements](https://www.prisma.io/docs/orm/v6/reference/system-requirements)
2. [Git](https://git-scm.com/downloads) เพื่อ clone/pull/push
3. [VS Code](https://code.visualstudio.com/) เพื่อเปิดไฟล์และ Terminal

ปิดแล้วเปิด Terminal ใหม่หลังติดตั้ง ตรวจด้วย:

```powershell
node --version
npm --version
git --version
```

**เครื่องในแล็บหรือเครื่องที่ไม่บล็อก ใช้ `npm` / `npx` ตามคำสั่งหลักในคู่มือได้เลย** ไม่ต้องเปลี่ยนการตั้งค่าเครื่อง

ถ้าเครื่อง Windows บางเครื่องขึ้น `npm.ps1 cannot be loaded because running scripts is disabled` ให้ใช้คำสั่งสำรองดังนี้ ไม่ต้องแก้ Execution Policy:

| คำสั่งปกติสำหรับเครื่องที่ไม่บล็อก | คำสั่งสำรองเมื่อ PowerShell บล็อก |
| --- | --- |
| `npm --version` | `npm.cmd --version` |
| `npm ci` | `npm.cmd ci` |
| `npm install` | `npm.cmd install` |
| `npm run prisma:generate` | `npm.cmd run prisma:generate` |
| `npm run prisma:push` | `npm.cmd run prisma:push` |
| `npm run start:dev` | `npm.cmd run start:dev` |
| `npx prisma studio` | `npx.cmd prisma studio` |

ใช้หลักเดียวกันกับทุกบท: ถ้าบล็อกให้เปลี่ยนเฉพาะคำแรก `npm` → `npm.cmd` และ `npx` → `npx.cmd` ส่วนท้ายเหมือนเดิม หรือเปิด Terminal แบบ Command Prompt แล้วใช้คำสั่ง npm/npx ปกติได้ ถ้าใช้ macOS/Linux ใช้ npm/npx ปกติ แต่ปรับคำสั่ง PowerShell เช่น Copy-Item ตามระบบ

เครื่องแล็บตรวจ `node --version`, `npm --version`, `git --version` ก่อน ถ้ามีแล้วและรุ่นเหมาะสมไม่ต้องลงใหม่ หากไม่มีและไม่มีสิทธิ์ติดตั้ง ให้ขอผู้ดูแลแล็บติดตั้งเครื่องมือ ไม่ต้องมีสิทธิ์ admin เพื่อรันโปรเจกต์ในโฟลเดอร์ที่ตนเขียนได้

### 2.2 Clone แล้วเข้าโฟลเดอร์งาน

เปิด Terminal ในโฟลเดอร์ที่จะเก็บงาน เปลี่ยน URL ให้เป็น repository จริง:

```powershell
git clone https://github.com/YOUR_NAME/crudbookwithprisma-67160284.git
cd crudbookwithprisma-67160284
code .
```

ถ้า `code` ใช้ไม่ได้ เปิด VS Code → File → Open Folder แล้วเลือกโฟลเดอร์นี้แทน

**คำสั่ง npm ทั้งหมดของ Backend ต้องรันในโฟลเดอร์ที่มี `package.json` นี้** ตรวจว่าอยู่ถูกที่:

```powershell
Get-Location
Get-ChildItem
```

### 2.3 ลงแพ็กเกจ สร้างตัวเชื่อม และสร้าง DB

```powershell
npm ci
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

| คำสั่ง | ทำอะไร | ผลที่ควรได้ |
| --- | --- | --- |
| `npm ci` | ลงแพ็กเกจตาม package-lock.json | มี node_modules ใหม่ |
| `prisma:generate` | สร้าง Prisma Client ให้ตรง schema และเครื่องนี้ | ตัวเชื่อม DB ใน node_modules |
| `prisma:push` | สร้าง/ปรับตารางตาม schema | มี prisma/dev.db และตาราง Book/Review |
| `start:dev` | เปิด Backend แบบเฝ้าดูไฟล์ | API พอร์ต 3000 |

`npm ci` ต้องมี `package-lock.json` ที่ตรงกับ `package.json` ถ้าไม่มี lockfile จริง ๆ ใช้ `npm install` ครั้งแรก แล้ว commit lockfile ด้วย ถ้าเพิ่งแก้ dependency เองให้ใช้ `npm install` เพื่อปรับ lockfile ก่อนส่งทั้งสองไฟล์ขึ้น Git

**ค่าปัจจุบันไม่ต้องมี `.env` และไม่ต้องลง MySQL/PostgreSQL** เพราะ schema ใช้ SQLite ที่ `file:./dev.db` โดยตรง เมื่อเปลี่ยนเป็น `env("DATABASE_URL")` จึงต้องสร้าง `.env` ตามคู่มือ Modify

อย่าปิด Terminal ที่เปิด Server ถ้าจะพิมพ์คำสั่งอื่นให้เปิด Terminal ใหม่ หยุด Server ด้วย `Ctrl+C`

### 2.4 ตรวจว่าเปิดได้

เปิดเบราว์เซอร์:

- `http://localhost:3000` → `Hello World!`
- `http://localhost:3000/books` → `[]` หาก DB ใหม่ยังไม่มีหนังสือ

หรือเปิด Terminal ที่สอง:

```powershell
Invoke-RestMethod http://localhost:3000/books
```

ฐานข้อมูลว่างหลัง clone เป็นเรื่องปกติ Git ไม่ได้เก็บข้อมูลหนังสือและรูปอัปโหลดไว้ให้

## 3. เปิดใช้งานครั้งต่อไป

ถ้าไม่ได้ pull หรือเปลี่ยนเครื่อง แค่เข้าโฟลเดอร์แล้วรัน ตัวอย่าง path ต้องปรับตามเครื่องตนเอง ใส่คำพูดเมื่อมีช่องว่าง:

```powershell
cd "D:\SE Learning\Year 3\งานจารเกม\crudbookwithprisma-67160284"
npm run start:dev
```

หลัง pull งานใหม่ ให้หยุด Server ก่อน และเก็บงานแก้ค้างของตนเองก่อน pull:

```powershell
git status
git pull
npm ci
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

สำรอง DB ก่อน push schema ที่เปลี่ยน หากทีมเปลี่ยนไปใช้ migration แล้วให้ทำตามบท migration ในคู่มือ Modify แทน `prisma:push`

## 4. คำสั่งที่ต้องใช้

**Backend นี้ไม่มี script ชื่อ `dev`** คำสั่งจริงคือ `npm run start:dev` หากอยากใช้ `npm run dev` เพิ่ม `"dev": "nest start --watch"` ใน `scripts` ของ `package.json` ใส่ comma ให้ถูก แล้วจึงใช้ `npm run dev` ได้

| คำสั่ง | ใช้เมื่อใด |
| --- | --- |
| `npm run` | ดู script ที่มีจริง |
| `npm ci` | ลงตาม lockfile บนเครื่องใหม่/หลัง pull; ติดตั้ง node_modules ใหม่ |
| `npm install` | ไม่มี lockfile หรือแก้รายการ dependency |
| `npm install PACKAGE_NAME` | เพิ่มแพ็กเกจใช้งาน เปลี่ยน PACKAGE_NAME เป็นชื่อจริง |
| `npm install -D PACKAGE_NAME` | เพิ่มเครื่องมือพัฒนา |
| `npm uninstall PACKAGE_NAME` | ถอนแพ็กเกจ |
| `npm run start:dev` | รันพัฒนา รีสตาร์ตเมื่อแก้ src |
| `npm start` | รัน Nest แบบไม่ watch |
| `npm run start:debug` | รัน debug + watch |
| `npm run prisma:generate` | หลังติดตั้ง/แก้ schema |
| `npm run prisma:push` | ปรับตาราง DB พัฒนา ไม่มีประวัติ migration |
| `npx prisma validate` | ตรวจ schema |
| `npx prisma studio` | เปิดเครื่องมือดู/แก้ข้อมูล DB ดู URL ที่ Terminal แจ้ง |
| `npm run build` | แปลง src TypeScript เป็น JavaScript ใน dist |
| `npm run start:prod` | รันผล build ต้อง build ก่อน |
| `npm test -- --runInBand` | unit tests รอบเดียว |
| `npm run test:watch` | tests ต่อเนื่อง ออกด้วย Ctrl+C |
| `npm run test:cov` | ดู coverage |
| `npm run test:e2e -- --runInBand` | e2e ต้องมี DB พร้อมใช้ |
| `npm run lint` | ตรวจและ **แก้ไฟล์อัตโนมัติ** ตาม ESLint |
| `npm run format` | จัดรูปแบบ src/test และ **แก้ไฟล์** |

ก่อนส่งงาน:

```powershell
npx prisma validate
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Tests เดิมมีขอบเขตจำกัด: unit tests ตรวจการสร้าง Controller/Service และ e2e ตรวจ `/` ไม่ได้ยืนยัน CRUD, รูป, CORS ทั้งหมด ต้องลอง API และหน้าเว็บด้วย

## 5. ไฟล์ไหนแก้อะไร

| ไฟล์ | หน้าที่/แก้เมื่อต้องการ |
| --- | --- |
| `package.json` | คำสั่ง run และ dependency |
| `package-lock.json` | ล็อกรุ่นแพ็กเกจ ให้ npm สร้าง/ปรับ ไม่แก้เลขเอง |
| `src/main.ts` | พอร์ต, CORS, URL ให้บริการ uploads |
| `src/app.module.ts` | ลงทะเบียน CRUD module เช่น BookModule, ProductModule |
| `src/app.controller.ts`, `src/app.service.ts` | ข้อความ API `/` ปัจจุบันคือ Hello World ไม่ใช่หน้าเว็บ |
| `src/book/book.controller.ts` | URL/method, รับรูป, แปลงปี/วัน/boolean |
| `src/book/book.service.ts` | query DB และเงื่อนไขเพิ่ม/อ่าน/แก้/ลบ |
| `src/book/book.module.ts` | เชื่อม Controller, Service, PrismaModule |
| `src/book/dto/create-book.dto.ts` | ฟิลด์รับเข้าตอนเพิ่ม |
| `src/book/dto/update-book.dto.ts` | ฟิลด์รับเข้าตอนแก้ |
| `src/book/entities/book.entity.ts` | แบบข้อมูลฝั่งโค้ด ไม่ได้สร้างตาราง |
| `src/review/` | มี DTO/Entity แต่ยังไม่มี Controller/Service รีวิวแยก |
| `src/prisma/prisma.service.ts` | PrismaClient เชื่อม/ตัด DB |
| `src/prisma/prisma.module.ts` | ส่งออก PrismaService ให้ module อื่น |
| `prisma/schema.prisma` | ตาราง ฟิลด์ ความสัมพันธ์ และ DB provider |
| `prisma/dev.db` | ข้อมูลจริง ใช้ Studio ดู ห้ามแก้เป็นข้อความ |
| `uploads/` | รูปจริง สร้างเองตอนอัปโหลดครั้งแรก |
| `dist/` | ผล build ห้ามแก้โดยตรงเพราะ build ทับ |
| `node_modules/` | แพ็กเกจติดตั้งใหม่ได้ ไม่แก้แทน src |
| `.gitignore` | บอก Git ไม่ต้องเก็บอะไร |
| `test/`, `*.spec.ts` | tests ปรับเมื่อเปลี่ยนพฤติกรรม |

## 6. API ที่มีจริง

Base URL: `http://localhost:3000` **ไม่มี prefix `/api`**

| Method | Path | ทำอะไร |
| --- | --- | --- |
| GET | `/` | เช็ก Server |
| GET | `/books` | อ่านทั้งหมดพร้อม reviews |
| GET | `/books/:id` | อ่านหนึ่งเล่มพร้อม reviews |
| POST | `/books` | เพิ่ม รองรับ JSON และ multipart/form-data |
| PATCH | `/books/:id` | แก้บางฟิลด์ รองรับ JSON และ multipart/form-data |
| DELETE | `/books/:id` | ลบหนังสือและรีวิวที่ผูกอยู่ |
| GET | `/books/:id/reviews` | อ่านรีวิว |
| POST | `/books/:id/reviews` | เพิ่มรีวิว |
| GET | `/uploads/ชื่อไฟล์` | อ่านรูป |

`:id` แทนด้วยเลขจริง เช่น `/books/1` ยังไม่มี API แก้/ลบรีวิวแยก และการแก้หนังสือใช้ PATCH ไม่ใช่ PUT

| ฟิลด์ Book | ชนิด | หมายเหตุ |
| --- | --- | --- |
| id | Int | DB สร้าง ไม่ส่งตอนเพิ่ม |
| title | String | ต้องส่งตอนเพิ่ม |
| author | String | ต้องส่งตอนเพิ่ม |
| publishedYear | Int? | ไม่บังคับ เช่น 2026 |
| publishedAt | DateTime | ไม่ส่งใช้เวลาปัจจุบัน; ตัวอย่าง `2026-01-01T00:00:00.000Z` |
| isAvailable | Boolean | ไม่ส่งเป็น true |
| coverUrl | String? | ไม่บังคับ; รูปอัปโหลดเป็น `/uploads/...` |
| reviews | Review[] | API ส่งกลับ; เพิ่มผ่าน endpoint รีวิว |

DTO TypeScript อย่างเดียว **ไม่ได้ตรวจ request ตอนรันครบทุกช่อง** โค้ดเดิมแปลงปี/วัน/boolean ตรวจรูป และคะแนนรีวิว แต่ยังไม่มี global ValidationPipe ตรวจ title/author ครบ บาง request ผิดจึงอาจได้ 500 แทน 400 ดูวิธีเพิ่ม validation ในคู่มือ Modify

### ลอง CRUD ด้วย PowerShell

เปิด Server ไว้ แล้วเปิด Terminal ใหม่ ตัวอย่างสร้างข้อมูลทดสอบและใช้ id จากผลตอบกลับ ไม่เดาว่า id เป็น 1:

```powershell
$apiBase = 'http://localhost:3000'
$bookBody = @{ title = 'Example book'; author = 'Student'; publishedYear = 2026 } | ConvertTo-Json
$createdBook = Invoke-RestMethod "$apiBase/books" -Method Post -ContentType 'application/json' -Body $bookBody
$bookId = $createdBook.id
$createdBook
Invoke-RestMethod "$apiBase/books"
Invoke-RestMethod "$apiBase/books/$bookId"

$editBody = @{ title = 'Updated book'; isAvailable = $false } | ConvertTo-Json
Invoke-RestMethod "$apiBase/books/$bookId" -Method Patch -ContentType 'application/json' -Body $editBody

$reviewBody = @{ rating = 5; content = 'Good book' } | ConvertTo-Json
Invoke-RestMethod "$apiBase/books/$bookId/reviews" -Method Post -ContentType 'application/json' -Body $reviewBody
Invoke-RestMethod "$apiBase/books/$bookId/reviews"

Invoke-RestMethod "$apiBase/books/$bookId" -Method Delete
```

บรรทัดสุดท้ายลบเล่มทดสอบและรีวิว เพราะ schema มี `onDelete: Cascade` ข้ามบรรทัดนั้นถ้าจะเก็บไว้ แถบ URL ของ browser เรียก GET ได้อย่างเดียว เพิ่ม/แก้/ลบต้องใช้คำสั่ง เครื่องมืออย่าง Postman หรือหน้าเว็บ

### อัปโหลดรูป

Postman: POST `http://localhost:3000/books` → Body → form-data:

| Key | Type | Value |
| --- | --- | --- |
| title | Text | ชื่อหนังสือ |
| author | Text | ผู้เขียน |
| publishedYear | Text | 2026 |
| cover | File | รูป JPEG/PNG/GIF/WebP จริง ไม่เกิน 5 MB |

หรือ Windows ใช้ `curl.exe` เปลี่ยน path รูปให้มีจริง:

```powershell
curl.exe -X POST http://localhost:3000/books -F "title=Photo book" -F "author=Student" -F "cover=@C:\Pictures\cover.jpg"
```

แก้รูปใช้ PATCH `/books/เลขจริง` ชื่อ field ต้องเป็น `cover` ใน Frontend ห้ามตั้ง Content-Type ของ FormData เอง browser ต้องเติม boundary ให้ ดูรูปโดยต่อ Backend URL หน้า coverUrl เช่น `http://localhost:3000/uploads/abc.jpg`

ปัจจุบันเปลี่ยนรูป/ลบหนังสือ **ไม่ได้ลบรูปเก่าในดิสก์** และส่ง `coverUrl: null` แค่ล้างการอ้างอิง ไม่ลบไฟล์ ต้องเพิ่มการจัดการไฟล์เองถ้าต้องการ

## 7. ใช้งาน Git และย้ายเครื่อง

### 7.1 ไฟล์ที่ตาม Git ไปและไฟล์ที่ต้องสร้างใหม่

| รายการ | เก็บใน Git | เครื่องใหม่ทำอย่างไร |
| --- | --- | --- |
| src, schema, tests, config, README, docs | เก็บ | clone/pull |
| package.json + package-lock.json | เก็บทั้งคู่ | npm ci |
| .gitignore | เก็บ | clone/pull |
| node_modules | ไม่เก็บ | npm ci |
| Prisma Client ที่ generate | ไม่เก็บ | prisma:generate |
| dist | ไม่เก็บ | build ถ้ารัน prod |
| prisma/dev.db และ journal/WAL | ไม่เก็บ | prisma:push สร้าง DB เปล่า หรือคืน backup |
| uploads | ไม่เก็บ | คืน backup; เริ่มใหม่สร้างเองเมื่ออัปโหลด |
| .env | ไม่เก็บ | สร้างใหม่เมื่อใช้ env |
| .env.example | ควรเก็บเมื่อใช้ env | แม่แบบ ไม่มีรหัสผ่านจริง |
| prisma/migrations | เก็บถ้าใช้ migration | ใช้ขั้นตอน migration |

**Git ไม่ได้สำรองรายการหนังสือหรือรูปให้** `prisma:push` สร้างโครงสร้าง ไม่ได้คืนข้อมูล DB กับ uploads ต้องสำรองคู่กัน

### 7.2 อัปโหลด GitHub ครั้งแรก

สร้าง repository ว่างบน GitHub ก่อน ไม่ต้องให้ GitHub สร้าง README ซ้ำ รันในโฟลเดอร์งาน:

```powershell
git status
git init
git add .
git status
git commit -m "Add CRUD base and Thai guide"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

ถ้าเป็น Git repository อยู่แล้วข้าม `git init` ได้ ก่อน commit ดู `git status` ว่าไม่มี .env/DB/uploads หลุดไป ถ้ามี remote อยู่แล้วตรวจ `git remote -v` ไม่ต้อง add ซ้ำ URL ผิดใช้ `git remote set-url origin URLใหม่` ตอน push อาจต้องลงชื่อเข้าใช้ GitHub

ถ้า Git ขอชื่อ/อีเมล ตั้งครั้งแรก เปลี่ยนเป็นของตนเอง:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 7.3 ส่งงานหลังแก้ และรับงานอีกเครื่อง

```powershell
git status
git diff
git add .
git commit -m "Describe what changed"
git push
```

อีกเครื่อง `git pull` แล้วติดตั้งตามหัวข้อ 3 ควร pull ก่อนเริ่มทำงานและ push ก่อนย้ายเครื่อง หากมีงานค้าง commit ก่อน หรือเก็บชั่วคราว:

```powershell
git stash push -u -m "Work before pulling"
git pull
git stash pop
```

stash อยู่ในเครื่อง ไม่ได้ส่งไปอีกเครื่อง และไม่รวมไฟล์ ignored เช่น DB/uploads ถ้าเกิด conflict เปิดไฟล์ที่ Git แจ้ง เลือกเนื้อหาที่ต้องการ ลบ `<<<<<<<`, `=======`, `>>>>>>>` แล้ว add/commit ผลที่รวมแล้ว อย่า force push หรือทิ้งงานเพื่อแก้โดยไม่ตรวจ

### 7.4 ย้ายข้อมูลจริงด้วย

1. หยุด Backend และ Prisma Studio ทั้งหมดก่อน เพื่อให้ SQLite หยุดเขียน
2. สำเนา `prisma/dev.db` และทั้ง `uploads/` ไว้นอก repository เช่น USB/พื้นที่สำรองไฟล์
3. เครื่องใหม่ clone, ลงแพ็กเกจ, generate แล้วหยุดแอปก่อนคืน backup
4. วาง DB กลับที่ `prisma/dev.db` และรูปกลับ `uploads/` สำรองของปลายทางก่อนทับถ้ามีข้อมูลอยู่แล้ว
5. ใช้ schema เวอร์ชันเดียวกับ backup ตรวจความต่างก่อน push schema หากเตือนข้อมูลหายให้หยุดอ่าน
6. เปิด Server ตรวจทั้ง `/books` และรูป

ถ้ายังมี `dev.db-wal` หลังหยุดโปรแกรม อย่าคัดลอกเฉพาะ DB แบบเดาสุ่ม อาจมีข้อมูลค้างใน WAL ให้ปิดการเชื่อมต่อให้ครบหรือใช้เครื่องมือ backup ของ SQLite การคัดลอกไม่ใช่การรวมข้อมูลสองเครื่อง ถ้าต้องใช้ข้อมูลชุดเดียวพร้อมกันให้ใช้ DB กลางและที่เก็บรูปกลาง

## 8. แก้ปัญหาที่พบบ่อย

| อาการ | วิธีตรวจ/แก้ |
| --- | --- |
| node/git is not recognized | ติดตั้ง แล้วเปิด Terminal ใหม่ ตรวจ PATH |
| npm.ps1 cannot be loaded | ใช้ npm.cmd / npx.cmd ตามตารางคำสั่งสำรองในหัวข้อ 2.1 |
| ENOENT package.json | อยู่ผิดโฟลเดอร์ ตรวจ Get-Location / Get-ChildItem |
| Missing script: dev | ใช้ npm run start:dev; ดู scripts ด้วย npm run |
| nest is not recognized / module หาย | npm ci แล้วรันผ่าน npm script ไม่ต้องลง CLI global |
| npm ci บอก lock ไม่ตรง | ถ้าแก้ dependency เองใช้ npm install แล้ว commit package+lock ถ้าไม่ได้แก้ตรวจว่าดึงครบ |
| ลงแพ็กเกจไม่ได้เพราะ network | ตรวจอินเทอร์เน็ต/proxy แล้วลองใหม่ ไม่ปิด SSL verification |
| Prisma Client ไม่ initialize / field ใหม่ไม่มี | prisma:generate แล้วรีสตาร์ต Server; VS Code ค้างให้ Restart TS Server |
| Table does not exist / P2021 | prisma:push ตรวจว่าใช้ DB ถูกไฟล์ |
| เปลี่ยน DATABASE_URL แล้วไม่เปลี่ยน DB | schema เดิม hardcode URL ต้องแก้ให้ใช้ env ตามคู่มือ |
| เปลี่ยน PORT ใน .env แล้วไม่เปลี่ยน | Nest เดิมไม่โหลด .env ให้ app อัตโนมัติ ใช้ $env:PORT หรือเพิ่ม dotenv |
| EADDRINUSE | พอร์ตชน หยุด Server เก่าหรือเปลี่ยน PORT พร้อม URL ฝั่ง Frontend |
| / แสดง Hello World | นี่คือ Backend เปิด/สร้าง Frontend แยก |
| Cannot GET /products | ยังไม่ได้เพิ่มตัวอย่าง หรือไม่ได้ import ProductModule |
| Cannot PUT /books/1 | ใช้ PATCH ตรวจ path และอย่าเติม /api หากไม่ได้ตั้ง prefix |
| Failed to fetch / connection refused | Backend ไม่เปิด, URL/port ผิด หรือ localhost ผิดเครื่อง |
| CORS error | origin ใน src/main.ts ต้องตรง protocol/host/port ของ Frontend แล้วรีสตาร์ต |
| Postman ได้ หน้าเว็บไม่ได้ | ตรวจ CORS / DevTools Network; Postman ไม่บังคับ CORS แบบ browser |
| รูป 404 หลัง clone | คืน uploads จาก backup และต่อ Backend URL หน้า coverUrl |
| Unexpected field ตอนส่งรูป | ชื่อ field ต้องเป็น cover |
| รูปถูกปฏิเสธ/ใหญ่เกิน | ใช้ JPEG/PNG/GIF/WebP จริงไม่เกิน 5 MB เปลี่ยนนามสกุลอย่างเดียวไม่ได้ |
| เลข/boolean ผิดชนิด | JSON ส่งเลขและ true/false ไม่ใส่ quote; FormData ต้องแปลงข้อความใน Controller |
| id แล้ว 404 | ไม่มีรายการ ใช้ id จากผลตอบกลับตอนสร้าง |
| body ผิดแล้ว 500 | อ่าน log Backend ตรวจ field/type; DTO เดิมไม่ได้ validate ครบ |
| ภาษาไทยเพี้ยน | เปิด/บันทึก UTF-8 ตรวจ response encoding อย่าแก้ตาม Terminal เพียงอย่างเดียว |
| git push ถูกปฏิเสธ | ตรวจบัญชี/สิทธิ์/remote หากมีงานใหม่ pull รวมก่อน push ไม่ force ทับ |
| แก้ dist แล้วหาย | แก้ src แล้ว build |
| audit แจ้งช่องโหว่ | อ่าน npm audit แล้วอัปเดตโดยทดสอบ ไม่ใช้ audit fix --force แบบไม่ตรวจ |

เปลี่ยนพอร์ตชั่วคราวใน PowerShell:

```powershell
$env:PORT = '3002'
npm run start:dev
```

Frontend ต้องเรียก `http://localhost:3002` ด้วย หยุด Server แล้วคืนค่าด้วย:

```powershell
Remove-Item Env:PORT
```

## 9. เริ่มดัดแปลง

ก่อนงานใหญ่ commit และสร้าง branch:

```powershell
git switch -c feature/product-crud
```

ทำทีละส่วน: schema → DTO → service → controller/module → Frontend → ทดสอบ ตาม [คู่มือ Modify](docs/MODIFY.md) มีทั้งเพิ่มฟิลด์ เพิ่ม CRUD คู่กับหนังสือ เปลี่ยน DB และเตรียม deploy
