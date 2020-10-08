import React from 'react';
// import logo from './logo.svg';
import './App.css';
// import { Button } from 'antd';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文

// import 'antd/dist/antd.css';
import Home from './pages/home'
import './index.css';
import Signin from './pages/signin.js'
import Signup from './components/signup-component'
import PostPage from './pages/post'
import User from './pages/user'
// import Edit from './components/edit-userInfo'
// import Main from './layout'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";


const App = () => (
  <div className="App">
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route path="/index">
          <Home />
        </Route>
        <Route path="/sign">
          <Signin />
        </Route>
        <Route path="/sign_up">
          <Signup />
        </Route>
        <Route path="/post-page/:id">
          <PostPage />
        </Route>
        {/* <Route path="/user/edit">
          <Edit />
        </Route> */}
        <Route path="/user/:id">
          <User />
        </Route>
        <Redirect to="/" />
      </Switch>
    </Router>
  </div>
)


export default App;
