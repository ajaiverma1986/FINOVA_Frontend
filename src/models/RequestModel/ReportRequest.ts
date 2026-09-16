import { ListRequest } from '../RequestModel/BaseRequest';

export class TxnListRequest extends ListRequest {
  TransactionCode!: string;
  TxnType!: string;
  PartnerTransactionId!: string;
  Status!: number;
  FromDate?: string;
  ToDate?: string;
}
export class UserStatementRequest extends ListRequest {
  FromDate?: string;
  ToDate?: string;
}
export class GetDayBookRequest {
  UserID!: number;
  FromDate?: string;
  ToDate?: string;
}
