export class GetCustomerRequestView {
  Mobile!: string;
  TokenData!: string;
}
export class FinoEkycRequestView {
  Mobile!: string;
  TokenData!: string;
  AadharNo!: string;
  PidData!: string;
  AccessMode!: string;
  isIris!: number;
}
export class FinoRegCustomerRequestView {
  ekyc_id!: string;
  mobile!: string;
  otp!: string;
  stateresp!: string;
  TokenData!: string;
}
export class FinoRegBenRequestView {
  mobile!: string;
  benename!: string;
  bankid!: string;
  accno!: string;
  ifsccode!: string;
  verified!: number;
  TokenData!: string;
}
export class FinoDeleteBenRequestView {
  mobile!: string;
  bene_id!: string;
  TokenData!: string;
}
export class FinofetchBenRequestView {
  mobile!: string;
  bene_id!: string;
  TokenData!: string;
}
export class FinoTransactionRequestView {
  mobile!: string;
  accno!: string;
  bankid!: string;
  pincode!: string;
  benename!: string;
  address!: string;
  dob!: string;
  gst_state!: string;
  bene_id!: string;
  TokenData!: string;
}
export class FinoTransactionSendRequestView {
  mobile!: string;
  referenceid!: string;
  bene_id!: string;
  txntype!: string;
  amount!: string;
  TokenData!: string;
}
export class FinoTransactionFinalRequestView {
  mobile!: string;
  referenceid!: string;
  bene_id!: string;
  txntype!: string;
  amount!: string;
  otp!: string;
  stateresp!: string;
  TokenData!: string;
}
export class FinoTransactionStatusRequestView {
  referenceid!: string;
  TokenData!: string;
}
export class FinoRefundOtpRequestView {
  referenceid!: string;
  ackno!: string;
  TokenData!: string;
}
export class FinoRefundRequestView {
  referenceid!: string;
  ackno!: string;
  otp!: string;
  TokenData!: string;
}
