import cookieParser = require("cookie-parser");
import * as express from "express";
import * as exphbs from "express-handlebars";
import * as session from "express-session";
import * as logger from "morgan";
import * as passport from "passport";
import * as auth0 from "passport-auth0";
import * as path from "path";
import { apiRouter } from "./api";
import {
    Auth0Config,
    authRouter,
} from "./auth";
import { homeRouter } from "./home";
import { policyRouter } from "./policy";

export const exp = express();

passport.use(new auth0.Strategy(
    {
        ...Auth0Config,
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

// tslint:disable-next-line:no-var-requires
exp.use(require("helmet")());

exp.set("view engine", "handlebars");
exp.set("views", path.join(__dirname, "..", "views"));
exp.engine("handlebars", exphbs({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "..", "views", "layouts"),
}));

exp.use("/", express.static(path.join(__dirname, "..", "public")));

exp.use(logger("dev"));
exp.use(cookieParser());

// tslint:disable-next-line:no-var-requires
const MongoDBStore = require("connect-mongodb-session")(session);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/manifesto",
    collection: "sessions",
});

const sess: any = {
    secret: process.env.SESSION_SECRET || "CHANGE THIS SECRET",
    resave: false,
    saveUninitialized: true,
    proxy: true, // add this when behind a reverse proxy, if you need secure cookies
    cookie: {
        sameSite: false,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    store,
};

if (process.env.NODE_ENV === "production") {
    sess.cookie.secure = true;
}

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
exp.use("/", apiRouter);
exp.disable("etag");

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
