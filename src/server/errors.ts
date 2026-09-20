export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super("Product validation failed.");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends Error {
  constructor(message = "Product not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}
