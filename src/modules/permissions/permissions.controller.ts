import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { RoleBasedPermissionDto } from './dtos/assign-permission.dto';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)  
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Post('assign')

    async assignPermissions(@Body() dtos: RoleBasedPermissionDto[], @Request() req: any) {
        return this.permissionsService.assignPermissionsToRoles(dtos, req.user.userId);
    }   
}
