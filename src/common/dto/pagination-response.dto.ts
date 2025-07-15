export class PaginationMetaDto  {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class PaginationResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}