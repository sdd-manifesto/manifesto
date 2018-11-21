import * as express from "express";
import * as passport from "passport";
import { database } from "./mongo";

export const authRouter = express.Router();

authRouter.get("/sign", passport.authenticate("auth0", {
    scope: "openid email profile",
}), (req, res) => {
    res.redirect("/");
});

authRouter.get("/callback", (req, res, next) => {
    passport.authenticate("auth0", async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect("/sign");
        }

        const db = await database();
        const sigs = db.collection("signatures");

        const sig = {
            ...user,
            ts: Date.now(),
            signed: true,
        };

        try {
            const result: any = await sigs.findOne({ id: user.id });
            if (!result) {
                await sigs.insertOne(sig);
                req.flash("info", "Thank you for signing the Manifesto!");
            } else if (!result.signed) {
                await sigs.update({ id: user.id }, { $set: { signed: true } });
                req.flash("info", "Thank you for signing the Manifesto!");
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
