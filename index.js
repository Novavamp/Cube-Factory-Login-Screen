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
const saltRounds = 10; //number of rounds to salt passwords

//env intialization
env.config();

//session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 30, //expiry for the cookie
        },
    })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

//database credentials
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

//login route for the app
app.get("/", (req, res) => {
    res.render("index.ejs");
});

//home route behind an authentication
app.get("/home", async (req, res) => {
    if (req.isAuthenticated()) {
        //if user is authenticated, get user details from the database
        const result = await db.query("SELECT * FROM users WHERE username = $1", [req.user.username]);
        const user = result.rows[0];
        //render the home page with the user details passed to the front end
        res.render("home.ejs", { photo: user.photo_url, name: user.firstname });
    } else {
        res.redirect("/"); //redirect to the login page if user is not authenticated
    }
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/login", (req, res) => {
    res.redirect("/");
});

//Google OAuth login
app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

//Google OAuth callback
app.get("/auth/google/home", passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/login"
}));

//Logout handler
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) console.log(err);
        res.redirect("/")
    });
});

//User Registration
app.post("/register", async (req, res) => {
    const firstName = req.body.firstname;
    const lastName = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    try {
        //get user information from the database
        const result = await db.query("SELECT * FROM users WHERE username = $1", [email]);
        if (result.rows.length === 0) { //If user does not exist
            //Hash the password and store in the database
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.log("Error hashing password", err);
                } else {
                    //if hashing is successful, insert user details to the database
                    const result = await db.query(`INSERT INTO users 
                        (username, firstname, lastname, password) 
                        VALUES ($1, $2, $3, $4) RETURNING *`, [email, firstName, lastName, hash]
                    );
                    const user = result.rows[0];
                    //log the user in and redirect to the home page
                    req.login(user, (err) => {
                        if (err) console.log(err);
                        console.log("Success");
                        res.redirect("/home");
                    });
                }
            });
        } else {
            //if user already exists in the database
            console.log("User already exists");
            res.send("User already exists");
            // res.redirect("/login");
        }
    } catch (err) {
        console.log(err);
    }
});

//login post route
app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login"
}
));

//Local strategy for loggin in
passport.use("local", new Strategy(async function verify(username, password, cb) {
    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length > 0) { //if user exists
            const user = result.rows[0];
            const hashedPassword = user.password;
            //compare the password inputed by the user and the password stored in the database
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
            //if user does not exist
            return cb("User not found");
        }
    } catch (err) {
        console.log(err);
    }
}));

//Google OAuth strategy for login/register
passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        const result = await db.query("SELECT * FROM users where username = $1", [profile.email]);
        if (result.rows.length === 0) { //if user does not exist
            //add the user details to the database
            const newUser = await db.query(`INSERT INTO users (firstname, lastname, username, password, photo_url) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [profile._json.given_name, profile._json.family_name, profile.email, "google-auth", profile._json.picture]);
            const user = newUser.rows[0];
            return cb(null, user); //return the user details without error
        } else {
            return cb(null, result.rows[0]); //if user exists, return user details without error
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