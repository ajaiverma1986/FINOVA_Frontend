import { operationRequest } from '../core/api';
import { operations } from './operations';
import type { Fields } from '../core/types';

export const SysMgrService = {
  CreateNewRoles: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['SysMgrService.CreateNewRoles'], values, signal),
  GetallRoles: (values: Fields = {}, signal?: AbortSignal) =>
    operationRequest(operations['SysMgrService.GetallRoles'], values, signal),
};
