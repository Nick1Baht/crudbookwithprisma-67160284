# ทางเลือก: Backend JavaScript + Express + Prisma

[กลับ README](../README.md) · [Modify Nest/DB](MODIFY.md) · [Frontend](FRONTEND.md)

คำสั่งใช้ npm/npx ปกติสำหรับเครื่องแล็บที่ไม่บล็อก ถ้า PowerShell บล็อกให้เปลี่ยนเฉพาะคำแรกเป็น npm.cmd/npx.cmd ตาม README หัวข้อ 2.1

Nest เดิมเขียน TypeScript แต่ build ออกมาเป็น JavaScript ได้อยู่แล้วด้วย `npm run build` ถ้าต้องการเพียงรันไฟล์ JavaScript ใช้ `npm run start:prod` หลัง build ได้ **ไม่ต้องเปลี่ยนภาษา**

ถ้าต้องการเขียน `.js` โดยตรง ตัวอย่างนี้สร้าง **Backend ใหม่แยกโฟลเดอร์** ใช้ Express + Prisma 6 และ CRUD สินค้า `/products` ไม่ใช่การเปลี่ยนนามสกุล `.ts` เป็น `.js` เพราะ type annotation, decorator และ dependency injection ของ Nest ต้องออกแบบใหม่ด้วย

ตัวอย่างนี้ไม่ทับ Nest เดิม ไม่ย้ายข้อมูลเก่า และยังไม่มี `/books`, รีวิว หรืออัปโหลดรูป หน้า HTML หนังสือในคู่มือ Frontend จึงใช้กับตัวอย่างนี้โดยเปลี่ยนแค่ base URL ไม่ได้ ต้องเปลี่ยน path/ฟอร์ม/body เป็นสินค้า หรือเขียน endpoint หนังสือให้มีสัญญาเดิมก่อน

## 1. สร้างโปรเจกต์ใหม่

เปิด Terminal ในโฟลเดอร์ที่จะเก็บงานใหม่ เช่นโฟลเดอร์รวมงาน ไม่ต้องสร้างทับ src เดิม:

```powershell
mkdir crud-products-js
cd crud-products-js
npm init -y
npm install express@5.1.0 cors@2.8.5 dotenv@16.6.1 @prisma/client@6.19.3
npm install -D prisma@6.19.3
New-Item -ItemType Directory -Force prisma
```

ใช้ Node 22.12+ ในสาย 22 หรือ 24.x เหมือนคู่มือหลัก ตั้ง Prisma CLI กับ client รุ่นเดียวกัน ตัวอย่างนี้เขียนตาม Prisma 6 อย่าใช้ Prisma รุ่นใหม่ข้าม major โดยไม่ปรับวิธีตั้งค่า

## 2. แก้ scripts ใน package.json

เปิด package.json **ของ crud-products-js** แทนที่เฉพาะ `scripts` เดิมด้วยบล็อกนี้ เก็บ dependencies/devDependencies ที่ npm เพิ่มไว้ ไม่คัดลอกทับทั้งไฟล์:

```json
"scripts": {
  "dev": "node --watch server.js",
  "start": "node server.js",
  "prisma:generate": "prisma generate",
  "prisma:push": "prisma db push"
}
```

โปรเจกต์ใหม่นี้ใช้ CommonJS (`require`) ไม่เติม `"type": "module"` ถ้าจะใช้ import ต้องปรับให้เป็น ESM ทั้งโปรเจกต์ ตัวอย่าง JavaScript นี้ไม่ต้องมีคำสั่ง build แบบ Nest

## 3. สร้าง prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Product {
  id    Int    @id @default(autoincrement())
  name  String
  price Int    @default(0)
  stock Int    @default(0)
}
```

ราคาเป็นจำนวนสตางค์ เช่น 1500 คือ 15 บาท ตัวอย่างนี้ตั้งใจให้ schema Product เหมือนคู่มือ Nest Product เพื่อให้เปลี่ยน backend ได้โดยสัญญา API เดิม

## 4. สร้าง .env, .env.example และ .gitignore

`.env` ที่ root ใหม่:

```dotenv
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL="file:./dev.db"
```

สร้าง `.env.example` เนื้อหาเหมือนข้างบนได้สำหรับตัวอย่าง SQLite ซึ่งไม่มีรหัสผ่าน ถ้าเปลี่ยน DB ให้ใส่แค่ค่าตัวอย่าง ไม่ใส่ secret จริง

`.gitignore` ที่ root ใหม่:

```gitignore
node_modules/
.env
.env.*
!.env.example
prisma/*.db
prisma/*.db-*
uploads/
*.log
```

schema อยู่ใน prisma จึงสร้าง DB ที่ `prisma/dev.db` ไม่ใช่ DB ของ Nest อีกโฟลเดอร์

## 5. สร้าง server.js

คัดลอกเนื้อหาทั้งหมดเป็น `server.js` ข้าง package.json:

```js
require('dotenv/config');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 3000);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3001' }));
app.use(express.json({ limit: '1mb' }));

function problem(status, message) {
  return Object.assign(new Error(message), { status });
}

function readId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw problem(400, 'id ต้องเป็นจำนวนเต็มบวก');
  return id;
}

function productData(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw problem(400, 'ต้องส่ง JSON object');
  }
  const fields = ['name', 'price', 'stock'];
  if (Object.keys(body).some((key) => !fields.includes(key))) {
    throw problem(400, 'ส่งเฉพาะ name, price, stock');
  }
  const data = {};
  for (const field of fields) {
    if (!Object.hasOwn(body, field)) {
      if (!partial) throw problem(400, `ต้องส่ง ${field}`);
      continue;
    }
    const value = body[field];
    if (field === 'name') {
      if (typeof value !== 'string' || !value.trim()) {
        throw problem(400, 'name ต้องเป็นข้อความที่ไม่ว่าง');
      }
      data.name = value.trim();
    } else {
      if (!Number.isInteger(value) || value < 0 || value > 2147483647) {
        throw problem(400, `${field} ต้องเป็นจำนวนเต็ม 0 ถึง 2147483647`);
      }
      data[field] = value;
    }
  }
  if (!Object.keys(data).length) throw problem(400, 'ต้องส่งอย่างน้อยหนึ่งฟิลด์');
  return data;
}

app.get('/', (_req, res) => res.json({ message: 'Products API ready' }));

app.get('/products', async (_req, res) => {
  res.json(await prisma.product.findMany({ orderBy: { id: 'asc' } }));
});

app.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: readId(req.params.id) } });
  if (!product) throw problem(404, 'ไม่พบสินค้า');
  res.json(product);
});

app.post('/products', async (req, res) => {
  const product = await prisma.product.create({ data: productData(req.body) });
  res.status(201).json(product);
});

app.patch('/products/:id', async (req, res) => {
  const product = await prisma.product.update({
    where: { id: readId(req.params.id) },
    data: productData(req.body, true),
  });
  res.json(product);
});

app.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: readId(req.params.id) } });
  res.json({ message: 'ลบสินค้าแล้ว' });
});

app.use((_req, res) => res.status(404).json({ message: 'ไม่พบ API นี้' }));

// Express 5 ส่ง error จาก async handler มาที่นี่ให้
app.use((error, _req, res, _next) => {
  if (error.code === 'P2025') {
    return res.status(404).json({ message: 'ไม่พบสินค้า' });
  }
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: status === 500 ? 'เกิดข้อผิดพลาดใน Server' : error.message });
});

let server;
async function start() {
  await prisma.$connect();
  server = app.listen(port, () => console.log(`API: http://localhost:${port}`));
  server.on('error', (error) => {
    console.error(error);
    void prisma.$disconnect().finally(() => process.exit(1));
  });
}

async function stop() {
  if (server) await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', () => { void stop(); });
process.on('SIGTERM', () => { void stop(); });
start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
```

## 6. ติดตั้ง DB และรัน

**หยุด Nest เดิมก่อนถ้าทั้งคู่ใช้พอร์ต 3000** หรือเปลี่ยน PORT ของ JavaScript เป็น 3002 และเปลี่ยน URL ที่ใช้ทดสอบ/Frontend ให้ตรง

```powershell
npm run prisma:generate
npm run prisma:push
npm run dev
```

ในโปรเจกต์ใหม่นี้ `npm run dev` ใช้ได้ เพราะเพิ่งเพิ่ม script เอง ต่างจาก Nest เดิมที่ใช้ start:dev

เปิด Terminal ใหม่ในโปรเจกต์ใหม่นี้:

```powershell
$apiBase = 'http://localhost:3000'
$body = @{ name = 'Pen'; price = 1500; stock = 10 } | ConvertTo-Json
$item = Invoke-RestMethod "$apiBase/products" -Method Post -ContentType 'application/json' -Body $body
$itemId = $item.id
Invoke-RestMethod "$apiBase/products"
Invoke-RestMethod "$apiBase/products/$itemId"
$edit = @{ stock = 8 } | ConvertTo-Json
Invoke-RestMethod "$apiBase/products/$itemId" -Method Patch -ContentType 'application/json' -Body $edit
Invoke-RestMethod "$apiBase/products/$itemId" -Method Delete
```

ลองส่ง price = -1, name ว่าง, field แปลก และ id ที่ไม่มี ควรได้ 400/404 จากนั้น restart แล้วดูว่าข้อมูลที่ยังไม่ลบคงอยู่ ตัวอย่างเก็บ DB จริง ไม่ใช้ array ใน memory

## 7. ย้ายเครื่องและเปลี่ยนเป็นระบบอื่น

เก็บ server.js, prisma/schema.prisma, package.json, package-lock.json, .gitignore และ .env.example ใน Git ไม่เก็บ DB/.env/node_modules เครื่องใหม่:

```powershell
npm ci
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

ถ้ามี .env อยู่แล้วอย่า copy ทับโดยไม่ตรวจ เติมค่าจริงก่อน run การคืนข้อมูล/สำรองทำเหมือน README หากใช้ PostgreSQL/MySQL เปลี่ยน datasource และ DATABASE_URL ตามคู่มือ Modify

ถ้าจะเพิ่ม Book คู่กับ Product ให้เพิ่ม model และชุด routes `/books` แยก ต้องเขียน validation/body ตามฟิลด์ Book หากต้องการใช้หน้าเดิมให้รักษา method/path/response/รูปแบบรูปเดิมไว้ หรือปรับ Frontend ทุกจุดตามสัญญาใหม่ ไม่มีการย้าย Controller ของ Nest มา Express อัตโนมัติ

อ้างอิง: [Express routing](https://expressjs.com/en/guide/routing.html), [Express error handling](https://expressjs.com/en/guide/error-handling.html), [Prisma v6](https://www.prisma.io/docs/orm/v6), [Node watch mode](https://nodejs.org/api/cli.html#--watch)
