export class CreateRoleRequest {
  RoleName!: string;
  RoleDescription!: string;
}
export class GetRoleRequest {
  RoleName!: string;
  RoleID!: number;
  Status!: number;
}
