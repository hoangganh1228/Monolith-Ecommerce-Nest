import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: string) {
    return typeof value === 'string' ? value.trim() : value;
  }
}
