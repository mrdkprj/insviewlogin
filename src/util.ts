import { AxiosRequestHeaders, AxiosResponseHeaders } from "axios";
import tough, { CookieJar } from "tough-cookie";

const baseUrl = "https://www.instagram.com"

const IgHeaderNames = {
    appId:"x_app_id",
    ajax:"x_ajax"
}

const Cookie = tough.Cookie;

const baseRequestHeaders :AxiosRequestHeaders = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US",
    "Authority": "www.instagram.com",
}

const getSession = (headers:any) :ISession => {

    try{

        const session :ISession = {
            isAuthenticated:false,
            csrfToken:"",
            userId:"",
            cookies:[],
            expires: null,
            xHeaders:{appId:"", ajax:""}
        }

        if(!headers.cookie){
            return session;
        }

        const cookies = headers.cookie.split(";")

        cookies.forEach((cookieString:string) => {

            const cookie = Cookie.parse(cookieString);

            if(!cookie){
                return
            }

            const key = cookie.key.toLowerCase();

            if(key === "sessionid" && cookie.value){

                session.isAuthenticated = true;

                if(!cookie.expires){
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (8*60*60*1000));
                    cookie.expires = expires
                }


                if(cookie.expires !== "Infinity"){
                    session.expires = cookie.expires;
                }

            }

            if(key === "csrftoken"){
                session.csrfToken = cookie.value;
            }

            if(key === "ds_user_id"){
                session.userId = cookie.value;
            }

            if(key === IgHeaderNames.appId.toLowerCase()){
                session.xHeaders.appId = cookie.value;
            }

            if(key === IgHeaderNames.ajax.toLowerCase()){
                session.xHeaders.ajax = cookie.value;
            }

            session.cookies.push(cookie);

        })

        return session;

    }catch(ex:any){
        console.log(ex.message);
        throw new Error("cookie error")
    }
}

const updateSession = (currentSession:ISession, cookies:tough.Cookie[], xHeaders?:IgHeaders) => {

    const session :ISession = {
        isAuthenticated:false,
        csrfToken:currentSession.csrfToken,
        userId:currentSession.userId,
        cookies:[],
        expires: currentSession.expires,
        xHeaders: xHeaders ?? currentSession.xHeaders,
    }

    const updatedCookies:{[key:string]:tough.Cookie} = {}

    currentSession.cookies.forEach(cookie => updatedCookies[cookie.key] = cookie)

    cookies.forEach(cookie => updatedCookies[cookie.key] = cookie);

    if(xHeaders){
        const today = new Date();
        const expires = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        const xAjaxCookie = new tough.Cookie();
        xAjaxCookie.key = IgHeaderNames.ajax;
        xAjaxCookie.value = xHeaders.ajax;
        xAjaxCookie.expires = expires;
        xAjaxCookie.path = "/"
        xAjaxCookie.secure = true;
        xAjaxCookie.maxAge = 31449600;
        updatedCookies[xAjaxCookie.key] = xAjaxCookie
        const xAppIdCookie = new tough.Cookie();
        xAppIdCookie.key = IgHeaderNames.appId;
        xAppIdCookie.value = xHeaders.appId;
        xAppIdCookie.expires = expires;
        xAppIdCookie.path = "/"
        xAppIdCookie.secure = true;
        xAppIdCookie.maxAge = 31449600;
        updatedCookies[xAppIdCookie.key] = xAppIdCookie
    }

    Object.values(updatedCookies).forEach((cookie:tough.Cookie) => {

        if(cookie.key.toLowerCase() === "sessionid" && cookie.value){

            session.isAuthenticated = true;

            if(!cookie.expires){
                const expires = new Date();
                expires.setTime(expires.getTime() + (8*60*60*1000));
                cookie.expires = expires
            }


            if(cookie.expires !== "Infinity"){
                session.expires = cookie.expires;
            }

        }

        if(cookie.key.toLowerCase() === "csrftoken"){
            session.csrfToken = cookie.value;
        }

        if(cookie.key.toLowerCase() === "ds_user_id"){
            session.userId = cookie.value;
        }

        session.cookies.push(cookie);

    })

    return session;

}

const createHeaders = (referer:string, session:ISession) :AxiosRequestHeaders => {

    const headers :AxiosRequestHeaders = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com"
    headers["referer"] = referer
    headers["x-requested-with"] = "XMLHttpRequest"
    headers["x-csrftoken"] = session.csrfToken;
    if(session.userAgent){
        headers["user-agent"] = session.userAgent
    }

    return headers;
}

const getAppId = (data:any) => {
    const appIds = data.match(/"customHeaders":{"X-IG-App-ID":"(.*)","X-IG-D"/)
    return appIds[1]
}

const getClientVersion = (data:any) => {
    const version = data.match(/"client_revision":(.*),"tier"/)
    return version[1]
}

const extractUserId = (data:any) => {
    const userId = data.match(/{"query":{"query_hash":".*","user_id":"(.*)","include_chaining"/)
    return userId[1]
}

const extractCsrfToken = (data:any) => {
    const token = data.match(/{"raw":"{\\"config\\":{\\"csrf_token\\":\\"(.*)\\",\\"viewer\\":/)
    //{"raw":"{\"config\":{\"csrf_token\":\"FDLgSfTPUrTDsYHfIoapicYTDCL9JjHH\",\"viewer\":null,\"
    return token[1]
}

const extractToken = (headers:AxiosResponseHeaders) => {

    const setCookieHeader = headers["set-cookie"] || [];

    const cookies :tough.Cookie[] = setCookieHeader.map(c => Cookie.parse(c) || new tough.Cookie());

    const { value: csrftoken } = cookies.find(({ key }) => key === "csrftoken") || {}

    if(!csrftoken){
        return "";
    }

    return csrftoken;
}

const getCookieString = (cookies:string[] | undefined[]) => {

    let setCookieString = "";

    cookies.forEach((cookieString:any) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null){
            return
        }

        setCookieString += `${cookie.key}=${cookie.value};`

    })

    return setCookieString;
}

const updateCookie = (old:string[] | undefined[], cs:string[] | undefined[]) => {

    const cookies:{[key:string]:any} = {}

    old.forEach((c:any) => {
        const cookie = Cookie.parse(c);

        if(!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null){
            return
        }

        cookies[cookie.key] = cookie.value;
    })

    cs.forEach((cookieString:any) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null){
            return
        }

        cookies[cookie.key] = cookie.value;

    })

    let setCookieString = "";

    Object.keys(cookies).forEach((k:any) => {

        setCookieString += `${k}=${cookies[k]};`

    })

    return setCookieString;
}

class CookieStore{

    jar:tough.CookieJar;

    constructor(){
        this.jar = new CookieJar();
    }

    async storeCookie(setCookie:string[] | undefined){

        if(!setCookie){
            return await this.getCookies();
        }

        for (const cookieString of setCookie) {
            await this.jar.setCookie(cookieString, baseUrl, {ignoreError:true});
        }

        return await this.getCookies();
    }

    async storeRequestCookie(cookieHeader:string | undefined){

        if(!cookieHeader){
            return await this.getCookies();
        }

        const excludeKeys = [
            "connect.sid",
            "ARRAffinity",
            "ARRAffinitySameSite",
            IgHeaderNames.ajax,
            IgHeaderNames.appId
        ]

        const validCookies = cookieHeader.split(";").map(item => item.trim()).filter(cookieString => !excludeKeys.some(key => cookieString.includes(key)))

        for (const cookieString of validCookies) {
            await this.jar.setCookie(cookieString, baseUrl, {ignoreError:true});
        }

        return await this.getCookies();
    }

    async getCookieStrings(){
        return await this.jar.getCookieString(baseUrl)
    }

    async getCookies(){
        return await this.jar.getCookies(baseUrl);
    }

}

const logError = (ex:any):ErrorDetail => {

    const hasResponse = !!ex.response
    const errorData = ex.response ? ex.response.data : ex;

    const message = hasResponse ? ex.response.data.message : ex.message;
    let data = hasResponse ? ex.response.data : "";

    if(hasResponse && ex.response.headers["content-type"].includes("html")){
        data = ""
    }

    console.log("----------- Error Logging ----------")
    console.log(`message: ${message}`)
    console.log(`data: ${errorData}`)
    console.log("------------------------------------")

    if(ex.response && ex.response.data){
       return ex.response.data.require_login
    }

    return {
        message,
        data,
        requireLogin: hasResponse ? ex.response.data.require_login : false
    }
}

export {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, getAppId, getClientVersion, getCookieString, extractToken, updateCookie, CookieStore, logError, extractUserId, extractCsrfToken}