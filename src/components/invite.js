import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'

import { Button } from 'antd'
import './user-page.css'
import { careStore, pageStore } from '../redux/redux'
import { useParams } from 'react-router-dom'

export default function ({ userId }) {
  let { id } = useParams()
  let [cares, setCare] = useState([])
  useEffect(() => {
    let uns = careStore.subscribe(() => setCare(careStore.getState().myCares))
    return () => uns()
  }, [])
  let outerRef = useRef()
  useEffect(() => {
    //获取关注列表
    axios.get(`/api/get-care/${userId}`)
      .then(res => {
        careStore.dispatch({
          type: 'getCare',
          myCares: res.data.myCares,
        })
      })
    //获取邀请状态
    axios.get(`/api/invite/${id}`)
      .then(res => {
        pageStore.dispatch({
          type: 'getInitial',
          inviteList: res.data.inviteList,
        })
      })

  }, [id, userId])
  useEffect(() => {
    let foo = document.querySelector('.invite-outer')
    foo.onmousewheel = (e) => {
      e.preventDefault()
    }

    return () => foo.onmousewheel = null
  }, [])
  let inviteEnd = useCallback(() => {
    pageStore.dispatch({
      type: 'invite',
      invite: false,
    })
  }, [])
  useEffect(() => {
    function clearInvite(e) {
      e.stopPropagation()
      if (e.target === outerRef.current || e.target === document.body) {
        inviteEnd()
      }
    }
    window.addEventListener('click', clearInvite)
    return () => window.removeEventListener('click', clearInvite)
  }, [inviteEnd])
  return (
    <div className="invite-outer" ref={outerRef}>
      <div className="invite-main">
        <div className="invite-header"><h2>选择想要邀请的用户<span> * 只能邀请关注用户，请多多充实关注列表吧！</span></h2>
          <Button type="primary" size="middle" onClick={inviteEnd}>完成</Button></div>
        <ul className="invite-list">
          {cares.length === 0 && <li className="no-invite"><span >还没有关注过用户，邀请列表太冷清啦！</span></li>}
          {cares.map(invite => {
            return <li key={invite.createdAt}><InviteItem invite={invite} /></li>
          })}
        </ul>
      </div>
    </div>
  )
}

function InviteItem({ invite }) {
  let { id } = useParams()
  let [complete, setComplete] = useState(false)
  let [clear, setClear] = useState(false)
  useEffect(() => {
    function updateInvite() {
      let inviteList = pageStore.getState().inviteList || []
      let temp = inviteList.some(it => it.targetId === invite.careId)
      setComplete(temp)
    }
    updateInvite()
    let uns = pageStore.subscribe(() => updateInvite())
    return () => uns()
  }, [invite])

  let toInvite = useCallback((type) => {
    axios.post('/api/invite', {
      type: type,
      postId: id,
      targetId: invite.careId,
      targetName: invite.careName,
    }).then(res => {
      pageStore.dispatch({
        type: 'upDateInvite',
        inviteList: res.data.newInvites
      })
    })
  }, [id, invite])
  return (
    <div className="invite-item">
      <a href={`/user/${invite.careId}`}><i style={{ backgroundImage: `url(${invite.avatar})` }} className="invite-avatar"></i></a>
      <div className="invite-userInfo">
        <a href={`/user/${invite.careId}`}><h4>{invite.careName}<span>  -  {invite.industry}</span></h4></a>
        <span>{invite.sign}</span>
      </div>
      {complete
        ? <Button type="ghost" onClick={() => toInvite('revoke')} style={{ width: '100px', color: 'rgb(138 138 138)' }} onMouseEnter={() => setClear(true)} onMouseLeave={() => setClear(false)}>{clear ? '取消邀请' : '已邀请'}</Button>
        : <Button type="ghost" style={{ width: '100px', borderColor: '#40a9ff', color: '#40a9ff' }} onClick={() => toInvite('active')}>邀请回答</Button>
      }

    </div>
  )
}
