import { IncomingHttpHeaders } from "http";
import { Cookie } from "tough-cookie";
declare global {
interface IResponse<T> {
    status: boolean;
    data: T;
}

interface IUser{
    id:string;
    igId:string;
    isPro:boolean;
    username:string;
    name:string;
    profileImage:string;
    biography:string;
    following:boolean;
}

interface ILoginResponse {
    account:string;
    success:boolean;
    challenge:boolean;
    endpoint:string;
}

interface IgHeaders {
    appId:string;
    ajax:string;
}

const IgHeaderNames = {
    appId:"x_app_id",
    ajax:"x_ajax"
}

interface IgRequest{
    data:any;
    headers:IncomingHttpHeaders;
}

interface IgResponse<T>{
    data:T;
    session: ISession;
}

interface ISession {
    isAuthenticated:boolean;
    csrfToken:string;
    userId:string;
    cookies: Cookie[];
    expires: Date | null;
    xHeaders:IgHeaders;
    userAgent?:string;
}

}
