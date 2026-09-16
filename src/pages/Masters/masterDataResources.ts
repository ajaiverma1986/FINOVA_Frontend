export type MasterField = {
  name: string;
  label: string;
  type?: 'text' | 'number';
  required?: boolean;
  options?: { value: number; label: string }[];
  nullable?: boolean;
};

export type MasterResource = {
  key: string;
  singular: string;
  plural: string;
  basePath: string;
  idField: string;
  idQuery: string;
  createPath: string;
  updatePath: string;
  deletePath: (id: number) => string;
  getPath: (id: number) => string;
  listPath: string;
  activePath?: string;
  fields: MasterField[];
};

const field = (name: string, label: string, type: MasterField['type'] = 'text'): MasterField => ({
  name,
  label,
  type,
  required: true,
});

const resource = (
  value: Omit<MasterResource, 'createPath' | 'updatePath' | 'deletePath' | 'getPath'> & {
    apiName: string;
  },
): MasterResource => ({
  ...value,
  createPath: `/MasterData/Create${value.apiName}`,
  updatePath: `/MasterData/Update${value.apiName}`,
  deletePath: (id) => `/MasterData/Delete${value.apiName}/${id}`,
  getPath: (id) => `/MasterData/Get${value.apiName}ByID?${value.idQuery}=${id}`,
});

export const masterDataResources = {
  calculationType: resource({
    key: 'calculationType', singular: 'calculation type', plural: 'Calculation types',
    apiName: 'CalculationType', basePath: '/Dashboard/CalculationType',
    idField: 'CalculationTypeId', idQuery: 'calculationTypeId',
    listPath: '/MasterData/GetAllCalculationTypes', activePath: '/MasterData/GetActiveCalculationTypes',
    fields: [
      field('CalculationTypeId', 'Calculation type ID', 'number'),
      field('CalculationTypeName', 'Calculation type name'),
      { ...field('Status', 'Status', 'number'), options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] },
    ],
  }),
  paymentAccount: resource({
    key: 'paymentAccount', singular: 'payment account', plural: 'Payment accounts',
    apiName: 'PaymentAccount', basePath: '/Dashboard/payacclist',
    idField: 'PaymentAccountID', idQuery: 'paymentAccountID',
    listPath: '/MasterData/GetAllPaymentAccounts', activePath: '/MasterData/GetActivePaymentAccounts',
    fields: [
      { name: 'BankID', label: 'Bank ID', type: 'number', nullable: true },
      field('AccountName', 'Account name'), field('AccountNo', 'Account number'),
      field('Ifsccode', 'IFSC code'),
      { name: 'BranchName', label: 'Branch name' },
      { name: 'Branchcode', label: 'Branch code' },
      { name: 'Micrcode', label: 'MICR code' },
      { name: 'BranchAddress', label: 'Branch address' },
      { ...field('Status', 'Status', 'number'), options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] },
      { name: 'Remarks', label: 'Remarks' },
    ],
  }),
  chargeDeductionType: resource({
    key: 'chargeDeductionType',
    singular: 'charge deduction type',
    plural: 'Charge deduction types',
    apiName: 'ChargeDeductionType',
    basePath: '/Dashboard/chrgdedutype',
    idField: 'ChargeDeductionId',
    idQuery: 'chargeDeductionId',
    listPath: '/MasterData/GetAllChargeDeductionTypes',
    activePath: '/MasterData/GetActiveChargeDeductionTypes',
    fields: [
      field('ChargeDeductionId', 'Charge deduction ID', 'number'),
      field('ChargeDeductionType', 'Charge deduction type'),
      { ...field('Status', 'Status', 'number'), options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] },
    ],
  }),
  slabType: resource({
    key: 'slabType',
    singular: 'slab type',
    plural: 'Slab types',
    apiName: 'SlabType',
    basePath: '/Dashboard/slabtype',
    idField: 'SlabTypId',
    idQuery: 'slabTypId',
    listPath: '/MasterData/GetAllSlabTypes',
    activePath: '/MasterData/GetActiveSlabTypes',
    fields: [
      field('SlabTypId', 'Slab type ID', 'number'),
      field('SlabTypeName', 'Slab type name'),
      { ...field('Status', 'Status', 'number'), options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] },
    ],
  }),
  plan: resource({
    key: 'plan',
    singular: 'plan',
    plural: 'Plans',
    apiName: 'Plan',
    basePath: '/Dashboard/CommissionType',
    idField: 'PlanID',
    idQuery: 'planID',
    listPath: '/MasterData/GetAllPlans',
    activePath: '/MasterData/GetActivePlans',
    fields: [field('PlanName', 'Plan name'), field('Status', 'Status', 'number')],
  }),
  companyType: resource({
    key: 'companyType',
    singular: 'company type',
    plural: 'Company types',
    apiName: 'CompanyType',
    basePath: '/Dashboard/CompanyType',
    idField: 'CompnayTypeId',
    idQuery: 'compnayTypeId',
    listPath: '/MasterData/GetAllCompanyTypes',
    activePath: '/MasterData/GetActiveCompanyTypes',
    fields: [field('CompanyTypeName', 'Company type name'), field('Status', 'Status', 'number')],
  }),
  agency: resource({
    key: 'agency',
    singular: 'agency',
    plural: 'Agencies',
    apiName: 'Agency',
    basePath: '/Dashboard/Agency',
    idField: 'AgencyId',
    idQuery: 'agencyId',
    listPath: '/MasterData/GetAllAgencies',
    activePath: '/MasterData/GetActiveAgencies',
    fields: [
      field('AgencyCode', 'Agency code'),
      field('AgencyName', 'Agency name'),
      field('Status', 'Status', 'number'),
    ],
  }),
  addressType: resource({
    key: 'addressType',
    singular: 'address type',
    plural: 'Address types',
    apiName: 'AddressType',
    basePath: '/Dashboard/AddressType',
    idField: 'AddressTypeId',
    idQuery: 'addressTypeId',
    listPath: '/MasterData/GetAllAddressTypes',
    activePath: '/MasterData/GetActiveAddressTypes',
    fields: [field('AddressTypeName', 'Address type name'), field('Status', 'Status', 'number')],
  }),
  bank: resource({
    key: 'bank',
    singular: 'bank',
    plural: 'Banks',
    apiName: 'Bank',
    basePath: '/Dashboard/BankMaster',
    idField: 'BankID',
    idQuery: 'bankID',
    listPath: '/MasterData/GetAllBanks',
    activePath: '/MasterData/GetActiveBanks',
    fields: [field('BankName', 'Bank name'), field('Status', 'Status', 'number')],
  }),
  state: resource({
    key: 'state',
    singular: 'state',
    plural: 'States',
    apiName: 'State',
    basePath: '/Dashboard/StateMaster',
    idField: 'StateID',
    idQuery: 'stateID',
    listPath: '/MasterData/GetAllStates',
    activePath: '/MasterData/GetActiveStates',
    fields: [
      field('StateFlagID', 'State flag ID', 'number'),
      field('CountryID', 'Country ID', 'number'),
      field('RegionID', 'Region ID', 'number'),
      field('StateCode', 'State code'),
      field('StateName', 'State name'),
      field('Abbreviation', 'Abbreviation'),
      field('Status', 'Status', 'number'),
    ],
  }),
  district: resource({
    key: 'district',
    singular: 'district',
    plural: 'Districts',
    apiName: 'District',
    basePath: '/Dashboard/DistrictMaster',
    idField: 'DistrictID',
    idQuery: 'districtID',
    listPath: '/MasterData/GetAllDistricts',
    activePath: '/MasterData/GetActiveDistricts',
    fields: [
      field('StateID', 'State ID', 'number'),
      field('DistrictCode', 'District code'),
      field('DistrictCodeOld', 'Old district code'),
      field('DistrictName', 'District name'),
      field('Status', 'Status', 'number'),
    ],
  }),
  kycType: resource({
    key: 'kycType',
    singular: 'KYC type',
    plural: 'KYC types',
    apiName: 'KycType',
    basePath: '/Dashboard/KycTypeMaster',
    idField: 'KycTypeID',
    idQuery: 'kycTypeID',
    listPath: '/MasterData/GetAllKycTypes',
    activePath: '/MasterData/GetActiveKycTypes',
    fields: [
      field('UserTypeID', 'User type ID', 'number'),
      field('CompanyTypeId', 'Company type ID', 'number'),
      field('KycTypeName', 'KYC type name'),
      field('Status', 'Status', 'number'),
    ],
  }),
  userType: resource({
    key: 'userType',
    singular: 'user type',
    plural: 'User types',
    apiName: 'UserType',
    basePath: '/Dashboard/UserTypeMaster',
    idField: 'UserTypeId',
    idQuery: 'userTypeId',
    listPath: '/MasterData/GetAllUserTypes',
    activePath: '/MasterData/GetActiveUserTypes',
    fields: [field('UserTypeName', 'User type name'), field('Status', 'Status', 'number')],
  }),
  ledgerType: resource({
    key: 'ledgerType',
    singular: 'ledger type',
    plural: 'Ledger types',
    apiName: 'LedgerType',
    basePath: '/Dashboard/LedgerType',
    idField: 'LedgerTypeId',
    idQuery: 'ledgerTypeId',
    listPath: '/MasterData/GetAllLedgerTypes',
    activePath: '/MasterData/GetActiveLedgerTypes',
    fields: [field('LedgerTypeName', 'Ledger type name'), field('Status', 'Status', 'number')],
  }),
  serviceType: resource({
    key: 'serviceType',
    singular: 'service type',
    plural: 'Service types',
    apiName: 'ServiceType',
    basePath: '/Dashboard/ServiceType',
    idField: 'ServiceTypeId',
    idQuery: 'serviceTypeId',
    listPath: '/MasterData/GetAllServiceTypes',
    activePath: '/MasterData/GetActiveServiceTypes',
    fields: [
      field('AgencyName', 'Agency name'),
      field('ServiceTypeName', 'Service type name'),
      field('Status', 'Status', 'number'),
    ],
  }),
  paymentChanel: resource({
    key: 'paymentChanel',
    singular: 'payment channel',
    plural: 'Payment channels',
    apiName: 'PaymentChanel',
    basePath: '/Dashboard/PaymentChanel',
    idField: 'PaymentChanelID',
    idQuery: 'paymentChanelID',
    listPath: '/MasterData/GetAllPaymentChanels',
    activePath: '/MasterData/GetActivePaymentChanels',
    fields: [
      field('PaymentChanelName', 'Payment channel name'),
      field('Status', 'Status', 'number'),
    ],
  }),
  paymentMode: resource({
    key: 'paymentMode',
    singular: 'payment mode',
    plural: 'Payment modes',
    apiName: 'PaymentMode',
    basePath: '/Dashboard/PaymentMode',
    idField: 'PaymentModeID',
    idQuery: 'paymentModeID',
    listPath: '/MasterData/GetAllPaymentModes',
    activePath: '/MasterData/GetActivePaymentModes',
    fields: [
      field('PaymentChanelID', 'Payment channel ID', 'number'),
      field('PaymentModeName', 'Payment mode name'),
      field('Status', 'Status', 'number'),
    ],
  }),
  service: resource({
    key: 'service',
    singular: 'service',
    plural: 'Services',
    apiName: 'Service',
    basePath: '/Dashboard/servicemst',
    idField: 'ServiceId',
    idQuery: 'serviceId',
    listPath: '/MasterData/GetAllServices',
    fields: [
      field('ServiceTypeName', 'Service type name'),
      field('ServiceCode', 'Service code'),
      field('ServiceName', 'Service name'),
      field('ServiceAccountNo', 'Service account number'),
      field('ServcieIfsccode', 'Service IFSC code'),
      field('ServiceAccName', 'Service account name'),
      field('ServiceMobileNo', 'Service mobile number'),
    ],
  }),
} satisfies Record<string, MasterResource>;

export type MasterResourceKey = keyof typeof masterDataResources;
