import React from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Welcome from './Welcome';
import Home from './Home.js';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/home">
          <Home />
        </Route>
        <Route path='/'>
          <Welcome />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
