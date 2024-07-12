const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

const serviceAccount = require('./telebot.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),    
  databaseURL: 'https://console.firebase.google.com/u/0/project/telegrambot-da0bf/firestore/databases/-default-/data/~2FpincodeData', 
});

const db = admin.firestore();

const token = '7396468945:AAG7Q6klFYy0Q-k4uULeCawHcHZf63XFexs';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', function (msg) {

  if (msg.text == '/start') {
    bot.sendMessage(msg.chat.id,"Welcome..I a here to give you details about Pincode.\n\n\nRequirements:\n\n\n => Firstly , Give correct Pincode. \n\n That's it! Simple right.\n\n Hope you will like our service :)");
  } 
  else if (msg.text.toLowerCase() === 'history') {
    db.collection('pincodeData').get()
    .then((querySnapshot) => {
      let historyMessage = "Pincode History:\n\n";

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        historyMessage += `Place    : ${data.Place}\n`;
        historyMessage += `District : ${data.District}\n`;
        historyMessage += `State    : ${data.State}\n`;
        historyMessage += `Pincode  : ${data.Pincode}\n\n`;
      });

      if (historyMessage === "Pincode History:\n\n") {
        historyMessage += "No pincode data available.";
      }
      bot.sendMessage(msg.chat.id, historyMessage);
    })
    .catch((error) => {
      console.error("Error getting documents: ", error);
      bot.sendMessage(msg.chat.id, "An error occurred while retrieving pincode history.");
    });
  }
  else {
    if (msg.text.length == 6) {

      request('https://app.zipcodebase.com/api/v1/search?apikey=17583690-4074-11ef-9703-9da72b08742d&codes=' + msg.text , function (error, response, body) {

          let dataStored = JSON.parse(body);

          if (dataStored.error == 'Pincode not found.') {

            bot.sendMessage(msg.chat.id, ' Sorry!! Pincode not found.');

          } 
          else {
            bot.sendMessage(msg.chat.id,'Pincode  : ' + dataStored.results[`${msg.text}`][0].postal_code);
            bot.sendMessage(msg.chat.id,'Country  : ' + dataStored.results[`${msg.text}`][0].country_code);
            bot.sendMessage(msg.chat.id,'Place    : ' + dataStored.results[`${msg.text}`][0].city);
            bot.sendMessage(msg.chat.id,'District : ' + dataStored.results[`${msg.text}`][0].province);
            bot.sendMessage(msg.chat.id,'State    : ' + dataStored.results[`${msg.text}`][0].state);
            
            db.collection('pincodeData').doc(msg.text).set({
              Place    : dataStored.results[`${msg.text}`][0].city,
              Country : dataStored.results[`${msg.text}`][0].country_code,
              District : dataStored.results[`${msg.text}`][0].province,
              State    : dataStored.results[`${msg.text}`][0].state,
              Pincode  : dataStored.results[`${msg.text}`][0].postal_code,
            });
          }
        }
      );
    } else {
      bot.sendMessage(msg.chat.id,'Please enter correct Pincode having 6 digits.');
    }
  }
});