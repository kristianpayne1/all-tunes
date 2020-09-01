import React, { Component } from 'react';
import {Button} from 'react-bootstrap';

class QueueButton extends Component {
    state = {
        value: '+',
        disabled: false,
    }

    onQueueButtonClicked = (song) => {
        this.sendQueueSong(song);
        this.setState({disabled: true, value: '-'})
    }

    sendQueueSong = (song) => {
        var message = {
            messageType: 'QUEUE_SONG',
            uri: song.uri,
        };
        try {
            this.props.socket.send(JSON.stringify(message));
        } catch (error) {
            console.log(error);
        }
    }

    render() {
        let isDisabled = this.state.disabled ? 'danger' : 'success';
        return (
        <Button 
            variant={isDisabled}
            onClick={() => this.onQueueButtonClicked(this.props.song)}
            disabled={this.state.disabled}
        >
            {this.state.value}
        </Button>
        )
    }
}

export default QueueButton;