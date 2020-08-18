import React, { Component } from 'react';
import { Button, Form, Col, Row } from 'react-bootstrap/';

class PartyForm extends Component {

    state = {
        socket: null,
        partyCode: ''
    }

    componentDidMount(){
        let socket = new WebSocket('ws://localhost:8524');
        this.setState({socket : socket})
    }

    sendHostPartyMessage = () => {
        var joinedMsg = {
            messageType: 'CREATE_PARTY'
        };
        this.state.socket.send(JSON.stringify(joinedMsg));
    }

    render() {
        return (
            <div>
                <Form>
                    <Form.Group as={Row} controlId="">
                        <Form.Label column sm="2">
                            Host a party
                        </Form.Label>
                        <Col sm="10">
                            <Button onClick={this.sendHostPartyMessage}>Host party</Button>
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
                                style={{'textTransform':'uppercase'}}
                                required
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