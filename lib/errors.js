// An error that carries an HTTP status, so services can say "404" or "409"
// without knowing anything about Next.js.
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}
