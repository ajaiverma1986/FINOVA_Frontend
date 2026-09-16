export class CalculationMasterResponse {
  CalculationTypeId!: number;
  CalculationTypeName!: string;
  Status!: number;
  StatusName!: string;
}
export class ChargedeductionTypeListResponse {
  ChargeDeductionId!: number;
  ChargeDeductionType!: string;
  Status!: number;
  StatusName!: string;
}
export class PlanMasterListDataResponse {
  PlanId!: number;
  PlanCode!: string;
  PlanName!: string;
  Status!: number;
  StatusName!: string;
}
export class SlabTypeListResponse {
  SlabTypId!: number;
  SlabTypeName!: string;
  Status!: number;
  StatusName!: string;
}
export class CommissionDistributionResponse {
  MarginConfigrationID!: number;
  AgencyId!: number;
  ServiceId!: number;
  PlanId!: number;
  FromAmount!: number;
  Toamount!: number;
  CalculationTypeId!: number;
  CalculationValue!: number;
  Status!: number;
  StatusName!: string;
  AgencyName!: string;
  ServiceName!: string;
  PlanName!: string;
  CalculationTypeName!: string;
}
export class TopupChargeResponse {
  TopupChargeId!: number;
  FromAmount!: number;
  Toamount!: number;
  SlabTypeId!: number;
  CalculationTypeId!: number;
  CalculationValue!: number;
  Status!: number;
  StatusName!: string;
  SlabTypeName!: string;
  CalculationTypeName!: string;
}
export class TransactionslabResponse {
  SlabId!: number;
  PlanId!: number;
  AgencyID!: number;
  ServiceID!: number;
  SlabType!: number;
  CalculationType!: number;
  FromAmount!: number;
  Toamount!: number;
  CalculationValue!: number;
  Status!: number;
  StatusName!: string;
  SlabTypeName!: string;
  CalculationTypeName!: string;
  AgencyName!: string;
  ServiceName!: string;
  PlanName!: string;
}
