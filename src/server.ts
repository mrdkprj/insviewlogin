import express, {Request, Response, Router} from "express";
import cors from "cors";
import Controller from "./controller"
import serverless from 'serverless-http';

const controller = new Controller()

//const port = process.env.PORT || 5000

const app = express();

app.enable('trust proxy')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const router = Router();
app.use('/api/', router);

router.post("/login", async (req:Request, res:Response) => {

    const account = req.body.account;
    const password = req.body.password;

    await controller.tryLogin(req, res, account, password);

})

router.post("/challenge", async (req:Request, res:Response) => {

    const account = req.body.account;
    const code = req.body.code;
    const endpoint = req.body.endpoint;

    await controller.tryChallenge(req, res, account, code, endpoint);

})

router.post("/logout", async (req:Request, res:Response) => {

    await controller.tryLogout(req, res);

})

/*
app.listen(port, () => {
    console.log(`Start server on port ${port}.`);
});
*/

export const handler = serverless(app);
