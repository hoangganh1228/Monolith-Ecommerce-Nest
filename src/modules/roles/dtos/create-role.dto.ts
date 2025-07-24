import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleEnum } from 'src/common/enums/role.enum';

export class CreateRoleDto {
  @IsEnum(RoleEnum)
  name: RoleEnum;

  @IsOptional()
  @IsString()
  description?: string;
}
