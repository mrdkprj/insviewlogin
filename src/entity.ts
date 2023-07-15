export class LoginError extends Error {

    detail:ErrorDetail;

    constructor(detail:ErrorDetail) {
        super(detail.message)
        this.message = detail.message
        this.detail = detail
        Object.setPrototypeOf(this, LoginError.prototype);

        Object.defineProperty(this, 'name', {
            configurable: true,
            enumerable: false,
            value: this.constructor.name,
            writable: true,
        });

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LoginError);
        }
    }
}