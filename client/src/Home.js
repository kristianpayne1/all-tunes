import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import PartyForm from './PartyForm.js';
import PartyView from './PartyView.js';
//import { Table, Button } from 'react-bootstrap';

class Home extends Component {
    constructor() {
        super();
        const params = this.getHashParams();
        const token = params.access_token;
        this.state = {
            loggedIn: token ? true : false,
            socket: null,
            token: token,
            isHost: false,
            partyCode: '',
            isConnected: false,
            recommended: [],
        }
    }

    componentDidMount() {
        this.connect();
    }

    connect = () => {
        if (this.state.loggedIn) {
            let socket = new WebSocket("ws://localhost:8888");
            this.setState({ socket: socket });
            console.log('Connected to socket');

            let self = this;

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message);
                switch (message.messageType) {
                    case 'SEND_ACCESS_TOKEN': {
                        var response = {
                            messageType: 'ACCESS_TOKEN',
                            access_token: self.state.token
                        };
                        try {
                            self.state.socket.send(JSON.stringify(response));
                        } catch (error) {
                            console.log(error);
                        }
                    }
                        break;
                    case 'CREATE_PARTY_SUCCESS': {
                        let partyCode = message.partyCode;
                        console.log('Hosting party: ' + partyCode);
                        self.setState({ partyCode: partyCode, isHost: true, isConnected: true });
                    }
                        break;
                    case 'JOINED_PARTY': {
                        let partyCode = message.partyCode;
                        console.log('Joined party: ' + partyCode);
                        self.setState({ partyCode: partyCode, isConnected: true });
                    }
                        break;
                    case 'JOIN_PARTY_ERROR': {
                        self.setState({ isConnected: false, partyCode: '', isHost: false });
                        console.log("Failed to join party \n" + message.error)
                    }
                        break;
                    case 'UPDATE_RECOMMENDED': {
                        console.table(message.data);
                        self.setState({recommended: message.data});
                    }
                        break;
                    default: {
                        console.log("Recieved unknown message");
                    }
                }

                socket.onerror = err => {
                    console.error(
                        "Socket encountered error: ",
                        err.message,
                        "Closing socket"
                    );
                    self.setState({ isConnected: false, partyCode: '', isHost: false, recommended: [] });
                    socket.close();
                }

                socket.onclose = () => {
                    self.setState({ isConnected: false, partyCode: '', isHost: false, recommended: [] });
                    console.log('disconnected')
                    // automatically try to reconnect on connection loss
                }
            }
        }
    }

    getHashParams = () => {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        e = r.exec(q)
        while (e) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
            e = r.exec(q);
        }
        return hashParams;
    }

    render() {
        let redirect = !this.state.loggedIn ? <Redirect to="/" /> : null;
        let partyView = this.state.isConnected ?
            <PartyView 
                isHost={this.state.isHost} 
                partyCode={this.state.partyCode} 
                recommended={this.state.recommended}
                socket={this.state.socket}
            /> :
            <PartyForm socket={this.state.socket} />
        return (
            <div>
                {redirect}
                {partyView}
            </div>
        )
    }
}

export default Home;