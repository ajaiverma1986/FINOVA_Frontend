import { request } from '../core/api';

export interface GetServicePolicyRequest {
  ServiceId: number;
  Agencyid: number;
  PolicyId: number;
  PolicyKey: string | null;
}

export interface AddTxnslabRequest {
  PlanId: number;
  AgencyID: number;
  ServiceID: number;
  FromAmount: number;
  ToAmount: number;
  SlabType: number;
  CalculationType: number;
  CalculationValue: number;
}

export interface CreateTopupChargeRequest {
  FromAmount: number | null;
  Toamount: number | null;
  SlabTypeId: number | null;
  CalculationTypeId: number | null;
  CalculationValue: number | null;
  Status: number;
}

export interface UpdateTopupChargeRequest {
  TopupChargeId: number;
  FromAmount: number | null;
  Toamount: number | null;
  SlabTypeId: number | null;
  CalculationTypeId: number | null;
  CalculationValue: number | null;
  Status: number;
}

export interface CreateCommissionDistributionRequest {
  AgencyId: number;
  ServiceId: number;
  PlanId: number | null;
  FromAmount: number | null;
  Toamount: number | null;
  CalculationTypeId: number | null;
  CalculationValue: number | null;
  Status: number;
}

export interface UpdateCommissionDistributionRequest {
  MarginConfigrationID: number;
  AgencyId: number;
  ServiceId: number;
  PlanId: number | null;
  FromAmount: number | null;
  Toamount: number | null;
  CalculationTypeId: number | null;
  CalculationValue: number | null;
  Status: number;
}

export interface CreateTransactionSlabRequest {
  PlanId: number | null;
  AgencyID: number | null;
  ServiceID: number | null;
  FromAmount: number | null;
  ToAmount: number | null;
  SlabType: number | null;
  CalculationType: number | null;
  CalculationValue: number | null;
  Status: number;
}

export interface UpdateTransactionSlabRequest {
  SlabId: number;
  PlanId: number | null;
  AgencyID: number | null;
  ServiceID: number | null;
  FromAmount: number | null;
  ToAmount: number | null;
  SlabType: number | null;
  CalculationType: number | null;
  CalculationValue: number | null;
  Status: number;
}

export const ConfigService = {
  getServicePolicy: (body: GetServicePolicyRequest, signal?: AbortSignal) =>
    request(`/Config/GetServicePolicy`, { method: 'POST', body, signal }),
  addTransacttionSlab: (body: AddTxnslabRequest, signal?: AbortSignal) =>
    request(`/Config/AddTransacttionSlab`, { method: 'POST', body, signal }),
  createTopupCharge: (body: CreateTopupChargeRequest, signal?: AbortSignal) =>
    request(`/Config/CreateTopupCharge`, { method: 'POST', body, signal }),
  updateTopupCharge: (body: UpdateTopupChargeRequest, signal?: AbortSignal) =>
    request(`/Config/UpdateTopupCharge`, { method: 'POST', body, signal }),
  deleteTopupCharge: (topupChargeId: number, signal?: AbortSignal) =>
    request(`/Config/DeleteTopupCharge/${encodeURIComponent(String(topupChargeId))}`, {
      method: 'DELETE',
      signal,
    }),
  getTopupChargeById: (topupChargeId: number, signal?: AbortSignal) =>
    request(
      `/Config/GetTopupChargeByID?topupChargeId=${encodeURIComponent(String(topupChargeId))}`,
      { method: 'GET', signal },
    ),
  getAllTopupCharges: (signal?: AbortSignal) =>
    request(`/Config/GetAllTopupCharges`, { method: 'GET', signal }),
  getActiveTopupCharges: (signal?: AbortSignal) =>
    request(`/Config/GetActiveTopupCharges`, { method: 'GET', signal }),
  getTopupChargesBySlabTypeId: (slabTypeId: number, signal?: AbortSignal) =>
    request(
      `/Config/GetTopupChargesBySlabTypeID?slabTypeId=${encodeURIComponent(String(slabTypeId))}`,
      { method: 'GET', signal },
    ),
  getTopupChargesByCalculationTypeId: (calculationTypeId: number, signal?: AbortSignal) =>
    request(
      `/Config/GetTopupChargesByCalculationTypeID?calculationTypeId=${encodeURIComponent(String(calculationTypeId))}`,
      { method: 'GET', signal },
    ),
  createCommissionDistribution: (body: CreateCommissionDistributionRequest, signal?: AbortSignal) =>
    request(`/Config/CreateCommissionDistribution`, { method: 'POST', body, signal }),
  updateCommissionDistribution: (body: UpdateCommissionDistributionRequest, signal?: AbortSignal) =>
    request(`/Config/UpdateCommissionDistribution`, { method: 'POST', body, signal }),
  deleteCommissionDistribution: (marginConfigrationID: number, signal?: AbortSignal) =>
    request(
      `/Config/DeleteCommissionDistribution/${encodeURIComponent(String(marginConfigrationID))}`,
      { method: 'DELETE', signal },
    ),
  getCommissionDistributionById: (marginConfigrationID: number, signal?: AbortSignal) =>
    request(
      `/Config/GetCommissionDistributionByID?marginConfigrationID=${encodeURIComponent(String(marginConfigrationID))}`,
      { method: 'GET', signal },
    ),
  getAllCommissionDistributions: (signal?: AbortSignal) =>
    request(`/Config/GetAllCommissionDistributions`, { method: 'GET', signal }),
  getActiveCommissionDistributions: (signal?: AbortSignal) =>
    request(`/Config/GetActiveCommissionDistributions`, { method: 'GET', signal }),
  getCommissionDistributionsByAgencyId: (agencyId: number, signal?: AbortSignal) =>
    request(
      `/Config/GetCommissionDistributionsByAgencyID?agencyId=${encodeURIComponent(String(agencyId))}`,
      { method: 'GET', signal },
    ),
  getCommissionDistributionsByServiceId: (serviceId: number, signal?: AbortSignal) =>
    request(
      `/Config/GetCommissionDistributionsByServiceID?serviceId=${encodeURIComponent(String(serviceId))}`,
      { method: 'GET', signal },
    ),
  getCommissionDistributionsByPlanId: (planId: number, signal?: AbortSignal) =>
    request(
      `/Config/GetCommissionDistributionsByPlanID?planId=${encodeURIComponent(String(planId))}`,
      { method: 'GET', signal },
    ),
  getCommissionDistributionsByAgencyService: (
    agencyId: number,
    serviceId: number,
    signal?: AbortSignal,
  ) =>
    request(
      `/Config/GetCommissionDistributionsByAgencyService?agencyId=${encodeURIComponent(String(agencyId))}&serviceId=${encodeURIComponent(String(serviceId))}`,
      { method: 'GET', signal },
    ),
  createTransactionSlab: (body: CreateTransactionSlabRequest, signal?: AbortSignal) =>
    request(`/Config/CreateTransactionSlab`, { method: 'POST', body, signal }),
  updateTransactionSlab: (body: UpdateTransactionSlabRequest, signal?: AbortSignal) =>
    request(`/Config/UpdateTransactionSlab`, { method: 'POST', body, signal }),
  deleteTransactionSlab: (slabId: number, signal?: AbortSignal) =>
    request(`/Config/DeleteTransactionSlab/${encodeURIComponent(String(slabId))}`, {
      method: 'DELETE',
      signal,
    }),
  getTransactionSlabById: (slabId: number, signal?: AbortSignal) =>
    request(`/Config/GetTransactionSlabByID?slabId=${encodeURIComponent(String(slabId))}`, {
      method: 'GET',
      signal,
    }),
  getAllTransactionSlabs: (signal?: AbortSignal) =>
    request(`/Config/GetAllTransactionSlabs`, { method: 'GET', signal }),
  getActiveTransactionSlabs: (signal?: AbortSignal) =>
    request(`/Config/GetActiveTransactionSlabs`, { method: 'GET', signal }),
  getTransactionSlabsByPlanId: (planId: number, signal?: AbortSignal) =>
    request(`/Config/GetTransactionSlabsByPlanID?planId=${encodeURIComponent(String(planId))}`, {
      method: 'GET',
      signal,
    }),
  getTransactionSlabsByAgencyId: (agencyID: number, signal?: AbortSignal) =>
    request(
      `/Config/GetTransactionSlabsByAgencyID?agencyID=${encodeURIComponent(String(agencyID))}`,
      { method: 'GET', signal },
    ),
  getTransactionSlabsByServiceId: (serviceID: number, signal?: AbortSignal) =>
    request(
      `/Config/GetTransactionSlabsByServiceID?serviceID=${encodeURIComponent(String(serviceID))}`,
      { method: 'GET', signal },
    ),
  getTransactionSlabsByAgencyService: (agencyID: number, serviceID: number, signal?: AbortSignal) =>
    request(
      `/Config/GetTransactionSlabsByAgencyService?agencyID=${encodeURIComponent(String(agencyID))}&serviceID=${encodeURIComponent(String(serviceID))}`,
      { method: 'GET', signal },
    ),
};
