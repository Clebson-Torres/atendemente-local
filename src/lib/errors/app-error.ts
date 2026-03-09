export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, options?: { statusCode?: number; code?: string }) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode ?? 400;
    this.code = options?.code ?? "APP_ERROR";
  }
}
