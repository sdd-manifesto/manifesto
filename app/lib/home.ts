import * as dateFormat from "dateformat";
import * as express from "express";
import * as fs from "fs-extra";
import * as moment from "moment";
import * as path from "path";
import * as showdown from "showdown";
import { GitInfo } from "../index";
import { Auth0Config } from "./auth";
import { database } from "./mongo";

const converter = new showdown.Converter();
const manifesto = converter.makeHtml(
    fs.readFileSync(path.join(__dirname, "..", "..", "README.md")).toString().split("\n").slice(2).join("\n"));

export const homeRouter = express.Router();

homeRouter.get("/", async (req: express.Request, res: express.Response) => {

    const db = await database();
    const sigs = db.collection("signatures");

    const count = await sigs.countDocuments({ signed: true });
    const profiles = await sigs.find({ signed: true }).sort({ ts: -1 }).limit(66).toArray();
    profiles.forEach(p => {
        p.ago = moment(p.ts).fromNow();
    });
    const message = req.flash("info");

    const version = GitInfo.version;
    const sha = GitInfo.sha;
    const date = dateFormat(new Date(GitInfo.date), "mmmm d, yyyy");
    const state = nonce();

    req.session.state = state;

    res.render("home", {
        profiles,
        count,
        html: manifesto,
        message,
        version,
        sha,
        date,
        auth0: Auth0Config,
        state });
});

function nonce(length: number = 40): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
