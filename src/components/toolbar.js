import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { SyncOutlined, EditOutlined, ProjectFilled, StarFilled, HeartFilled, FileFilled, } from '@ant-design/icons'
import { homeStore, userStore, navStore } from '../redux/redux'
import { withRouter } from 'react-router-dom'
import { Link } from "react-router-dom"

export default function () {
  let [data, setData] = useState(homeStore.getState())
  useEffect(() => {
    let uns = homeStore.subscribe(() => setData(homeStore.getState()))
    return () => uns()
  }, [])
  return (
    <div className="toolbar">
      <div className="toolbar-user-data">
        <ToolbarHead data={data} />
        <UserInfo cookieUser={data.cookieUser} user={data.user} />
        <UserSign data={data} />
      </div>
      <Recommend data={data} />
      <FooterBar />
    </div>
  )
}

function ToolbarHead(props) {
  let cookieUser = props.data.cookieUser
  let user = props.data.user || {}
  let signOut = useCallback(() => {
    axios.post('/api/clearCookie/')
  }, [])
  return (
    <span>
      {cookieUser !== undefined
        ? <>欢迎用户 <Link to={'/user/' + user.userId} className="denglu-user">{cookieUser}</Link>
          <Link to="/sign" className="dengchu" onClick={signOut}>登出</Link></>
        : <>当前处于未登录状态
          <Link to="/sign" className="dengchu">登录/注册</Link></>
      }
    </span>
  )
}

function Info(props) {
  let user = props.user || {}
  let [avatar, avatarChange] = useState(user.avatar)
  //切换头像
  let [hoverAvatar, setHover] = useState(false)
  let avatarCutover = useCallback((e) => {
    let data = new FormData()
    data.append('avatar', e.target.files[0])
    axios.post('/api/user-avatar/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then(res => {
      avatarChange(res.data)
    })
  }, [])
  let inputAvatar = useCallback(() => {
    document.querySelector('[name="avatar"]').click()
  }, [])
  useEffect(() => {
    avatarChange(user.avatar)
  }, [user])
  let pushUserPage = useCallback((idx) => {
    if (props.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      props.history.push(`/user/${user.userId}`)
      userStore.dispatch({
        type: 'activeSwitch',
        active: idx,
      })
    }

  }, [user, props])
  useEffect(() => {
    function switchAvatar() {
      homeStore.dispatch({
        type: 'hoverAvatar',
        hover: true,
      })
    }
    function clearAvatarEvent() {
      homeStore.dispatch({
        type: 'hoverAvatar',
        hover: false,
      })
    }
    let userAvatarDiv = document.querySelector('.user-avatar')
    userAvatarDiv.addEventListener('mouseenter', switchAvatar)
    userAvatarDiv.addEventListener('mouseleave', clearAvatarEvent)

    let uns = homeStore.subscribe(() => setHover(homeStore.getState().hover))
    return () => {
      uns()
      userAvatarDiv.removeEventListener('mouseenter', switchAvatar)
      userAvatarDiv.removeEventListener('mouseleave', clearAvatarEvent)
    }
  }, [])

  return (
    <div className="user-info">
      {props.cookieUser
        ? <div className="user-avatar" onClick={inputAvatar} style={{ backgroundImage: `url(${avatar})` }}>
          {/* <i className="switch"> </i> */}
          <input type="file" name="avatar" style={{ display: 'none' }} onChange={avatarCutover} />
          {hoverAvatar &&
            <div className="avatarMouseEnter">
              <SyncOutlined /><span>更换头像</span>
            </div>
          }
        </div>
        : <div className="user-avatar" style={{ backgroundImage: `url('/images/default.jpg')` }}>
        </div>
      }
      <ul className="user-bar">
        <li onClick={() => pushUserPage(0)}><span><ProjectFilled />全部动态</span></li>
        <li onClick={() => pushUserPage(5)}><span><StarFilled />我的收藏</span></li>
        <li onClick={() => pushUserPage(4)}><span><HeartFilled />我的关注</span></li>
        <li onClick={() => pushUserPage(1)}><span><FileFilled />历史回答</span></li>
      </ul>
    </div>
  )
}

export const UserInfo = withRouter(Info)
export function UserSign(props) {
  let data = props.data || {}
  // debugger
  //更新签名
  let user = data.user || {}
  let signChange = useCallback((e) => {
    e.stopPropagation()
    if (data.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    let sign = document.querySelector('.user-sign-text')
    sign.setAttribute('contenteditable', true)
    sign.focus()
    sign.onblur = () => {
      axios.post('/api/sign-edit/', { user_sign: sign.textContent })
      sign.setAttribute('contenteditable', false)
    }
  }, [data])
  let lastSign = useRef('')
  let signInput = useCallback((e) => {
    let text = e.target.textContent
    if (text.length === 30) {
      lastSign.current = text
    }
    if (text.length > 30) {
      e.target.innerText = lastSign.current
    }
  }, [])
  return (
    <div className="user-sign">
      <i className="el-icon-edit" onClick={signChange}><EditOutlined style={{ fontSize: '16px', marginRight: '8px' }} /> </i>
      {data.cookieUser
        ? <span className="user-sign-text" onInput={signInput}>{user ? user.sign : data.poster.sign}</span>
        : <span>当前还未登录，赶快前往登录吧！</span>
      }
    </div>
  )
}


export function Recommend() {
  let [data, upData] = useState(homeStore.getState())
  // debugger
  // let [divTop, upTop] = useState(0)
  useEffect(() => {
    //请求数据
    axios.get('/api/home-data').then(res => {
      let initial = res.data
      homeStore.dispatch({
        type: 'getData',
        ...initial
      })
    })

    // upTop(window.innerHeight)
    // recommendScoll()
    // let recommendDIV = document.querySelector('.recommend')
    // window.onmousewheel = (e) => {
    //   if (e.wheelDelta > 0 && window.scrollY === 0) {
    //     recommendDIV.scrollTop = 0
    //   }
    // }

    let uns = homeStore.subscribe(() => upData(homeStore.getState()))
    return () => uns()
  }, [])

  let recommend = data.recommend || []
  let recommendList = recommend.filter(it => it.status !== 'delete')

  return (
    <div className="recommend"  >
      <h3>热门问题</h3>
      <ul className="recommend-list">
        {recommendList.slice(0, 15).map(item => {
          return (
            <li key={item.postId}>
              <Link to={"/post-page/" + item.postId} title={item.title}>{item.title}</Link>
            </li>
          )
        })
        }
      </ul>
      {/* <FooterBar /> */}
    </div>
  )
}

export function FooterBar() {
  return (
    <div className="footer-bar">
      <p> 陈听水 然也指南 然也协议 然也隐私保护指引 <br />应用工作申请开通然也机构号<br />侵权举报网上有害信息举报专区<br />京 ICP 证 110745 号<br />京 ICP 备 13052560 号 - 1<br />京公网安备 11010802010035 号<br />互联网药品信息服务资格证书<br />（京）- 非经营性 - 2017 - 0067违法和不良信息举报：010-82716601<br /> 儿童色情信息举报专区<br />证照中心<br />联系我们 © 2020 然也</p>
    </div>
  )
}
