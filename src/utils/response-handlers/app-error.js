class AppError extends Error {
  constructor(message, statusCode) {
    message = typeof message == String ? message : JSON.stringify(message);
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
export default AppError;
