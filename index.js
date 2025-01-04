import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;

env.config();

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 30,
        },
    })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/home", async (req, res) => {
    if (req.isAuthenticated()) {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [req.user.username]);
        const user = result.rows[0];
        res.render("home.ejs", { photo: user.photo_url, name: user.firstname });
    } else {
        res.redirect("/");
    }
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/login", (req, res) => {
    res.redirect("/");
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/google/home", passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/login"
}));

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) console.log(err);
        res.redirect("/")
    });
});

app.post("/register", async (req, res) => {
    const firstName = req.body.firstname;
    const lastName = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [email]);
        if (result.rows.length === 0) {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.log("Error hashing password", err);
                } else {
                    const result = await db.query(`INSERT INTO users 
                        (username, firstname, lastname, password) 
                        VALUES ($1, $2, $3, $4) RETURNING *`, [email, firstName, lastName, hash]
                    );
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        if (err) console.log(err);
                        console.log("Success");
                        res.redirect("/home");
                    });
                }
            });
        } else {
            console.log("User already exists");
            res.send("User already exists");
            // res.redirect("/login");
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login"
}
));

passport.use("local", new Strategy(async function verify(username, password, cb) {
    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const hashedPassword = user.password;
            bcrypt.compare(password, hashedPassword, (err, result) => {
                if (err) {
                    return cb(err)
                } else {
                    if (result) {
                        return cb(null, user) //User details
                    } else {
                        return cb(null, false) //wrong password
                    }
                }
            });
        } else {
            return cb("User not found");
        }
    } catch (err) {
        console.log(err);
    }
}));

passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        const result = await db.query("SELECT * FROM users where username = $1", [profile.email]);
        if (result.rows.length === 0) {
            const newUser = await db.query(`INSERT INTO users (firstname, lastname, username, password, photo_url) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [profile._json.given_name, profile._json.family_name, profile.email, "google-auth", profile._json.picture]);
            const user = newUser.rows[0];
            return cb(null, user);
        } else {
            return cb(null, result.rows[0]);
        }
    } catch (err) {
        console.log(err);
    }
}));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`Server is listing at http://localhost:${port}`);
});