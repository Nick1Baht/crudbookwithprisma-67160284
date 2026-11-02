# คู่มือ Modify: ใช้โปรเจกต์นี้เป็น Base

[กลับ README](../README.md) · [Frontend](FRONTEND.md) · [JavaScript Backend](JAVASCRIPT-BACKEND.md)

ทุกตัวอย่างในบทนี้เป็นขั้นตอนให้ลงมือทำ ยังไม่ได้เพิ่ม Product หรือเปลี่ยนฐานข้อมูลในแอปหลัก คำสั่งใช้ PowerShell ในโฟลเดอร์ Backend ที่มี package.json ก่อนแก้ DB ให้หยุดแอปและสำรอง `prisma/dev.db` กับ uploads ตาม README เครื่องแล็บที่ไม่บล็อกใช้ npm/npx ตามตัวอย่างได้เลย ถ้า PowerShell บล็อกให้เปลี่ยนเป็น npm.cmd/npx.cmd ตาม README หัวข้อ 2.1

## 1. เลือกสิ่งที่กำลังจะเปลี่ยน

| งาน | จุดที่ต้องแก้ |
| --- | --- |
| เปลี่ยนข้อความ/สี/ปุ่มบนหน้าเว็บ | Frontend เท่านั้น ดูคู่มือ Frontend |
| เปลี่ยนเงื่อนไขการทำงาน | service |
| เปลี่ยน URL หรือ method | controller และผู้เรียก API ฝั่ง Frontend |
| เพิ่มช่องข้อมูล | schema + DTO + service ถ้ามี mapping + ฟอร์ม/ตาราง Frontend |
| เพิ่ม CRUD อีกชุด | model ใหม่ + DTO + service + controller + module + AppModule + Frontend |
| เปลี่ยน DB provider | datasource + connection URL + ตรวจ schema + ย้ายข้อมูล + generate |
| เปลี่ยน Nest เป็น Express | สร้าง Backend แยกตามคู่มือ JavaScript แล้วปรับ Frontend URL/สัญญา API |

## 2. ตัวอย่างเพิ่มฟิลด์ price ให้หนังสือ

สมมติจะเก็บราคาเป็น **จำนวนสตางค์แบบจำนวนเต็ม** เช่น 19900 = 199 บาท ช่วยเลี่ยงปัญหาเลขทศนิยมของราคา

1. เปิด `prisma/schema.prisma` เพิ่มภายใน `model Book` โดยเก็บฟิลด์เดิมไว้:

```prisma
price Int @default(0)
```

2. เพิ่มใน `src/book/dto/create-book.dto.ts` และ `src/book/dto/update-book.dto.ts` ภายใน class ทั้งคู่:

```ts
price?: number;
```

3. ถ้าจะใช้ `book.entity.ts` อธิบายผลลัพธ์ให้เพิ่ม `price: number;` ด้วย แต่ entity ไม่ได้สร้างตารางจริง
4. ถ้าส่งแบบ FormData ทุกค่าเป็นข้อความ ต้องแปลงใน `normalizeBookFields()` ของ `src/book/book.controller.ts` เพิ่มก่อน `return normalized;`:

```ts
if (normalized.price !== undefined) {
  const price = Number(normalized.price);
  if (!Number.isInteger(price) || price < 0) {
    throw new BadRequestException('price ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
  }
  normalized.price = price;
}
```

5. Service ปัจจุบันส่ง DTO เข้า Prisma ตรง ๆ จึงไม่ต้องเพิ่ม mapping สำหรับตัวอย่างนี้ ถ้าเขียน service แบบเลือก field เองต้องเพิ่ม price ใน `data` ด้วย
6. หยุด Server แล้วรัน:

```powershell
npx prisma validate
npm run prisma:push
npm run prisma:generate
npm run build
npm run start:dev
```

7. เพิ่ม input ใน Frontend ส่ง `price: Number(inputValue)` แบบ JSON หรือ `formData.append('price', inputValue)` ถ้าเป็น FormData และแสดงราคาเป็น `price / 100`
8. ทดสอบสร้าง/อ่าน/แก้/ลบ และตรวจว่ารายการเก่าได้ price = 0

เครื่องหมาย `?` ใน DTO แปลว่าโค้ดยอมให้ไม่ส่งมา ส่วน `?` ใน Prisma เช่น `String?` แปลว่าคอลัมน์ยอมเป็น null คนละเรื่องกัน หากเพิ่มฟิลด์บังคับให้ DB ที่มีข้อมูลอยู่แล้ว ต้องมี default หรือทำขั้นตอนเติมข้อมูลก่อน ไม่กดยอมลบข้อมูลเพื่อให้ผ่านโดยไม่อ่าน

### เปลี่ยนชื่อ ลบฟิลด์ หรือเปลี่ยนชนิด

- เปลี่ยนชื่อฟิลด์ต้องตามแก้ schema, DTO, service, entity ที่ใช้, body ของ API, Frontend และ tests ด้วย ค้นชื่อเก่าทั้งโปรเจกต์ด้วย VS Code `Ctrl+Shift+F`
- เปลี่ยนชื่อคอลัมน์ผ่าน db push อาจถูกมองว่า “ลบคอลัมน์เก่าแล้วเพิ่มใหม่” หากมีข้อมูลให้ใช้ migration ที่ตรวจ SQL และย้าย/rename ข้อมูลอย่างตั้งใจ
- จะลบฟิลด์ให้เลิกใช้ใน UI/API ก่อน ตรวจข้อมูลที่ต้องเก็บ แล้วค่อยแก้ schema และ DB
- จะเปลี่ยน String เป็น Int ต้องตรวจว่าแถวเดิมแปลงได้ อย่าคิดว่า generate จะเปลี่ยนข้อมูลให้
- อย่าแก้ `node_modules/.prisma` หรือ `dist` ให้แก้ต้นทางแล้ว generate/build

## 3. เปลี่ยนหนังสือเป็น CRUD อื่นทั้งชุด

ถ้าต้องการเหลือระบบสินค้าอย่างเดียว ควรทำ CRUD สินค้าให้ใช้ได้ก่อนตามหัวข้อถัดไป แล้วจึงถอดหนังสือออก เพื่อยังมีตัวอย่างที่เปิดได้ระหว่างแก้

| เดิม | ตัวอย่างใหม่ |
| --- | --- |
| Book / BookService / BookController / BookModule | Product / ProductService / ProductController / ProductModule |
| prisma.book | prisma.product |
| @Controller('books') | @Controller('products') |
| title / author / publishedYear | name / price / stock |
| URL /books | URL /products |
| ฟอร์มชื่อหนังสือ/ผู้เขียน | ฟอร์มชื่อสินค้า/ราคา/จำนวน |

อย่าใช้ Replace All `book` เป็น `product` ทันที เพราะ Review มี `bookId` และ relation กับ Book หากไม่ใช้รีวิว ต้องถอด routes รีวิว, import DTO, query `include: { reviews: true }`, relation/model ที่เกี่ยวข้อง และส่วน UI ที่เรียกรีวิวด้วย หากต้องเก็บข้อมูลเดิมให้ export/ย้ายก่อนลบตาราง

เมื่อ Product ทำงานแล้วและตัดสินใจถอด Book: เอา BookModule ออกจาก AppModule, ลบโค้ดที่ไม่ใช้งาน, ปรับ tests และค่อยเปลี่ยน schema หลังสำรองข้อมูล เปลี่ยนชื่อ package ใน package.json ได้ แต่ไม่ใช่สิ่งที่เปลี่ยน URL API

## 4. เพิ่ม CRUD ที่สอง: สินค้าอยู่คู่กับหนังสือ

ตัวอย่างนี้เพิ่ม `/products` โดยเก็บ `/books` และรีวิวไว้ สินค้ายังไม่มีรูปและยังไม่มีความสัมพันธ์กับหนังสือ เก็บราคาเป็นจำนวนสตางค์ จำนวนเต็มตั้งแต่ 0

### 4.1 เพิ่ม model

เปิด `prisma/schema.prisma` เพิ่มท้ายไฟล์ **อย่าลบ Book/Review**:

```prisma
model Product {
  id    Int    @id @default(autoincrement())
  name  String
  price Int    @default(0)
  stock Int    @default(0)
}
```

### 4.2 ติดตั้งตัวตรวจข้อมูล และสร้างโฟลเดอร์

```powershell
npm install class-validator class-transformer
New-Item -ItemType Directory -Force src/product/dto
```

ใน VS Code สร้างไฟล์ตามชื่อด้านล่าง คัดลอกโค้ดทั้งบล็อกลงแต่ละไฟล์ ไม่ต้องพิมพ์ชื่อไฟล์เป็นคำสั่ง Terminal

### 4.3 `src/product/dto/create-product.dto.ts`

```ts
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;
}
```

### 4.4 `src/product/dto/update-product.dto.ts`

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

PartialType ทำให้ส่งเฉพาะช่องที่ต้องแก้ได้ ตัวอย่างนี้ส่ง JSON โดย price/stock ต้องเป็น number ไม่ใช่ข้อความ ไม่รับ FormData

### 4.5 `src/product/product.service.ts`

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { name: dto.name, price: dto.price, stock: dto.stock },
    });
  }

  findAll() {
    return this.prisma.product.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { name: dto.name, price: dto.price, stock: dto.stock },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'ลบสินค้าแล้ว' };
  }
}
```

### 4.6 `src/product/product.controller.ts`

```ts
import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get()
  findAll() {
    return this.products.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.products.remove(id);
  }
}
```

วาง ValidationPipe เฉพาะ Product เพื่อไม่ให้กระทบ Book เดิมที่ยังไม่มี decorator ตรวจข้อมูล หากเปิด global whitelist ทันที Book fields อาจถูกตัดทิ้งเพราะไม่มี decorator

### 4.7 `src/product/product.module.ts`

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

### 4.8 ลงทะเบียนใน `src/app.module.ts`

แทนเนื้อหาด้วยตัวอย่างนี้ ซึ่งยังเก็บ BookModule:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [BookModule, ProductModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 4.9 สร้างตาราง/Client แล้วทดสอบ

หยุด Server เดิมก่อน:

```powershell
npx prisma validate
npm run prisma:push
npm run prisma:generate
npm run build
npm run start:dev
```

เปิด Terminal ใหม่:

```powershell
$productBody = @{ name = 'Pen'; price = 1500; stock = 10 } | ConvertTo-Json
$product = Invoke-RestMethod http://localhost:3000/products -Method Post -ContentType 'application/json' -Body $productBody
$productId = $product.id
Invoke-RestMethod http://localhost:3000/products
Invoke-RestMethod "http://localhost:3000/products/$productId"
$stockBody = @{ stock = 9 } | ConvertTo-Json
Invoke-RestMethod "http://localhost:3000/products/$productId" -Method Patch -ContentType 'application/json' -Body $stockBody
Invoke-RestMethod "http://localhost:3000/products/$productId" -Method Delete
Invoke-RestMethod http://localhost:3000/books
```

ผลที่ควรได้: สร้างสินค้า อ่านเจอ แก้ stock ได้ ลบได้ และหนังสือยังอ่านได้ ลอง price = -1 ควรได้ 400, id ที่ไม่มีควร 404 ส่วน `GET /products` ยังเป็น 404 ถ้ายังไม่ได้ทำบทนี้

ฝั่ง Frontend ให้เพิ่มหน้าและเมนูสินค้าแยก เรียก `/products` ใช้ name/price/stock อย่าทับหน้าหนังสือ ถ้าจะเพิ่ม CRUD ที่สามทำรูปแบบเดียวกันและ import module เพิ่ม

ตัวอย่างนี้เหมาะกับ Base เรียนรู้ ยังควรเพิ่ม tests ของพฤติกรรมจริง การตรวจช่องว่างล้วน/การรับ null และจัดการ race condition กรณีหลายคนแก้/ลบพร้อมกันเมื่อนำไปใช้งานจริง

## 5. เปลี่ยนการเชื่อม Backend / พอร์ต / prefix

### เปลี่ยนพอร์ต

`src/main.ts` ใช้ `process.env.PORT ?? 3000` ตั้ง `$env:PORT = '3002'` ก่อน run ได้ หรือแก้เลข default ในไฟล์ ต้องเปลี่ยน API base URL ที่ Frontend ด้วย

### เปลี่ยน Frontend origin (CORS)

แก้ `app.enableCors()` ใน `src/main.ts` เช่น:

```ts
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
});
```

origin ไม่มี path ต่อท้าย `http://localhost:3001` กับ `http://127.0.0.1:3001` ถือเป็นคนละ origin ตั้งตามที่เปิดจริง ถ้าใช้ cookie login ต้องออกแบบ credentials ทั้งสองฝั่งเพิ่ม CORS ไม่ใช่ระบบยืนยันตัวตน

### เพิ่ม /api หน้า routes

เพิ่มก่อน `app.listen()`:

```ts
app.setGlobalPrefix('api');
```

จากนั้น `/books` เป็น `/api/books` ต้องแก้ Frontend/คำสั่งทดสอบทุกแห่งด้วย URL static uploads จัดการแยกโดย useStaticAssets ไม่ควรเดาว่าเปลี่ยนตาม prefix ให้ตรวจ URL จริง

### ใช้ .env สำหรับค่า app

Prisma CLI v6 อ่าน .env ได้ แต่ Nest เดิมไม่ได้โหลด .env ให้ app โดยอัตโนมัติ หากจะใช้ PORT/CORS_ORIGIN ในไฟล์:

```powershell
npm install dotenv
```

เพิ่มบรรทัดแรกของ `src/main.ts`:

```ts
import 'dotenv/config';
```

ปรับ CORS เป็น:

```ts
app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001' });
```

สร้าง `.env` ที่ root ข้าง package.json:

```dotenv
PORT=3000
CORS_ORIGIN=http://localhost:3001
```

สร้าง `.env.example` เป็นแม่แบบไม่มี secret แล้ว commit เฉพาะ example และโค้ด/lockfile เครื่องใหม่ `Copy-Item .env.example .env` แล้วใส่ค่าจริง รีสตาร์ตแอปเมื่อแก้ env ค่าที่ตั้งใน Terminal เช่น $env:PORT อาจมีผลเหนือไฟล์ จึงตรวจทั้งสองที่

## เปลี่ยนฐานข้อมูล

### 6.1 SQLite ไฟล์เดิม → SQLite ไฟล์ใหม่

ใน `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./inventory.db"
}
```

path อ้างจากโฟลเดอร์ schema จึงได้ `prisma/inventory.db` เป็นข้อมูลคนละชุด รัน push + generate แล้ว restart ข้อมูลใน dev.db ไม่ย้ายมาเอง ต้องเพิ่ม ignore สำหรับไฟล์ใหม่ด้วย เช่น:

```gitignore
/prisma/*.db
/prisma/*.db-*
```

### 6.2 SQLite → PostgreSQL หรือ MySQL

ต้องมี DB server จริงก่อน ต่างจาก SQLite ที่เป็นไฟล์ ติดตั้ง [PostgreSQL](https://www.postgresql.org/download/) หรือ [MySQL](https://dev.mysql.com/downloads/) ตาม OS หรือสร้างฐานข้อมูลผ่านบริการที่ตนใช้ จด host, port, username, password, database จากผู้ให้บริการ

ถ้าใช้ PostgreSQL ในเครื่อง เปิด SQL tool ที่ติดตั้งมาด้วย เชื่อมต่อด้วยบัญชีที่มีสิทธิ์ แล้วสร้าง DB ตัวอย่าง (พิมพ์ใน SQL tool ไม่ใช่ PowerShell):

```sql
CREATE DATABASE crudbase;
```

หากยังไม่มีบัญชีแอป ให้สร้างผ่านเครื่องมือผู้ดูแล DB และให้สิทธิ์ฐานข้อมูลตามที่ต้องใช้ ตัวอย่างนี้สมมติว่ามีบัญชี `appuser` ที่เชื่อม DB ได้แล้ว บริการ cloud มักสร้าง database/user ให้ ให้ใช้ connection string ที่บริการนั้นให้โดยตรง

แก้ **เฉพาะ datasource** ใน schema เก็บ model เดิมไว้:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

สร้าง `.env` ที่ root:

```dotenv
DATABASE_URL="postgresql://appuser:YOUR_PASSWORD@localhost:5432/crudbase?schema=public"
```

ถ้า MySQL ใช้ provider `mysql` และ URL ตัวอย่าง:

```dotenv
DATABASE_URL="mysql://appuser:YOUR_PASSWORD@localhost:3306/crudbase"
```

ใช้ host/port/user/password/database จริง รหัสผ่านที่มีอักขระพิเศษต้อง URL encode ตาม [Prisma v6 connection URLs](https://www.prisma.io/docs/orm/v6/reference/connection-urls) ถ้า cloud ต้องใช้ SSL ให้ใช้พารามิเตอร์จากผู้ให้บริการ อย่าใส่ secret ใน schema หรือ commit .env

เพิ่ม `import 'dotenv/config';` ใน main.ts และติดตั้ง dotenv ตามหัวข้อก่อนหน้า เพื่อให้ runtime โหลด DATABASE_URL ได้แน่นอน แล้วรัน:

```powershell
npx prisma validate
npm run prisma:push
npm run prisma:generate
npm run build
npm run start:dev
```

**การเปลี่ยน provider ไม่ได้ย้ายข้อมูล** push สร้างตารางในปลายทาง ข้อมูลเก่าและรูปต้อง export/import เอง ตรวจชนิดข้อมูล ความสัมพันธ์ ลำดับ import (Book ก่อน Review) และค่า id ถ้ารักษา id เดิมบน PostgreSQL ต้องจัด sequence ให้เริ่มต่อจาก id สูงสุดด้วย

ถ้ามี migrations ของ provider เก่า ห้ามเอา SQL เก่าไปใช้กับ DB ใหม่ตรง ๆ ให้แยกประวัติและเริ่ม migration ของ provider ใหม่อย่างตั้งใจ ไม่ลบประวัติทีมโดยไม่สำรอง ถ้าไม่แน่ใจใช้ branch/ฐานข้อมูลทดสอบแยกก่อน

### 6.3 ถ้ามีฐานข้อมูลเดิมอยู่แล้ว

ใช้ฐานข้อมูลสำเนาทดสอบก่อน ตั้ง datasource/URL แล้ว:

```powershell
npx prisma db pull
npm run prisma:generate
```

`db pull` อ่านโครงสร้าง DB มาแก้ schema จึงต้อง commit/สำรอง schema ก่อน ไม่ได้สร้าง Controller/Service ให้ และไม่ได้รับประกันว่าชื่อ model/field จะตรงโค้ดเดิม ต้องปรับ service/DTO/API ตามจริง ห้าม push schema ตัวอย่างใส่ DB จริงที่มีข้อมูลโดยไม่ตรวจ

### 6.4 MongoDB

ไม่ใช่แค่เปลี่ยน connection URL: id แบบ Int autoincrement ในตัวอย่างต้องออกแบบใหม่ โดยทั่วไปใช้ String/ObjectId, แก้ relation และเส้นทางที่แปลง `+id`/ParseIntPipe; การทำงานบางอย่างต้อง replica set และ MongoDB ใช้ db push แทน Prisma Migrate ควรแยกเป็นงานย้ายระบบ อ่าน [Prisma MongoDB connector](https://www.prisma.io/docs/orm/v6/overview/databases/mongodb) ก่อน ไม่คัดลอก schema SQL เดิมไปใช้ตรง ๆ

## 7. db push กับ migration ต่างกันอย่างไร

| เครื่องมือ | เหมาะกับ | สิ่งที่ได้ |
| --- | --- | --- |
| prisma db push | ต้นแบบ/DB พัฒนา | ปรับตารางตรง ไม่มีไฟล์ประวัติ |
| prisma migrate dev | พัฒนาโดยเก็บประวัติ | สร้างและใช้ migration SQL |
| prisma migrate deploy | เครื่องปลายทาง/production | ใช้ migration ที่ commit แล้ว ไม่สร้างใหม่ |
| prisma generate | สร้าง client | ไม่ได้คืนข้อมูลหรือสร้างตารางด้วยตัวมันเอง |

แนวทาง Prisma v6: [db push](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/prototyping-your-schema) และ [Prisma Migrate](https://www.prisma.io/docs/orm/v6/prisma-migrate/understanding-prisma-migrate/overview)

โปรเจกต์เดิมใช้ push และยังไม่มี migration ถ้าจะเริ่มเก็บ migration ให้เริ่มใน DB พัฒนาใหม่ที่ไม่มีข้อมูลสำคัญ เช่นเปลี่ยน SQLite URL ชั่วคราวเป็น `file:./migration-dev.db` (เพิ่ม .gitignore สำหรับไฟล์นี้ด้วย) แล้ว:

```powershell
npx prisma migrate dev --name init
npm run prisma:generate
```

ถ้าใช้ DB ที่เคย db push มาแล้ว migrate dev อาจแจ้ง drift และขอ reset **อย่ารับ reset ถ้ามีข้อมูลต้องเก็บ** ใช้ DB ใหม่สำหรับทดลอง หรือทำ [baseline](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/baselining) ให้ฐานข้อมูลเดิมอย่างถูกต้องก่อน

หลังเริ่มใช้ migration แล้ว ทุกครั้งที่แก้ schema บนเครื่องพัฒนา:

```powershell
npx prisma migrate dev --name add_product
npm run prisma:generate
```

ตั้งชื่อ migration ตามงานจริง commit `prisma/migrations/` และ schema อีกเครื่องที่รับโค้ดแล้วต้องการใช้ migration ที่มีอยู่:

```powershell
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run build
```

อย่าสลับ push กับ migrate ไปมาโดยไม่จัดประวัติ และอย่าใช้ `--force-reset`, `--accept-data-loss`, `migrate reset` เป็นคำสั่งติดตั้งทั่วไป เพราะอาจทำข้อมูลหาย

## 8. เพิ่ม validation ให้ Book เดิม

1. ติดตั้ง class-validator / class-transformer
2. เพิ่ม decorator ให้ทุกฟิลด์ที่รับใน DTO ทั้ง create/update รวม optional fields เช่น `@IsOptional()`, `@IsString()`, `@IsInt()`, `@Min()` ตามกติกา
3. ใส่ ValidationPipe เฉพาะ BookController ก่อน แล้วลองทั้ง JSON และ FormData
4. FormData ให้ส่งเป็น string ใน DTO แล้ว normalize อย่างชัดเจน หรือใช้ `@Transform` แบบออกแบบไว้ หลีกเลี่ยงแปลง Boolean ด้วย `Boolean(value)` เพราะ `Boolean('false')` เป็น true
5. เมื่อทุก DTO พร้อมจึงพิจารณา global pipe ใน main.ts:

```ts
import { ValidationPipe } from '@nestjs/common';
// ภายใน bootstrap หลังสร้าง app:
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

อย่าเปิด snippet นี้ก่อนเพิ่ม decorator ให้ DTO เดิมทุกช่อง เพราะ whitelist อิง decorator ไม่ได้อิงแค่ชนิด TypeScript ทดสอบค่าที่ไม่ส่ง/ว่าง/null/เลขผิด/วันผิดด้วย

## 9. กรณีดัดแปลงอื่นที่เจอบ่อย

| ต้องการ | จุดเริ่มต้น |
| --- | --- |
| เพิ่มค้นหา | Controller รับ query เช่น @Query('q'), service ใช้ where/contains, UI ส่ง ?q=... |
| แบ่งหน้า | validate page/limit, service skip/take + count, ตกลง response ให้ Frontend เช่น { items, total } |
| เรียงข้อมูล | service orderBy ตรวจชื่อ field ที่ยอมให้เรียง อย่าส่งชื่อจาก request เข้า query โดยไม่ตรวจ |
| ตารางสัมพันธ์ เช่น Category กับ Product | เพิ่ม model/relation/FK, DTO รับ categoryId, service ตรวจว่ามี category, UI dropdown |
| เพิ่มรูปให้สินค้า | ออกแบบ imageUrl, interceptor/storage/validation และ static URL ดู Book เป็นตัวอย่าง |
| เปลี่ยนชื่อช่องอัปโหลด | FileInterceptor, ชื่อ FormData/Postman และคำอธิบายต้องตรงกัน |
| ลบรูปเก่า | service/ส่วนจัดการไฟล์ตามผล DB สำเร็จ และตรวจ path ให้อยู่ใน uploads ก่อน unlink |
| เพิ่ม login/สิทธิ์ | ออกแบบ user/password hash/session หรือ token และ guards; ไม่ใช่แค่ซ่อนปุ่มใน UI |
| ไม่ใช้ DB | เปลี่ยนชั้น service/repository; array ใน memory จะหายเมื่อ restart ไม่ใช่ที่เก็บถาวร |

## 10. รันแบบ build และนำขึ้นเครื่องปลายทาง

สำหรับทดสอบ build ในเครื่องเดิมที่ติดตั้ง/สร้าง DB แล้ว:

```powershell
npm run build
npm run start:prod
```

สำหรับเครื่องใหม่ที่ใช้รูปแบบ push เดิม ให้ติดตั้ง/generate/push ตาม README ก่อน build ส่วนระบบที่เริ่มใช้ migration แล้วใช้ migrate deploy แทน push ห้ามเริ่มด้วย start:prod ทั้งที่ยังไม่มี dist

ต้องเตรียมเพิ่มเมื่อขึ้น server จริง:

- ตั้ง environment ของ Backend (PORT, DATABASE_URL, CORS_ORIGIN ถ้าใช้) และ Frontend API URL คนละฝั่ง
- Frontend ใน browser เรียก localhost บน server ไม่ได้ ต้องใช้ URL Backend จริง หากเว็บเป็น HTTPS ให้ API เป็น HTTPS ด้วยเพื่อไม่ติด mixed content
- เก็บ SQLite/uploads บนพื้นที่ถาวร หาก hosting ล้างดิสก์เมื่อ deploy ข้อมูลอาจหาย พิจารณา DB กลางและ object storage
- มี backup/restore DB และรูปที่ทดสอบคืนได้ และ migration ที่ตรวจแล้ว
- มี process manager/บริการของ hosting เพื่อ restart แอป ตั้ง HTTPS และสิทธิ์ตามระบบจริง
- CORS ไม่ได้ห้ามเครื่องมืออื่นเรียก API ต้องมี authentication/authorization หากข้อมูลควรถูกจำกัด

## 11. ตรวจหลัง Modify ทุกครั้ง

1. build ผ่าน และเรียก list/detail ได้
2. เพิ่มรายการด้วย field ใหม่แล้วอ่านกลับยังอยู่
3. แก้บางช่องแล้วช่องอื่นยังถูกต้อง
4. ลบแล้วอ่าน id เดิมได้ 404 ตามพฤติกรรมที่ออกแบบ
5. ลองค่าผิด ช่องว่าง id ไม่มี รูปผิด/ใหญ่เกิน
6. CRUD เดิมยังใช้ได้ หน้าเว็บเรียก URL/ชื่อ field ถูกต้อง
7. restart แล้วยังมีข้อมูล และลองติดตั้งจาก Git ในโฟลเดอร์/เครื่องทดสอบใหม่
8. commit schema, source, package+lock, docs และ migrations ถ้ามี ไม่ commit DB, uploads, secret หรือ node_modules
