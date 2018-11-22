import cookieParser = require("cookie-parser");
import * as express from "express";
import * as exphbs from "express-handlebars";
import * as session from "express-session";
import * as logger from "morgan";
import * as passport from "passport";
import * as auth0 from "passport-auth0";
import * as path from "path";
import { authRouter } from "./auth";
import { homeRouter } from "./home";
import { policyRouter } from "./policy";

export const exp = express();

passport.use(new auth0.Strategy(
    {
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        callbackURL: process.env.AUTH0_CALLBACK_URL || "http://localhost:3000/callback",
        state: false,
    },
    (accessToken, refreshToken, extraParams, profile, done) => {
        return done(undefined, profile);
    },
));

passport.serializeUser(async (user: any, done) => {
    done(undefined, user);
});

passport.deserializeUser((user, done) => {
    done(undefined, user);
});

exp.set("view engine", "handlebars");
exp.set("views", path.join(__dirname, "..", "views"));
exp.engine("handlebars", exphbs({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "..", "views", "layouts"),
}));

exp.use("/", express.static(path.join(__dirname, "..", "public")));

exp.use(logger("dev"));
exp.use(cookieParser());

const sess: any = {
    secret: "CHANGE THIS SECRET",
    resave: false,
    saveUninitialized: true,
    proxy: true, // add this when behind a reverse proxy, if you need secure cookies
    cookie: {
        sameSite: false,
        maxAge: 1000 * 60 * 10,
    },
};

if (process.env.NODE_ENV === "production") {
    sess.cookie.secure = true;
}

// tslint:disable-next-line:no-var-requires
exp.use(require("helmet")());
exp.use(session(sess));

exp.use(passport.initialize());
exp.use(passport.session());
// tslint:disable-next-line:no-var-requires
exp.use(require("connect-flash")());

exp.use((req, res, next) => {
    if (req.get("X-Forwarded-Proto") !== "https" && !req.get("Host").includes("localhost")) {
        res.redirect(`https://${req.get("Host")}${req.url}`);
    } else {
        next();
    }
});

exp.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
exp.use("/", authRouter);
exp.use("/", homeRouter);
exp.use("/", policyRouter);

exp.use((req, res, next) => {
    const err = new Error("Not Found");
    (err as any).status = 404;
    next(err);
});

exp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: err,
    });
});
