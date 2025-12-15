const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
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
