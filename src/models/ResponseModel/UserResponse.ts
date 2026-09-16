export class PartnerDetailsResponse {
  UserId!: number;
  Usercode!: string;
  OrganisationName!: string;
  ContactPersonName!: string;
  MobileNo!: string;
  EmailId!: string;
  AvailableLimit?: number;
  LogoUrl!: string;
}
export class ListOrganisationResponse {
  UserId!: number;
  Usercode!: string;
  OrganisationName!: string;
  ContactPerson!: string;
  MobileNo!: string;
  EmailId!: string;
  UpdatedOn!: Date;
  UpdatedBy!: string;
  StatusName!: string;
  Status!: number;
}
export class UserConfigurationResponse {
  ConfigurationId!: number;
  UserId!: number;
  MinTxn!: number;
  MaxTxn!: number;
  ChargeTypeOn!: number;
  ChargeDeductionType!: string;
  MaxPayinamount!: number;
  MaxNoofcountPayin!: number;
  SameAmountPayinAllowed!: number;
  PlanId!: number;
  PlanName!: string;
}
export class ListUserMasterResponse {
  UserMasterID!: number;
  UserTypeId!: number;
  UserTypename!: string;
  UserName!: string;
  OrganisationName!: string;
  ContactPerson!: string;
  MobileNo!: string;
  EmailId!: string;
  // UpdatedOn?: Date; // Uncomment if needed
  UpdatedBy!: string;
  StatusName!: string;
  Status!: number;
}
export class UserAddressListResponse {
  UserAddressID!: number;
  UserID!: number;
  AddressTypeId!: number;
  PincodeDataId!: number;
  Address1!: string;
  Address2!: string;
  Address3!: string;
  AddressTypeName!: string;
  StatusName!: string;
  AreaName!: string;
  SubDistrictName!: string;
  DistrictName!: string;
  StateName!: string;
  CreatedBy!: string;
  Pincode!: string;
  UpdatedBy!: string;
  CreatedOn?: Date;
  UpdatedOn?: Date;
  Status!: number;
}
export class GetIPAddressResponse {
  IPAddressId!: number;
  ApplicationId!: number;
  OrganisationName!: string;
  ApplicationName!: string;
  StatusName!: string;
  CreatedBy!: string;
  UpdatedBy!: string;
  IPAddress!: string;
  CreatedOn?: Date;
  UpdatedOn?: Date;
  Status!: number;
}
export class GetUserLogoRequest {
  UserId!: number;
  FileUrl!: string;
  ContentType!: string;
  FileBytes!: string;
  Base64String!: string;
  MediaContentType!: string;
  MediaExtension!: string;
}
export class GetUserOtherDetailsResponse {
  OtherDetailId!: number;
  UserId!: number;
  Pancard!: string;
  AadharCard!: string;
  GSTNo!: string;
}
export class ListOutletResponse {
  UserId!: number;
  Usercode!: string;
  ParentCode!: string;
  OrganisationName!: string;
  ContactPerson!: string;
  AvailableLimit!: number | 0;
  ThresoldLimit!: number | 0;
  MobileNo!: string;
  EmailId!: string;
  UpdatedOn!: string | null;
  UpdatedBy!: string;
  StatusName!: string;
  Status!: number | 0;
}
