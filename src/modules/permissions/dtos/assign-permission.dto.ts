export class RoleBasedPermissionDto {
  resource: string;
  roles: {
    name: string;
    actions: string[];
  }[];
}