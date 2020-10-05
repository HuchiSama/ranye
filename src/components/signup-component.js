import React, { useState, useEffect, useCallback } from 'react'
// import { Form, Input, Button, Checkbox, Space, message } from 'antd'
// import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './signin-component.css'
import Footer from './footer'
import { signStore } from '../redux/redux'
import Sign from './sign'


export default function Logup() {
  let [state, setState] = useState({
    form: 'signup',
    captcha: false,
    other: false,
    protocol: '注册即代表同意《知乎协议》《隐私保护指引》',
    buttonText: '注册',
    sucessSignup: false,
  })
  useEffect(() => {
    let uns = signStore.subscribe(() => setState(signStore.getState()))
    return () => uns()
  })
  return (
    <div className="main">
      {state.sucessSignup &&
        <Success props={state} />
      }
      <img src="../images/login-top.png" alt="logo" className="logo" />
      <Sign state={state} />
      <Footer type="signup" />
    </div>
  )
}

export function Success(props) {
  let toSignin = useCallback((e) => {
    e.preventDefault()
    signStore.dispatch({
      type: 'toSignin',
      sucessSignup: false
    })
  }, [])
  return (
    <div className="success-bg">
      <div className={props.sucessSignup ? "success" : 'suc-transition success'}>
        <img src="/images/loading.gif" alt="注册成功" />
        <label className="label-visi">
          <span>注册成功！ </span> 点击 <a href="/sign" onClick={toSignin}>返回登陆</a>
        </label>
      </div>
    </div>
  )
}
