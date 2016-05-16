const http = require('http');
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
var dbCreateEvent = function (event, callback) {
  db.events.insert(doc, function (err, res) {
    callback(err, res);
  });
}

//alle events finden (um sie auf der website anzuzeigen)
//alternativ nach einer eventid suchen
var dbQueryEvents = function (eventid, callback) {
  if(event == null) {
  db.events.find({}, function (err, docs) {
   callback(err, docs);
 });
 } else {
   db.events.find({_id: eventid}, function (err, docs) {
    callback(err, docs);
  });
 }
}

//user in usercollection einfügen
var dbInsertUser = function(user, eventId, callback) {
  db.users.insert(user, function(err ,res) {
    callback(err, res, eventId);
  });
}

//checken, ob im event noch platz ist, und emails schicken
var dbProcessSignup = function(user, event, callback) {
  //nach freien plätzen prüfen
  if(event)
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
    dispatcher.onGet('queryEvents', function(req, res) {
      dbQueryEvents(function(err, events) {
        if(err == null) {
        //bestätigung senden
        res.writeHead(200, {
          'Content-type': 'text/HTML'
        });
        res.end(JSON.stringify(events));
      });} else {
        //error senden
        res.writeHead(404, {
          'Content-type': 'text/HTML'
        });
        res.end(err);
      }
      });
    });

    dispatcher.onPost("/signup", function(req, res) {
      var body = JSON.parse(req.body);

      var eventId = body.eventId;

      //definition user
      var user = {
        email = body.email,
        name = body.name,
        verified = false,
        timestamp = new Date();
      }

      async.waterfall([
        async.apply(dbInsertUser, user, eventId),
        dbQueryEvent,
        dbProcessSignup
      ], function(err, res) {
        //rückmeldung an user
      });


    });

    dispatcher.onPost("/createEvent", function(req ,res) {
      var body = JSON.parse(req.body);

      //definition event
      var event = {
        name: body.name,
        creator: body.creator,
        description: body.description,
        time: body. time,
        maxParticipants: body. maxParticipants,
        participants: [],
      }

      dbCreateEvent(event, function(err, res) {
        if(err == null) {
        //bestätigung senden
        res.writeHead(200, {
          'Content-type': 'text/HTML'
        });
        res.end();
      });} else {
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
