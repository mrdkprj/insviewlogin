import axios, { AxiosRequestConfig, AxiosRequestHeaders } from "axios";
import { baseUrl, createHeaders, getAppId, getClientVersion, getSession, CookieStore, updateSession, logError, extractCsrfToken } from "./util";
import { LoginError } from "entity";

const login = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("---------- login start ----------")

    const account = req.data.account;

    let session = getSession({});
    session.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"//req.headers["user-agent"];
    const headers = createHeaders(baseUrl, session);
    let cookies = [];
    const jar = new CookieStore();

    try{

        const options :AxiosRequestConfig= {};

        headers.Cookie = "ig_cb=1"
        headers["X-Instagram-Ajax"] = 1;
        options.url = baseUrl;
        options.method = "GET"
        options.headers = headers;
        let response = await axios.request(options);

        const xHeaders :IgHeaders = {
            appId: getAppId(response.data),
            ajax: getClientVersion(response.data)
        }

        session.csrfToken = extractCsrfToken(response.data)

        cookies = await jar.storeCookie(response.headers["set-cookie"])

        headers["X-Ig-App-Id"] = xHeaders.appId
        headers.Cookie = await jar.getCookieStrings();
        session = updateSession(session, cookies, xHeaders)

//-----
        headers["X-Asbd-Id"] = 129477;
        headers["X-Ig-Www-Claim"] = 0
        headers["X-Instagram-Ajax"] = xHeaders.ajax
        headers["X-Csrftoken"] = session.csrfToken;
        options.url = "https://www.instagram.com/api/v1/public/landing_info/";
        options.method = "GET"
        options.headers = headers;

        response = await axios.request(options);

        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies, xHeaders)
        headers.Cookie = await jar.getCookieStrings()

        const x = 10;
        if(x > 0){
            return {
                data:{account, success:session.isAuthenticated, challenge:false, endpoint:""},
                session
            }
        }
//----

        headers["X-Asbd-Id"] = 129477;
        headers["X-Ig-Www-Claim"] = 0
        headers["X-Instagram-Ajax"] = xHeaders.ajax
        headers["X-Csrftoken"] = session.csrfToken;
        headers["content-type"] = "application/x-www-form-urlencoded"

        const createEncPassword = (pwd:string) => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Math.floor(Date.now() / 1000)}:${pwd}`
        }

        const params = new URLSearchParams();
        params.append("enc_password", createEncPassword(req.data.password))
        params.append("username", account)
        params.append("queryParams", "{}")
        params.append("optIntoOneTap", "false")
        params.append("trustedDeviceRecords", "{}")

        options.url = "https://www.instagram.com/api/v1/web/accounts/login/ajax/"
        options.method = "POST"
        options.data = params;
        options.headers = headers;
console.log(headers)
        response = await axios.request(options);

        console.log("----------auth response-------")
        console.log(response.data)

        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);

        const data = {account, success:session.isAuthenticated, challenge:false, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){

        if(ex.response && ex.response.data.message && ex.response.data.message === "checkpoint_required"){

            console.log("------------- checkpoint required ------------")
            console.log(ex.response.data)
            cookies = await jar.storeCookie(ex.response.headers["set-cookie"]);
            session = updateSession(session, cookies);
            headers["X-Csrftoken"] = session.csrfToken;
            headers.Cookie = await jar.getCookieStrings()

            return await requestChallenge(account, ex.response.data.checkpoint_url, headers, session, jar)

        }

        const error = logError(ex)

        throw new LoginError(error)
    }
}

const requestChallenge = async (account:string, checkpoint:string, headers:AxiosRequestHeaders, session:ISession, jar:CookieStore) :Promise<IgResponse<ILoginResponse>> => {


    console.log("---------- checkpoint start -------")

    try{

        const options :AxiosRequestConfig= {};

        const url = "https://www.instagram.com" + new URL(checkpoint).pathname.replace("/challenge/","/challenge/action/");

        options.url = checkpoint;
        options.method = "GET";
        options.headers = headers;

        let response = await axios.request(options);
console.log(response.headers)
        let cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies)

        headers["referer"] = url
        headers["X-Csrftoken"] = session.csrfToken;
        headers.Cookie = await jar.getCookieStrings();

        const params = new URLSearchParams();
        params.append("choice", "1")

        options.data = params;
        options.method = "POST"
        options.headers = headers;
        console.log(url)
        console.log(headers)

        response = await axios.request(options);

        console.log("---------- challenge response -------")
        console.log(response.data)
        console.log(response.headers)

        cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies)

        if(response.data.type && response.data.type === "CHALLENGE"){

            return {
                data:{account:account, success:false, challenge: true, endpoint:url},
                session
            }
        }

        return {
            data:{account:response.data, success:false, challenge: true, endpoint:url},
            session
        }

    }catch(ex:any){

        const error = logError(ex)

        throw new LoginError(error)

    }

}

const challenge = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("-------------- code verification start ---------")

    const url = req.data.endpoint;

    const jar = new CookieStore();
    const options :AxiosRequestConfig = {}
    let session = getSession(req.headers);
    const headers = createHeaders(url, session);

    try{

        headers["X-Ig-App-Id"] = session.xHeaders.appId
        headers["X-Ig-Www-Claim"] = 0
        headers["X-Instagram-Ajax"] = session.xHeaders.ajax
        headers["content-type"] = "application/x-www-form-urlencoded"

        await jar.storeRequestCookie(req.headers.cookie)
        headers.Cookie = await jar.getCookieStrings()
        console.log(headers)
        const params = new URLSearchParams();
        params.append("security_code", req.data.code)

        options.url = url;
        options.data = params;
        options.method = "POST"
        options.headers = headers;

        const response = await axios.request(options);

        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies);
        const data = {account:req.data.account, success:session.isAuthenticated, challenge:!session.isAuthenticated, endpoint:""};

        console.log(response.data)

        return {
            data,
            session
        }

    }catch(ex:any){

        const error = logError(ex);
        console.log(error.data)

        throw new LoginError({message:"Code verification failed", data:{account:req.data.account, success:false, challenge:true, endpoint:req.data.endpoint}, requireLogin:true})
    }

}

const logout = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>>  => {

    const jar = new CookieStore();

    let session = getSession(req.headers);

    if(!session.isAuthenticated) throw new Error("Already logged out")

    try{

        const url = "https://www.instagram.com/api/v1/web/accounts/logout/ajax/";

        const headers = createHeaders(baseUrl, session);
        headers["X-Ig-App-Id"] = session.xHeaders.appId
        headers["X-Ig-Www-Claim"] = 0
        headers["X-Instagram-Ajax"] = session.xHeaders.ajax
        headers["content-type"] = "application/x-www-form-urlencoded"

        await jar.storeRequestCookie(req.headers.cookie)
        headers.Cookie = await jar.getCookieStrings();

        const options :AxiosRequestConfig = {
            url,
            method: "POST",
            headers,
        }

        const response = await axios.request(options);

        console.log(response.data)
        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies);

        const data = {account:"", success:true, challenge:false, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){
        return {
            data:{account:"", success:true, challenge:false, endpoint:""},
            session
        }
    }
}

export {login, challenge, logout}