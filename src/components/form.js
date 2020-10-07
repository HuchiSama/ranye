import React, { createRef } from 'react'
import { navStore, signStore } from '../redux/redux'
import axios from 'axios'
import { withRouter } from 'react-router-dom'
import { Link } from "react-router-dom"
// import signStore from '../redux/redux'
class Form extends React.Component {

  static footer(props) {
    let other = (
      <>
        <hr className="other-hr" />
        <div className="other-Account">
          <span>其他账号登陆</span>
          <span>广告位招租</span>
          <span>广告位招租</span>
        </div>
      </>
    )
    return (
      <>
        {props.other && other}
      </>
    )
  }

  constructor(props) {
    super()
    this.state = signStore.getState()
    this.props = props

    this.errRef = createRef()
  }

  componentDidMount() {
    window.onclick = () => {
      this.errRef.current.innerHTML = ""
    }
  }
  componentWillUnmount() {
    window.onclick = null
  }

  signTo = (e) => {
    e.preventDefault()
    let el = e.target
    if (this.props.form === 'signin') {
      let form = {
        name: el.name.value,
        password: el.password.value,
        captcha: el.captcha.value,
      }
      axios.post('/api/clearCookie')
      axios.post('/api/login', form)
        .then(item => {
          if (item.data === 0) {
            document.querySelector('.captcha').click()
            this.errRef.current.innerHTML = '用户名或密码错误，请重新输入'
          } else if (item.data === 1) {
            if (window.location.pathname === '/sign') {
              this.props.history.push("/")
            } else {
              navStore.dispatch({
                type: 'toSign',
                sign: true,
              })
              window.location.replace('')
            }
          } else {
            document.querySelector('.captcha').click()
            this.errRef.current.innerHTML = '验证码错误，请重新输入'
          }
        }).catch(console.log)
    } else {
      if (el.password.value !== el.nextPassword.value) {
        return this.errRef.current.innerHTML = '密码验证失败，请重新输入'
      }
      let form = {
        name: el.name.value.trim(),
        password: el.password.value.trim(),
        email: el.email.value.trim(),
      }
      if (!form.name || !form.password || !form.email) {
        return this.errRef.current.innerHTML = '不能输入空，请重新输入'
      }
      if (this.props.accQuery) {
        return this.errRef.current.innerHTML = '用户名已被使用，请重新输入'
      }
      if (this.props.emailQuery) {
        return this.errRef.current.innerHTML = '邮箱已被使用，请重新输入'
      }
      // console.log(form)
      axios.post('/api/sign_up', form)
        .then(item => {
          if (item.data) {
            signStore.dispatch({
              type: 'sucessSignup',
              sucessSignup: true
            })

            setTimeout(() => {
              let sucess = document.querySelector('.success')
              sucess.classList.remove('suc-transition')
            }, 200)
            setTimeout(() => {
              let sucess = document.querySelector('.success img')
              sucess.classList.add('img-cslc')
              document.querySelector('.success label').classList.remove('label-visi')
            }, 3000)
          } else {
            this.errRef.current.innerHTML = '注册失败，请再次尝试'
          }
        }).catch(() => {
          this.errRef.current.innerHTML = '注册失败，请再次尝试'
        })
    }
  }
  toSignUp = (e) => {
    e.preventDefault()
    signStore.dispatch({
      type: 'formRedirect',
      form: 'signup',
      captcha: false,
      other: false,
      protocol: '注册即代表同意《知乎协议》《隐私保护指引》',
      buttonText: '注册',
    })
  }
  toSignIn = (e) => {
    e.preventDefault()
    signStore.dispatch({
      type: 'formRedirect',
      form: 'signin',
      captcha: 2,
      other: true,
      protocol: '未注册手机验证后自动登录，注册即代表同意《知乎协议》《隐私保护指引》',
      buttonText: '登录',
    })
  }
  render() {
    let props = this.props
    let children = props.children.props.children
    return (
      <>
        <form action="/api/login" method="post" onSubmit={this.signTo}>
          {
            children.filter(it => it.type !== 'div')
          }

          <div className="redirector">
            {props.form === 'signin'
              ? <>
                <Link to="/sign_up" className="zhuce" onClick={this.toSignUp}>注册新用户</Link>
                <Link to="/lossPas" className="lossPas">忘记密码？</Link>
              </>
              : <Link to="/sign" className="zhuce" onClick={this.toSignIn}>返回登陆界面</Link>
            }
          </div>
          {
            children.filter(it => it.type === 'div')
          }
          <span className={props.form === 'signin' ? "sub-error" : "lossPas sub-error"} ref={this.errRef}></span>
          <button type="submit" className="submit" >{props.buttonText}</button>
          <span className="xieyi">{this.state.protocol}</span>
        </form>
        <Form.footer xieyi={props.xieyi} other={props.other} />
      </>
    )
  }
}

export default withRouter(Form)
