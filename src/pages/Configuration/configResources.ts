import {
  ConfigService,
  type GetServicePolicyRequest,
  type AddTxnslabRequest,
  type CreateTopupChargeRequest,
  type UpdateTopupChargeRequest,
  type CreateCommissionDistributionRequest,
  type UpdateCommissionDistributionRequest,
  type CreateTransactionSlabRequest,
  type UpdateTransactionSlabRequest,
} from '../../services/ConfigService';
import type { ApiResponse } from '../../core/types';
export type Values = Record<string, string | number | null>;
export type ConfigField = { key: string; type: string; nullable: boolean };
export type ConfigOperation = {
  fields: ConfigField[];
  run: (values: Values, signal?: AbortSignal) => Promise<ApiResponse<unknown>>;
};
export const configOperations = {
  GetServicePolicy: {
    fields: [
      { key: 'ServiceId', type: 'integer', nullable: false },
      { key: 'Agencyid', type: 'integer', nullable: false },
      { key: 'PolicyId', type: 'integer', nullable: false },
      { key: 'PolicyKey', type: 'string', nullable: true },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getServicePolicy(values as unknown as GetServicePolicyRequest, signal),
  },
  AddTransacttionSlab: {
    fields: [
      { key: 'PlanId', type: 'integer', nullable: false },
      { key: 'AgencyID', type: 'integer', nullable: false },
      { key: 'ServiceID', type: 'integer', nullable: false },
      { key: 'FromAmount', type: 'number', nullable: false },
      { key: 'ToAmount', type: 'number', nullable: false },
      { key: 'SlabType', type: 'integer', nullable: false },
      { key: 'CalculationType', type: 'integer', nullable: false },
      { key: 'CalculationValue', type: 'number', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.addTransacttionSlab(values as unknown as AddTxnslabRequest, signal),
  },
  CreateTopupCharge: {
    fields: [
      { key: 'FromAmount', type: 'number', nullable: true },
      { key: 'Toamount', type: 'number', nullable: true },
      { key: 'SlabTypeId', type: 'integer', nullable: true },
      { key: 'CalculationTypeId', type: 'integer', nullable: true },
      { key: 'CalculationValue', type: 'number', nullable: true },
      { key: 'Status', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.createTopupCharge(values as unknown as CreateTopupChargeRequest, signal),
  },
  UpdateTopupCharge: {
    fields: [
      { key: 'TopupChargeId', type: 'integer', nullable: false },
      { key: 'FromAmount', type: 'number', nullable: true },
      { key: 'Toamount', type: 'number', nullable: true },
      { key: 'SlabTypeId', type: 'integer', nullable: true },
      { key: 'CalculationTypeId', type: 'integer', nullable: true },
      { key: 'CalculationValue', type: 'number', nullable: true },
      { key: 'Status', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.updateTopupCharge(values as unknown as UpdateTopupChargeRequest, signal),
  },
  DeleteTopupCharge: {
    fields: [{ key: 'topupChargeId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.deleteTopupCharge(Number(values.topupChargeId), signal),
  },
  GetTopupChargeByID: {
    fields: [{ key: 'topupChargeId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTopupChargeById(Number(values.topupChargeId), signal),
  },
  GetAllTopupCharges: {
    fields: [],
    run: (values: Values, signal?: AbortSignal) => ConfigService.getAllTopupCharges(signal),
  },
  GetActiveTopupCharges: {
    fields: [],
    run: (values: Values, signal?: AbortSignal) => ConfigService.getActiveTopupCharges(signal),
  },
  GetTopupChargesBySlabTypeID: {
    fields: [{ key: 'slabTypeId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTopupChargesBySlabTypeId(Number(values.slabTypeId), signal),
  },
  GetTopupChargesByCalculationTypeID: {
    fields: [{ key: 'calculationTypeId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTopupChargesByCalculationTypeId(Number(values.calculationTypeId), signal),
  },
  CreateCommissionDistribution: {
    fields: [
      { key: 'AgencyId', type: 'integer', nullable: false },
      { key: 'ServiceId', type: 'integer', nullable: false },
      { key: 'PlanId', type: 'integer', nullable: true },
      { key: 'FromAmount', type: 'number', nullable: true },
      { key: 'Toamount', type: 'number', nullable: true },
      { key: 'CalculationTypeId', type: 'integer', nullable: true },
      { key: 'CalculationValue', type: 'number', nullable: true },
      { key: 'Status', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.createCommissionDistribution(
        values as unknown as CreateCommissionDistributionRequest,
        signal,
      ),
  },
  UpdateCommissionDistribution: {
    fields: [
      { key: 'MarginConfigrationID', type: 'integer', nullable: false },
      { key: 'AgencyId', type: 'integer', nullable: false },
      { key: 'ServiceId', type: 'integer', nullable: false },
      { key: 'PlanId', type: 'integer', nullable: true },
      { key: 'FromAmount', type: 'number', nullable: true },
      { key: 'Toamount', type: 'number', nullable: true },
      { key: 'CalculationTypeId', type: 'integer', nullable: true },
      { key: 'CalculationValue', type: 'number', nullable: true },
      { key: 'Status', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.updateCommissionDistribution(
        values as unknown as UpdateCommissionDistributionRequest,
        signal,
      ),
  },
  DeleteCommissionDistribution: {
    fields: [{ key: 'marginConfigrationID', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.deleteCommissionDistribution(Number(values.marginConfigrationID), signal),
  },
  GetCommissionDistributionByID: {
    fields: [{ key: 'marginConfigrationID', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getCommissionDistributionById(Number(values.marginConfigrationID), signal),
  },
  GetAllCommissionDistributions: {
    fields: [],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getAllCommissionDistributions(signal),
  },
  GetActiveCommissionDistributions: {
    fields: [],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getActiveCommissionDistributions(signal),
  },
  GetCommissionDistributionsByAgencyID: {
    fields: [{ key: 'agencyId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getCommissionDistributionsByAgencyId(Number(values.agencyId), signal),
  },
  GetCommissionDistributionsByServiceID: {
    fields: [{ key: 'serviceId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getCommissionDistributionsByServiceId(Number(values.serviceId), signal),
  },
  GetCommissionDistributionsByPlanID: {
    fields: [{ key: 'planId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getCommissionDistributionsByPlanId(Number(values.planId), signal),
  },
  GetCommissionDistributionsByAgencyService: {
    fields: [
      { key: 'agencyId', type: 'integer', nullable: false },
      { key: 'serviceId', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getCommissionDistributionsByAgencyService(
        Number(values.agencyId),
        Number(values.serviceId),
        signal,
      ),
  },
  CreateTransactionSlab: {
    fields: [
      { key: 'PlanId', type: 'integer', nullable: true },
      { key: 'AgencyID', type: 'integer', nullable: true },
      { key: 'ServiceID', type: 'integer', nullable: true },
      { key: 'FromAmount', type: 'number', nullable: true },
      { key: 'ToAmount', type: 'number', nullable: true },
      { key: 'SlabType', type: 'integer', nullable: true },
      { key: 'CalculationType', type: 'integer', nullable: true },
      { key: 'CalculationValue', type: 'number', nullable: true },
      { key: 'Status', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.createTransactionSlab(
        values as unknown as CreateTransactionSlabRequest,
        signal,
      ),
  },
  UpdateTransactionSlab: {
    fields: [
      { key: 'SlabId', type: 'integer', nullable: false },
      { key: 'PlanId', type: 'integer', nullable: true },
      { key: 'AgencyID', type: 'integer', nullable: true },
      { key: 'ServiceID', type: 'integer', nullable: true },
      { key: 'FromAmount', type: 'number', nullable: true },
      { key: 'ToAmount', type: 'number', nullable: true },
      { key: 'SlabType', type: 'integer', nullable: true },
      { key: 'CalculationType', type: 'integer', nullable: true },
      { key: 'CalculationValue', type: 'number', nullable: true },
      { key: 'Status', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.updateTransactionSlab(
        values as unknown as UpdateTransactionSlabRequest,
        signal,
      ),
  },
  DeleteTransactionSlab: {
    fields: [{ key: 'slabId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.deleteTransactionSlab(Number(values.slabId), signal),
  },
  GetTransactionSlabByID: {
    fields: [{ key: 'slabId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTransactionSlabById(Number(values.slabId), signal),
  },
  GetAllTransactionSlabs: {
    fields: [],
    run: (values: Values, signal?: AbortSignal) => ConfigService.getAllTransactionSlabs(signal),
  },
  GetActiveTransactionSlabs: {
    fields: [],
    run: (values: Values, signal?: AbortSignal) => ConfigService.getActiveTransactionSlabs(signal),
  },
  GetTransactionSlabsByPlanID: {
    fields: [{ key: 'planId', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTransactionSlabsByPlanId(Number(values.planId), signal),
  },
  GetTransactionSlabsByAgencyID: {
    fields: [{ key: 'agencyID', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTransactionSlabsByAgencyId(Number(values.agencyID), signal),
  },
  GetTransactionSlabsByServiceID: {
    fields: [{ key: 'serviceID', type: 'integer', nullable: false }],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTransactionSlabsByServiceId(Number(values.serviceID), signal),
  },
  GetTransactionSlabsByAgencyService: {
    fields: [
      { key: 'agencyID', type: 'integer', nullable: false },
      { key: 'serviceID', type: 'integer', nullable: false },
    ],
    run: (values: Values, signal?: AbortSignal) =>
      ConfigService.getTransactionSlabsByAgencyService(
        Number(values.agencyID),
        Number(values.serviceID),
        signal,
      ),
  },
} satisfies Record<string, ConfigOperation>;
export type OperationKey = keyof typeof configOperations;
export type ConfigResource = {
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
export const configResources: Record<string, ConfigResource> = {
  topup: {
    title: 'Top-up charges',
    singular: 'top-up charge',
    id: 'TopupChargeId',
    hiddenColumns: ['Status', 'CalculationTypeId', 'SlabTypeId'],
    list: 'GetAllTopupCharges',
    active: 'GetActiveTopupCharges',
    create: 'CreateTopupCharge',
    update: 'UpdateTopupCharge',
    detail: 'GetTopupChargeByID',
    remove: 'DeleteTopupCharge',
    searches: [
      { label: 'Slab Type ID', operation: 'GetTopupChargesBySlabTypeID' },
      { label: 'Calculation Type ID', operation: 'GetTopupChargesByCalculationTypeID' },
    ],
  },
  commission: {
    title: 'Commission distributions',
    singular: 'commission distribution',
    id: 'MarginConfigrationID',
    hiddenColumns: ['AgencyId', 'ServiceId', 'PlanId', 'CalculationTypeId', 'Status'],
    list: 'GetAllCommissionDistributions',
    active: 'GetActiveCommissionDistributions',
    create: 'CreateCommissionDistribution',
    update: 'UpdateCommissionDistribution',
    detail: 'GetCommissionDistributionByID',
    remove: 'DeleteCommissionDistribution',
    searches: [
      { label: 'Agency ID', operation: 'GetCommissionDistributionsByAgencyID' },
      { label: 'Service ID', operation: 'GetCommissionDistributionsByServiceID' },
      { label: 'Plan ID', operation: 'GetCommissionDistributionsByPlanID' },
      { label: 'Agency Service', operation: 'GetCommissionDistributionsByAgencyService' },
    ],
  },
  transaction: {
    title: 'Transaction slabs',
    singular: 'transaction slab',
    id: 'SlabId',
    hiddenColumns: ['PlanId', 'AgencyID', 'ServiceID', 'SlabType', 'CalculationType', 'Status'],
    list: 'GetAllTransactionSlabs',
    active: 'GetActiveTransactionSlabs',
    create: 'CreateTransactionSlab',
    update: 'UpdateTransactionSlab',
    detail: 'GetTransactionSlabByID',
    remove: 'DeleteTransactionSlab',
    searches: [
      { label: 'Plan ID', operation: 'GetTransactionSlabsByPlanID' },
      { label: 'Agency ID', operation: 'GetTransactionSlabsByAgencyID' },
      { label: 'Service ID', operation: 'GetTransactionSlabsByServiceID' },
      { label: 'Agency Service', operation: 'GetTransactionSlabsByAgencyService' },
    ],
  },
};
