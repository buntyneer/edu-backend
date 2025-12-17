const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Avoid crashing if env vars are missing; log and skip strategy
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.warn("⚠️ Google OAuth disabled: missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL");
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });

          // If not, create a new user
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                name: profile.displayName,
                googleId: profile.id,
              },
            });
          }

          // Return user
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}
