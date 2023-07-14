import {Request, Response} from "express";
import type { Cookie } from "tough-cookie";
import {login, challenge, logout} from "./login"

class Controller{

    _convertSameSite(_sameSite:string){

        if(!_sameSite) return undefined

        if(_sameSite.toLowerCase() === "lax") return "lax"

        if(_sameSite.toLowerCase() === "strict") return "strict"

        if(_sameSite.toLowerCase() === "none") return "none"

        return false;
    }

    async sendResponse(req:Request, res:Response, data:any, session:ISession){

        const domain = process.env.NODE_ENV === "production" ? req.hostname : ""

        session.cookies.forEach((cookie:Cookie) => {

            if(typeof cookie.maxAge === "number" && cookie.maxAge <= 0) return;

            res.cookie(cookie.key, cookie.value, {
                domain:domain,
                expires:cookie.expires === "Infinity" ? undefined : cookie.expires,
                httpOnly:cookie.httpOnly,
                path:cookie.path ?? undefined,
                secure:cookie.secure,
                sameSite:this._convertSameSite(cookie.sameSite),
                encode: String
            });

        })

        res.status(200).send(data);

    }

    sendErrorResponse(res:Response, ex:any, message = ""){

        let errorMessage
        if(message){
            errorMessage = message;
        }else{
            errorMessage = ex.response ? ex.response.data.message : ex.message;
        }

        res.status(400).send(errorMessage)
    }

    async tryLogin(req:Request, res:any, account:string, password:string){
console.log("here")
        if(!account || !password){
            return this.sendErrorResponse(res, {message:"Username/password required"});
        }

        if(account !== process.env.ACCOUNT){
            return this.sendErrorResponse(res, {message:"Unauthorized account"});
        }

        try{

            const result = await login({data:{account, password}, headers:req.headers})

            await this.sendResponse(req, res, result.data, result.session);

        }catch(ex:any){
            this.sendErrorResponse(res, ex, "Login failed");

        }
    }

    async tryChallenge(req:Request, res:any, account:string, code:string, endpoint:string){

        try{

            const result = await challenge({data:{account, code, endpoint}, headers:req.headers})

            await this.sendResponse(req, res, result.data, result.session);

        }catch(ex:any){

            this.sendErrorResponse(res, ex, "Challenge failed");

        }

    }

    async tryLogout(req:Request, res:any){

        try{

            const result = await logout({data:{}, headers:req.headers});

            await this.sendResponse(req, res, result.data, result.session);

        }catch(ex:any){

            this.sendErrorResponse(res, ex);

        }
    }

}

export default Controller