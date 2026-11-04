export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
  }
}

export interface Reply {
  status: number;
  body?: unknown;
}
