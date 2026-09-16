import { ListRequest } from '../RequestModel/BaseRequest';

export class AddPaymentRequestRequest {
  PaymentChanelID!: number;
  PaymentModeId!: number;
  Amount?: number | null;
  Charge?: number | null;
  OriginatorAccountId!: number;
  BenficiaryAccountId!: number;
  DepositDate?: string | null;
  RefNo1?: string | null;
  RefNo2?: string | null;
  Remarks?: string | null;
}

export class ListPayinRequestRequest extends ListRequest {
  PaymentChanelID!: number;
  PaymentModeId!: number;
  Status!: number;
  FromDate?: string | null;
  ToDate?: string | null;
}

export class PayinRequestReciptDownloadResponse {
  RequestID!: number;
  RecieptFile!: string;
  FileBytes!: Uint8Array;
  Base64String!: string;
  MediaExtension!: string;
}
export class OriginatorListAccountRequest extends ListRequest {
  Status!: number;
}
export class ApproveRejectPayinRequest {
  RequestID!: number;
  RejectedReason!: string;
  Status!: number;
}
export class OriginatorListAccountforadminRequest extends ListRequest {
  Status!: number;
  FromDate?: string | null;
  ToDate?: string | null;
}
export class ApproveRejectOriAccountRequest {
  RequestId!: number;
  RemarksReason!: string;
  Status!: number;
}
