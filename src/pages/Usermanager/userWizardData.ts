import { UserMgrService as users } from '../../services/UserMgrservice';
import { MasterDataService as masters } from '../../services/MasterDataService';
import type { ApiResponse } from '../../core/types';

export type Row = Record<string, unknown>;
export function fieldValue(row: Row, key: string): unknown {
  return row[Object.keys(row).find((name) => name.toLowerCase() === key.toLowerCase()) ?? key];
}
export function rows(result: unknown): Row[] {
  if (Array.isArray(result)) return result.filter((item) => item && typeof item === 'object');
  if (!result || typeof result !== 'object') return [];
  const nested = Object.values(result).find(Array.isArray);
  return nested ? rows(nested) : [result as Row];
}
export function recordId(result: unknown, key: string): number {
  const id =
    typeof result === 'number' || typeof result === 'string'
      ? Number(result)
      : Number(fieldValue(rows(result)[0] ?? {}, key));
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}
type Field = { key: string; label: string; required?: boolean; decimal?: boolean };
type Step = {
  title: string;
  id: string;
  defaults: Row;
  fields: Field[];
  get: (id: number, signal?: AbortSignal) => Promise<ApiResponse>;
  save: (row: Row, userId: number, id: number) => Promise<ApiResponse>;
  lookup?: {
    field: string;
    id: string;
    name: string;
    get: (signal?: AbortSignal) => Promise<ApiResponse>;
  };
};
function defineStep<T extends object>(
  config: Omit<Step, 'save' | 'defaults'> & {
    defaults: T;
    owner: keyof T;
    create: (body: T) => Promise<ApiResponse>;
    update: (body: T & Record<string, number>) => Promise<ApiResponse>;
  },
): Step {
  return {
    ...config,
    defaults: config.defaults as Row,
    save: (row, userId, id) => {
      const body = Object.fromEntries(
        Object.entries(config.defaults).map(([key, fallback]) => [
          key,
          fieldValue(row, key) ?? fallback,
        ]),
      ) as T;
      body[config.owner] = userId as T[keyof T];
      return id ? config.update({ ...body, [config.id]: id }) : config.create(body);
    },
  };
}
export const detailSteps: Step[] = [
  defineStep({
    title: 'Address',
    id: 'UserAddressID',
    owner: 'UserMasterId',
    defaults: {
      UserMasterId: 0,
      AddressTypeId: 0,
      Pincode: '',
      PincodeDataId: 0,
      Address1: '',
      Address2: '',
      Address3: '',
      Status: 1,
    },
    fields: [
      { key: 'AddressTypeId', label: 'Address type', required: true },
      { key: 'Pincode', label: 'Pincode', required: true },
      { key: 'PincodeDataId', label: 'Pincode data ID', required: true },
      { key: 'Address1', label: 'Address line 1', required: true },
      { key: 'Address2', label: 'Address line 2' },
      { key: 'Address3', label: 'Address line 3' },
    ],
    get: (id, signal) => users.getUserAddressesByUserMasterId(id, signal),
    create: (body) => users.createUserAddress({ ...body, Status: 1 }),
    update: (body) =>
      users.updateUserAddress({ ...body, UserAddressID: body.UserAddressID, Status: 1 }),
    lookup: {
      field: 'AddressTypeId',
      id: 'AddressTypeId',
      name: 'AddressTypeName',
      get: (signal) => masters.getActiveAddressTypes(signal),
    },
  }),
  defineStep({
    title: 'KYC',
    id: 'UserKYCID',
    owner: 'UserMasterId',
    defaults: {
      UserMasterId: 0,
      KycID: 0,
      DocumentNo: '',
      FileUrl: '',
      MediaExtension: '',
      MediaContentType: '',
      RejectedReason: '',
      Status: 8,
    },
    fields: [
      { key: 'KycID', label: 'KYC document', required: true },
      { key: 'DocumentNo', label: 'Document number', required: true },
      { key: 'FileUrl', label: 'Document URL' },
      { key: 'MediaExtension', label: 'File extension' },
      { key: 'MediaContentType', label: 'Content type' },
    ],
    get: (id, signal) => users.getUserKycByUserMasterId(id, signal),
    create: (body) => users.createUserKyc(body),
    update: (body) => users.updateUserKyc({ ...body, UserKYCID: body.UserKYCID }),
    lookup: {
      field: 'KycID',
      id: 'KycTypeID',
      name: 'KycTypeName',
      get: (signal) => masters.getActiveKycTypes(signal),
    },
  }),
  defineStep({
    title: 'Bank account',
    id: 'OriginatorAccountID',
    owner: 'UserMasterID',
    defaults: {
      UserMasterID: 0,
      BankId: 0,
      AccountName: '',
      AccountNo: '',
      Ifsccode: '',
      BranchAddress: '',
      Filename: '',
      RejectedReason: '',
      Status: 8,
    },
    fields: [
      { key: 'BankId', label: 'Bank', required: true },
      { key: 'AccountName', label: 'Account name', required: true },
      { key: 'AccountNo', label: 'Account number', required: true },
      { key: 'Ifsccode', label: 'IFSC code', required: true },
      { key: 'BranchAddress', label: 'Branch address' },
      { key: 'Filename', label: 'Document filename' },
    ],
    get: (id, signal) => users.getUserBankAccountsByUserMasterId(id, signal),
    create: (body) => users.createUserBankAccount(body),
    update: (body) =>
      users.updateUserBankAccount({ ...body, OriginatorAccountID: body.OriginatorAccountID }),
    lookup: {
      field: 'BankId',
      id: 'BankID',
      name: 'BankName',
      get: (signal) => masters.getActiveBanks(signal),
    },
  }),
  defineStep({
    title: 'Configuration',
    id: 'ConfigurationId',
    owner: 'UserMasterId',
    defaults: {
      UserMasterId: 0,
      MinTxn: 0,
      MaxTxn: 0,
      ChargeTypeOn: 0,
      PlanId: 0,
      MaxPayinamount: 0,
      MaxNoofcountPayin: 0,
      SameAmountPayinAllowed: 0,
    },
    fields: [
      { key: 'MinTxn', label: 'Minimum transaction', decimal: true },
      { key: 'MaxTxn', label: 'Maximum transaction', decimal: true },
      { key: 'ChargeTypeOn', label: 'Charge type' },
      { key: 'PlanId', label: 'Plan' },
      { key: 'MaxPayinamount', label: 'Maximum pay-in amount', decimal: true },
      { key: 'MaxNoofcountPayin', label: 'Maximum pay-in count' },
      { key: 'SameAmountPayinAllowed', label: 'Same amount pay-in allowed' },
    ],
    get: (id, signal) => users.getUserConfigurationByUserMasterId(id, signal),
    create: (body) => users.createUserConfiguration(body),
    update: (body) =>
      users.updateUserConfiguration({ ...body, ConfigurationId: body.ConfigurationId }),
  }),
  defineStep({
    title: 'Other details',
    id: 'OtherDetailId',
    owner: 'UserMasterId',
    defaults: { UserMasterId: 0, Pancard: '', AadharCard: '', GSTNo: '', Status: 8 },
    fields: [
      { key: 'Pancard', label: 'PAN card' },
      { key: 'AadharCard', label: 'Aadhaar card' },
      { key: 'GSTNo', label: 'GST number' },
    ],
    get: (id, signal) => users.getOtherDetailsByUserMasterId(id, signal),
    create: (body) => users.createOtherDetails(body),
    update: (body) => users.updateOtherDetails({ ...body, OtherDetailId: body.OtherDetailId }),
  }),
];
