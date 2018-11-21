import * as dateFormat from "dateformat";
import * as express from "express";
import * as fs from "fs-extra";
import * as moment from "moment";
import * as path from "path";
import * as showdown from "showdown";
import { GitInfo } from "../index";
import { database } from "./mongo";

const converter = new showdown.Converter();
const content = fs.readFileSync(path.join(__dirname, "..", "..", "README.md")).toString();
const html = converter.makeHtml(content);

export const homeRouter = express.Router();

homeRouter.get("/", async (req: express.Request, res: express.Response) => {

    const db = await database();
    const sigs = db.collection("signatures");

    const count = await sigs.countDocuments({ signed: true });
    const profiles = await sigs.find({ signed: true }).sort({ ts: -1 }).limit(50).toArray();
    profiles.forEach(p => {
        p.ago = moment(p.ts).fromNow();
    });
    const message = req.flash("info");

    const sha = GitInfo.sha.slice(0, 7);
    const date = dateFormat(new Date(GitInfo.date), "mmmm d, yyyy");

    res.render("home", { profiles, count, html, message, sha, date });
});
