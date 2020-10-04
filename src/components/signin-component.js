import React, { useEffect, useState } from 'react'
// import { Form, Input, Button, Checkbox, Space, message } from 'antd'
// import { UserOutlined, LockOutlined } from '@ant-design/icons';
// import { Redirect } from 'react-router-dom'
import { signStore } from '../redux/redux.js'
import './signin-component.css'
import Footer from './footer'
import Sign from './sign'

export default function Login() {
  let [state, setState] = useState(signStore.getState())

  useEffect(() => {
    let uns = signStore.subscribe(() => setState(signStore.getState()))
    return () => uns()
  })
  return (
    <div className="main">
      <img src="../images/login-top2.png" alt="logo" className="logo" />
      {state.sucessSignup &&
        <Success props={state} />
      }
      <Sign state={state} />
      <Footer />
    </div>
  )
}
function Success(props) {

  return (
    <div className="success-bg">
      <div className={'suc-transition success'}>
        <img src="./images/loading.gif" alt="注册成功" />
        <label className="label-visi">
          <span>注册成功！ </span> 点击 <a href="./sign">返回登陆界面</a>
        </label>
      </div>
    </div>
  )
}





