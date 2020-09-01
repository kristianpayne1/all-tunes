import React from 'react';
import './App.css';
import {
  HashRouter as Router,
  Route
} from "react-router-dom";
import Welcome from './Welcome';
import Home from './Home.js';

function App() {
  return (
    <Router basename='/'>
        <Route path="/home">
          <Home />
        </Route>
        <Route exact path='/'>
          <Welcome />
        </Route>
    </Router>
  );
}

export default App;
