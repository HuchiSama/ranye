import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { ManOutlined, DownOutlined, UpOutlined, MailOutlined, WomanOutlined, CameraOutlined } from '@ant-design/icons'
import './user-page.css'
import { userStore, homeStore } from '../redux/redux'
import EditUser from './edit-userInfo'
import CareMessage from './care-message'

export default function () {

  return (
    <div className="user-page ">
      <div className="user-header-bg">
        <UserHeader />
      </div>
    </div>
  )
}

function UserHeader() {
  let [state, setState] = useState({})
  let userInfo = state.userInfo || {}

  let [avatar, avatarChange] = useState(userInfo.avatar)
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
    avatarChange(userInfo.avatar)
  }, [userInfo])
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
    let userAvatarDiv = document.querySelector('.User-avatar')
    userAvatarDiv.addEventListener('mouseenter', switchAvatar)
    userAvatarDiv.addEventListener('mouseleave', clearAvatarEvent)
    let uns = homeStore.subscribe(() => setHover(homeStore.getState().hover))
    return () => {
      uns()
      userAvatarDiv.removeEventListener('mouseenter', switchAvatar)
      userAvatarDiv.removeEventListener('mouseleave', clearAvatarEvent)
    }
  }, [userInfo])

  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [])

  let [flod, setFlod] = useState(false)
  let flodClick = useCallback(() => {
    setFlod(!flod)
  }, [flod])

  let editState = useCallback(() => {
    userStore.dispatch({
      type: 'editState',
      edit: true
    })
  }, [])

  // debugger
  return (
    <>
      <div className="user-header">
        <div className="UserCover-bg"></div>
        <div className="User-avatar" style={{ backgroundImage: `url(${avatar})` }} >
          <input type="file" name="avatar" style={{ display: 'none' }} onChange={avatarCutover} />
          {hoverAvatar && userInfo.name === state.cookieUser &&
            <div className="avatarMouseEnter" onClick={inputAvatar}>
              <CameraOutlined style={{ fontSize: '18px' }} /><span>更换头像</span>
            </div>
          }
        </div>
        <div className={flod ? 'UserDetailed UserDetailed-flod' : 'UserDetailed'}>
          <div className="User-data">
            <h2>{userInfo.name}</h2>
            <span className="sign">{userInfo.sign}</span>
            <UserDataList flod={flod} />
            <UserBaseData flod={flod} />
          </div>
          <div className="User-data-bottom">
            {flod
              ? <span onClick={flodClick}><UpOutlined />  收起详细资料</span>
              : <span onClick={flodClick}><DownOutlined />  查看详细资料</span>
            }
            {state.cookieUser === userInfo.name
              ? <div className="user-editing" onClick={editState}>编辑个人资料</div>
              : <div className="other-user"><CareMessage careInfo={state.userInfo} /></div>
            }

          </div>
        </div>
      </div>
      {state.edit && <EditUser />}

    </>
  )
}

function UserBaseData(props) {
  let flod = props.flod
  let [state, setState] = useState({})
  let userInfo = state.userInfo || {}
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))

    return () => uns()
  }, [])
  return (
    <>
      <ul className={flod ? 'User-data-base' : 'User-data-base active'}>
        <li><MailOutlined /><span> &nbsp; &nbsp;{userInfo.sociality}</span> </li>
        <li><span style={{ color: '#cacaca' }}>|</span>
          {userInfo.sex === 'man'
            ? <ManOutlined style={{ marginLeft: '15px', color: '#0084FF' }} />
            : <WomanOutlined style={{ marginLeft: '15px', color: '#e49eab' }} />
          }
        </li>
      </ul>
    </>
  )
}

function UserDataList(props) {
  let flod = props.flod
  let [state, setState] = useState({})
  let userInfo = state.userInfo || {}
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))

    return () => uns()
  }, [])
  return (
    <ul className={flod ? 'User-data-list active' : 'User-data-list'} >
      <li><span>现居地</span><span>{userInfo.address}</span></li>
      <li><span>生日</span><span>{userInfo.birthday && userInfo.birthday.slice(5)}</span></li>
      <li><span>所在行业</span><span>{userInfo.industry}</span></li>
      <li><span>个人简介</span><span>{userInfo.introduction}</span></li>
      <li><span>社交地址</span><span>{userInfo.sociality}</span></li>
    </ul>
  )
}

