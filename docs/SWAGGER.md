# คู่มือ Swagger: ทดลอง API แนบไฟล์ และเจนโค้ดเรียก API

[กลับ README](../README.md) · [เพิ่ม CRUD/เปลี่ยน DB](MODIFY.md) · [เชื่อม Frontend](FRONTEND.md)

**บทนี้เป็นวิธีทำเท่านั้น ยังไม่ได้ติดตั้ง Swagger หรือแก้โค้ดแอปไว้ให้** ทำตามเมื่อพร้อมใช้งาน คำสั่งใช้ npm/npx ปกติสำหรับเครื่องแล็บ ถ้า Windows บล็อก npm.ps1 ให้ใช้ npm.cmd/npx.cmd ตาม README

## 1. Swagger ช่วยอะไร และเจนโค้ดแบบไหน

| สิ่งที่ต้องการ | ใช้อะไร | สิ่งที่ยังต้องเขียนเอง |
| --- | --- | --- |
| มีหน้าอ่านและลองเรียก API | Swagger UI | endpoint, service, DB ต้องมีอยู่จริงก่อน |
| มีไฟล์บอกรายละเอียด API | OpenAPI JSON | ระบุ field/request/response ให้ตรงโค้ด |
| สร้างโค้ดที่ Frontend ใช้เรียก API | OpenAPI Generator | ฟอร์ม ตาราง ปุ่ม state และการแสดง error |
| สร้างโครง CRUD ฝั่ง Nest | Nest CLI หรือคัดลอกตามคู่มือ Modify | query Prisma, validation, เงื่อนไข และ DB |

ลำดับที่ใช้ในคู่มือนี้:

```text
เขียน Backend CRUD → ใส่ Swagger decorators → ได้ OpenAPI JSON
                                             ↓
                            Generator สร้างโค้ดเรียก API ให้ Frontend
```

Swagger ไม่ได้สร้างข้อมูลใน DB และการเขียนคำอธิบายว่า price เป็น number ไม่ได้ตรวจข้อมูลจริงให้ ต้องมี validation แยกตามคู่มือ Modify

## 2. ติดตั้ง Swagger ใน Nest เดิม

เปิด Terminal ใน root Backend ที่มี package.json หยุด Server ก่อน แล้วรัน:

```powershell
npm install @nestjs/swagger@^11
```

ใช้สาย 11 ให้ตรง Nest 11 ในโปรเจกต์นี้ คำสั่งจะปรับ package.json และ package-lock.json ต้องเก็บทั้งสองไฟล์ใน Git เครื่องอื่นจึงใช้ npm ci ลงตามได้ ไม่ต้องติดตั้ง Swagger แบบ global และไม่ต้องสร้าง Frontend เพื่อเปิด Swagger UI

### 2.1 แก้ src/main.ts

ตัวอย่างเต็มสำหรับโค้ดเดิม ถ้าคุณแก้ CORS/port/env เพิ่มไปแล้ว ให้ผสานส่วน Swagger เข้าไฟล์ของคุณ อย่าทับค่าที่ใช้งานอยู่:

```ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: 'http://localhost:3001' });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const config = new DocumentBuilder()
    .setTitle('Books CRUD API')
    .setDescription('API หนังสือและรีวิว')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/docs-json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

รัน:

```powershell
npm run build
npm run start:dev
```

| URL | ใช้ทำอะไร |
| --- | --- |
| http://localhost:3000/docs | หน้า Swagger UI ใช้กดลอง API |
| http://localhost:3000/docs-json | ไฟล์ OpenAPI JSON สำหรับ generator |
| http://localhost:3000/books | API หนังสือจริง |

`/docs` ไม่ใช่หน้าเว็บ Frontend พอร์ต 3001 และไม่ได้เปลี่ยน API เป็น `/docs/books` ถ้าเปลี่ยน PORT ให้เปลี่ยน URL ทั้งหมดตามพอร์ตจริง

## 3. ทำให้ Swagger เห็นช่องข้อมูล ไม่ใช่แค่ชื่อ endpoint

### 3.1 แก้ src/book/dto/create-book.dto.ts

แทนเนื้อหาเดิมด้วย:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'เรียนรู้ CRUD' })
  title: string;

  @ApiProperty({ example: 'Student' })
  author: string;

  @ApiPropertyOptional({ type: 'integer', example: 2026 })
  publishedYear?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt?: Date | string;

  @ApiPropertyOptional({ example: true })
  isAvailable?: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  coverUrl?: string | null;
}
```

`ApiProperty` คือช่องที่ต้องส่ง ส่วน `ApiPropertyOptional` คือไม่บังคับในเอกสาร **ไม่ใช่ตัวตรวจ request** ถ้าเพิ่ม field ใน schema ต้องตามแก้ DTO และ Swagger ด้วย

### 3.2 แก้ src/book/dto/update-book.dto.ts

```ts
import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {}
```

ใช้ PartialType จาก **@nestjs/swagger** ใน DTO ที่ต้องแสดงใน Swagger เพื่อคัดลอก metadata และทำให้ทุกช่องเป็น optional สำหรับ PATCH ถ้าเดิมใช้ @nestjs/mapped-types ให้เปลี่ยน import ใน DTO นี้

## 4. ตั้งค่าแนบไฟล์ให้มีปุ่ม Choose File

ต้องมีทั้ง **โค้ดรับไฟล์จริง** และ **คำอธิบาย Swagger** จึงใช้งานได้ โค้ด Book เดิมมี FileInterceptor, diskStorage, ตรวจรูป และบันทึก coverUrl แล้ว หัวข้อนี้เพิ่มคำอธิบายเพื่อให้ลองผ่าน Swagger

### 4.1 สร้าง src/book/dto/book-upload.dto.ts

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';
import { UpdateBookDto } from './update-book.dto';

export class CreateBookUploadDto extends CreateBookDto {
  @ApiPropertyOptional({
    type: String,
    format: 'binary',
    description: 'รูป JPEG/PNG/GIF/WebP ไม่เกิน 5 MB',
  })
  cover?: string;
}

export class UpdateBookUploadDto extends UpdateBookDto {
  @ApiPropertyOptional({
    type: String,
    format: 'binary',
    description: 'แนบรูปใหม่ถ้าต้องการเปลี่ยนปก',
  })
  cover?: string;
}
```

cover ใน DTO นี้ใช้บอก Swagger ว่าเป็นไฟล์ ส่วนไฟล์จริงเข้าผ่าน `@UploadedFile()` ไม่ได้เป็น string เก็บลง DB และ **อย่าเปลี่ยน @Body ของ controller เดิมเป็น upload DTO แล้วส่งทั้งก้อนเข้า Prisma** เพราะตาราง Book ไม่มีคอลัมน์ cover

### 4.2 เพิ่ม import ใน src/book/book.controller.ts

```ts
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBookUploadDto, UpdateBookUploadDto } from './dto/book-upload.dto';
```

เพิ่ม tag ก่อน class โดยเก็บ @Controller เดิม:

```ts
@ApiTags('Books')
@Controller('books')
export class BookController {
  // เก็บ constructor และทุก method เดิม
}
```

บล็อกนี้แสดงเฉพาะตำแหน่ง decorator ไม่ใช่ให้แทนทั้ง controller แล้วลบ method เดิม

เพิ่ม decorator เหนือ method create เดิม:

```ts
@Post()
@ApiOperation({ operationId: 'createBook', summary: 'เพิ่มหนังสือและรูปปก' })
@ApiConsumes('multipart/form-data')
@ApiBody({ type: CreateBookUploadDto })
@UseInterceptors(FileInterceptor('cover', imageUploadOptions))
```

เพิ่มเหนือ method update เดิม:

```ts
@Patch(':id')
@ApiOperation({ operationId: 'updateBook', summary: 'แก้หนังสือและเปลี่ยนปก' })
@ApiConsumes('multipart/form-data')
@ApiBody({ type: UpdateBookUploadDto })
@UseInterceptors(FileInterceptor('cover', imageUploadOptions))
```

เก็บ method body, normalizeBookFields, withValidatedCover และ imageUploadOptions เดิมไว้ ไม่เพิ่ม @Post/@Patch/@UseInterceptors ซ้ำสองชุด

ตัวอย่างนี้ **ประกาศ POST/PATCH ใน Swagger เป็น multipart/form-data** เพื่อให้ generator สร้างการส่งไฟล์ได้ API เดิมยังรับ JSON ได้ แต่ตัวอย่าง OpenAPI นี้ไม่ได้ประกาศ JSON เป็นอีกตัวเลือก อย่าเปลี่ยน ApiConsumes เป็น application/json แล้วคาดว่าจะส่งไฟล์ได้

### 4.3 ทดลองแนบรูปทีละขั้น

1. รีสตาร์ต Backend เปิด `http://localhost:3000/docs`
2. ขยายหมวด Books → POST /books → กด **Try it out**
3. กรอก title และ author
4. เลือกชนิด request เป็น multipart/form-data ถ้ามีตัวเลือก
5. ช่อง cover กด **Choose File** แล้วเลือกรูปจริงไม่เกิน 5 MB
6. ช่อง optional ที่ไม่ใช้ให้เอา **Send empty value** ออกถ้ามี เช่น publishedAt, publishedYear, coverUrl เพื่อไม่ส่งข้อความว่างเข้า Backend
7. กด **Execute** จะสร้างข้อมูลจริง ไม่ใช่การจำลอง
8. ดู Server response ควรได้ 201 และ id/coverUrl จด id นี้ไว้
9. ถ้า coverUrl คือ `/uploads/abc.jpg` เปิด `http://localhost:3000/uploads/abc.jpg` เพื่อตรวจรูป
10. PATCH /books/{id} → Try it out → ใส่ id จริง → กรอกเฉพาะช่องที่จะเปลี่ยน/เลือกรูปใหม่ → Execute ควรได้ 200

ไม่เลือกรูปตอน PATCH คือใช้รูปเดิม การลบหนังสือไม่ได้ลบไฟล์รูปเก่าให้อัตโนมัติ โค้ดเดิมรองรับ **รูปเดียวต่อ request** ชื่อ cover ไม่ใช่ file/files และยังไม่รับ PDF/Word การเพิ่มนามสกุลใน Swagger อย่างเดียวไม่ได้ทำให้ Backend รับได้

### 4.4 เทียบ Swagger กับ Frontend

```js
const data = new FormData();
data.append('title', 'เรียนรู้ CRUD');
data.append('author', 'Student');
// imageFile มาจาก input.files[0] ถ้าไม่ได้เลือกรูปก็ไม่ต้อง append
if (imageFile) data.append('cover', imageFile);

const response = await fetch('http://localhost:3000/books', {
  method: 'POST',
  body: data,
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const book = await response.json();
```

ห้ามใส่ Content-Type เอง browser ต้องสร้าง multipart boundary ให้ Text fields ใน FormData เป็นข้อความทั้งหมด โค้ด Book เดิมจึงมี normalizeBookFields แปลงปี/boolean/วันที่ก่อนส่ง DB ดูหน้า HTML เต็มในคู่มือ Frontend

## 5. ระบุ response และชื่อ method ก่อนเจน client

ถ้าไม่บอก response generator อาจได้ method ที่คืน void/unknown แม้ API ส่งข้อมูลจริง ต้องระบุทั้ง **ฟิลด์ผลลัพธ์** และ **response ของแต่ละ route**

### 5.1 เพิ่ม decorator ให้ entity ที่มีอยู่

แก้ `src/review/entities/review.entity.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class Review {
  @ApiProperty({ type: 'integer' })
  id: number;
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 5 })
  rating: number;
  @ApiProperty()
  content: string;
  @ApiProperty({ type: 'integer' })
  bookId: number;
}
```

แก้ `src/book/entities/book.entity.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../../review/entities/review.entity';

export class Book {
  @ApiProperty({ type: 'integer' })
  id: number;
  @ApiProperty()
  title: string;
  @ApiProperty()
  author: string;
  @ApiProperty({ type: 'integer', nullable: true })
  publishedYear?: number;
  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt?: Date | string;
  @ApiProperty()
  isAvailable: boolean;
  @ApiProperty({ type: String, nullable: true })
  coverUrl?: string | null;
  @ApiProperty({ type: () => [Review] })
  reviews?: Review[];
}
```

entity ที่นี่เป็นคำอธิบายผลลัพธ์ ไม่ได้สร้างตาราง DB

### 5.2 เพิ่ม metadata ใน BookController

เพิ่ม import โดยรวมกับ import Swagger จากหัวข้อก่อน ไม่ประกาศชื่อ import ซ้ำ:

```ts
import {
  ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam,
} from '@nestjs/swagger';
import { Book } from './entities/book.entity';
import { Review } from '../review/entities/review.entity';
```

ใช้ตารางนี้เพิ่ม decorator เหนือ method เดิม เก็บ handler เดิมไว้ และถ้าใส่ ApiOperation ไปแล้วให้แก้ตัวเดิม ไม่เพิ่มซ้ำ:

| Route | operationId ที่ใช้ | Response decorator |
| --- | --- | --- |
| GET /books | listBooks | @ApiOkResponse({ type: [Book] }) |
| GET /books/:id | getBook | @ApiOkResponse({ type: Book }) |
| POST /books | createBook | @ApiCreatedResponse({ type: Book }) |
| PATCH /books/:id | updateBook | @ApiOkResponse({ type: Book }) |
| GET /books/:id/reviews | listBookReviews | @ApiOkResponse({ type: [Review] }) |
| POST /books/:id/reviews | createBookReview | @ApiCreatedResponse({ type: Review }) |

ตัวอย่าง method GET ที่แก้แล้ว:

```ts
@Get()
@ApiOperation({ operationId: 'listBooks', summary: 'อ่านหนังสือทั้งหมด' })
@ApiOkResponse({ type: [Book] })
findAll() {
  return this.bookService.findAll();
}
```

ตัวอย่าง GET ตาม id:

```ts
@Get(':id')
@ApiOperation({ operationId: 'getBook', summary: 'อ่านหนังสือหนึ่งเล่ม' })
@ApiParam({ name: 'id', type: 'integer', example: 1 })
@ApiOkResponse({ type: Book })
@ApiNotFoundResponse({ description: 'ไม่พบหนังสือ' })
findOne(@Param('id') id: string) {
  return this.bookService.findOne(+id);
}
```

ทุก route ที่มี `:id` รวม PATCH/DELETE/รีวิว ให้ใส่ ApiParam แบบเดียวกัน เพื่อให้ client รับ id เป็น number ส่วน DELETE เพิ่ม:

```ts
@ApiOperation({ operationId: 'deleteBook', summary: 'ลบหนังสือ' })
@ApiOkResponse({
  schema: {
    type: 'object',
    required: ['message'],
    properties: { message: { type: 'string' } },
  },
})
```

ถ้าจะใช้รีวิว ให้เพิ่ม ApiProperty ใน `src/review/dto/create-review.dto.ts` สำหรับ rating/content เช่นเดียวกับหัวข้อ 3 ด้วย operationId ต้องไม่ซ้ำกันทั้งระบบ เพราะ generator ใช้ตั้งชื่อ method

## 6. เพิ่ม API CRUD ใหม่แล้วให้ขึ้น Swagger

### 6.1 สร้าง Backend CRUD ให้ทำงานก่อน

ทำตาม [Modify หัวข้อ 4](MODIFY.md) เพื่อเพิ่ม Product model/DTO/service/controller/module และ import ProductModule ใน AppModule ให้ `/products` เรียกได้จริงก่อน Swagger ไม่สร้าง Prisma query ให้

ถ้าต้องการให้ Nest CLI สร้าง **โครงไฟล์** แทนการสร้างมือ ใช้:

```powershell
npx nest generate resource product
```

เลือก REST API และตอบ Yes สำหรับ CRUD entry points แล้วเขียน Prisma service/DTO/schema ต่อเอง **เลือกวิธีนี้หรือวิธีคัดลอกไฟล์ใน Modify อย่างใดอย่างหนึ่ง** อย่ารันทับชุด product ที่ทำไว้แล้ว โค้ดที่ CLI สร้างยังเป็นโครง ไม่ได้จัดเก็บ DB สำเร็จทันที

### 6.2 เพิ่มคำอธิบาย Product DTO

ใน CreateProductDto ของคู่มือ Modify ให้เพิ่ม ApiProperty คู่กับ validation เดิม ตัวอย่าง field price:

```ts
// import เพิ่มจาก @nestjs/swagger
import { ApiProperty } from '@nestjs/swagger';

// ภายใน class เดิม เก็บ @IsInt/@Min และฟิลด์อื่นไว้
@ApiProperty({ type: 'integer', minimum: 0, example: 1500, description: 'ราคาเป็นสตางค์' })
@IsInt()
@Min(0)
price: number;
```

ทำเช่นเดียวกันกับ name (String) และ stock (integer) แล้วเปลี่ยน UpdateProductDto ให้ใช้ PartialType จาก @nestjs/swagger แทน @nestjs/mapped-types เพื่อให้ Swagger รู้ว่าฟิลด์แก้ไขเป็น optional

### 6.3 เพิ่ม tag/operation/response ของ Product

- ใส่ `@ApiTags('Products')` เหนือ ProductController
- ตั้ง operationId แยกเป็น listProducts, getProduct, createProduct, updateProduct, deleteProduct
- สร้าง Product response class ที่มี ApiProperty ครบ id/name/price/stock แล้วระบุ ApiOkResponse/ApiCreatedResponse เหมือน Book
- ระบุ ApiParam สำหรับ id เป็น integer
- Product ตัวอย่างเดิมรับ JSON ไม่ต้องใส่ ApiConsumes multipart ถ้ายังไม่ได้ทำระบบรับไฟล์
- รีสตาร์ตแอป เปิด /docs ควรมีทั้ง Books และ Products ไม่ต้องตั้ง SwaggerModule ใหม่อีกชุด

### 6.4 ถ้าต้องการแนบรูปให้ CRUD ใหม่ด้วย

การมีปุ่ม Choose File อย่างเดียวไม่พอ ต้องทำทั้งสายดังนี้:

1. เพิ่มคอลัมน์เช่น imageUrl ใน Product schema แล้วปรับ DB/generate
2. ออกแบบชื่อช่องไฟล์ เช่น image ให้ตรงกันทั้ง Swagger, FileInterceptor, Frontend
3. เพิ่ม interceptor/storage/ขนาด/ชนิดไฟล์และตรวจเนื้อหาเหมือน Book เดิม อย่าคัดลอกแค่คำอธิบาย Swagger
4. รับไฟล์ผ่าน UploadedFile แยกจาก DTO; บันทึกเฉพาะ URL ใน DB ไม่ส่ง object ไฟล์เข้า Prisma
5. แปลง price/stock จากข้อความเป็น number ก่อน validate/บันทึก เพราะ FormData ส่งเป็น string โดยเฉพาะ ProductController ของคู่มือ Modify มี ValidationPipe อยู่ ต้องวางการแปลงใน DTO/pipe ก่อนการตรวจ IsInt ไม่ใช่รอแปลงใน service
6. สร้าง Product upload DTO ที่มี field image เป็น `type: String, format: 'binary'`
7. เพิ่ม ApiConsumes multipart และ ApiBody upload DTO เหมือน Book
8. ทดสอบเพิ่มโดยมี/ไม่มีรูป เปลี่ยนรูป ข้อมูลผิด รูปใหญ่/ผิดชนิด และกำหนดว่าจะลบไฟล์เก่าเมื่อใด

ถ้าต้องการหลายไฟล์ ต้องใช้ FilesInterceptor/FileFieldsInterceptor และ UploadedFiles พร้อม schema array/ชื่อ field ที่ตรงกัน API เดิมของ Book ยังรับแค่ cover เดียว ส่วน PDF/Word ต้องออกแบบตัวตรวจและวิธีให้ดาวน์โหลดต่างจากรูป ไม่ใช่เปิดให้ทุกไฟล์ผ่าน

## 7. ใช้ Swagger เจนโค้ดเรียก API ให้ Frontend

ทำหัวข้อ 2–5 ให้ครบก่อน เพื่อให้ไฟล์ OpenAPI มีชื่อ method, request, response และไฟล์ binary ถูกต้อง ตัวอย่างนี้ใช้ **OpenAPI Generator → typescript-fetch** เหมาะกับ Frontend TypeScript เช่น Next.js/React ไม่ได้สร้างหน้าเว็บให้

### 7.1 เครื่องมือที่ต้องมี

- Node/npm ตาม README
- Java JDK 17 และตั้ง PATH ให้ใช้ `java` ได้ เช่นติดตั้งจาก [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=17)
- อินเทอร์เน็ตตอนติดตั้ง npm wrapper และดาวน์โหลด generator JAR ครั้งแรก

ตรวจใน Terminal ใหม่หลังลง Java:

```powershell
java -version
```

ถ้าเครื่องแล็บลงไม่ได้ให้ขอผู้ดูแลติดตั้ง หรือเจนโค้ดจากอีกเครื่องแล้ว commit ผลลัพธ์มา เครื่องที่แค่ใช้ไฟล์ client ที่เจนแล้วไม่จำเป็นต้องมี Java เว้นแต่จะเจนใหม่

### 7.2 ติดตั้ง generator ในโปรเจกต์ Frontend

เปิด Terminal ที่ **root Frontend** คนละโฟลเดอร์กับ Backend มี package.json ของ Frontend เอง แล้ว:

```powershell
npm install -D @openapitools/openapi-generator-cli
npx openapi-generator-cli version-manager set 7.12.0
```

ตัวอย่างล็อก engine เป็น 7.12.0 เพื่อให้ข้ามเครื่องใช้รุ่นเดียวกัน เก็บ package.json, package-lock.json และ openapitools.json ที่สร้างใน Frontend ไว้ใน Git การอัปเดตรุ่นในอนาคตควรเจนใหม่และตรวจผลต่างก่อนใช้

### 7.3 ดาวน์โหลด JSON และเจน client

เปิด Backend ที่พอร์ต 3000 ค้างไว้ก่อน แล้วใน Terminal ฝั่ง Frontend:

```powershell
New-Item -ItemType Directory -Force openapi
Invoke-WebRequest http://localhost:3000/docs-json -OutFile openapi/backend.json
npx openapi-generator-cli validate -i openapi/backend.json
npx openapi-generator-cli generate -i openapi/backend.json -g typescript-fetch -o src/generated/api --additional-properties=useSingleRequestParameter=true
```

คำสั่ง generate เป็นหนึ่งบรรทัด กำหนด `src/generated/api` เป็นโฟลเดอร์ที่ให้เครื่องมือสร้างทั้งหมด ไม่เขียนไฟล์มือปนในนี้และไม่ตั้ง output เป็น src ทั้งก้อน การเจนซ้ำอาจทับไฟล์เดิมและไม่ได้ลบ endpoint เก่าทุกไฟล์ให้เสมอ ถ้าต้องเริ่มใหม่ให้ตรวจโฟลเดอร์ output ก่อนลบเฉพาะไฟล์ generated

ผลที่ควรได้มี runtime, models และ apis เช่น `src/generated/api/apis/BooksApi.ts` ชื่ออิง tag Books และ operationId ใน Backend

### 7.4 เรียก client ที่เจนแล้ว

สร้างไฟล์ที่เขียนเองอยู่นอก generated เช่น `src/lib/books-api.ts`:

```ts
import { BooksApi, Configuration } from '../generated/api';

export const booksApi = new BooksApi(new Configuration({
  basePath: 'http://localhost:3000',
}));
```

ถ้าใช้ env ให้เปลี่ยน basePath เป็นตัวแปรของ framework ตามคู่มือ Frontend (`NEXT_PUBLIC_API_URL` สำหรับ Next หรือ `VITE_API_URL` สำหรับ Vite) ไม่ใช้ URL /docs และไม่ใส่ /books ซ้ำใน basePath

ตัวอย่างเรียกจาก event handler ฝั่ง browser หลังทำ metadata ตามคู่มือ:

```ts
const books = await booksApi.listBooks();
const oneBook = await booksApi.getBook({ id: 1 });

// imageFile คือ File จาก input.files[0] ใช้เฉพาะฝั่ง browser
const created = await booksApi.createBook({
  title: 'เรียนรู้ CRUD',
  author: 'Student',
  publishedYear: 2026,
  isAvailable: true,
  cover: imageFile,
});

await booksApi.updateBook({ id: created.id, title: 'ชื่อที่แก้ไข' });
// บรรทัดนี้ลบข้อมูลจริง หากต้องการเก็บให้ข้าม
await booksApi.deleteBook({ id: created.id });
```

ถ้าไม่ได้เลือกรูป ให้ไม่ส่ง cover หรือส่ง undefined ไม่ใส่ path ไฟล์เป็นข้อความ เช่น `C:\Pictures\a.jpg` เพราะ browser ต้องส่ง File/Blob จริง generator จะจัด FormData ให้ตาม schema binary ไม่ต้อง stringify รูปเอง

ชื่อ method/parameter อาจต่างเมื่อคุณเปลี่ยน operationId/tag หรือรุ่น generator **เปิด BooksApi.ts ดู interface และ signature ที่สร้างจริงเป็นหลัก** หากยังไม่ได้ทำหัวข้อ response method อาจคืน void จึงใช้ created.id ไม่ได้ ให้แก้ Swagger response แล้วเจนใหม่ ไม่แก้ generated ให้หลอกชนิด

โค้ดตัวอย่างย่อเพื่อแสดงรูปแบบ ต้องครอบ try/catch ใน UI เพื่อแจ้ง error และ disable ปุ่มขณะส่ง สำหรับ Next.js โค้ดที่ใช้ File/event/state ต้องอยู่ใน client component; อย่าใช้ input.files ใน server component

### 7.5 เพิ่ม CRUD ใหม่แล้วต้องเจน client ใหม่

1. เพิ่ม Product Backend และ Swagger ตามหัวข้อ 6
2. build/restart Backend ตรวจ /docs ว่ามี Products และ schema/response ถูกต้อง
3. ดาวน์โหลด docs-json ใหม่และรัน validate/generate ใน Frontend ด้วยคำสั่งเดิม
4. ควรมี ProductsApi ตาม tag ใหม่ เปิดดูชื่อ method จริง
5. สร้าง wrapper ที่เขียนเอง แล้วทำหน้าสินค้าเรียก client ใหม่นี้
6. ตรวจ diff ของ generated และทดสอบทั้ง Books/Products ก่อน commit

generator ไม่รู้ว่าคุณแก้ schema ใน DB จนกว่าคุณจะแก้ API/Swagger และส่ง JSON ฉบับใหม่ให้มัน ถ้าใช้ไฟล์ JSON เก่า ก็จะได้ client เก่า

## 8. ถ้ามีคนส่งไฟล์ Swagger มาให้แล้ว

| สิ่งที่ได้รับ | ทำต่ออย่างไร |
| --- | --- |
| URL หน้า /docs | เปิดทดลอง API; ขอ/หา URL JSON ที่ระบบนั้นตั้งจริง ไม่เดาว่าทุกระบบใช้ /docs-json |
| ไฟล์ openapi.json หรือ YAML | ใช้เป็น input ให้ generator ได้ ไม่ต้องเปิด Swagger server ในเครื่องเพื่อเจนจากไฟล์ |
| โฟลเดอร์ client ที่เจนแล้ว | ดู README/package.json ของ client ติดตั้ง dependency ตามที่ใช้ ตั้ง base URL แล้ว import |
| โค้ด Nest Controller/Service | เป็น Backend ต้องติดตั้ง dependency/DB และรัน ไม่ใช่ client สำหรับเอาไปวางในหน้าเว็บ |

ไฟล์ JSON ไม่ใช่ Server รันไม่ได้ด้วย npm start และไม่ได้มีข้อมูล DB อยู่ในนั้น ถ้าได้รับ spec ของคนอื่นแต่ไม่มี Backend จริง client ที่เจนได้ก็ยังไม่มีปลายทางให้เรียกจนกว่าจะเปิด Server ตามสัญญานั้น

มี generator สำหรับสร้างโครง server จาก spec ได้เช่นกัน แต่ยังต้องเขียนธุรกิจ/DB/สิทธิ์เอง สำหรับ Base นี้ใช้ Nest CRUD ตาม Modify แล้วให้ Swagger สะท้อนโค้ดที่รันจริงจะติดตามง่ายกว่า อย่าเอาโครง server ที่เจนใหม่มาทับ src เดิมโดยตรง

## 9. ย้ายเครื่องผ่าน Git

| รายการ | สิ่งที่ต้องเก็บ/ทำ |
| --- | --- |
| Backend | commit source ที่เพิ่ม Swagger + package.json + lockfile |
| เครื่อง Backend ใหม่ | npm ci → prisma:generate → prisma:push (หรือ migration ตามทีม) → start:dev |
| Frontend | commit wrapper/UI + generator config + package/lock และ spec ถ้าต้องการเก็บ snapshot |
| generated client | เลือกเก็บใน Git เพื่อให้แล็บใช้ง่าย หรือกำหนดขั้นตอนเจนก่อน build ให้ชัด |
| เครื่องที่ต้องเจนใหม่ | มี Java + npm ci และใช้ openapitools.json รุ่นเดียวกัน |
| .env / DB / uploads | ทำตาม README ไม่ได้ตาม Git มาอัตโนมัติ |

ถ้า commit generated แล้ว เครื่องแล็บแค่ npm ci และรัน Frontend ตาม scripts ได้ ไม่ต้องเจนทุกครั้งที่เปิดแอป แต่เมื่อ API เปลี่ยนต้องอัปเดต client ให้ตรงและ commit ชุดใหม่

## 10. ปัญหาที่พบบ่อย

| อาการ | ตรวจ/แก้ |
| --- | --- |
| /docs เป็น 404 | ยังไม่ได้ทำ setup ใน main.ts หรือรันโค้ดเก่า/ผิดพอร์ต |
| Swagger มี route แต่ body ว่าง | DTO ยังไม่มี ApiProperty หรือ ApiBody ไม่ได้อ้าง DTO ที่ถูกต้อง |
| ไม่มี Choose File | ต้องเป็น multipart/form-data และ field มี format binary |
| Unexpected field | ชื่อใน Swagger/FormData ไม่ตรง FileInterceptor เช่น cover กับ file |
| วันผิด/ปีผิดทั้งที่ไม่ได้กรอก | ปิด Send empty value สำหรับ optional; ไม่ส่งข้อความว่าง |
| รูปผิดชนิด/413 | ตรวจชนิดไฟล์จริงและขนาดไม่เกิน 5 MB |
| Swagger ส่งได้แต่ Frontend ไม่ได้ | ตรวจ CORS, API URL และชนิด body Swagger อยู่ origin เดียวกับ Backend จึงอาจไม่เจอ CORS แบบ Frontend |
| Java not found / UnsupportedClassVersionError | ตรวจ java -version และ PATH ใช้ JDK ที่เหมาะสมแล้วเปิด Terminal ใหม่ |
| Generator โหลด JAR ไม่ได้ | ตรวจ network/proxy ของแล็บ ต้องดาวน์โหลดอีกส่วนแม้ npm install ผ่านแล้ว |
| Spec validate ไม่ผ่าน | อ่านชื่อ path/schema ที่แจ้ง แก้ metadata Backend แล้วดาวน์โหลด JSON ใหม่ |
| Method คืน void | ต้องระบุ ApiOkResponse/ApiCreatedResponse พร้อม schema แล้วเจนใหม่ |
| ชื่อ method ไม่เหมือนตัวอย่าง | ตรวจ operationId/tag และ interface ที่เจนจริง อย่าเดาชื่อ |
| เพิ่ม CRUD แล้วไม่ขึ้น Swagger | import module ใน AppModule, restart และตรวจ Controller ถูกลงทะเบียน |
| Client ไม่มี CRUD ใหม่ | ใช้ JSON เก่า หรือยังไม่ได้เจนใหม่ |
| ส่งไฟล์กลายเป็นข้อความ | schema ไม่ใช่ binary หรือใช้ JSON แทน FormData; แก้ spec แล้วเจนใหม่ |
| แก้ generated แล้วหาย | ย้าย customization ไว้ใน wrapper นอก output folder |

## เอกสารอ้างอิง

- [Nest Swagger setup](https://docs.nestjs.com/openapi/introduction) สำหรับขั้นตอนเปิด UI/JSON
- [Nest Swagger types](https://docs.nestjs.com/openapi/types-and-parameters) สำหรับ DTO/schema
- [Nest Swagger operations](https://docs.nestjs.com/openapi/operations) สำหรับ response และ upload
- [OpenAPI Generator installation](https://openapi-generator.tech/docs/installation/) สำหรับ CLI และ Java wrapper
- [typescript-fetch generator](https://openapi-generator.tech/docs/generators/typescript-fetch/) สำหรับ client/options

ตัวอย่างในบทนี้เป็นแนวทางให้ติดตั้งและตรวจผลบนเครื่องที่จะใช้จริง ยังไม่ได้ติดตั้ง Swagger หรือรันทดสอบ generator ใน repository นี้
