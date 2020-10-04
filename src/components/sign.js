import React, { useCallback, useEffect, useState } from 'react'
import { signStore } from '../redux/redux'
import Form from './form'
import axios from 'axios'

export default function Sign(props) {
  let [state, setState] = useState(signStore.getState())
  // let [accValue, setAccValue] = useState('')
  // let [emailValue, setemailValue] = useState('')
  let [accQuery, setAccQuery] = useState(false)
  let [emailQuery, setemailQuery] = useState(false)
  let formRedirect = useCallback(function (e) {
    let type = e.target.textContent === '用户登录' ? 'signin' : 'signup'
    if (type === 'signin') {
      signStore.dispatch({
        type: 'formRedirect',
        form: 'signin',
        captcha: 2,
        other: true,
        protocol: '未注册手机验证后自动登录，注册即代表同意《知乎协议》《隐私保护指引》',
        buttonText: '登录',
      })
    } else {
      signStore.dispatch({
        type: 'formRedirect',
        form: 'signup',
        captcha: false,
        other: false,
        protocol: '注册即代表同意《知乎协议》《隐私保护指引》',
        buttonText: '注册',
      })
    }
  }, [])

  useEffect(() => {
    let uns = signStore.subscribe(() => setState(signStore.getState()))
    return () => uns()
  }, [])
  // debugger
  let switchCaptcha = useCallback(function (e) {
    let el = e.target
    el.src = `/api/captcha?t=${Date.now()}`
  }, [])
  let accountInput = useCallback((e) => {
    axios.post('/api/user-query/', { name: e.target.value })
      .then(res => {
        if (res.data === 0) {
          setAccQuery(true)
        } else {
          setAccQuery(false)
        }
      })
  }, [])
  let emailInput = useCallback((e) => {
    axios.post('/api/email-query/', { email: e.target.value })
      .then(res => {
        if (res.data === 0) {
          setemailQuery(true)
        } else {
          setemailQuery(false)
        }
      })
  }, [])
  return (
    <div className="outer">
      <div className="form-header">
        <label className={state.form === "signin" ? 'form-action' : ''} onClick={formRedirect}>
          用户登录
        </label>
        <label className={state.form === "signup" ? 'form-action signup-label' : 'signup-label'} onClick={formRedirect}>
          注册账号
        </label>

      </div>
      <hr />
      <Form captcha={state.captcha} other={state.other} form={state.form} xieyi={state.captcha} buttonText={state.buttonText} accQuery={accQuery} emailQuery={emailQuery}>
        {
          state.form === 'signin'
            ? <div>
              < input type="text" placeholder="请输入登录账号" className="name" name="name" />
              < input type="password" placeholder='密码' className="password" name="password" />
              <div name="captcha-div">
                < input type="text" placeholder='请输入验证码' className="captcha-input" name="captcha" />
                <img src={`/api/captcha?t=${Date.now()}`} title="点击换一张" className="captcha" onClick={switchCaptcha} alt="captcha" />
              </div>
            </div>
            : <div>
              < input type="text" placeholder="请输入注册账号" className="name" name="name" onChange={accountInput} />
              {accQuery && <label className="user-query"></label>}
              < input type="email" placeholder='绑定电子邮箱' className="email" name="email" onChange={emailInput} />
              {emailQuery && <label className="email-query"></label>}
              < input type="password" placeholder="请输入密码" className="password" name="password" />
              < input type="password" placeholder='请再次输入密码' className="password" name="nextPassword" />
            </div>
        }
      </Form>
    </div>
  )
}
