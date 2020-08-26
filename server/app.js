
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var crypto = require('crypto');

var SpotifyWebApi = require('spotify-web-api-node');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
var expressWs = require('express-ws')(app);

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/login', function (req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-top-read user-read-recently-played user-library-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('http://localhost:3000/home/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.get('/refresh_token', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

// ------------------------------------------------------------
// WEBSOCKET 

// maps rooms to list of clients
let parties = new Map();
// maps room to host
let partyHost = new Map();

app.ws('/', function (ws, req) {
    ws.ip = req.socket.remoteAddress;
    ws.inParty = false;
    ws.partyCode = '';
    ws.spotifyWebApi = new SpotifyWebApi();
    ws.topArtists = [];

    // ask client for the spotify access_token
    let response = {
        messageType: 'SEND_ACCESS_TOKEN'
    };
    ws.send(JSON.stringify(response));

    // receiving a message
    ws.on('message', (message) => {
        var data = JSON.parse(message);
        switch (data.messageType) {
            case 'ACCESS_TOKEN': {
                if (data.access_token) {
                    ws.spotifyWebApi.setAccessToken(data.access_token);
                }
            }
                break;
            case 'CREATE_PARTY': {
                // create random 6 char party code
                ws.partyCode = crypto.randomBytes(20).toString('hex').substring(0, 6).toUpperCase();

                console.log("Party created with party code: " + ws.partyCode);

                // create party 
                parties.set(ws.partyCode, []);
                partyHost.set(ws.partyCode, ws);

                // respond to host with party code
                const response = {
                    messageType: 'CREATE_PARTY_SUCCESS',
                    partyCode: ws.partyCode
                };
                ws.send(JSON.stringify(response));

                // get clients top users
                getTopArtists(ws);
            }
                break;
            case 'JOIN_PARTY_REQUEST': {
                console.log(data.partyCode);
                if (parties.has(data.partyCode)) {
                    if (isClientInParty(data.partyCode, ws.ip)) {
                        ws.partyCode = data.partyCode;

                        console.log("Client: " + ws.ip + " joined party: " + ws.partyCode);

                        // add client to party
                        ws.inParty = true;
                        let clients = parties.get(ws.partyCode);
                        clients.push(ws);
                        parties.set(ws.partyCode, ws.ip);
                        const response = {
                            messageType: 'JOINED_PARTY',
                            partyCode: ws.partyCode,
                        };
                        ws.send(JSON.stringify(response));

                        // get clients top users
                        getTopArtists();
                    } else {
                        const response = {
                            messageType: 'JOIN_PARTY_ERROR',
                            error: 'Client already in party'
                        }
                        ws.send(JSON.stringify(response));
                    }
                } else {
                    // tried joining unknown party
                    const response = {
                        messageType: 'JOIN_PARTY_ERROR',
                        error: 'No party found'
                    };
                    ws.send(JSON.stringify(response));
                }
            }
                break;
            case 'DISCONNECTED': {
                leaveParty(ws);
            }
                break;
        }
    });
});

function getTopArtists(client) {
    client.spotifyWebApi.getMyTopArtists({ time_range: 'long_term', limit: 50 })
        .then(
            function (data) {
                let topArtists = [];
                data.items.forEach(artist => {
                    topArtists.push(artist);
                });
                client.topArtists = topArtists;
            },
            function (err) {
                console.error(err);
            }
        );
}

function isClientInParty(party, ip) {
    const clients = parties.get(party);
    if (clients === undefined) {
        return false;
    } else {
        return clients.find((item) => item.ip === ip) ? true : false;
    }
};

function leaveParty(ws) {
    if (ws.inParty === true) {
        // Remove the player from the party
        const clients = parties.get(ws.party);
        clients.splice(clients.indexOf(ws.ip), 1);
        parties.set(ws.party, clients);
    }
};

console.log('Listening on 8888');
app.listen(8888);
