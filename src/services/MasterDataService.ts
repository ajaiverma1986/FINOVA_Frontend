import { operationRequest, request } from '../core/api';
import { operations } from './operations';
import type { Fields } from '../core/types';

export type PincodeDataRequest = {
  PageNo?: number;
  PageSize?: number;
  OrderBy?: string | null;
  Pincode?: string | null;
};

export type CreatePlanRequest = { PlanName?: string | null; Status?: number };

export type UpdatePlanRequest = { PlanID?: number; PlanName?: string | null; Status?: number };

export type CreateCompanyTypeRequest = { CompanyTypeName?: string | null; Status?: number };

export type UpdateCompanyTypeRequest = {
  CompnayTypeId?: number;
  CompanyTypeName?: string | null;
  Status?: number;
};

export type CreateAgencyRequest = {
  AgencyCode?: string | null;
  AgencyName?: string | null;
  Status?: number;
};

export type UpdateAgencyRequest = {
  AgencyId?: number;
  AgencyCode?: string | null;
  AgencyName?: string | null;
  Status?: number;
};

export type CreateAddressTypeRequest = { AddressTypeName?: string | null; Status?: number };

export type UpdateAddressTypeRequest = {
  AddressTypeId?: number;
  AddressTypeName?: string | null;
  Status?: number;
};

export type CreateBankRequest = { BankName?: string | null; Status?: number };

export type UpdateBankRequest = { BankID?: number; BankName?: string | null; Status?: number };

export type CreateStateRequest = {
  StateFlagID?: number | null;
  CountryID?: number;
  RegionID?: number;
  StateCode?: string | null;
  StateName?: string | null;
  Abbreviation?: string | null;
  Status?: number;
};

export type UpdateStateRequest = {
  StateID?: number;
  StateFlagID?: number | null;
  CountryID?: number;
  RegionID?: number;
  StateCode?: string | null;
  StateName?: string | null;
  Abbreviation?: string | null;
  Status?: number;
};

export type CreateDistrictRequest = {
  StateID?: number;
  DistrictCode?: string | null;
  DistrictCodeOld?: string | null;
  DistrictName?: string | null;
  Status?: number;
};

export type UpdateDistrictRequest = {
  DistrictID?: number;
  StateID?: number;
  DistrictCode?: string | null;
  DistrictCodeOld?: string | null;
  DistrictName?: string | null;
  Status?: number;
};

export type CreateKycTypeRequest = {
  UserTypeID?: number;
  CompanyTypeId?: number | null;
  KycTypeName?: string | null;
  Status?: number;
};

export type UpdateKycTypeRequest = {
  KycTypeID?: number;
  UserTypeID?: number;
  CompanyTypeId?: number | null;
  KycTypeName?: string | null;
  Status?: number;
};

export type CreateUserTypeRequest = { UserTypeName?: string | null; Status?: number };

export type UpdateUserTypeRequest = {
  UserTypeId?: number;
  UserTypeName?: string | null;
  Status?: number;
};

export type CreateLedgerTypeRequest = { LedgerTypeName?: string | null; Status?: number };

export type UpdateLedgerTypeRequest = {
  LedgerTypeId?: number;
  LedgerTypeName?: string | null;
  Status?: number;
};

export type CreateServiceTypeRequestmdm = {
  AgencyId?: number | null;
  ServiceTypeName?: string | null;
  Status?: number;
};

export type UpdateServiceTypeRequestmdm = {
  ServiceTypeId?: number;
  AgencyId?: number | null;
  ServiceTypeName?: string | null;
  Status?: number;
};

export type CreatePaymentChanelRequest = { PaymentChanelName?: string | null; Status?: number };

export type UpdatePaymentChanelRequest = {
  PaymentChanelID?: number;
  PaymentChanelName?: string | null;
  Status?: number;
};

export type CreatePaymentModeRequest = {
  PaymentChanelID?: number | null;
  PaymentModeName?: string | null;
  Status?: number;
};

export type UpdatePaymentModeRequest = {
  PaymentModeID?: number;
  PaymentChanelID?: number | null;
  PaymentModeName?: string | null;
  Status?: number;
};

export type CreateServiceRequest = {
  ServiceTypeId?: number | null;
  ServiceCode?: string | null;
  ServiceName?: string | null;
  ServiceAccountNo?: string | null;
  ServcieIfsccode?: string | null;
  ServiceAccName?: string | null;
  ServiceMobileNo?: string | null;
};

export type UpdateServiceRequest = {
  ServiceId?: number;
  ServiceTypeId?: number | null;
  ServiceCode?: string | null;
  ServiceName?: string | null;
  ServiceAccountNo?: string | null;
  ServcieIfsccode?: string | null;
  ServiceAccName?: string | null;
  ServiceMobileNo?: string | null;
};

export type CreateChargeDeductionTypeRequest = {
  ChargeDeductionId?: number;
  ChargeDeductionType?: string | null;
  Status?: number;
};

export type UpdateChargeDeductionTypeRequest = {
  ChargeDeductionId?: number;
  ChargeDeductionType?: string | null;
  Status?: number;
};

export type CreateSlabTypeRequest = {
  SlabTypId?: number;
  SlabTypeName?: string | null;
  Status?: number;
};

export type UpdateSlabTypeRequest = {
  SlabTypId?: number;
  SlabTypeName?: string | null;
  Status?: number;
};

export interface CreatePaymentAccountRequest {
  BankID: number | null;
  AccountName: string | null;
  AccountNo: string | null;
  Ifsccode: string | null;
  BranchName: string | null;
  Branchcode: string | null;
  Micrcode: string | null;
  BranchAddress: string | null;
  Status: number;
  Remarks: string | null;
}
export interface UpdatePaymentAccountRequest extends CreatePaymentAccountRequest {
  PaymentAccountID: number;
}

export interface CreateCalculationTypeRequest {
  CalculationTypeId: number;
  CalculationTypeName: string | null;
  Status: number;
}
export type UpdateCalculationTypeRequest = CreateCalculationTypeRequest;

export const MasterDataService = {
  createCalculationType: (body: CreateCalculationTypeRequest, signal?: AbortSignal) =>
    request('/MasterData/CreateCalculationType', { method: 'POST', body, signal }),
  updateCalculationType: (body: UpdateCalculationTypeRequest, signal?: AbortSignal) =>
    request('/MasterData/UpdateCalculationType', { method: 'POST', body, signal }),
  deleteCalculationType: (calculationTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteCalculationType/${encodeURIComponent(calculationTypeId)}`, { method: 'DELETE', signal }),
  getCalculationTypeById: (calculationTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/GetCalculationTypeByID?calculationTypeId=${encodeURIComponent(calculationTypeId)}`, { signal }),
  getAllCalculationTypes: (signal?: AbortSignal) => request('/MasterData/GetAllCalculationTypes', { signal }),
  getActiveCalculationTypes: (signal?: AbortSignal) => request('/MasterData/GetActiveCalculationTypes', { signal }),
  createPaymentAccount: (body: CreatePaymentAccountRequest, signal?: AbortSignal) =>
    request('/MasterData/CreatePaymentAccount', { method: 'POST', body, signal }),
  updatePaymentAccount: (body: UpdatePaymentAccountRequest, signal?: AbortSignal) =>
    request('/MasterData/UpdatePaymentAccount', { method: 'POST', body, signal }),
  deletePaymentAccount: (paymentAccountID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeletePaymentAccount/${encodeURIComponent(paymentAccountID)}`, { method: 'DELETE', signal }),
  getPaymentAccountById: (paymentAccountID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetPaymentAccountByID?paymentAccountID=${encodeURIComponent(paymentAccountID)}`, { signal }),
  getAllPaymentAccounts: (signal?: AbortSignal) => request('/MasterData/GetAllPaymentAccounts', { signal }),
  getActivePaymentAccounts: (signal?: AbortSignal) => request('/MasterData/GetActivePaymentAccounts', { signal }),
  getPaymentAccountsByBankId: (bankID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetPaymentAccountsByBankID?bankID=${encodeURIComponent(bankID)}`, { signal }),
  genderList: (signal?: AbortSignal) =>
    request(`/MasterData/GenderList`, { method: 'GET', signal }),
  maritalStatusList: (signal?: AbortSignal) =>
    request(`/MasterData/MaritalStatusList`, { method: 'GET', signal }),
  demographicDataListByPincode: (Pincode: string, signal?: AbortSignal) =>
    request(
      `/MasterData/DemographicDataListByPincode?Pincode=${encodeURIComponent(String(Pincode))}`,
      { method: 'GET', signal },
    ),
  demographicDataListByPincodeList: (body: PincodeDataRequest, signal?: AbortSignal) =>
    request(`/MasterData/DemographicDataListByPincodeList`, { method: 'POST', body, signal }),
  createPlan: (body: CreatePlanRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreatePlan`, { method: 'POST', body, signal }),
  updatePlan: (body: UpdatePlanRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdatePlan`, { method: 'POST', body, signal }),
  deletePlan: (planID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeletePlan/${encodeURIComponent(String(planID))}`, {
      method: 'DELETE',
      signal,
    }),
  getPlanById: (planID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetPlanByID?planID=${encodeURIComponent(String(planID))}`, {
      method: 'GET',
      signal,
    }),
  getAllPlans: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllPlans`, { method: 'GET', signal }),
  getActivePlans: (signal?: AbortSignal) =>
    request(`/MasterData/GetActivePlans`, { method: 'GET', signal }),
  createCompanyType: (body: CreateCompanyTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateCompanyType`, { method: 'POST', body, signal }),
  updateCompanyType: (body: UpdateCompanyTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateCompanyType`, { method: 'POST', body, signal }),
  deleteCompanyType: (compnayTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteCompanyType/${encodeURIComponent(String(compnayTypeId))}`, {
      method: 'DELETE',
      signal,
    }),
  getCompanyTypeById: (compnayTypeId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetCompanyTypeByID?compnayTypeId=${encodeURIComponent(String(compnayTypeId))}`,
      { method: 'GET', signal },
    ),
  getAllCompanyTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllCompanyTypes`, { method: 'GET', signal }),
  getActiveCompanyTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveCompanyTypes`, { method: 'GET', signal }),
  createAgency: (body: CreateAgencyRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateAgency`, { method: 'POST', body, signal }),
  updateAgency: (body: UpdateAgencyRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateAgency`, { method: 'POST', body, signal }),
  deleteAgency: (agencyId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteAgency/${encodeURIComponent(String(agencyId))}`, {
      method: 'DELETE',
      signal,
    }),
  getAgencyById: (agencyId: number, signal?: AbortSignal) =>
    request(`/MasterData/GetAgencyByID?agencyId=${encodeURIComponent(String(agencyId))}`, {
      method: 'GET',
      signal,
    }),
  getAllAgencies: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllAgencies`, { method: 'GET', signal }),
  getActiveAgencies: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveAgencies`, { method: 'GET', signal }),
  createAddressType: (body: CreateAddressTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateAddressType`, { method: 'POST', body, signal }),
  updateAddressType: (body: UpdateAddressTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateAddressType`, { method: 'POST', body, signal }),
  deleteAddressType: (addressTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteAddressType/${encodeURIComponent(String(addressTypeId))}`, {
      method: 'DELETE',
      signal,
    }),
  getAddressTypeById: (addressTypeId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetAddressTypeByID?addressTypeId=${encodeURIComponent(String(addressTypeId))}`,
      { method: 'GET', signal },
    ),
  getAllAddressTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllAddressTypes`, { method: 'GET', signal }),
  getActiveAddressTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveAddressTypes`, { method: 'GET', signal }),
  createBank: (body: CreateBankRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateBank`, { method: 'POST', body, signal }),
  updateBank: (body: UpdateBankRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateBank`, { method: 'POST', body, signal }),
  deleteBank: (bankID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteBank/${encodeURIComponent(String(bankID))}`, {
      method: 'DELETE',
      signal,
    }),
  getBankById: (bankID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetBankByID?bankID=${encodeURIComponent(String(bankID))}`, {
      method: 'GET',
      signal,
    }),
  getAllBanks: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllBanks`, { method: 'GET', signal }),
  getActiveBanks: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveBanks`, { method: 'GET', signal }),
  createState: (body: CreateStateRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateState`, { method: 'POST', body, signal }),
  updateState: (body: UpdateStateRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateState`, { method: 'POST', body, signal }),
  deleteState: (stateID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteState/${encodeURIComponent(String(stateID))}`, {
      method: 'DELETE',
      signal,
    }),
  getStateById: (stateID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetStateByID?stateID=${encodeURIComponent(String(stateID))}`, {
      method: 'GET',
      signal,
    }),
  getAllStates: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllStates`, { method: 'GET', signal }),
  getActiveStates: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveStates`, { method: 'GET', signal }),
  getStatesByCountryId: (countryID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetStatesByCountryID?countryID=${encodeURIComponent(String(countryID))}`, {
      method: 'GET',
      signal,
    }),
  createDistrict: (body: CreateDistrictRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateDistrict`, { method: 'POST', body, signal }),
  updateDistrict: (body: UpdateDistrictRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateDistrict`, { method: 'POST', body, signal }),
  deleteDistrict: (districtID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteDistrict/${encodeURIComponent(String(districtID))}`, {
      method: 'DELETE',
      signal,
    }),
  getDistrictById: (districtID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetDistrictByID?districtID=${encodeURIComponent(String(districtID))}`, {
      method: 'GET',
      signal,
    }),
  getAllDistricts: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllDistricts`, { method: 'GET', signal }),
  getActiveDistricts: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveDistricts`, { method: 'GET', signal }),
  getDistrictsByStateId: (stateID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetDistrictsByStateID?stateID=${encodeURIComponent(String(stateID))}`, {
      method: 'GET',
      signal,
    }),
  createKycType: (body: CreateKycTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateKycType`, { method: 'POST', body, signal }),
  updateKycType: (body: UpdateKycTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateKycType`, { method: 'POST', body, signal }),
  deleteKycType: (kycTypeID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteKycType/${encodeURIComponent(String(kycTypeID))}`, {
      method: 'DELETE',
      signal,
    }),
  getKycTypeById: (kycTypeID: number, signal?: AbortSignal) =>
    request(`/MasterData/GetKycTypeByID?kycTypeID=${encodeURIComponent(String(kycTypeID))}`, {
      method: 'GET',
      signal,
    }),
  getAllKycTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllKycTypes`, { method: 'GET', signal }),
  getActiveKycTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveKycTypes`, { method: 'GET', signal }),
  getKycTypesByUserTypeId: (userTypeID: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetKycTypesByUserTypeID?userTypeID=${encodeURIComponent(String(userTypeID))}`,
      { method: 'GET', signal },
    ),
  getKycTypesByUserAndCompanyType: (
    userTypeID: number,
    companyTypeId: number,
    signal?: AbortSignal,
  ) =>
    request(
      `/MasterData/GetKycTypesByUserAndCompanyType?userTypeID=${encodeURIComponent(String(userTypeID))}&companyTypeId=${encodeURIComponent(String(companyTypeId))}`,
      { method: 'GET', signal },
    ),
  createUserType: (body: CreateUserTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateUserType`, { method: 'POST', body, signal }),
  updateUserType: (body: UpdateUserTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateUserType`, { method: 'POST', body, signal }),
  deleteUserType: (userTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteUserType/${encodeURIComponent(String(userTypeId))}`, {
      method: 'DELETE',
      signal,
    }),
  getUserTypeById: (userTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/GetUserTypeByID?userTypeId=${encodeURIComponent(String(userTypeId))}`, {
      method: 'GET',
      signal,
    }),
  getAllUserTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllUserTypes`, { method: 'GET', signal }),
  createLedgerType: (body: CreateLedgerTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateLedgerType`, { method: 'POST', body, signal }),
  updateLedgerType: (body: UpdateLedgerTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateLedgerType`, { method: 'POST', body, signal }),
  deleteLedgerType: (ledgerTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteLedgerType/${encodeURIComponent(String(ledgerTypeId))}`, {
      method: 'DELETE',
      signal,
    }),
  getLedgerTypeById: (ledgerTypeId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetLedgerTypeByID?ledgerTypeId=${encodeURIComponent(String(ledgerTypeId))}`,
      { method: 'GET', signal },
    ),
  getAllLedgerTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllLedgerTypes`, { method: 'GET', signal }),
  getActiveLedgerTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveLedgerTypes`, { method: 'GET', signal }),
  createServiceType: (body: CreateServiceTypeRequestmdm, signal?: AbortSignal) =>
    request(`/MasterData/CreateServiceType`, { method: 'POST', body, signal }),
  updateServiceType: (body: UpdateServiceTypeRequestmdm, signal?: AbortSignal) =>
    request(`/MasterData/UpdateServiceType`, { method: 'POST', body, signal }),
  deleteServiceType: (serviceTypeId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteServiceType/${encodeURIComponent(String(serviceTypeId))}`, {
      method: 'DELETE',
      signal,
    }),
  getServiceTypeById: (serviceTypeId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetServiceTypeByID?serviceTypeId=${encodeURIComponent(String(serviceTypeId))}`,
      { method: 'GET', signal },
    ),
  getAllServiceTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllServiceTypes`, { method: 'GET', signal }),
  getActiveServiceTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveServiceTypes`, { method: 'GET', signal }),
  getServiceTypesByAgencyId: (agencyId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetServiceTypesByAgencyID?agencyId=${encodeURIComponent(String(agencyId))}`,
      { method: 'GET', signal },
    ),
  createPaymentChanel: (body: CreatePaymentChanelRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreatePaymentChanel`, { method: 'POST', body, signal }),
  updatePaymentChanel: (body: UpdatePaymentChanelRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdatePaymentChanel`, { method: 'POST', body, signal }),
  deletePaymentChanel: (paymentChanelID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeletePaymentChanel/${encodeURIComponent(String(paymentChanelID))}`, {
      method: 'DELETE',
      signal,
    }),
  getPaymentChanelById: (paymentChanelID: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetPaymentChanelByID?paymentChanelID=${encodeURIComponent(String(paymentChanelID))}`,
      { method: 'GET', signal },
    ),
  getAllPaymentChanels: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllPaymentChanels`, { method: 'GET', signal }),
  getActivePaymentChanels: (signal?: AbortSignal) =>
    request(`/MasterData/GetActivePaymentChanels`, { method: 'GET', signal }),
  createPaymentMode: (body: CreatePaymentModeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreatePaymentMode`, { method: 'POST', body, signal }),
  updatePaymentMode: (body: UpdatePaymentModeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdatePaymentMode`, { method: 'POST', body, signal }),
  deletePaymentMode: (paymentModeID: number, signal?: AbortSignal) =>
    request(`/MasterData/DeletePaymentMode/${encodeURIComponent(String(paymentModeID))}`, {
      method: 'DELETE',
      signal,
    }),
  getPaymentModeById: (paymentModeID: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetPaymentModeByID?paymentModeID=${encodeURIComponent(String(paymentModeID))}`,
      { method: 'GET', signal },
    ),
  getAllPaymentModes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllPaymentModes`, { method: 'GET', signal }),
  getActivePaymentModes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActivePaymentModes`, { method: 'GET', signal }),
  getPaymentModesByPaymentChanelId: (paymentChanelID: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetPaymentModesByPaymentChanelID?paymentChanelID=${encodeURIComponent(String(paymentChanelID))}`,
      { method: 'GET', signal },
    ),
  createService: (body: CreateServiceRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateService`, { method: 'POST', body, signal }),
  updateService: (body: UpdateServiceRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateService`, { method: 'POST', body, signal }),
  deleteService: (serviceId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteService/${encodeURIComponent(String(serviceId))}`, {
      method: 'DELETE',
      signal,
    }),
  getServiceById: (serviceId: number, signal?: AbortSignal) =>
    request(`/MasterData/GetServiceByID?serviceId=${encodeURIComponent(String(serviceId))}`, {
      method: 'GET',
      signal,
    }),
  getAllServices: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllServices`, { method: 'GET', signal }),
  getServicesByServiceTypeId: (serviceTypeId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetServicesByServiceTypeID?serviceTypeId=${encodeURIComponent(String(serviceTypeId))}`,
      { method: 'GET', signal },
    ),
  createChargeDeductionType: (body: CreateChargeDeductionTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateChargeDeductionType`, { method: 'POST', body, signal }),
  updateChargeDeductionType: (body: UpdateChargeDeductionTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateChargeDeductionType`, { method: 'POST', body, signal }),
  deleteChargeDeductionType: (chargeDeductionId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/DeleteChargeDeductionType/${encodeURIComponent(String(chargeDeductionId))}`,
      { method: 'DELETE', signal },
    ),
  getChargeDeductionTypeById: (chargeDeductionId: number, signal?: AbortSignal) =>
    request(
      `/MasterData/GetChargeDeductionTypeByID?chargeDeductionId=${encodeURIComponent(String(chargeDeductionId))}`,
      { method: 'GET', signal },
    ),
  getAllChargeDeductionTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllChargeDeductionTypes`, { method: 'GET', signal }),
  getActiveChargeDeductionTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveChargeDeductionTypes`, { method: 'GET', signal }),
  createSlabType: (body: CreateSlabTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/CreateSlabType`, { method: 'POST', body, signal }),
  updateSlabType: (body: UpdateSlabTypeRequest, signal?: AbortSignal) =>
    request(`/MasterData/UpdateSlabType`, { method: 'POST', body, signal }),
  deleteSlabType: (slabTypId: number, signal?: AbortSignal) =>
    request(`/MasterData/DeleteSlabType/${encodeURIComponent(String(slabTypId))}`, {
      method: 'DELETE',
      signal,
    }),
  getSlabTypeById: (slabTypId: number, signal?: AbortSignal) =>
    request(`/MasterData/GetSlabTypeByID?slabTypId=${encodeURIComponent(String(slabTypId))}`, {
      method: 'GET',
      signal,
    }),
  getAllSlabTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetAllSlabTypes`, { method: 'GET', signal }),
  getActiveSlabTypes: (signal?: AbortSignal) =>
    request(`/MasterData/GetActiveSlabTypes`, { method: 'GET', signal }),

  getActiveUserTypes: (signal?: AbortSignal) =>
    request('/MasterData/GetActiveUserTypes', { signal }),
  GetallPlan: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.GetallPlan'], values, signal),
  GetAllCompanyTypeMaster: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.GetAllCompanyTypeMaster'], values, signal),
  GenderList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.GenderList'], values, signal),
  MaritalStatusList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.MaritalStatusList'], values, signal),
  AdressTypeList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.AdressTypeList'], values, signal),
  AgencyList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.AgencyList'], values, signal),
  BankList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.BankList'], values, signal),
  StateList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.StateList'], values, signal),
  DistrictList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.DistrictList'], values, signal),
  DistrictMasterList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.DistrictMasterList'], values, signal),
  KycTypeList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.KycTypeList'], values, signal),
  UserTypeList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.UserTypeList'], values, signal),
  UserTypeAdminList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.UserTypeAdminList'], values, signal),
  DemographicDataListByPincode: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.DemographicDataListByPincode'], values, signal),
  DemographicDataListByPincodeList: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(
      operations['MasterDataService.DemographicDataListByPincodeList'],
      values,
      signal,
    ),
  ListLedegrType: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.ListLedegrType'], values, signal),
  ListServiceType: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.ListServiceType'], values, signal),
  ListPaymentChanel: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.ListPaymentChanel'], values, signal),
  ListPaymentModes: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.ListPaymentModes'], values, signal),
  ListAllService: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['MasterDataService.ListAllService'], values, signal),
};
