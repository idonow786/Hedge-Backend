// config/passport.js
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const axios = require('axios');
const { LinkedInUser } = require('../../Model/Linkedin');
const { TwitterUser } = require('../../Model/Twitter');
// const TwitterStrategy = require('passport-twitter').Strategy;
const { FacebookUser } = require('../../Model/Facebook');
const { InstagramUser } = require('../../Model/Instagram');
const { SnapUser } = require('../../Model/SnapChat');
require('dotenv').config();
const OAuth2Strategy = require('passport-oauth2');
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;

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
        await FacebookUser.deleteMany()
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






// callbackURL: 'http://localhost:3000/api/social/auth/linkedin/callback',

// scope: ['openid', 'profile', 'email', 'w_member_social'],

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: 'https://crm-m3ck.onrender.com/api/social/auth/linkedin/callback',
      scope: ['openid', 'profile', 'email', 'w_member_social'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const adminId = JSON.parse(decodeURIComponent(req.query.state)).adminId;
        const linkedinProfile = profile;
        const linkedinEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

        let user = await LinkedInUser.findOne({ linkedinId: linkedinProfile.id });
        if (!user) {
          await LinkedInUser.deleteMany();
          user = new LinkedInUser({
            adminId: adminId,
            userId: linkedinProfile.id,
            linkedinId: linkedinProfile.id,
            accessToken: accessToken,
            name: linkedinProfile.displayName,
            email: linkedinEmail,
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
    }
  )
);











// Twitter Strategy
passport.use(new TwitterStrategy({
  clientID: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
  callbackURL: 'https://crm-m3ck.onrender.com/api/social/auth/twitter/callback',
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const adminId = req.session.adminId;
    if (!adminId) {
      return done(new Error('Missing adminId'), null);
    }

    let user = await TwitterUser.findOne({ adminId: adminId });

    if (!user) {
      return done(new Error('User not found'), null);
    }

    user.twitterId = profile.id;
    user.name = profile.displayName;
    user.username = profile.username;

    await user.save();

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));



passport.use('snapchat', new OAuth2Strategy({
  authorizationURL: 'https://accounts.snapchat.com/accounts/oauth2/auth',
  tokenURL: 'https://accounts.snapchat.com/accounts/oauth2/token',
  clientID: process.env.SNAPCHAT_CLIENT_ID,
  clientSecret: process.env.SNAPCHAT_CLIENT_SECRET,
  callbackURL: 'https://crm-m3ck.onrender.com/api/social/auth/snapchat/callback',
  scope: ['snapchat.marketing'],
  state: true,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await SnapUser.findOne({ snapid: profile.id });
    if (!user) {
      user = new SnapUser({
        snapid: profile.id,
        accessToken,
        refreshToken,
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
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await FacebookUser.findById(id) || await InstagramUser.findById(id) || await TwitterUser.findById(id) ||SnapUser.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});








module.exports = passport;