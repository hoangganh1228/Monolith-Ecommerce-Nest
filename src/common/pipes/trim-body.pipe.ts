import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TrimBodyPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (typeof value[key] === 'string') {
          value[key] = value[key].trim();
        }
      }
    }
    return value;
  }
}
