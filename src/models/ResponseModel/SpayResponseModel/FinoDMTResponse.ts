export class SpBaseResponse {
  status!: boolean;
  response_code!: string;
  message!: string | null;
  data: any;
}
