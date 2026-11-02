import { Review } from '../../review/entities/review.entity';

export class Book {
  id: number;
  title: string;
  author: string;
  publishedYear?: number;
  publishedAt?: Date | string;
  isAvailable: boolean;
  coverUrl?: string | null;
  reviews?: Review[];
}

