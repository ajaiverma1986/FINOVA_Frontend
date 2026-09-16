export class PaymentAccountsListResponse {
  PaymentAccountID!: number;
  BankID!: number;
  Status!: number;
  StatusName!: string;
  AccountName!: string;
  AccountNo!: string;
  Ifsccode!: string;
  BranchName!: string;
  Branchcode!: string;
  Micrcode!: string;
  BranchAddress!: string;
  CreatedBy!: string;
  UpdatedBy!: string;
  BankName!: string;
  CreatedOn?: Date;
  UpdatedOn?: Date;
}
export class CommissionDistributionRequest {
  AgencyId?: number | null;
  ServiceId?: number | null;
  CalculationTypeId?: number | null;
  amount?: number | null;
  PlanId?: number | null;
}
export class TopupChargeRequest {
  TopupChargeId?: number | null;
  SlabTypeId?: number | null;
  CalculationTypeId?: number | null;
  Amount?: number | null;
}
export class TransactionslabRequest {
  PlanId!: number;
  SlabId?: number | null;
  SlabType?: number | null;
  CalculationType?: number | null;
  AgencyID?: number | null;
  ServiceID?: number | null;
  Amount?: number | null;
}
export class AddPaymentAccountMasterRequest {
  BankID?: number;
  AccountName!: string;
  AccountNo!: string;
  Ifsccode!: string;
  BranchName!: string;
  Branchcode!: string;
  Micrcode!: string;
  BranchAddress!: string;
}
export class ChangePaymentAccStatusRequest {
  PaymentAccountID?: number;
  Status?: number;
  Remarks!: string;
}
export class AddTxnslabRequest {
  PlanId!: number;
  AgencyID!: number;
  ServiceID!: number;
  FromAmount!: number;
  ToAmount!: number;
  SlabType!: number;
  CalculationType!: number;
  CalculationValue!: number;
}
