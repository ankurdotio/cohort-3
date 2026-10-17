import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'


passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URI,
    },
    // Runs AFTER Passport exchanged the code and fetched the profile
    async (accessToken, refreshToken, profile, done) => {
        try {
            return done(null, profile);
        } catch (err) {
            return done(err);
        }
    }
));

export default passport;