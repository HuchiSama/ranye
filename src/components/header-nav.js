import React, { useCallback, Fragment, useEffect, useState } from 'react'
import './home-page.css'
import { SearchOutlined, BellFilled, MessageFilled, HomeFilled, UserOutlined, FormOutlined, LogoutOutlined, ProjectFilled, HeartFilled, LikeFilled } from '@ant-design/icons'
import { homeStore, navStore, signStore, userStore } from '../redux/redux'
import axios from 'axios'
import { Empty } from 'antd';
import { withRouter } from 'react-router-dom'
import Sign from './sign'
import moment from 'moment';
import { ChatWindow } from './care-message'
import { Success } from './signup-component'

function useGetInvite() {
  let [inviteMsg, setInviteMsg] = useState(navStore.getState().invitedList || [])
  let [byCareMsg, setByCareMsg] = useState(navStore.getState().byCareList || [])
  let [byCommentMsg, setByCommentMsg] = useState(navStore.getState().byCommentLike || [])
  let [msgSum, setMsgSum] = useState(0)
  let [invited, setInvited] = useState(false)
  useEffect(() => {
    axios.get('/api/invite')
      .then(res => {
        let initial = res.data
        navStore.dispatch({
          type: 'getInitial',
          ...initial,
        })
      })
  }, [])
  useEffect(() => {
    let invitedLen = inviteMsg.filter(it => it.status !== 'view').length
    let careLen = byCareMsg.filter(it => it.status !== 'view').length
    let commentLen = byCommentMsg.filter(it => it.status !== 'view').length
    let viewLen = invitedLen + careLen + commentLen
    setMsgSum(viewLen)
  }, [inviteMsg, byCareMsg, byCommentMsg])

  useEffect(() => {
    let uns = navStore.subscribe(() => {
      setInviteMsg(navStore.getState().invitedList || [])
      setByCareMsg(navStore.getState().byCareList || [])
      setByCommentMsg(navStore.getState().byCommentLike || [])
    })

    return () => uns()
  }, [])
  useEffect(() => {
    let pullUL = document.querySelector('.nav-invited-outer')
    let clickEvent = (e) => {
      setInvited(false)
    }
    function leaveEvent() {
      window.addEventListener('click', clickEvent)
    }
    function enterEvent() {
      window.removeEventListener('click', clickEvent)
    }
    pullUL.addEventListener('mouseleave', leaveEvent)
    pullUL.addEventListener('mouseenter', enterEvent)

    return () => {
      pullUL.removeEventListener('mouseleave', leaveEvent)
      pullUL.removeEventListener('mouseenter', enterEvent)
    }
  }, [])
  let invitePull = useCallback(([setChat,setHome],e) => {
    e.stopPropagation()
    setInvited(!invited)
    setChat(false)
    setHome('none')
    axios.post('/api/clear-invited')
    setMsgSum(0)
  }, [invited])

  return { invitePull, inviteMsg, byCareMsg, byCommentMsg, msgSum, invited,setInvited }
}

function useGetChat(state) {
  let [chat, setChat] = useState(false)
  let [chatSum, setChatSum] = useState(0)
  let [chatList, updateChat] = useState(navStore.getState().chatList)
  useEffect(() => {
    axios.get('/api/chat-list')
      .then(res => {
        let initial = res.data
        navStore.dispatch({
          type: 'getInitial',
          ...initial,
        })
      })
  }, [])
  useEffect(() => {
    let uns = navStore.subscribe(() => updateChat(navStore.getState().chatList))
    return () => uns()
  }, [])
  let chatPull = useCallback(([setHome,setInvited],e) => {
    e.stopPropagation()
    setHome('none')
    setChat(!chat)
    setInvited(false)
    setChatSum(0)
  }, [chat])
  useEffect(() => {
    if (state.cookieUser) {
      setChatSum(chatList.flat().filter(it => (it.status === 'normal' && it.userName !== state.cookieUser)).length)
    }
  }, [chatList, state])
  useEffect(() => {
    let pullUL = document.querySelector('.nav-chat-outer')
    let clickEvent = (e) => {
      setChat(false)
    }
    function leaveEvent() {
      window.addEventListener('click', clickEvent)
    }
    function enterEvent() {
      window.removeEventListener('click', clickEvent)
    }
    pullUL.addEventListener('mouseleave', leaveEvent)
    pullUL.addEventListener('mouseenter', enterEvent)

    return () => {
      pullUL.removeEventListener('mouseleave', leaveEvent)
      pullUL.removeEventListener('mouseenter', enterEvent)
    }
  }, [])
  return { chat, setChat,chatSum, chatList, chatPull }
}
export default function (props) {
  let [homeDis, setHome] = useState('none')
  let [state, setState] = useState(navStore.getState() || {})
  let { invitePull, inviteMsg, byCareMsg, byCommentMsg, msgSum, invited ,setInvited} = useGetInvite()
  let { chat, chatSum, chatList, chatPull,setChat } = useGetChat(state)
  let [signState, setSignState] = useState(signStore.getState())
  useEffect(() => {
    let signUns = signStore.subscribe(() => setSignState(signStore.getState() || {}))
    let uns = navStore.subscribe(() => setState(navStore.getState() || {}))
    return () => {
      uns()
      signUns()
    }
  }, [])
  let postQuestion = useCallback(() => {
    if (state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    homeStore.dispatch({
      type: 'question',
      question: true,
    })
  }, [state])

  useEffect(() => {
    axios.get('/api/nav-data')
      .then(res => {
        let initial = res.data
        navStore.dispatch({
          type: 'getInitial',
          ...initial,
        })
      })
    let setHomeNone = () => {
      setHome('none')
    }
    window.addEventListener('click', setHomeNone)

    return () => window.removeEventListener('click', setHomeNone)
  }, [homeDis])
  useEffect(() => {
    if (!state.sign) {
      function clearSignDIV(e) {
        let FROM_DIV = document.querySelector('.user-not-sign')
        if (e.target === FROM_DIV) {
          navStore.dispatch({
            type: 'toSign',
            sign: true,
          })
        }
      }
      window.addEventListener('click', clearSignDIV)
      return () => window.removeEventListener('click', clearSignDIV)
    }
  }, [state])
  let homeList = useCallback(([setChat,setInvited],e) => {
    e.stopPropagation()
    if (homeDis === 'none') {
      setHome('block')
    } else {
      setHome('none')
    }
    setChat(false)
    setInvited(false)
  }, [homeDis])
  useEffect(() => {
    let sliderNav = document.querySelector('.nav-slider-outer')
    function slider(e) {
      if(props.page === 'post'){
        if (document.documentElement.scrollTop < 100){
          return 
        }
      }
      if(props.page === 'user'){
        if (document.documentElement.scrollTop < 300){
          return 
        }
      }
      if (e.wheelDelta > 0) {
        sliderNav.style.top = '0px'
      } else {
        sliderNav.style.top = '-50px'
      }
    }

    window.addEventListener('mousewheel', slider)
    return () => window.removeEventListener('mousewheel', slider)
  }, [props])
  return (
    <>
      <nav>
        <div className="nav-slider-outer">
          <div className="top-nav">
            <a href="/" className="home-logo">
              <img src="/images/icon2.jpg" alt="zhi 呼" />
            </a>
            <ul className="home-list">
              <li><a href="/">首页</a></li>
              <li><a href="/">发现</a></li>
              <li><a href="/">等你来答</a></li>
            </ul>
            <div className="search-div">
              <label className="search-label">
                <input type="search" name="search" className="search" placeholder="功能尚未完善" />
                <SearchOutlined style={{ fontSize: '20px', color: '#9AA3B5' }} />
              </label>
              <input type="button" className="question" value="发帖" onClick={postQuestion} />
            </div>
            <ul className="persen-list">
              <li >
                <BellFilled style={{ fontSize: "22px" }} onClick={(e)=>invitePull([setChat,setHome],e)} />
                {msgSum !== 0 &&
                  <label className="nav-message-icon" onClick={(e)=>invitePull([setChat,setHome],e)}>{msgSum}</label>
                }
                
              </li>
              <li>
                <MessageFilled style={{ fontSize: "20px" }} onClick={(e)=>chatPull([setHome,setInvited],e)} />
                {chatSum !== 0 &&
                  <label className="nav-message-icon" onClick={(e)=>chatPull([setHome,setInvited],e)}>{chatSum}</label>
                }
              </li>
              <li onClick={(e)=>homeList([setChat,setInvited],e)}><HomeFilled style={{ fontSize: "20px" }} /></li>
            </ul>
          </div>
          {props.children}
        </div>
      </nav>
      <div className="nav-pull-container">
      <MessageItem inviteMsg={inviteMsg} byCareMsg={byCareMsg} byCommentMsg={byCommentMsg} className={invited ? '' : 'nav-message-hidden'} />
       <ChatComponent className={chat ? '' : 'nav-message-hidden'} chatList={chatList} />
       <PullDown display={homeDis} />
      {!state.sign && <div className="user-not-sign"><Sign /></div>}
      {signState.sucessSignup &&
        <Success props={signState} />
      }
      </div>
    </>
  )
}
function PullList(props) {
  let [cookie, setCookie] = useState(navStore.getState().cookieUser)
  let [state, setState] = useState(navStore.getState().userInfo || {})
  useEffect(() => {
    let uns = navStore.subscribe(() => {
      setState(navStore.getState().userInfo || {})
      setCookie(navStore.getState().cookieUser)
    })

    return () => uns()
  }, [])
  let sign_out = useCallback(() => {
    axios.post('/api/clearCookie/')
  }, [])

  let toEditpage = useCallback(() => {
    if (cookie === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      props.history.push(`/user/${state.userId}`)
      userStore.dispatch({
        type: 'editState',
        edit: true,
      })
    }
  }, [state, cookie, props.history])
  let myHome = useCallback(() => {
    if (cookie === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      props.history.push(`/user/${state.userId}`)
    }
  }, [state, cookie, props.history])

  return (
    <div className="pull-down" style={{ display: props.display }}>
      <span className="flag"><i></i></span>
      <ul className="home-pull">
        <li onClick={myHome}><UserOutlined />我的首页</li>
        <li onClick={toEditpage}><FormOutlined />编辑资料</li>
        <li onClick={sign_out}><a href='/sign'><LogoutOutlined />退出登陆</a></li>
      </ul>
    </div>
  )
}
let PullDown = withRouter(PullList)


function MessageItem({ inviteMsg, byCareMsg, byCommentMsg, className }) {
  let [active, setActive] = useState(0)
  let MessageList = [inviteMsg, byCareMsg, byCommentMsg][active]
  let [scroll, setScroll] = useState(false)
  useEffect(() => {
    let listUl = document.querySelector('.nav-invited-list')
    if (listUl.offsetHeight >= 430) {
      setScroll(true)
    }
  }, [active])
  return (
    <div className={`nav-invited-outer ${className}`}>
      <span className="flag"><i></i></span>
      <div className="nav-invited-head">
        <ul>
          <li onClick={() => setActive(0)}><ProjectFilled className={active === 0 ? 'active-msgList' : ''} /></li>
          <li onClick={() => setActive(1)}><HeartFilled className={active === 1 ? 'active-msgList' : ''} /></li>
          <li onClick={() => setActive(2)}><LikeFilled className={active === 2 ? 'active-msgList' : ''} /></li>
        </ul>
      </div>
      <ul className={scroll ? "nav-invited-list nav-invited-scroll" : 'nav-invited-list'}>
        {active === 1 && <div className="msgList-care-head"><span>最近这些人关注了你</span></div>}
        {MessageList.length !== 0 && MessageList.map((it, idx) => {
          return (
            <Fragment key={idx}>
              {active === 0 && <InvitedItem item={it} />}
              {active === 1 && <CareItem item={it} />}
              {active === 2 && <CommentLikeItem item={it} />}
            </Fragment>
          )
        })
        }
        {MessageList.length === 0 &&
          <li className="nav-invited-item">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有新的动态哦！" />
          </li>
        }
      </ul>
    </div>
  )
}
function InvitedItem({ item }) {
  return (
    <li className="nav-invited-item" key={item.createdAt}>
      <a href={`/user/${item.userId}`}>{item.userName}</a>
      <span>&nbsp;邀请您回答问题&nbsp;</span>
      <a href={`/post-page/${item.postId}`}>{item.title}</a>
    </li>
  )
}
function CareItem({ item }) {
  return (
    <li className="nav-cares-item" key={item.createdAt}>
      <a href={`/user/${item.userId}`}>
        <i style={{ backgroundImage: `url(${item.avatar})` }} className="msgList-care-avatar"></i>
        <div>
          <h4>{item.name}</h4>
          <span>{item.sign}</span>
        </div>
      </a>
    </li>
  )
}

function CommentLikeItem({ item }) {
  let TIME = moment(item.createdAt * 1).endOf().fromNow(true) + '前'
  let TIME_CONTENT = parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ? moment(item.createdAt * 1).format("MM-DD HH:mm") : TIME
  return (
    <li className="nav-invited-item" key={item.createdAt}>
      <a href={`/user/${item.userId}`}>{item.userName}</a>
      <span>&nbsp;点赞了您的回答:&nbsp;<span className="nav-comment-item-time">{TIME_CONTENT}</span></span>
      <a href={`/post-page/${item.postId}`} className="nav-comment-item-content" >{item.content}</a>
      <a href={`/post-page/${item.postId}`} className="nav-comment-item-title" title={item.title}>{item.title}</a>
    </li>
  )
}

function ChatComponent({ className, chatList }) {
  let [active, setActive] = useState(0)
  let [cares, setCare] = useState(navStore.getState().cares || {})
  let [openChat, setOpenChat] = useState(false)
  let [state, setState] = useState(navStore.getState())
  let [targetInfo, setTargetInfo] = useState({})
  let [headLabelCare, setHeadLabelCare] = useState(false)
  let [headLabelOther, setHeadLabelOther] = useState(false)
  useEffect(() => {
    let uns = navStore.subscribe(() => {
      setState(navStore.getState())
      setCare(navStore.getState().cares)
    })
    return () => uns()
  }, [])
  let careChat = chatList.filter(it => {
    if (it[0].userName === state.cookieUser) {
      return cares[it[0].targetId]
    } else {
      return cares[it[0].userId]
    }
  })
  let strangerChat = chatList.filter(it => {
    if (it[0].userName === state.cookieUser) {
      return !cares[it[0].targetId]
    } else {
      return !cares[it[0].userId]
    }
  })
  let openChatWindow = useCallback((item, setUnread, targetInfo) => {
    setOpenChat(!openChat)
    setTargetInfo(targetInfo)
    axios.post('/api/clear-chat', { targetName: item.name })
    setUnread(0)
  }, [openChat])
  useEffect(() => {
    if (!openChat) {
      axios.get('/api/chat-list').then(res => {
        let initial = res.data
        navStore.dispatch({
          type: 'getInitial',
          ...initial,
        })
      })
    }
  }, [openChat])
  useEffect(() => {
    //可优化
    if (!state.cookieUser) return
    let careCount = 0
    careChat.forEach(it => {
      let count = it.filter(item => item.status === 'normal' && item.userName !== state.cookieUser)
      careCount += count.length
    })
    if (careCount) {
      setHeadLabelCare(true)
    } else {
      setHeadLabelCare(false)
    }
    let otherCount = 0
    strangerChat.forEach(it => {
      let count = it.filter(item => {
        return item.status === 'normal' && item.userName !== state.cookieUser
      })
      otherCount += count.length
    })
    if (otherCount) {
      setHeadLabelOther(true)
    } else {
      setHeadLabelOther(false)
    }
  }, [careChat, strangerChat, state])
  return (
    <div className={`nav-invited-outer ${className} nav-chat-outer`}>
      <span className="flag"><i></i></span>
      <div className="nav-invited-head">
        <ul className="nav-chat-head">
          <li onClick={() => setActive(0)} className={active === 0 ? 'nav-chat-active' : 'nav-chat'}><span>最近联系</span>{headLabelCare && <label className="chat-head-label"></label>}</li>
          <li onClick={() => setActive(1)} className={active === 1 ? 'nav-chat-active' : 'nav-chat'}><span>陌生人私信</span>{headLabelOther && <label className="chat-head-label"></label>}</li>
        </ul>
      </div>
      <ul className={'nav-chat-list nav-invited-list'}>
        {active === 0 && careChat.length !== 0 && careChat.map(it => {
          let unread = it.filter(it => it.status === 'normal' && it.userName !== state.cookieUser).length
          let targetId
          // = it.filter(it => it.targetName === state.cookieUser)[0]
          if (it[0].targetName === state.cookieUser) {
            targetId = it[0].userId
          } else {
            targetId = it[0].targetId
          }
          return (
            <Fragment key={it[0].createdAt} >
              {<CareChat item={it[0]} targetId={targetId} unread={unread} onClick={openChatWindow} />}
            </Fragment >
          )
        })
        }
        {active === 1 && strangerChat.length !== 0 && strangerChat.map(it => {
          let unread = it.filter(it => it.status === 'normal' && it.userName !== state.cookieUser).length
          let targetId
          // = it.filter(it => it.targetName === state.cookieUser)[0]
          if (it[0].targetName === state.cookieUser) {
            targetId = it[0].userId
          } else {
            targetId = it[0].targetId
          }
          return (
            <Fragment key={it[0].createdAt}>
              {<StrangerChat item={it[0]} unread={unread} targetId={targetId} onClick={openChatWindow} />}
            </Fragment >
          )
        })
        }
        {((strangerChat.length === 0 && active === 1) || (careChat.length === 0 && active === 0)) &&
          <li className="nav-invited-item">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有私信哦！" />
          </li>
        }
      </ul>
      {openChat && <ChatWindow targetInfo={targetInfo} state={state} setChat={setOpenChat} />}
    </div>
  )
}

function CareChat({ item, unread, onClick, targetId }) {
  let avatar = item.userId === targetId ? item.userAvatar : item.targetAvatar
  let name = item.userId === targetId ? item.userName : item.targetName
  let [notRead, setUnread] = useState(unread)
  let [targetInfo, setTargetInfo] = useState({})
  useEffect(() => {
    axios.post('/api/userInfo-serach', { id: targetId })
      .then(res => {
        setTargetInfo(res.data.userInfo)
      })
  }, [targetId])
  return (
    <>
      <li className="nav-chat-item" key={item.createdAt} onClick={() => onClick(targetInfo, setUnread, targetInfo)}>
        {notRead !== 0 &&
          <label className="nav-message-icon chat-unred">{notRead}</label>
        }
        <div>
          <i style={{ backgroundImage: `url(${avatar})` }} className="msgList-care-avatar"></i>
          <div>
            <h4>{name}</h4>
            <span>{item.content}</span>
          </div>
        </div>
      </li>

    </>
  )
}
function StrangerChat({ item, unread, onClick, targetId }) {
  let avatar = item.userId === targetId ? item.userAvatar : item.targetAvatar
  let name = item.userId === targetId ? item.userName : item.targetName
  let [notRead, setUnread] = useState(unread)
  let [targetInfo, setTargetInfo] = useState({})
  useEffect(() => {
    axios.post('/api/userInfo-serach', { id: targetId })
      .then(res => {
        setTargetInfo(res.data.userInfo)
      })
  }, [targetId])
  return (
    <li className="nav-chat-item" key={item.createdAt} onClick={() => onClick(targetInfo, setUnread, targetInfo)}>
      {notRead !== 0 &&
        <label className="nav-message-icon chat-unred">{notRead}</label>
      }
      <div>
        <i style={{ backgroundImage: `url(${avatar})` }} className="msgList-care-avatar"></i>
        <div>
          <h4>{name}</h4>
          <span>{item.content}</span>
        </div>
      </div>
    </li>
  )
}
