import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateReviewDto } from '../review/dto/create-review.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBookDto: CreateBookDto) {
    return this.prisma.book.create({
      data: createBookDto,
      include: { reviews: true },
    });
  }

  findAll() {
    return this.prisma.book.findMany({
      include: { reviews: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { reviews: true },
    });

    if (!book) {
      throw new NotFoundException(`ไม่พบหนังสือรหัส ID: ${id}`);
    }

    return book;
  }

  async findReviews(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: { reviews: true },
    });

    if (!book) {
      throw new NotFoundException(`ไม่พบหนังสือรหัส ID: ${id}`);
    }

    return book.reviews;
  }

  async createReview(id: number, createReviewDto: CreateReviewDto) {
    const rating = Number(createReviewDto.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('คะแนนรีวิวต้องอยู่ระหว่าง 1 ถึง 5');
    }

    const book = await this.prisma.book.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!book) {
      throw new NotFoundException(`ไม่พบหนังสือรหัส ID: ${id}`);
    }

    return this.prisma.review.create({
      data: {
        rating,
        content: createReviewDto.content,
        book: { connect: { id } },
      },
    });
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    await this.ensureBookExists(id);
    return this.prisma.book.update({
      where: { id },
      data: updateBookDto,
      include: { reviews: true },
    });
  }

  async remove(id: number) {
    await this.ensureBookExists(id);
    await this.prisma.book.delete({ where: { id } });
    return { message: `ลบหนังสือรหัส ID: ${id} เรียบร้อยแล้ว` };
  }

  private async ensureBookExists(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException(`ไม่พบหนังสือรหัส ID: ${id}`);
    }
  }
}
