require('dotenv').config( {path: './config/.env'})
const passport= require("passport")
const User = require('../models/user')
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
// })
    try {
      const name=profile.displayName;
      const email=profile.emails[0].value
      const mobile = profile.phoneNumbers ? profile.phoneNumbers[0].value: null

      const existingUser =await User.findOne({email:email})

      if(existingUser){
        // Update existing user's information if necessary
        existingUser.name = name;
        // You may update other user information here if needed

        const updatedUser = await existingUser.save();
        console.log('User updated successfully:', updatedUser);

        return done(null, updatedUser);
      }

      else{
        
        // Create a new user if they don't exist
         const user = new User({
          name:name,
          email:email,
          mobile:mobile,
          verified:"1",
          is_admin: 0
         })

         const userData = await user.save()
         console.log('user saved Succesfully',userData)

         if(userData){
          return done(null,userData)
         }
         else{
          return done(null,false,{message:'Failed to save user'})
         }
      }
    } catch (error) {
      console.log("Error iserting user details",error.message)
      return done(error)
    }
    ;
  }
));

passport.serializeUser((user,done)=>{
  console.log('Serializing user:', user);
    done(null,user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserializing user:', user);
    done(null, user);
  } catch (error) {
    console.log("Error deserializing user", error.message);
    done(error);
  }
});