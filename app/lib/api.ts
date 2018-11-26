import * as cors from "cors";
import * as express from "express";
import * as moment from "moment";
import { database } from "./mongo";

export const apiRouter = express.Router();

const options: cors.CorsOptions = {
    origin: process.env.NODE_ENV === "production" ? "https://sdd-manifesto.org" : "http://localhost",
    methods: ["GET", "OPTIONS"],
};

apiRouter.options("/api/signatures/:cursor?", cors(options));
apiRouter.get("/api/signatures/:cursor?", cors(options), async (req: express.Request, res: express.Response) => {

    const db = await database();
    const sigs = db.collection("signatures");

    const count = await sigs.countDocuments({ signed: true });
    const length = 25;
    const cursor = +req.params.cursor || 0;
    const profiles = await sigs.find({ signed: true }).sort({ ts: -1 }).skip(cursor * length).limit(length).toArray();
    const results = profiles.map(p => {
        return {
            name: p.displayName,
            avatar: p.picture,
            ago: moment(p.ts).fromNow(),
            version: p.version,
            connection: mapConnection(p.id),
        };
    });

    const response: any = {
        signatures: results,
        meta: {
            self: cursor > 0 ? `/api/signatures/${cursor}` : "/api/signatures",
        },
    };

    if ((cursor * length) + results.length < count) {
        response.meta.next = `/api/signatures/${cursor + 1}`;
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", 0);
    res.json(response);
});

function mapConnection(id: string): string {
    if (id.startsWith("twitter")) {
        return "Twitter";
    } else if (id.startsWith("google")) {
        return "Google";
    } else if (id.startsWith("linkedin")) {
        return "LinkedIn";
    } else if (id.startsWith("github")) {
        return "GitHub";
    }
    return "unkown";
}
