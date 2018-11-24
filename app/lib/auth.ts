import * as express from "express";
import * as passport from "passport";
import { GitInfo } from "../index";
import { database } from "./mongo";

export const Auth0Config = {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || "http://localhost:3000/callback",
};

export const authRouter = express.Router();

authRouter.get("/callback", (req, res, next) => {
    passport.authenticate("auth0", async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect("/");
        }
        if (req.session.state !== req.query.state) {
            return res.redirect("/");
        }

        const db = await database();
        const sigs = db.collection("signatures");

        const sig = {
            ...user,
            ts: Date.now(),
            signed: true,
            version: GitInfo.version,
        };

        try {
            const result: any = await sigs.findOne({ id: user.id });
            if (!result) {
                await sigs.insertOne(sig);
                req.flash("info", "Thank you for signing the Manifesto!");
            } else if (!result.signed) {
                await sigs.updateOne({ id: user.id }, { $set: { signed: true, version: GitInfo.version } });
                req.flash("info", "Thank you for signing the Manifesto!");
            } else {
                req.flash("info", "Thank you for coming back. You already signed the Manifesto.");
            }
        } catch (err) {
            console.error(err);
        }

        req.logIn(user, e => {
            if (err) {
                return next(e);
            }
            const returnTo = req.session.returnTo;
            delete req.session.returnTo;
            res.redirect(returnTo || "/");
        });
    })(req, res, next);
});

authRouter.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

authRouter.get("/signout", async (req, res) => {
    const db = await database();
    const sigs = db.collection("signatures");

    try {
        const result: any = await sigs.findOne({ id: req.user.id });
        if (result && result.signed) {
            await sigs.update({ id: req.user.id }, { $set: { signed: false } });
            req.flash("info", "Signature removed!");
        }
    } catch (err) {
        console.error(err);
    }
    req.logout();
    res.redirect("/");
});
