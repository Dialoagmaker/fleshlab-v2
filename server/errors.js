export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const unavailable = (name) => new HttpError(
  501,
  'MIGRATION_NOT_IMPLEMENTED',
  `${name} is not yet available on the Azure migration runtime.`
);
