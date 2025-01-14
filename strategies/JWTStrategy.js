const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/user.model");

// Create JWT strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
    },
    (jwtPayload, done) => {
      if (jwtPayload.exp < Date.now() / 1000) {
        return done(null, false, { expired: true });
      }

      return User.findOne({ email: jwtPayload.email })
        .select("_id fullname username email roleCode")
        .then((user) => {
          if (!user) {
            throw new Error("User does not exist");
          }

          user = {
            _id: user._id,
            fullname: user?.fullname,
            username: user.username,
            role: user?.roleCode,
            email: user.email,
          };
          return done(null, user);
        })
        .catch((err) => {
          return done(err);
        });
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL + "api/v1/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.BASE_URL + "api/v1/facebook/callback",
      profileFields: ["id", "email", "name", "displayName", "picture.type(large)"],
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
