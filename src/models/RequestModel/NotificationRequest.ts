// Property names and optionality follow the Notification Swagger schemas.
export interface CreateSMSGatewayRequest {
  SMSGatewayName?: string | null;
  GatewayURL?: string | null;
  UserName?: string | null;
  Password?: string | null;
  SenderID?: string | null;
  ReponseSuccess?: string | null;
  ReponseError?: string | null;
  Status?: number;
}

export interface UpdateSMSGatewayRequest extends CreateSMSGatewayRequest {
  SMSGatewayID?: number;
}

export interface CreateEmailGatewayRequest {
  SMTPServer?: string | null;
  SMTPPort?: number;
  SMTPEnableSSL?: boolean;
  SMTPUsername?: string | null;
  SMTPPassword?: string | null;
  SMTPSenderEmail?: string | null;
  SMTPSenderName?: string | null;
  Status?: number;
}

export interface UpdateEmailGatewayRequest extends CreateEmailGatewayRequest {
  EmailGatewayID?: number;
}

export interface CreateTemplateRequest {
  TemplateID?: number;
  TemplateTypeId?: number | null;
  ServiceType?: string | null;
  TemplateName?: string | null;
  TemplateMsg?: string | null;
  Status?: number;
}

export interface UpdateTemplateRequest extends CreateTemplateRequest {
  TemplateID: number;
}

export interface GetTemplateRequest {
  TemplateTypeId?: number | null;
  ServiceType?: string | null;
  Status?: number | null;
}

export interface GetActiveTemplateRequest {
  TemplateTypeId?: number | null;
  ServiceType?: string | null;
  TemplateName?: string | null;
}

export interface CreateTemplateTypeRequest {
  TemplateTypeName?: string | null;
  Description?: string | null;
  Status?: number;
}

export interface CreateServiceTypeRequest {
  ServiceTypeName?: string | null;
  Description?: string | null;
  Status?: number;
}

export interface TemplateType {
  TemplateTypeId: number;
  TemplateTypeName?: string | null;
  Description?: string | null;
  Status?: number;
  StatusName?: string | null;
}
