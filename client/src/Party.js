import React, { Component } from 'react';
import PartyForm from './PartyForm.js';
import PartyView from './PartyView.js'

class Party extends Component {

    state = {
        socket: null,
        partyCode: '',
        isHost: false
    }

    componentDidMount() {
        this.connect();
    }

    connect = () => {
        let socket = new WebSocket("ws://localhost:8524");
        let self = this;
        this.setState({ socket: socket });

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);
            switch (message.messageType) {
                case 'CREATE_PARTY_SUCCESS': {
                    let partyCode = message.partyCode;
                    console.log('Hosting party: ' + partyCode);
                    self.setState({ partyCode: partyCode, isHost: true });
                }
                    break;
                case 'JOINED_PARTY': {
                    let partyCode = message.partyCode;
                    console.log('Joined party: ' + partyCode);
                    self.setState({ partyCode: partyCode });
                }
                    break;
                case 'JOIN_PARTY_ERROR': {
                    console.log("Failed to join party \n" + message.error)
                }
                    break;
                default: {
                    console.log("Recieved unknown message");
                }
            }
        }

        socket.onerror = err => {
            console.error(
                "Socket encountered error: ",
                err.message,
                "Closing socket"
            );

            socket.close();
        }

        socket.onclose = () => {
            console.log('disconnected')
            // automatically try to reconnect on connection loss
        }
    }

    render() {
        let currentView = this.state.partyCode !== '' ? <PartyView isHost={this.state.isHost} partyCode={this.state.partyCode} /> : <PartyForm socket={this.state.socket} />;
        return (
            <div>
                {currentView}
            </div>
        )
    }
}

export default Party;