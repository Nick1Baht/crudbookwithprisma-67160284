# คู่มือ Frontend: แก้หน้าไหน เชื่อม Backend ตรงไหน

[กลับ README](../README.md) · [Modify Backend/DB](MODIFY.md)

**Repository นี้ยังไม่มี Frontend** จึงยังไม่มี `app/page.tsx`, `pages/index.tsx` หรือ `App.jsx` ให้แก้ รายชื่อ React/Next.js ด้านล่างเป็นแนวทางสำหรับอีกโปรเจกต์ ไม่ใช่ไฟล์ที่ซ่อนอยู่ใน Backend นี้

คำสั่งใช้ npm/npx ปกติสำหรับเครื่องแล็บที่ไม่บล็อก ถ้า PowerShell บล็อกให้เปลี่ยนเฉพาะคำแรกเป็น npm.cmd/npx.cmd ตาม README หัวข้อ 2.1

## 1. รู้ก่อนว่าต้องแก้ฝั่งไหน

| อยากเปลี่ยน | แก้ที่ |
| --- | --- |
| ข้อความหัวข้อ สี ปุ่ม ขนาด ตาราง ฟอร์ม | HTML/JSX/CSS ฝั่ง Frontend |
| เพิ่มช่องในฟอร์มแต่ยังไม่เก็บ DB | Frontend แต่บันทึกจริงยังไม่ได้จนกว่า Backend รองรับ |
| เพิ่มข้อมูลให้เก็บถาวร | schema/DTO/service Backend และ input/body ฝั่ง Frontend |
| เปลี่ยน URL Backend | ตัวแปร API base URL ฝั่ง Frontend |
| เปลี่ยน path /books เป็น /products | fetch ฝั่ง Frontend และ @Controller ฝั่ง Backend |
| เปลี่ยนช่อง title เป็น name | input/state, body, table และ schema/DTO/service |
| หน้าเปิดแต่ข้อมูลไม่ขึ้น | DevTools → Network ดู URL, status, response และ console |

เส้นทางเชื่อมจริงคือ **Frontend เรียก API Backend** ไม่ได้เชื่อม SQLite/Prisma โดยตรง ห้ามใส่ DATABASE_URL หรือรหัสผ่าน DB ลงใน JavaScript ที่ browser โหลด

## 2. สัญญาการรับส่งที่ต้องตรงกัน

```js
const API_BASE_URL = 'http://localhost:3000';

const response = await fetch(`${API_BASE_URL}/books`);
if (!response.ok) throw new Error(`อ่านไม่ได้: HTTP ${response.status}`);
const books = await response.json();
```

- API เดิมส่งรายการเป็น array ตรง ๆ เช่น `[{ id: 1, title: 'A', author: 'B' }]` ไม่ใช่ `{ data: [...] }`
- เพิ่มใช้ POST, แก้ใช้ PATCH, ลบใช้ DELETE และเติม id จริง
- JSON ใช้ `Content-Type: application/json` และ `JSON.stringify(data)`
- รูปใช้ `FormData` ชื่อ field `cover` **ไม่ตั้ง Content-Type เอง**
- coverUrl จาก API เป็น `/uploads/...` ต้องต่อ Backend URL ก่อนแสดง ไม่เช่นนั้น browser จะขอรูปจากพอร์ต Frontend
- URL, method, ชื่อ field, ชนิดข้อมูล, รูปแบบ response ต้องตรงกัน แม้จะเปลี่ยน Backend เป็น JavaScript ก็ใช้กติกาเดียวกัน

ตัวอย่างแก้ด้วย JSON:

```js
await fetch(`${API_BASE_URL}/books/1`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'ชื่อใหม่', publishedYear: 2026 }),
});
```

ตัวอย่างนี้ย่อเพื่ออธิบายรูปแบบ ในโค้ดใช้งานต้องตรวจ response.ok และแจ้งข้อผิดพลาดเหมือนตัวอย่างเต็มด้านล่าง

## 3. สร้างหน้าเว็บทดลอง CRUD หนังสือแบบไม่ใช้ React

ถ้ามี Frontend เดิมอยู่แล้ว ข้ามไปหัวข้อ 4 ได้ ตัวอย่างนี้สร้างไฟล์ใหม่เพิ่มใน repository เมื่อคุณทำตาม **ตัวหน้าเว็บยังไม่ได้ถูกสร้างไว้ให้ในโค้ดหลัก** ใช้ API หนังสือของ Nest เดิม รองรับเพิ่ม/อ่าน/แก้/ลบและอัปโหลดรูป แต่ยังไม่มี UI จัดการรีวิว

### 3.1 สร้างโฟลเดอร์และไฟล์

ในโฟลเดอร์ Backend:

```powershell
New-Item -ItemType Directory -Force frontend-example
```

สร้าง `frontend-example/index.html` ใน VS Code แล้วใส่เนื้อหาทั้งหมด:

```html
<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>จัดการหนังสือ</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 32px auto; padding: 16px; }
    label { display: block; margin: 12px 0; }
    input, button { padding: 8px; margin: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #ccc; text-align: left; }
    img { max-width: 80px; max-height: 100px; }
    #message { white-space: pre-wrap; }
    .table-wrap { overflow-x: auto; }
  </style>
</head>
<body>
  <h1>จัดการหนังสือ</h1>
  <p id="mode">เพิ่มหนังสือ</p>
  <form id="book-form">
    <label>ชื่อหนังสือ <input id="title" required></label>
    <label>ผู้เขียน <input id="author" required></label>
    <label>ปีที่พิมพ์ <input id="year" type="number" step="1"></label>
    <label><input id="available" type="checkbox" checked> พร้อมใช้งาน</label>
    <label>รูปปก <input id="cover" type="file" accept="image/jpeg,image/png,image/gif,image/webp"></label>
    <button id="save" type="submit">บันทึก</button>
    <button id="cancel" type="button">ยกเลิกการแก้ไข</button>
  </form>
  <p id="message" role="status"></p>
  <button id="reload" type="button">โหลดรายการใหม่</button>
  <div class="table-wrap">
    <table>
      <thead><tr><th>รูป</th><th>ชื่อ</th><th>ผู้เขียน</th><th>ปี</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
  </div>

  <script>
    // เปลี่ยนจุดนี้เมื่อเปลี่ยนที่อยู่ Backend (ไม่ใส่ / ปิดท้าย)
    const API_BASE_URL = 'http://localhost:3000';
    const byId = (id) => document.getElementById(id);
    const form = byId('book-form');
    let editingId = null;

    function showError(error) {
      byId('message').textContent = error.message;
    }

    async function api(path, options = {}) {
      const response = await fetch(`${API_BASE_URL}${path}`, options);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = body?.message;
        throw new Error(Array.isArray(detail) ? detail.join('\n') : detail || `HTTP ${response.status}`);
      }
      return body;
    }

    function resetForm() {
      editingId = null;
      form.reset();
      byId('mode').textContent = 'เพิ่มหนังสือ';
    }

    function addTextCell(row, value) {
      const cell = row.insertCell();
      cell.textContent = String(value ?? '-');
      return cell;
    }

    async function loadBooks() {
      const books = await api('/books');
      byId('rows').replaceChildren();
      for (const book of books) {
        const row = document.createElement('tr');
        const imageCell = row.insertCell();
        if (book.coverUrl) {
          const image = document.createElement('img');
          // จำกัดเฉพาะ URL รูป http/https
          const url = new URL(book.coverUrl, API_BASE_URL);
          if (['http:', 'https:'].includes(url.protocol)) image.src = url.href;
          image.alt = `ปก ${book.title}`;
          imageCell.append(image);
        }
        addTextCell(row, book.title);
        addTextCell(row, book.author);
        addTextCell(row, book.publishedYear);
        addTextCell(row, book.isAvailable ? 'พร้อมใช้' : 'ไม่พร้อมใช้');
        const actions = row.insertCell();
        const edit = document.createElement('button');
        edit.textContent = 'แก้ไข';
        edit.type = 'button';
        edit.onclick = () => {
          editingId = book.id;
          byId('title').value = book.title;
          byId('author').value = book.author;
          byId('year').value = book.publishedYear ?? '';
          byId('available').checked = book.isAvailable;
          byId('cover').value = '';
          byId('mode').textContent = `แก้ไขหนังสือ ID ${book.id}`;
          byId('title').focus();
        };
        const remove = document.createElement('button');
        remove.textContent = 'ลบ';
        remove.type = 'button';
        remove.onclick = async () => {
          if (!confirm(`ลบ ${book.title} และรีวิวของเล่มนี้หรือไม่?`)) return;
          remove.disabled = true;
          try {
            await api(`/books/${book.id}`, { method: 'DELETE' });
            if (editingId === book.id) resetForm();
            await loadBooks();
            byId('message').textContent = 'ลบแล้ว';
          } catch (error) {
            showError(error);
          } finally {
            remove.disabled = false;
          }
        };
        actions.append(edit, remove);
        byId('rows').append(row);
      }
      if (!books.length) byId('message').textContent = 'ยังไม่มีหนังสือ';
    }

    form.onsubmit = async (event) => {
      event.preventDefault();
      byId('save').disabled = true;
      try {
        const data = new FormData();
        data.append('title', byId('title').value.trim());
        data.append('author', byId('author').value.trim());
        const year = byId('year').value;
        if (year !== '') data.append('publishedYear', year);
        data.append('isAvailable', String(byId('available').checked));
        const cover = byId('cover').files[0];
        if (cover) data.append('cover', cover);
        await api(editingId === null ? '/books' : `/books/${editingId}`, {
          method: editingId === null ? 'POST' : 'PATCH',
          body: data,
        });
        resetForm();
        await loadBooks();
        byId('message').textContent = 'บันทึกแล้ว';
      } catch (error) {
        showError(error);
      } finally {
        byId('save').disabled = false;
      }
    };

    byId('cancel').onclick = resetForm;
    byId('reload').onclick = () => loadBooks().catch(showError);
    loadBooks().catch(showError);
  </script>
</body>
</html>
```

ข้อจำกัดที่ตั้งใจให้ตัวอย่างสั้น: ช่องปีว่างตอนแก้หมายถึง “ไม่แก้ปีเดิม” ยังไม่มีปุ่มล้างปีให้เป็น null เพราะ DTO/normalizer เดิมไม่ได้รองรับกรณีนั้นครบ และไม่เลือกรูปใหม่หมายถึงใช้รูปเดิม ไม่ใช่ลบรูป

### 3.2 เปิดสอง Terminal

Terminal แรกที่ root Backend:

```powershell
npm run start:dev
```

Terminal ที่สองที่ root เดียวกัน:

```powershell
npx --yes http-server@14.1.1 ./frontend-example -a localhost -p 3001 -c-1
```

คำสั่งหลังดาวน์โหลดเครื่องมือ static server ชั่วคราวเมื่อยังไม่มี ต้องมีอินเทอร์เน็ต ไม่ต้องลง Node อีกชุด ไม่เพิ่ม http-server เข้า dependency ของ Backend

เปิด **`http://localhost:3001`** ไม่ใช่ดับเบิลคลิกไฟล์ HTML (`file://` จะมี origin ต่างออกไป) CORS ของ Backend เดิมอนุญาต origin นี้อยู่แล้ว ถ้าพอร์ตชนให้หยุดตัวเก่าหรือเปลี่ยนพอร์ตและแก้ CORS ให้ตรง

ลองเพิ่ม → อ่าน → แก้ → ลบ → โหลดหน้าใหม่ → restart Backend แล้วตรวจข้อมูลยังอยู่ ลองรูปทั้งที่ถูกและผิดชนิดด้วย

### 3.3 จุดแก้ในตัวอย่างนี้

| จุดใน index.html | ใช้แก้อะไร |
| --- | --- |
| title, h1, label, th | ชื่อหน้า/ข้อความ/หัวตาราง |
| style | สี ระยะห่าง ฟอนต์ ขนาด |
| input id=... | ช่องกรอก ต้องตรง byId ใน script |
| API_BASE_URL | ที่อยู่ Backend |
| loadBooks | โหลดและแสดงรายการ |
| edit.onclick | ใส่ข้อมูลเดิมเข้าฟอร์ม |
| form.onsubmit | สร้าง body และเลือก POST/PATCH |
| remove.onclick | ยืนยันและลบ |
| api | ตรวจผลตอบกลับและข้อความผิดพลาด |

ถ้าจะเพิ่มหน้า Product ให้สร้าง `frontend-example/products.html`, เพิ่มลิงก์ `<a href="products.html">สินค้า</a>` และหน้า Product ใส่ลิงก์กลับ `index.html` ใช้ body JSON `{ name, price, stock }` กับ `/products` ตามคู่มือ Modify **อย่าเปลี่ยนแค่ URL แต่ยังส่ง title/author/cover อยู่** เพราะ Product DTO คนละชุดและตัวอย่าง Product ไม่รับ FormData

## 4. ถ้ามี React / Next.js อีกโปรเจกต์

เปิดโฟลเดอร์ Frontend ของจริงก่อน ดู package.json ว่าใช้ framework อะไรและมี script อะไร ไม่ใช่รันคำสั่ง Frontend ในโฟลเดอร์ Backend

| โครงสร้างที่พบ | ไฟล์ที่มักแก้ |
| --- | --- |
| Next.js App Router | app/page.tsx หรือ src/app/page.tsx คือหน้าแรก |
| Next.js App Router | app/books/page.tsx คือ /books; app/products/page.tsx คือ /products |
| Next.js | app/layout.tsx คือโครงร่วม/เมนู; globals.css คือ CSS รวม |
| Next.js Pages Router | pages/index.tsx หรือ src/pages/index.tsx คือหน้าแรก |
| React + Vite | src/App.jsx หรือ src/App.tsx, src/main.*, src/index.css |
| components/ | ฟอร์ม ตาราง ปุ่มที่ใช้ซ้ำ |
| lib/api.* หรือ services/ | ถ้ามี มักรวม fetch/base URL |

ให้ค้น `localhost:3000`, `/books`, `fetch(`, `axios`, `title`, `author` ด้วย Ctrl+Shift+F เพื่อหาจุดจริง ชื่อไฟล์แต่ละโปรเจกต์อาจไม่เหมือนตาราง

### Next.js: ตั้ง URL ที่ browser ใช้

สร้าง `.env.local` ใน root **Frontend**:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
```

ในโค้ดที่เรียก API:

```js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
```

ถ้าใช้ state, event handler หรือ fetch จาก browser ใน App Router ให้ component นั้นเป็น client component ด้วย `'use client';` บรรทัดแรก หรือแยก component ที่มี interaction ออกมา ค่านำหน้า NEXT_PUBLIC เป็นข้อมูลสาธารณะ ไม่ใส่ secret

ดู script ก่อนรัน ตัวอย่างเมื่อมี dev script แบบ Next มาตรฐาน:

```powershell
npm ci
npm run dev -- --port 3001
```

### Vite: ตั้ง URL และพอร์ต

`.env.local` ฝั่ง Frontend:

```dotenv
VITE_API_URL=http://localhost:3000
```

```js
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

```powershell
npm ci
npm run dev -- --port 3001
```

ใช้ได้เมื่อ package.json มี dev เป็น vite ถ้าใช้ค่า default 5173 ต้องเพิ่ม `http://localhost:5173` ใน CORS Backend ด้วย

แก้ env แล้ว restart dev server ส่วน production ค่าสาธารณะมักถูกฝังตอน build จึงต้อง build/deploy Frontend ใหม่ สร้าง `.env.example` ไม่มี secret ไว้ใน Git และเครื่องใหม่คัดลอกเป็น `.env.local` เอง ตรวจ .gitignore ของ Frontend แยกจาก Backend

อ้างอิง: [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables), [Vite env](https://vite.dev/guide/env-and-mode)

## 5. เปลี่ยน Backend ไปเครื่องอื่น / domain จริง

เปลี่ยน API_BASE_URL ฝั่ง Frontend ให้เป็น URL ใหม่ เช่น `https://api.example.com` แล้วตั้ง CORS Backend ให้ตรง origin หน้าเว็บ เช่น `https://example.com`

ทดสอบใน LAN ใช้ IP ของเครื่อง Backend แทน localhost เช่น `http://192.168.1.20:3000` (ตัวอย่าง ต้องใช้ IP จริง) ตรวจว่า server รับการเชื่อมต่อภายนอกและ firewall อนุญาตเฉพาะที่จำเป็น Backend CORS ต้องอนุญาต origin ที่หน้าเว็บถูกเปิดจากจริง ห้ามใช้ IP/พอร์ตตัวอย่างโดยไม่ตรวจ

ถ้า API มี prefix /api ให้ต่อ URL ตามที่ตกลง แต่ URL รูปอาจยังอยู่ `/uploads/...` ใช้ origin ของ Backend สำหรับรูป อย่าต่อ prefix API ไปกับรูปโดยอัตโนมัติ

## 6. ตรวจปัญหาจาก browser

กด F12 → Network → ทำรายการอีกครั้ง → คลิก request:

| สิ่งที่เห็น | แปลว่า/ตรวจอะไร |
| --- | --- |
| ไม่มี request | handler ไม่ทำงาน, JavaScript error, ปุ่ม/form ไม่ผูก event |
| URL ผิดพอร์ต | API base URL ผิด หรือ env ยังไม่ restart/build |
| 400 | body/ชนิด/ชื่อ field ไม่ตรง อ่าน response message |
| 404 | path/id ผิด หรือยังไม่ได้เพิ่ม module |
| 500 | อ่าน log Backend และ DB อย่าแก้ด้วยการซ่อน error |
| CORS | origin ไม่ตรงหรือ Backend ตอบไม่ได้ ดู console และ log ร่วมกัน |
| POST ได้แล้ว UI ไม่เพิ่ม | ต้องโหลด list ใหม่หรือปรับ state หลังสำเร็จ |
| รูปขอจาก :3001/uploads | ลืมต่อ Backend URL |
| งาน deploy เรียก localhost | browser กำลังเรียกเครื่องผู้ใช้เอง เปลี่ยน URL production |

หน้าเว็บตัวอย่างแสดงข้อความด้วย textContent เพื่อไม่เอาข้อมูลผู้ใช้ไปแทรกเป็น HTML โดยตรง เวลาทำตารางเองควรรักษาวิธีนี้ไว้
