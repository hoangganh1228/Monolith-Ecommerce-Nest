import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MethodNotAllowedException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Type,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BaseQueryDto } from './base-query.dto';
import { BaseEntity } from './base.entity';
import { BaseService } from './base.service';
import { DeepPartial } from 'typeorm';
import { PaginationResponseDto } from '../dto/pagination-response.dto';

export interface ControllerMethods {
  create?: boolean;
  findAll?: boolean;
  findOne?: boolean;
  update?: boolean;
  remove?: boolean;
}

function createValidationPipe<T>(dtoClass: Type<T>): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    expectedType: dtoClass,
    forbidNonWhitelisted: true,
    validateCustomDecorators: true,
  });
}

function ensureMethodAllowed(enabled: boolean | undefined): void {
  if (!enabled) throw new MethodNotAllowedException();
}

export function createBaseController<
  T extends BaseEntity,
  CreateDto extends DeepPartial<T>,
  UpdateDto extends DeepPartial<T>,
  QueryDto extends BaseQueryDto = BaseQueryDto
>(
  createDtoClass: Type<CreateDto>,
  updateDtoClass: Type<UpdateDto>,
  queryDtoClass: Type<QueryDto> = BaseQueryDto as any,
  enabledMethods: ControllerMethods = {
    create: true,
    findAll: true,
    findOne: true,
    update: true,
    remove: true,
  },
) {
  abstract class BaseController {
    constructor(protected readonly service: BaseService<T>) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(createValidationPipe(createDtoClass))
    async create(@Body() createDto: CreateDto) {
      ensureMethodAllowed(enabledMethods.create);
      return this.service.create(createDto);
    }

    @Get()
    @UsePipes(createValidationPipe(queryDtoClass))
    async findAll(@Query() query: QueryDto): Promise<PaginationResponseDto<T>> {
      ensureMethodAllowed(enabledMethods.findAll);
      return this.service.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<T> {
      ensureMethodAllowed(enabledMethods.findOne);
      return this.service.findOne(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @UsePipes(createValidationPipe(updateDtoClass))
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateDto,
    ) {
      ensureMethodAllowed(enabledMethods.update);
      return this.service.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      ensureMethodAllowed(enabledMethods.remove);
      return this.service.remove(id);
    }
  }

  return BaseController as Type<any>;
}
