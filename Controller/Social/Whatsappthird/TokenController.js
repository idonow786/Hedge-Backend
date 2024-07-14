const axios = require('axios');
const User = require('../../../Model/whatsappUser'); 

const getToken = async (req, res) => {
  const { email } = req.body;

  // const options = {
  //   method: 'GET',
  //   url: 'https://whatsapp-messaging-hub.p.rapidapi.com/WhatsappGetToken',
  //   params: { email },
  //   headers: {
  //     'x-rapidapi-key': process.env.RAPIDAPI_KEY,
  //     'x-rapidapi-host': process.env.RAPIDAPI_HOST,
  //   },
  // };

  try {
    // const response = await axios.request(options);

    const newUser = new User({
      userId: req.adminId,
      email: email,
    });

    await newUser.save();

    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching the token');
  }
};


const updateToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.adminId;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.Token = token;
    await user.save();

    res.json({ message: 'Token updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while updating the token');
  }
};


module.exports = { getToken,updateToken };
