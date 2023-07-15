export class LoginError extends Error {

    detail:ErrorDetail;

    constructor(detail:ErrorDetail) {
        super(detail.message)
        this.message = detail.message
        this.detail = detail
        Object.setPrototypeOf(this, LoginError.prototype);
    }
}