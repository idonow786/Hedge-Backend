// config/passport.js
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { LinkedInUser } = require('../../Model/Linkedin');
const { TwitterUser } = require('../../Model/Twitter');
const TwitterStrategy = require('passport-twitter').Strategy;
const { FacebookUser } = require('../../Model/Facebook');
const { InstagramUser } = require('../../Model/Instagram');
require('dotenv').config();

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'https://crm-m3ck.onrender.com/api/social/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails'],
  passReqToCallback: true // Pass the request object to the callback
},
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Extract adminId from the state parameter
      const adminId = req.query.state;
      console.log("app client secret: ", process.env.FACEBOOK_APP_SECRET)
      let user = await FacebookUser.findOne({ facebookId: profile.id });

      if (!user) {
        user = new FacebookUser({
          adminId: adminId,
          userId: profile.id,
          facebookId: profile.id,
          accessToken: accessToken,
          name: profile.displayName,
          email: profile.emails[0].value,
        });
        await user.save();
      } else {
        user.accessToken = accessToken;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

// Instagram Strategy
// passport.use(new InstagramStrategy({
//   clientID: process.env.INSTAGRAM_CLIENT_ID,
//   clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
//   callbackURL: 'http://localhost:3000/api/social/auth/instagram/callback',
//   passReqToCallback: true // Pass the request object to the callback
// },
// async (req, accessToken, refreshToken, profile, done) => {
//   try {
//     const adminId = req.query.state;

//     let user = await InstagramUser.findOne({ instagramId: profile.id });

//     if (!user) {
//       user = new InstagramUser({
//         adminId: adminId,
//         userId: profile.id,
//         instagramId: profile.id,
//         accessToken: accessToken,
//         name: profile.displayName,
//         email: profile.emails[0].value,
//       });
//       await user.save();
//     } else {
//       user.accessToken = accessToken;
//       await user.save();
//     }

//     return done(null, user);
//   } catch (error) {
//     return done(error, null);
//   }
// }));

// LinkedIn Strategy


passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: 'https://crm-m3ck.onrender.com/api/social/auth/linkedin/callback',
  scope: ['openid', 'profile', 'email', 'w_member_social'],
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Process the user profile and access token here
    const adminId = req.query.state;
    let user = await LinkedInUser.findOne({ linkedinId: profile.id });

    if (!user) {
      user = new LinkedInUser({
        adminId: adminId,
        userId: profile.id,
        linkedinId: profile.id,
        accessToken: accessToken,
        name: profile.displayName,
        email: profile.emails[0].value,
      });
      await user.save();
    } else {
      user.accessToken = accessToken;
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    console.error('Error during LinkedIn authentication:', error);
    return done(error, null);
  }
}));






// Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: 'https://crm-m3ck.onrender.com/api/social/auth/twitter/callback',
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const adminId = req.query.state;

    let user = await TwitterUser.findOne({ twitterId: profile.id });

    if (!user) {
      user = new TwitterUser({
        adminId: adminId,
        userId: profile.id,
        twitterId: profile.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        name: profile.displayName,
        username: profile.username,
      });
      await user.save();
    } else {
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    console.error('Error during Twitter authentication:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await FacebookUser.findById(id) || await InstagramUser.findById(id) || await TwitterUser.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;