import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../core/api';
import { configOperations, type OperationKey } from '../pages/Configuration/configResources';
vi.mock('../core/api', () => ({ request: vi.fn().mockResolvedValue({ Result: [] }) }));
afterEach(() => vi.clearAllMocks());
// Request contracts captured from the Config controller Swagger document.
const cases: { name: string; values: Record<string, string | number | null>; url: string; method: string; body?: Record<string, string | number | null> }[] = [
  {
    name: 'GetServicePolicy',
    values: {
      ServiceId: 2,
      Agencyid: 2,
      PolicyId: 2,
      PolicyKey: 'sample & value',
    },
    url: '/Config/GetServicePolicy',
    method: 'POST',
    body: {
      ServiceId: 2,
      Agencyid: 2,
      PolicyId: 2,
      PolicyKey: 'sample & value',
    },
  },
  {
    name: 'AddTransacttionSlab',
    values: {
      PlanId: 2,
      AgencyID: 2,
      ServiceID: 2,
      FromAmount: 2,
      ToAmount: 2,
      SlabType: 2,
      CalculationType: 2,
      CalculationValue: 2,
    },
    url: '/Config/AddTransacttionSlab',
    method: 'POST',
    body: {
      PlanId: 2,
      AgencyID: 2,
      ServiceID: 2,
      FromAmount: 2,
      ToAmount: 2,
      SlabType: 2,
      CalculationType: 2,
      CalculationValue: 2,
    },
  },
  {
    name: 'CreateTopupCharge',
    values: {
      FromAmount: 2,
      Toamount: 2,
      SlabTypeId: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
    url: '/Config/CreateTopupCharge',
    method: 'POST',
    body: {
      FromAmount: 2,
      Toamount: 2,
      SlabTypeId: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
  },
  {
    name: 'UpdateTopupCharge',
    values: {
      TopupChargeId: 2,
      FromAmount: 2,
      Toamount: 2,
      SlabTypeId: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
    url: '/Config/UpdateTopupCharge',
    method: 'POST',
    body: {
      TopupChargeId: 2,
      FromAmount: 2,
      Toamount: 2,
      SlabTypeId: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
  },
  {
    name: 'DeleteTopupCharge',
    values: {
      topupChargeId: 2,
    },
    url: '/Config/DeleteTopupCharge/2',
    method: 'DELETE',
  },
  {
    name: 'GetTopupChargeByID',
    values: {
      topupChargeId: 2,
    },
    url: '/Config/GetTopupChargeByID?topupChargeId=2',
    method: 'GET',
  },
  {
    name: 'GetAllTopupCharges',
    values: {},
    url: '/Config/GetAllTopupCharges',
    method: 'GET',
  },
  {
    name: 'GetActiveTopupCharges',
    values: {},
    url: '/Config/GetActiveTopupCharges',
    method: 'GET',
  },
  {
    name: 'GetTopupChargesBySlabTypeID',
    values: {
      slabTypeId: 2,
    },
    url: '/Config/GetTopupChargesBySlabTypeID?slabTypeId=2',
    method: 'GET',
  },
  {
    name: 'GetTopupChargesByCalculationTypeID',
    values: {
      calculationTypeId: 2,
    },
    url: '/Config/GetTopupChargesByCalculationTypeID?calculationTypeId=2',
    method: 'GET',
  },
  {
    name: 'CreateCommissionDistribution',
    values: {
      AgencyId: 2,
      ServiceId: 2,
      PlanId: 2,
      FromAmount: 2,
      Toamount: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
    url: '/Config/CreateCommissionDistribution',
    method: 'POST',
    body: {
      AgencyId: 2,
      ServiceId: 2,
      PlanId: 2,
      FromAmount: 2,
      Toamount: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
  },
  {
    name: 'UpdateCommissionDistribution',
    values: {
      MarginConfigrationID: 2,
      AgencyId: 2,
      ServiceId: 2,
      PlanId: 2,
      FromAmount: 2,
      Toamount: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
    url: '/Config/UpdateCommissionDistribution',
    method: 'POST',
    body: {
      MarginConfigrationID: 2,
      AgencyId: 2,
      ServiceId: 2,
      PlanId: 2,
      FromAmount: 2,
      Toamount: 2,
      CalculationTypeId: 2,
      CalculationValue: 2,
      Status: 2,
    },
  },
  {
    name: 'DeleteCommissionDistribution',
    values: {
      marginConfigrationID: 2,
    },
    url: '/Config/DeleteCommissionDistribution/2',
    method: 'DELETE',
  },
  {
    name: 'GetCommissionDistributionByID',
    values: {
      marginConfigrationID: 2,
    },
    url: '/Config/GetCommissionDistributionByID?marginConfigrationID=2',
    method: 'GET',
  },
  {
    name: 'GetAllCommissionDistributions',
    values: {},
    url: '/Config/GetAllCommissionDistributions',
    method: 'GET',
  },
  {
    name: 'GetActiveCommissionDistributions',
    values: {},
    url: '/Config/GetActiveCommissionDistributions',
    method: 'GET',
  },
  {
    name: 'GetCommissionDistributionsByAgencyID',
    values: {
      agencyId: 2,
    },
    url: '/Config/GetCommissionDistributionsByAgencyID?agencyId=2',
    method: 'GET',
  },
  {
    name: 'GetCommissionDistributionsByServiceID',
    values: {
      serviceId: 2,
    },
    url: '/Config/GetCommissionDistributionsByServiceID?serviceId=2',
    method: 'GET',
  },
  {
    name: 'GetCommissionDistributionsByPlanID',
    values: {
      planId: 2,
    },
    url: '/Config/GetCommissionDistributionsByPlanID?planId=2',
    method: 'GET',
  },
  {
    name: 'GetCommissionDistributionsByAgencyService',
    values: {
      agencyId: 2,
      serviceId: 2,
    },
    url: '/Config/GetCommissionDistributionsByAgencyService?agencyId=2&serviceId=2',
    method: 'GET',
  },
  {
    name: 'CreateTransactionSlab',
    values: {
      PlanId: 2,
      AgencyID: 2,
      ServiceID: 2,
      FromAmount: 2,
      ToAmount: 2,
      SlabType: 2,
      CalculationType: 2,
      CalculationValue: 2,
      Status: 2,
    },
    url: '/Config/CreateTransactionSlab',
    method: 'POST',
    body: {
      PlanId: 2,
      AgencyID: 2,
      ServiceID: 2,
      FromAmount: 2,
      ToAmount: 2,
      SlabType: 2,
      CalculationType: 2,
      CalculationValue: 2,
      Status: 2,
    },
  },
  {
    name: 'UpdateTransactionSlab',
    values: {
      SlabId: 2,
      PlanId: 2,
      AgencyID: 2,
      ServiceID: 2,
      FromAmount: 2,
      ToAmount: 2,
      SlabType: 2,
      CalculationType: 2,
      CalculationValue: 2,
      Status: 2,
    },
    url: '/Config/UpdateTransactionSlab',
    method: 'POST',
    body: {
      SlabId: 2,
      PlanId: 2,
      AgencyID: 2,
      ServiceID: 2,
      FromAmount: 2,
      ToAmount: 2,
      SlabType: 2,
      CalculationType: 2,
      CalculationValue: 2,
      Status: 2,
    },
  },
  {
    name: 'DeleteTransactionSlab',
    values: {
      slabId: 2,
    },
    url: '/Config/DeleteTransactionSlab/2',
    method: 'DELETE',
  },
  {
    name: 'GetTransactionSlabByID',
    values: {
      slabId: 2,
    },
    url: '/Config/GetTransactionSlabByID?slabId=2',
    method: 'GET',
  },
  {
    name: 'GetAllTransactionSlabs',
    values: {},
    url: '/Config/GetAllTransactionSlabs',
    method: 'GET',
  },
  {
    name: 'GetActiveTransactionSlabs',
    values: {},
    url: '/Config/GetActiveTransactionSlabs',
    method: 'GET',
  },
  {
    name: 'GetTransactionSlabsByPlanID',
    values: {
      planId: 2,
    },
    url: '/Config/GetTransactionSlabsByPlanID?planId=2',
    method: 'GET',
  },
  {
    name: 'GetTransactionSlabsByAgencyID',
    values: {
      agencyID: 2,
    },
    url: '/Config/GetTransactionSlabsByAgencyID?agencyID=2',
    method: 'GET',
  },
  {
    name: 'GetTransactionSlabsByServiceID',
    values: {
      serviceID: 2,
    },
    url: '/Config/GetTransactionSlabsByServiceID?serviceID=2',
    method: 'GET',
  },
  {
    name: 'GetTransactionSlabsByAgencyService',
    values: {
      agencyID: 2,
      serviceID: 2,
    },
    url: '/Config/GetTransactionSlabsByAgencyService?agencyID=2&serviceID=2',
    method: 'GET',
  },
];
it.each(cases)('$name matches the documented request', async (item) => {
  const signal = new AbortController().signal;
  await configOperations[item.name as OperationKey].run(item.values, signal);
  expect(request).toHaveBeenCalledWith(item.url, {
    method: item.method,
    signal,
    ...('body' in item ? { body: item.body } : {}),
  });
});
