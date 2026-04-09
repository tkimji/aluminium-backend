export class AppError extends Error {
  readonly statusCode: number;

  readonly data: unknown;

  constructor(statusCode: number, message: string, data: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class ConflictError extends AppError {
  constructor(message: string, data: unknown = null) {
    super(409, message, data);
    this.name = 'ConflictError';
  }
}
