import React, { Component } from 'react';

class PartyView extends Component {

    render() {
        let isHostView = this.props.isHost ? <label>You are host</label> : null;
        return(
            <div>
                <h1>Party: {this.props.partyCode}</h1>
                {isHostView}
            </div>
        )
    }
}

export default PartyView;