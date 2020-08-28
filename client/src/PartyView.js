import React, { Component } from 'react';
import { Tabs, Tab, Table, Spinner } from 'react-bootstrap';

class PartyView extends Component {
    onQueueButtonClicked = (song) => {
        this.sendQueueSong(song);
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

    renderTable = (songs) => {
        return songs.map(song => {
            let artists = ''
            song.artists.forEach(artist => {
                artists += artist.name + ', '
            })
            return (
                <tr>
                    <td>{song.name}</td>
                    <td>{artists}</td>
                    <td>{song.popularity}</td>
                </tr>
            )
        })
    }

    renderTabs = () => {
        return this.props.recommended.map((item) => {
            return (
                <Tab eventKey={item.genre} title={item.genre}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Song</th>
                                <th>Artist(s)</th>
                                <th>Popularity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.renderTable(item.songs)}
                        </tbody>
                    </Table>
                </Tab>
            )
        })
    }

    renderRecommended = () => {
        if (this.props.recommended.length > 0) {
            return (
                <Tabs eventKey="1" fill >
                    {this.renderTabs()}
                </Tabs>
            )
        } else {
            return (
                <div>
                    <Spinner animation="border" />
                </div>
            )
        }
    }


    render() {
        let isHostView = this.props.isHost ?
            <div>
                <label>You are host</label>
                {this.renderRecommended()}
            </div>
            : null;
        return (
            <div>
                <h1>Party: {this.props.partyCode}</h1>
                {isHostView}
            </div>
        )
    }
}

export default PartyView;