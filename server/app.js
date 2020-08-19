'use strict';

const express = require('express');
const WebSocket = require('ws');
const server = require('http').createServer();
const app = require('./http-server');
const crypto = require('crypto');

const port = process.env.PORT || 8524;

server.on('request', app);

const wss = new WebSocket.Server({ server });

// maps rooms to list of clients
let parties = new Map();
// maps room to host
let partyHost = new Map();

wss.on('connection', (ws, req) => {
    ws.ip = req.socket.remoteAddress;
    ws.inParty = false;
    ws.partyCode = '';
    // receiving a message
    ws.on('message', (message) => {
        var data = JSON.parse(message);
        
        switch (data.messageType) {
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
            }
            break;
            case 'JOIN_PARTY_REQUEST': {
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

function isClientInParty(party, ip)
{
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

server.listen(port, () => console.log(`Server is listening on port ${port}`));