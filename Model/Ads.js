const mongoose = require('mongoose')
const adsSchema = new mongoose.Schema({
    AdsLink: { type: String},
    picLink: { type: String },
    videoLink: { type: String },
    Date: { type: Date,default:new Date()},
    clickCount: { type: String },
  });

  const Ads = mongoose.model('Ads', adsSchema);

module.exports={Ads}