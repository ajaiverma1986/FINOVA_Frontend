import { operations as generated } from './operations';
import type { Operation, PageDefinition } from '../core/types';

export const operations: Record<string, Operation> = { ...generated };
const upload = (
  id: string,
  path: string,
  title: string,
  query: Record<string, string>,
  fields: string[],
) => {
  operations[id] = {
    id,
    title,
    path,
    method: 'POST',
    read: false,
    multipart: true,
    query,
    fields: [
      ...fields.map((name) => ({
        name,
        label: name.replace(/([a-z])([A-Z])/g, '$1 $2'),
        type: /ID$|Id$/.test(name) ? 'number' : 'string',
        required: true,
      })),
      { name: 'file', label: 'Document', type: 'file', required: true },
    ],
  };
};
upload(
  'uploads.kyc',
  '/User/UploadUserKYC',
  'Upload KYC document',
  { kycTypeId: 'kycTypeId', DocumentNo: 'DocumentNo' },
  ['kycTypeId', 'DocumentNo'],
);
upload('uploads.logo', '/User/UploadUserLogo', 'Upload organisation logo', {}, []);
upload(
  'uploads.receipt',
  '/Transaction/UpdatePayinRecieptFile',
  'Upload payment receipt',
  { RequestId: 'RequestId' },
  ['RequestId'],
);
upload(
  'uploads.cheque',
  '/User/UpdateOriginatorChequeFile',
  'Upload account cheque',
  { AccountID: 'AccountID' },
  ['AccountID'],
);
operations['uploads.kyc'].fields.unshift({
  name: 'CompanyTypeId',
  label: 'Company type',
  type: 'number',
  required: true,
  uiOnly: true,
});
for (const operation of Object.values(operations)) {
  for (const field of operation.fields) {
    if (
      [
        'middlename',
        'branchaddress',
        'address2',
        'address3',
        'reason',
        'remarksreason',
        'rejectedreason',
      ].includes(field.name.toLowerCase())
    )
      field.required = false;
  }
  if (
    operation.fields.some((field) => field.name.toLowerCase() === 'serviceid') &&
    !operation.fields.some((field) => field.name.toLowerCase() === 'servicetypeid')
  ) {
    const index = operation.fields.findIndex((field) => field.name.toLowerCase() === 'serviceid');
    operation.fields.splice(index, 0, {
      name: 'ServiceTypeId',
      label: 'Service type',
      type: 'number',
      required: !operation.read,
      uiOnly: true,
    });
  }
}

export function pageOperations(page: PageDefinition) {
  const ids = [...new Set(page.operations)];
  return ids
    .map((id) => operations[id])
    .filter(Boolean)
    .filter((op) => !/ListAllApp|GetUserLogo|GetUserDetails/.test(op.id));
}
export function isLookup(operation: Operation, page: PageDefinition) {
  if (page.group === 'Masters') return false;
  return operation.id.startsWith('MasterDataService.');
}
export const lookupFields: Record<
  string,
  {
    operation: string;
    key: string;
    label: string;
    params?: Record<string, string | number>;
    depends?: Record<string, string>;
  }
> = {
  bankid: { operation: 'MasterDataService.BankList', key: 'BankId', label: 'BankName' },
  genderid: { operation: 'MasterDataService.GenderList', key: 'GenderId', label: 'GenderName' },
  usertypeid: {
    operation: 'MasterDataService.UserTypeList',
    key: 'UserTypeId',
    label: 'UserTypeName',
  },
  companytypeid: {
    operation: 'MasterDataService.GetAllCompanyTypeMaster',
    key: 'CompnayTypeId',
    label: 'CompanyTypeName',
  },
  stateid: { operation: 'MasterDataService.StateList', key: 'StateId', label: 'StateName' },
  addresstypeid: {
    operation: 'MasterDataService.AdressTypeList',
    key: 'AddressTypeId',
    label: 'AddressTypeName',
  },
  agencyid: { operation: 'MasterDataService.AgencyList', key: 'AgencyId', label: 'AgencyName' },
  paymentchanelid: {
    operation: 'MasterDataService.ListPaymentChanel',
    key: 'PaymentChanelId',
    label: 'PaymentChanelName',
  },
  paymentmodeid: {
    operation: 'MasterDataService.ListPaymentModes',
    key: 'PaymentModeId',
    label: 'PaymentModeName',
    params: { PaymentChanelId: 1 },
    depends: { PaymentChanelId: 'PaymentChanelID' },
  },
  planid: { operation: 'MasterDataService.GetallPlan', key: 'PlanId', label: 'PlanName' },
  originatoraccountid: {
    operation: 'UserMasterService.ListUserAccounts',
    key: 'OriginatorAccountID',
    label: 'AccountNo',
  },
  benficiaryaccountid: {
    operation: 'ConfigService.ListUserAccounts',
    key: 'PaymentAccountID',
    label: 'AccountNo',
  },
  calculationtypeid: {
    operation: 'ConfigService.ListCalculationType',
    key: 'CalculationTypeId',
    label: 'CalculationTypeName',
  },
  applicationid: {
    operation: 'UserMasterService.ListApplication',
    key: 'ApplicationID',
    label: 'ApplicationName',
  },
  servicetypeid: {
    operation: 'MasterDataService.ListServiceType',
    key: 'ServiceTypeId',
    label: 'ServiceTypeName',
    depends: { AgencyId: 'AgencyId' },
  },
  serviceid: {
    operation: 'MasterDataService.ListAllService',
    key: 'ServiceId',
    label: 'ServiceName',
    depends: { ServiceTypeId: 'ServiceTypeId' },
  },
  kyctypeid: {
    operation: 'MasterDataService.KycTypeList',
    key: 'KycId',
    label: 'KycTypeName',
    params: { UserTypeID: 1 },
    depends: { CompanyTypeId: 'CompanyTypeId' },
  },
  pincodedataid: {
    operation: 'MasterDataService.DemographicDataListByPincode',
    key: 'PincodeDataId',
    label: 'OfficeName',
    depends: { Pincode: 'Pincode' },
  },
  slabtypeid: { operation: 'ConfigService.ListSlabType', key: 'SlabTypId', label: 'SlabTypeName' },
  slabtype: { operation: 'ConfigService.ListSlabType', key: 'SlabTypId', label: 'SlabTypeName' },
  calculationtype: {
    operation: 'ConfigService.ListCalculationType',
    key: 'CalculationTypeId',
    label: 'CalculationTypeName',
  },
  chargetypeon: {
    operation: 'ConfigService.ListChargeDeductionType',
    key: 'ChargeDeductionId',
    label: 'ChargeDeductionType',
  },
};
