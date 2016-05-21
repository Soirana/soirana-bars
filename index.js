var express = require('express');
var fs = require('fs');
var Datastore = require('nedb');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var merge = require('merge');
var Yelp = require('yelp');

var yelp = new Yelp({
  consumer_key: process.env['yelpkey'],
  consumer_secret: process.env['yelpsecret'],
  token: process.env['yelptoken'],
  token_secret: process.env['yelptokensecret']
});
var app = express();
var html = fs.readFileSync('public/reactbase.html');

passport.use(new Strategy({
    consumerKey: process.env['twitterkey'],
    consumerSecret: process.env['twittersecret'],
    callbackURL: 'https://soirana-bars.herokuapp.com/twitter/return'
  },
  function(token, tokenSecret, profile, cb) {
    return cb(null, profile);
  }));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

var db = new Datastore({ filename: 'bars.db', autoload: true });
app.use(bodyParser.json())
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public')); 
app.set('port', (process.env.PORT || 5000));

app.get('/search', function(request, response) {
	if (!request.xhr) {
		response.redirect('/');
	}
	yelp.search({ term: 'pubs', location: request.query.city})
		.then(function (data) {
			var bars = data.businesses;
			var barsOut= [],
				emptyBars = [],
				emptyVoters= [];
			for (var i = 0; i < bars.length; i++) {
				barsOut.push({barname :bars[i].name,description :bars[i].snippet_text,
				image :bars[i].image_url});
			}
			db.find({city: request.query.city},function(err, docs) {

				if (docs.length>0){
					docs[0].places = barsOut;
					response.json(docs[0]);	
				}else{
					var temp ={city: request.query.city, voters:{votes: [], votedBars: []}};
					db.insert(temp);
					response.json({places: barsOut, city: request.query.city, voters:{votes: [], votedBars: []}});
				}
			})
		})
		.catch(function (err) {
  			response.json(err);
		});
});

app.get('/vote', function(request, response) {
	if (!request.xhr) {
			response.redirect('/');	
	};
	db.find({city: request.query.city}, function (err, docs) {
		if (docs.length === 0){
				db.insert({city: request.query.city, voters:{votes: [[request.query.user]],
				votedBars: [request.query.place]}});
				response.json({0:0});
		}

		var check = docs[0].voters.votedBars.indexOf(request.query.place);
		var replacer;
				
		if (check === -1) {
			docs[0].voters.votedBars.push(request.query.place);
			docs[0].voters.votes.push([request.query.user]);
		} else if(request.query.adder === "yes"){
					docs[0].voters.votes[check].push(request.query.user);
			}else{
					var remInd = docs[0].voters.votes.indexOf(request.query.user);
					docs[0].voters.votes[check].splice(remInd, 1);
			}
		replacer = docs[0];
		db.update({city: request.query.city}, { $set: {voters: replacer.voters}});
		response.json({0:0});

	});
});

app.get('/', function(request, response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end(html);
	});

app.get('/twitter', passport.authenticate('twitter'));

app.get('/twitter/return',
passport.authenticate('twitter', { failureRedirect: '/twitter' }), 
  function(req, res) {
  	res.json({name: req.user.username});
  });
app.get('/*', function(request, response) {
		response.redirect('/');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});