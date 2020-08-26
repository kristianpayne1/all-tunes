import React, { Component } from 'react';
import { Button, Form, Col, Row } from 'react-bootstrap/';

class PartyForm extends Component {
    state = {
        value: ''
    }

    onHostButtonClicked = () => {
        this.sendHostPartyMessage();
    }

    sendHostPartyMessage = () => {
        var message = {
            messageType: 'CREATE_PARTY'
        };
        try {
            this.props.socket.send(JSON.stringify(message));
        } catch (error) {
            console.log(error);
        }
    }

    onJoinButtonClicked = (event) => {
        event.preventDefault();
        console.log("Join button clicked");
        this.sendJoinPartyMessage();
    }

    sendJoinPartyMessage = () => {
        var message = {
            messageType: 'JOIN_PARTY_REQUEST',
            partyCode: this.state.value.toUpperCase()
        };
        try {
            this.props.socket.send(JSON.stringify(message));
        } catch (error) {
            console.log(error);
        }
    }

    handleChange = (event) => {
        this.setState({ value: event.target.value });
    }

    render() {
        return (
            <div>
                <Form onSubmit={this.onJoinButtonClicked}>
                    <Form.Group as={Row} controlId="">
                        <Form.Label column sm="2">
                            Host a party
                        </Form.Label>
                        <Col sm="10">
                            <Button onClick={this.onHostButtonClicked}>Host party</Button>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="">
                        <Form.Label column sm="2">
                            Join a party
                      </Form.Label>
                        <Col sm="2">
                            <Form.Control
                                type="text"
                                placeholder="Party code"
                                maxLength="6"
                                style={{ 'textTransform': 'uppercase' }}
                                required
                                value={this.state.value} 
                                onChange={this.handleChange}
                            />
                            <Form.Control.Feedback type="invalid">
                                Please enter party code.
                            </Form.Control.Feedback>
                        </Col>
                        <Col sm="5">
                            <Button type="submit">Join party</Button>
                        </Col>
                    </Form.Group>
                </Form>
            </div>
        )
    }
}

export default PartyForm;