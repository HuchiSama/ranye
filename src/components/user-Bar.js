import React, { useCallback, useEffect, useState } from 'react'
import { userStore } from '../redux/redux'
import { FooterBar } from './toolbar'
import { withRouter } from 'react-router-dom'
import { LikeFilled } from '@ant-design/icons'

export default function UserBar() {
  return (
    <div className="toolbar">
      <Score />
      <FooterBar />
    </div>
  )
}
function UserScore() {
  let [state, setState] = useState(userStore.getState() || {})
  let { userInfo = {} } = state
  let isMe = state.cookieUser === userInfo.name
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [])

  let careQuestion = useCallback((one, sen) => {
    userStore.dispatch({
      type: 'activeSwitch',
      active: one,
    })
    userStore.dispatch({
      type: 'careActive',
      careActive: sen,
    })
  }, [])
  let collectActive = useCallback((one, sen) => {
    userStore.dispatch({
      type: 'activeSwitch',
      active: one,
    })
    userStore.dispatch({
      type: 'collectActive',
      collectActive: sen,
    })
  }, [])
  return (
    <>
      <div className="person-honor">
        <h4>个人成就</h4>
        <ul>
          <li><LikeFilled style={{ fontSize: '16px' }} /></li>
          <li>
            <span>获得了 {userInfo.agree} 次赞同</span>
            <span>{userInfo.collect} 次收藏</span>
            <span>{userInfo.favorite} 次喜欢</span>
          </li>
        </ul>
      </div>
      <div className="user-score">
        <div className="likes" onClick={() => careQuestion(4, 1)}><h4>关注了</h4><span>{userInfo.care}</span></div>
        <div className="fans" onClick={() => careQuestion(4, 2)}><h4>关注者</h4><span>{userInfo.fans}</span></div>
      </div>
      <div>
        <ul className="user-bar-list">
          <li onClick={() => careQuestion(4, 0)}><span>关注的问题</span><span>{state.attentionDynamic && state.attentionDynamic.length}</span></li>
          <li onClick={() => collectActive(5, 0)}><span>收藏的问题</span><span>{state.collectQues && state.collectQues.length}</span></li>
          <li onClick={() => collectActive(5, 1)}><span>收藏的回答</span><span>{state.collectComment && state.collectComment.length}</span></li>
          <li onClick={() => careQuestion(4, 1)}><span>{isMe ? '我' : userInfo.sex === 'man' ? '他' : '她'}关注的人</span><span>{userInfo.care}</span></li>
        </ul>
      </div>
    </>
  )
}

const Score = withRouter(UserScore)
