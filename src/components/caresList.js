import React, { Fragment, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { CheckCircleFilled, ManOutlined, WomanOutlined } from '@ant-design/icons'
// import { FooterBar } from './toolbar'
// import { Over, Attachment } from './invitation'
// import { homeStore } from '../redux/redux'
import './user-page.css'
import { careStore, userStore, navStore } from '../redux/redux'
import { useParams } from 'react-router-dom'
// import PostsFooter from './postfooter'
import { AttentionQuestion } from './user-container'
import { Link } from "react-router-dom"


export default function AttentionDynamic(props) {
  let dynamicList = props.dynamicList
  let state = props.state
  let userInfo = state.userInfo || {}
  let isMe = state.cookieUser === userInfo.name
  let [active, setActive] = useState(userStore.getState().careActive || 0)
  useEffect(() => {
    let uns = userStore.subscribe(() => setActive(userStore.getState().careActive))
    return () => uns()
  })
  let changeView = useCallback((idx) => {
    userStore.dispatch({
      type: 'careActive',
      careActive: idx,
    })
    // setActive(idx)
  }, [])
  let Idx = -1
  return (
    <>
      <div className="dynamicCareList">
        <ul>
          <li onClick={() => changeView(0)} className={active === 0 ? 'careListActive' : ''}>关注的问题</li>
          <li onClick={() => changeView(1)} className={active === 1 ? 'careListActive' : ''}>{isMe ? '我' : state.userInfo.sex === 'man' ? '他' : '她'}关注的人</li>
          <li onClick={() => changeView(2)} className={active === 2 ? 'careListActive' : ''}>关注{isMe ? '我' : state.userInfo.sex === 'man' ? '他' : '她'}的人</li>
        </ul>
      </div>
      <div>
        <ul className="posts user-Dynamic cares">
          {active === 0 &&
            dynamicList.map((item, idx) => {
              if (item.status !== 'delete') {
                Idx++
                return (
                  <Fragment key={idx}>
                    {item.style === 'attention' && <AttentionQuestion item={item} state={props.state} idx={Idx} />}
                  </Fragment>
                )
              }
              return ""
            })
          }
          {active !== 0 && <CaresList active={active} />
          }
        </ul>
      </div>
    </>
  )
}

function CaresList(props) {
  let active = props.active
  let { id } = useParams()
  let [state, setState] = useState(careStore.getState() || {})
  let { myCares = [] } = state
  let careList = active === 1 ? state.itCaresList : state.recevies

  useEffect(() => {
    axios.get(`/api/get-care/${id}`)
      .then(res => {
        let data = res.data
        careStore.dispatch({
          type: 'getCare',
          cares: data.myCares,
          ...data
        })
      })

    let uns = careStore.subscribe(() => setState(careStore.getState()))
    return () => uns()
  }, [id])

  let enterText = useCallback((e) => {
    e.target.innerText = '取消关注'
  }, [])
  let leaveTXet = useCallback((e) => {
    e.target.innerText = '已关注'
  }, [])
  // debugger
  let updateCare = useCallback(({ type, item }) => {
    if (state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    careStore.dispatch({
      type: 'updateCare',
      id: item.userId,
    })

    axios.post('/api/care', { type, careId: item.userId })
      .catch(rej => {
        if (rej.response.status === 401) {
          navStore.dispatch({
            type: 'toSign',
            sign: false,
          })
        }
      })
  }, [state])

  return (
    <>
      {careList && careList.map(item => {
        let careBloon = myCares.find(it => it.careId === item.userId)
        return (
          <li key={item.createdAt} className="careList">
            <div><Link to={'/user/' + item.userId}><i style={{ backgroundImage: `url(${item.avatar})` }} className="careAvatar"></i></Link></div>
            <div>
              <Link to={'/user/' + item.userId} className="cares-name">
                <h3>{item.name}</h3>
                {item.sex === 'man'
                  ? <ManOutlined style={{ marginLeft: '15px', color: '#0084FF' }} />
                  : <WomanOutlined style={{ marginLeft: '15px', color: '#e49eab' }} />
                }
              </Link>
              <span className="careSign">{item.sign}</span>
              <ul className="careinfo">
                <li><span>{item.commentCount} 回答</span></li>
                <li><span>{item.agree} 赞同</span></li>
                <li><span>{item.fans} 关注者</span></li>
              </ul>
            </div>
            <div className="careButton">
              {careBloon
                ? <button className="active" onMouseEnter={enterText} onMouseLeave={leaveTXet} onClick={() => updateCare({ type: 'reCare', item: item })}>已关注</button>
                : <button className="unactive" onClick={() => updateCare({ type: 'toCare', item: item })}><CheckCircleFilled /> 关注{item.sex === 'man' ? '他' : '她'}</button>
              }
            </div>
          </li>
        )
      })
      }
    </>
  )
}
