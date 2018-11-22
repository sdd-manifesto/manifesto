import * as express from "express";
import * as fs from "fs-extra";
import * as path from "path";
import * as showdown from "showdown";

const converter = new showdown.Converter();
const cookiePolicy = converter.makeHtml(
    fs.readFileSync(path.join(__dirname, "..", "..", "legal", "COOKIE_POLICY.md")).toString());
const privacyPolicy = converter.makeHtml(
    fs.readFileSync(path.join(__dirname, "..", "..", "legal", "PRIVACY_POLICY.md")).toString());

export const policyRouter = express.Router();

policyRouter.get("/cookie-policy.html", async (req: express.Request, res: express.Response) => {
    res.render("policy", { policy: cookiePolicy });
});

policyRouter.get("/privacy-policy.html", async (req: express.Request, res: express.Response) => {
    res.render("policy", { policy: privacyPolicy });
});
