import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AssignRoleDto } from './assign-role.dto';

export class BulkAssignRolesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignRoleDto)
  assignments: AssignRoleDto[];
}
