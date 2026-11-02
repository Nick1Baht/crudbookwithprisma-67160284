import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateReviewDto } from '../review/dto/create-review.dto';

const uploadDirectory = join(process.cwd(), 'uploads');
const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const imageUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      mkdirSync(uploadDirectory, { recursive: true });
      callback(null, uploadDirectory);
    },
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _request: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!imageExtensions[file.mimetype]) {
      callback(
        new BadRequestException('รองรับเฉพาะไฟล์ JPEG, PNG, GIF และ WebP'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover', imageUploadOptions))
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.withValidatedCover(cover, () => {
      const bookData = this.normalizeBookFields(createBookDto);
      if (cover) {
        bookData.coverUrl = `/uploads/${cover.filename}`;
      }
      return this.bookService.create(bookData);
    });
  }

  @Get()
  findAll() {
    return this.bookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(+id);
  }

  @Get(':id/reviews')
  findReviews(@Param('id') id: string) {
    return this.bookService.findReviews(+id);
  }

  @Post(':id/reviews')
  createReview(
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.bookService.createReview(+id, createReviewDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('cover', imageUploadOptions))
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.withValidatedCover(cover, () => {
      const bookData = this.normalizeBookFields(updateBookDto);
      if (cover) {
        bookData.coverUrl = `/uploads/${cover.filename}`;
      }
      return this.bookService.update(+id, bookData);
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookService.remove(+id);
  }

  private normalizeBookFields<T extends CreateBookDto | UpdateBookDto>(
    bookData: T,
  ): T {
    const normalized = { ...bookData };

    if (normalized.publishedYear !== undefined) {
      const year = Number(normalized.publishedYear);
      if (!Number.isInteger(year)) {
        throw new BadRequestException('ปีที่พิมพ์ต้องเป็นจำนวนเต็ม');
      }
      normalized.publishedYear = year;
    }

    if (typeof normalized.publishedAt === 'string') {
      const publishedAt = new Date(normalized.publishedAt);
      if (Number.isNaN(publishedAt.getTime())) {
        throw new BadRequestException('วันที่พิมพ์ไม่ถูกต้อง');
      }
      normalized.publishedAt = publishedAt;
    }

    if (typeof normalized.isAvailable === 'string') {
      if (normalized.isAvailable === 'true') {
        normalized.isAvailable = true;
      } else if (normalized.isAvailable === 'false') {
        normalized.isAvailable = false;
      } else {
        throw new BadRequestException(
          'สถานะ isAvailable ต้องเป็น true หรือ false',
        );
      }
    }

    return normalized;
  }

  private async withValidatedCover<T>(
    cover: Express.Multer.File | undefined,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      if (cover && !(await this.hasValidImageSignature(cover))) {
        throw new BadRequestException('เนื้อหาไฟล์ไม่ตรงกับชนิดรูปภาพที่ระบุ');
      }
      return await operation();
    } catch (error) {
      if (cover) {
        await unlink(cover.path);
      }
      throw error;
    }
  }

  private async hasValidImageSignature(
    cover: Express.Multer.File,
  ): Promise<boolean> {
    const buffer = await readFile(cover.path);
    switch (cover.mimetype) {
      case 'image/jpeg':
        return (
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        );
      case 'image/png':
        return buffer
          .subarray(0, 8)
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          );
      case 'image/gif':
        return buffer.subarray(0, 6).toString('ascii').startsWith('GIF8');
      case 'image/webp':
        return (
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      default:
        return false;
    }
  }
}
