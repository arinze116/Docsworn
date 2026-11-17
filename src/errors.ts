export class DocswornError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class InputError extends DocswornError {}
export class CommandTimeoutError extends DocswornError {}
export class ExternalServiceError extends DocswornError {}
