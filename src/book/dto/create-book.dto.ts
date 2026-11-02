export class CreateBookDto {
  title: string;
  author: string;
  publishedYear?: number;
  publishedAt?: Date | string;
  isAvailable?: boolean;
  coverUrl?: string | null;
}
