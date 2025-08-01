import { IsString } from "class-validator";

export class CreateMenuGroupDto {
  @IsString()
  name: string;

  @IsString()
  sortOrder: number;
}
