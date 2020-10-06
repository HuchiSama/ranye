import React, { useCallback, useEffect, useState,Fragment } from 'react'
import axios from 'axios'
import { HeartOutlined, CommentOutlined, CloseOutlined } from '@ant-design/icons';
import { careStore, navStore } from '../redux/redux';
import { Input, Button } from 'antd';
import moment from 'moment';
const { TextArea } = Input;

export default function (props) {
  let [careBloon, setCareBl] = useState(false)
  let { careInfo = {} } = props
  let [chat, setChat] = useState(false)
  let [state, setState] = useState(navStore.getState())
  useEffect(() => {
    let uns = navStore.subscribe(() => setState(navStore.getState()))
    return () => uns()
  }, [])
  useEffect(() => {
    if (careBloon) {
      var recare = document.querySelector('.recare')
      recare.onmouseenter = () => {
        recare.childNodes[1].innerText = "取消"
      }
      recare.onmouseleave = () => {
        recare.childNodes[1].innerText = "已关注"
      }
    }
    return () => {
      if (careBloon) {
        recare.onmouseenter = null
        recare.onmouseleave = null
      }
    }
  }, [careBloon])
  useEffect(() => {
    axios.get('/api/care')
      .then(res => {
        let data = res.data
        careStore.dispatch({
          type: 'getCare',
          ...data,
        })
      }).catch(rej => { })

    let uns = careStore.subscribe(() => {
      setCareBl(Array.from(careStore.getState().myCares).some(it => it.careId === careInfo.userId))
    })
    return () => uns()
  }, [careInfo])
  let updateCare = useCallback(() => {
    if (state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    careStore.dispatch({
      type: 'updateCare',
      id: careInfo.userId,
    })

    axios.post('/api/care', { type: careBloon ? 'reCare' : 'toCare', careId: careInfo.userId })
      .catch(rej => {
        if (rej.response.status === 401) {
          navStore.dispatch({
            type: 'toSign',
            sign: false,
          })
        }
      })

  }, [careBloon, careInfo, state])
  let toChat = useCallback(() => {
    if (state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    setChat(!chat)
  }, [chat, state])
  // useEffect(() => {

  // }, [ws])
  return (
    <>
      <ul className="poster-interactive">
        {careBloon
          ? <li onClick={updateCare} className="recare"><HeartOutlined /><span>已关注</span></li>
          : <li onClick={updateCare}><HeartOutlined /><span>关注他</span></li>
        }
        <li onClick={toChat}><CommentOutlined />发私信</li>
      </ul>
      { chat && <ChatWindow targetInfo={careInfo} setChat={setChat} state={state} />}
    </>
  )
}


export function ChatWindow({ targetInfo, setChat, state }) {
  let [value, setValue] = useState('')
  let [msgList, updateMsg] = useState([])
  let [ws, setWS] = useState(null)

  useEffect(() => {
    if (ws === null) {
      setWS(new WebSocket(`ws://47.111.233.71:8080/targetId=${targetInfo.userId}&&userId=${state.userInfo.userId}`))
    }
  }, [targetInfo, state, ws])

  let sendMsg = useCallback(() => {
    if (value === '') { return }
    ws.send(JSON.stringify([{
      content: value,
      targetName: targetInfo.name,
      targetId: targetInfo.userId,
      targetAvatar: targetInfo.avatar
    }]))
    setValue('')
  }, [value, targetInfo, ws])
  useEffect(() => {
    if (ws) {
      ws.onopen = function (msg) {
        console.log('WebSocket opened!');
      }
      ws.onclose = function () {
        console.log('WebSocket closed!');
      }
      ws.onmessage = (event) => {
        let msg = JSON.parse(event.data)
        msg = msg.flat()
        console.log(msg)
        updateMsg(msg)
      }
    }
  }, [ws])
  let editInput = useCallback((e) => {
    setValue(e.target.value)
  }, [])

  let webClose = useCallback(() => {
    setChat(false)
    ws.close()
  }, [ws, setChat])
  useEffect(() => {
    let section = document.querySelector('.chat-section')
    section.scrollTop = document.querySelector('.chat-section-ul').offsetHeight
  }, [msgList])
  let sendEnter = useCallback((e) => {
    if (!e.shiftKey && e.keyCode === 13) {
      e.preventDefault()
      document.querySelector('.chat-edit-footer button').click()
    }
  }, [])
  return (
    <div className="chat-outer" style={{ width: `${window.innerWidth}px`, height: `${window.innerHeight}px` }}>
      <div className="chat-container">
        <div className="chat-user-head">
          <label onClick={webClose}><CloseOutlined /></label>
          <h2>{targetInfo.name}</h2>
        </div>
        <div className="chat-section">
          <ul className="chat-section-ul">
            {msgList.map((it, idx) => {
              if (it.targetName !== state.cookieUser) {
                let now = moment(Date.now()).format("YY")
                let created = moment(it.createdAt * 1).format("YY")
                return (
                  <Fragment key={it.createdAt}>
                    <li className="chat-time">
                      {(idx === 0 || (it.createdAt - msgList[idx - 1].createdAt >= 180000)) &&
                        <span >{now * 1 > created * 1
                          ? moment(it.createdAt * 1).format("YY-MM-DD HH:mm:ss")
                          : moment(it.createdAt * 1).format("MM-DD HH:mm:ss")
                        }
                        </span>
                      }</li>
                    <li className="chat-section-me" key={it.createdAt}>
                      <p className="chat-msg-content">{it.content}</p>
                      <i style={{ backgroundImage: `url(${it.userAvatar})` }} className="chat-msg-avatar"></i>
                    </li>
                  </Fragment>
                )
              } else {
                let now = moment(Date.now()).format("YY")
                let created = moment(it.createdAt * 1).format("YY")
                return (
                  <Fragment key={it.createdAt}>
                    <li className="chat-time">
                      {(idx === 0 || (it.createdAt - msgList[idx - 1].createdAt >= 180000)) &&
                        <span >{now * 1 > created * 1
                          ? moment(it.createdAt * 1).format("YY-MM-DD HH:mm:ss")
                          : moment(it.createdAt * 1).format("MM-DD HH:mm:ss")
                        }
                        </span>
                      }</li>
                    <li className="chat-section-target" key={it.createdAt}>
                      <i style={{ backgroundImage: `url(${targetInfo.avatar})` }} className="chat-msg-avatar"></i>
                      <p className="chat-msg-content">{it.content}</p>
                    </li>
                  </Fragment>
                )
              }
            })
            }
          </ul>
        </div>
        <div className="chat-footer">
          <div className="chat-edit">
            <TextArea rows={6} value={value} onChange={editInput} onKeyDown={sendEnter} />
          </div>
          <div className="chat-edit-footer">
            <span>按Enter 发送</span>
            <Button type="primary" onClick={sendMsg}>发送</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
