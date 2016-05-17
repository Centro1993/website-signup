sconst http = require('http');
const dispatcher = require('httpdispatcher');
const async = require('async');
const datastore = require('nedb');
const chalk = require('chalk');

//db laden
db = {};
db.users = new Datastore('db/users.db');
db.events = new Datastore('db/events.db');

db.users.loadDatabase();
db.events.loadDatabase();

//servervariablen
const host = '0.0.0.0';
const port = 3001;

/*------------------------NEDB-FUNKTIONEN----------------------*/
//event in db einfügen
var dbCreateEvent = function(event, callback) {
  db.events.insert(doc, function(err, res) {
    callback(err, res);
  });
}

//alle events finden (um sie auf der website anzuzeigen)
//alternativ nach einer eventid suchen
var dbQueryEvents = function(eventid, userId, callback) {
  if (event == null) {
    db.events.find({}, function(err, docs) {
      callback(err, docs, userId);
    });
  } else {
    db.events.find({
      _id: eventid
    }, function(err, docs) {
      callback(err, docs, userId);
    });
  }
}

//user in usercollection einfügen
var dbInsertUser = function(user, eventId, callback) {
  db.users.insert(user, function(err, res) {
    callback(err, eventId, user);
  });
}

//checken, ob im event noch platz ist, und emails schicken
var dbProcessSignup = function(event, user, callback) {
  //DEFINITION PARTICIPANT
  var participant = {
    user['_id'],
    verified: false,
    timestamp: new Date()
  }

  //user in event eintragen als unbestätigt eintragen
  event.participants.push(participant);
  //nach freien plätzen prüfen
  if (eventCheckPlaces(event) > 0) {
    //email mit bestätigungsanfrage schicken

  } else {
    //wartelistenmail schicken

  }
  //event in db updaten
  db.events.update({
    event['_id']
  }, event, {
    upsert: true
  }, function(err, res) {
    callback(err, res);
  });

}

/*---------------------------FUNKTIONEN----------------*/

//event nach anzahl freier plätze überprüfen
var eventCheckPlaces = function(event) {
  var reservedPlaces = 0;

  for (var i = 0; i < event.participants.length; i++) {
    if (event.participants[i].verified == true) {
      reservedPlaces++;
    }
    var places = event.maxParticipants - reservedPlaces;
  }
  return places;
}

//user verifien, warteliste oder bestätigunsmail schicken
var eventVerifyUser = function(event, userId, callback) {
  if (err == null) {
    //user suchen und verifizieren
    for (var i = 0; i < event.participants.length; i++) {
      if (event.participant[i]['_id'] == userId) {
        event.participant[i].verified == true;
      }
    }
    //frei plätze überprüfen
    if (event.maxParticipants > eventCheckPlaces(event)) {
      //TODO bestätiigungsmail schicken
    } else { //TODO wartelistenmail schicken
    }
    //event updaten
    db.events.update({
      event['_id']
    }, event, {
      upsert: true
    }, function(err, res) {
      callback(err, res);
    });
  } else {
    callback(err, null)
  }
}

var eventSignoutUser = function(event, user, callback) {

}

/*----------------------HTTP-DISPATCHER------------------------*/
var handleRequest = function(req, res) {
{
  //dispatcher einrichten
  try {
    console.log(req.url);
    dispatcher.dispatch(req, res);
  } catch (err) {
    console.log(err);
  }
  //relativen ressourcenpfad setzen
  dispatcher.setStatic('resources');
  dispatcher.setStaticDirname('/');

  //alle events anfordern
  dispatcher.onGet('/queryEvents', function(req, res) {
    dbQueryEvents(function(err, null, userID) {
        if (err == null) {
          //bestätigung senden
          res.writeHead(200, {
            'Content-type': 'text/HTML'
          });
          res.end(JSON.stringify(events));
        });
    }
    else {
      //error senden
      res.writeHead(404, {
        'Content-type': 'text/HTML'
      });
      res.end(err);
    }
  });
});

//email-link, welcher den user auf verifiziert setzt
dispatcher.onPost('/verifySignup', function(req, res) {
  var body = JSON.parse(req.body);

  userId = body.userid;
  eventId = body.eventid;
  //event suchen
  //freie plätze überprüfen
  //user in event eintragen oder nicht, email schicken
  async.waterfall([
    async.apply(dbQueryEvents, eventId, userId),
    eventVerifySignup
  ], function(err, res) {
    if (err == null) {
      console.log(chalk.green("User verifiziert!"));
    } else {
      console.log(chalk.red(err));
    }
  })
});

//TODO email-link, welcher einen user aus der veranstaltung austrägt
dispatcher.onPost('/signOut', function(req, res) {
  var body = JSON.parse(req.body);

  userId = body.userid;
  eventId = body.eventid;

  async.waterfall([
      async.apply(dbQueryEvents, eventId, userId),
      eventSignoutUser,
      eventProcessWaitlist
    ]),
    function(err, res) {

    });
});

dispatcher.onPost("/signup", function(req, res) {
  var body = JSON.parse(req.body);

  var eventId = body.eventId;

  //definition user
  var user = {
    email = body.email,
    name = body.name,
    verified = false
  }

  async.waterfall([
    async.apply(dbInsertUser, user, eventId),
    dbQueryEvent,
    dbProcessSignup
  ], function(err, res) {

  });


});

dispatcher.onPost("/createEvent", function(req, res) {
  var body = JSON.parse(req.body);

  //definition event
  var event = {
    name: body.name,
    creator: body.creator,
    description: body.description,
    time: body.time,
    maxParticipants: body.maxParticipants,
    participants: [],
  }

  dbCreateEvent(event, function(err, res) {
      if (err == null) {
        //bestätigung senden
        res.writeHead(200, {
          'Content-type': 'text/HTML'
        });
        res.end();
      });
  }
  else {
    //error senden
    res.writeHead(404, {
      'Content-type': 'text/HTML'
    });
    res.end(err);
  }
});
}

//server erstellen
var server = http.createServer(handleRequest);
server.listen(port, host);
console.log('Listening at http://' + host + ':' + port);
