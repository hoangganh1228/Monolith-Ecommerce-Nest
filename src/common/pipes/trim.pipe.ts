import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class RemoveAllSpacesPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.replace(/\s+/g, ''); // loại bỏ mọi khoảng trắng
    }
    return value;
  }
}
