import { WalletService, type CompanyAccountRequest } from '../../services/WalletService';
import type { ApiResponse } from '../../core/types';
import type { ConfigField } from '../Configuration/configResources';

export type Values = Record<string, string | number | File | null>;
type Operation = {
  fields: ConfigField[];
  run: (values: Values, signal?: AbortSignal) => Promise<ApiResponse<unknown>>;
};
const idField = (key: string): ConfigField => ({ key, type: 'integer', nullable: false });
const fields: ConfigField[] = [
  ...['OrganizationId', 'ApplicationId', 'BankId'].map(idField),
  ...[
    'AccountType',
    'AccountName',
    'AccountNo',
    'Ifsccode',
    'BranchName',
    'BranchCode',
    'BranchAddress',
    'Remarks',
  ].map((key) => ({ key, type: 'string', nullable: true })),
  { key: 'File', type: 'file', nullable: true },
  idField('Status'),
];
export const companyAccountOperations = {
  all: {
    fields: [],
    run: (_: Values, signal?: AbortSignal) => WalletService.getAllCompanyAccounts(signal),
  },
  active: {
    fields: [],
    run: (_: Values, signal?: AbortSignal) => WalletService.getActiveCompanyAccounts(signal),
  },
  detail: {
    fields: [idField('CompanyAccountId')],
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.getCompanyAccountById(Number(v.CompanyAccountId), signal),
  },
  organization: {
    fields: [idField('OrganizationId')],
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.getCompanyAccountsByOrganizationId(Number(v.OrganizationId), signal),
  },
  application: {
    fields: [idField('ApplicationId')],
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.getCompanyAccountsByApplicationId(Number(v.ApplicationId), signal),
  },
  organizationApplication: {
    fields: [idField('OrganizationId'), idField('ApplicationId')],
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.getCompanyAccountsByOrganizationApplication(
        Number(v.OrganizationId),
        Number(v.ApplicationId),
        signal,
      ),
  },
  create: {
    fields,
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.createCompanyAccount(v as unknown as CompanyAccountRequest, signal),
  },
  update: {
    fields,
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.updateCompanyAccount(
        v as unknown as CompanyAccountRequest & { CompanyAccountId: number },
        signal,
      ),
  },
  remove: {
    fields: [idField('CompanyAccountId')],
    run: (v: Values, signal?: AbortSignal) =>
      WalletService.deleteCompanyAccount(Number(v.CompanyAccountId), signal),
  },
} satisfies Record<string, Operation>;
export type OperationKey = keyof typeof companyAccountOperations;
export type CompanyAccountResource = {
  title: string;
  singular: string;
  id: string;
  hiddenColumns?: string[];
  list: OperationKey;
  active: OperationKey;
  create: OperationKey;
  update: OperationKey;
  detail: OperationKey;
  remove: OperationKey;
  searches: { label: string; operation: OperationKey }[];
};
export const companyAccountResources: Record<string, CompanyAccountResource> = {
  companyAccount: {
    title: 'Company accounts',
    singular: 'company account',
    id: 'CompanyAccountId',
    hiddenColumns: ['OrganizationId', 'ApplicationId', 'BankId', 'BranchName', 'BranchCode', 'BranchAddress', 'FileUrl', 'Status'],
    list: 'all',
    active: 'active',
    create: 'create',
    update: 'update',
    detail: 'detail',
    remove: 'remove',
    searches: [
      { label: 'Organization ID', operation: 'organization' },
      { label: 'Application ID', operation: 'application' },
      { label: 'Organization and application', operation: 'organizationApplication' },
    ],
  },
};
