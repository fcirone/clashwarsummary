const config = require('config');
const axios = require('axios');
const fs = require('fs');
const nodeMailer = require('nodemailer');

const apiToken = config.has('token') ? config.get('token') : '';
const clanId = (config.has('clan') ? config.get('clan') : '');
const apiURL = (config.has('apiURL') ? config.get('apiURL') : '');
const senderEmail = (config.has('senderEmail') ? config.get('senderEmail') : '');
const senderPassword = (config.has('senderPassword') ? config.get('senderPassword') : '');
const emailTo = (config.has('emailTo') ? config.get('emailTo') : '');

if (apiToken == '') {
  console.log('API Token not provided.');
  return;
}
if (clanId == '') {
  console.log('Clan ID not provided.');
  return;
}
if (apiURL == '') {
  console.log('API URL not provided.');
  return;
}

let clanMembers = [];

axios.get(`${apiURL}/clans/${clanId}/members`, {
  "headers" : {
    "Authorization": `Bearer ${apiToken}`
  }
})
  .then(response => {
    response.data.items.map(function(cParticipant) {
      clanMembers[cParticipant.name] = {
        "warsPlayed" : 0,
        "battlesPlayed" : 0,
        "cardsEarned" : 0,
        "wins" : 0,
        "collectionDayBattlesPlayed" : 0
      };
    })
  })
  .catch(error => {
    console.log(error);
  });

axios.get(`${apiURL}/clans/${clanId}/warlog`, {
  "headers" : {
    "Authorization": `Bearer ${apiToken}`
  }
})
  .then(response => {
    response.data.items.map(function(cSeason) {
      cSeason.participants.map(function(cParticipant) {
        if (clanMembers[cParticipant.name]) {
          clanMembers[cParticipant.name] = {
            "warsPlayed" : (cParticipant.battlesPlayed > 0 ? clanMembers[cParticipant.name].warsPlayed+1 : clanMembers[cParticipant.name].warsPlayed),
            "battlesPlayed" : (clanMembers[cParticipant.name].battlesPlayed+cParticipant.battlesPlayed),
            "cardsEarned" : (clanMembers[cParticipant.name].cardsEarned+cParticipant.cardsEarned),
            "wins" : (clanMembers[cParticipant.name].wins+cParticipant.wins),
            "collectionDayBattlesPlayed" : (clanMembers[cParticipant.name].collectionDayBattlesPlayed+cParticipant.collectionDayBattlesPlayed)
          };
        }
      })
    })

    fs.writeFile("sonamaldade.html", Convert2HTML(clanMembers), function(err) {
      if (err) {
        return console.log(err);
      }

      console.log("File saved");
    });

    SendEmail();
  })
  .catch(error => {
    console.log(error);
  });

  function Convert2HTML(members) {
    let html = "<HTML>Last 10 Wars<BR><TABLE BORDER=1><TR><TD>Member</TD><TD>Wars Played</TD><TD>Battles Played</TD><TD>Cards Earned</TD><TD>Wins</TD><TD>Collection Battles Played</TD></TR>";

    for(member in members) {
      html += `<TR><TD>${member}</TD><TD>${members[member].warsPlayed}</TD><TD>${members[member].battlesPlayed}</TD><TD>${members[member].cardsEarned}</TD><TD>${members[member].wins}</TD><TD>${members[member].collectionDayBattlesPlayed}</TD></TR>`;
    }

    html += "</TABLE></HTML>"

    return html;
  }

  function SendEmail() {
    let transporter = nodeMailer.createTransport({
      host : "smtp.gmail.com",
      port : 465,
      secure : true,
      auth : {
        user : senderEmail,
        pass : senderPassword
      } 
    });

    let mailOptions = {
      from : "fabiocirone@gmail.com",
      to : emailTo,
      subject : "SoNaMaldade War Summary",
      attachments : [
        {
          filename : "warsummary.html",
          path : 'sonamaldade.html'
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }

      console.log('Message %s sent: %s', info.messageId, info.response);
    })

  }