import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import './post.css'
import PostContainer from './post-container'
import { FormOutlined, MessageFilled, FireFilled, UserAddOutlined } from '@ant-design/icons';
import { pageStore, navStore } from '../redux/redux'
// var POST_DATA
import Nav from '../components/header-nav'
import moment from 'moment';
import Invite from './invite'
import { Skeleton } from 'antd';

export default function () {
  let { id = 1 } = useParams()
  let [data, Update] = useState(pageStore.getState())
  let [invite, setInvite] = useState(false)
  let [loading, setLoading] = useState(true)
  useEffect(() => {
    let uns = pageStore.subscribe(() => setInvite(pageStore.getState().invite))
    return () => uns()
  }, [])
  useEffect(() => {
    const getInitial = async () => {
      const result = await axios.get(`/api/post-page/${id}`)
      pageStore.dispatch({
        type: 'getInitial',
        ...result.data,
      })
      setLoading(false)
    }
    getInitial()
    let uns = pageStore.subscribe(() => Update(pageStore.getState()))

    return () => uns()
  }, [id])

  return (
    <>
      <Nav page={"post"}>
        <PostNavChild data={data} />
      </Nav>
      <PostInfo>
        <PostTitle data={data} loading={loading} />
        <Poster data={data} />
      </PostInfo>
      <PostContainer data={data} loading={loading} />
      {invite && <Invite id={id} />}
    </>
  )
}
function PostNavChild({ data }) {
  let post = data.post || {}
  let writeAnswer = useCallback(() => {
    pageStore.dispatch({
      type: 'writeAnswer',
      writeAnswer: !data.writeAnswer,
    })
    document.documentElement.scrollTop = 0
    let sliderNav = document.querySelector('.nav-slider-outer')
    sliderNav.style.top = '0px'
  }, [data])

  return (
    <div className="post-nav-slider">
      <h1 title={post.title}>{post.title}</h1>
      <div className="post-footer-list">
        <Attention data={data} />
        <div className="answer" onClick={writeAnswer}><FormOutlined />写回答</div>
      </div>
    </div>
  )
}

function PostInfo(props) {
  return <div className="post-info post-top">{props.children}</div>
}

function PostTitle(props) {
  // debugger
  let data = props.data
  let commenterInfo = data.commenterInfo || []
  let post = props.data.post || {}
  let [hide, upHide] = useState(false)
  let [fold, setFlod] = useState(true)

  let answerCount = commenterInfo.filter(it => it.status !== 'delete')

  let writeAnswer = useCallback(() => {
    pageStore.dispatch({
      type: 'writeAnswer',
      writeAnswer: !data.writeAnswer,
    })
  }, [data])

  useEffect(() => {
    let span = document.querySelector('.post-content span')
    let p = document.querySelector('.post-content')
    if (span && span.offsetHeight > 72) {
      p.style.height = '72px'
      upHide(true)
    }
  }, [data])
  let foldCutover = useCallback(() => {
    let p = document.querySelector('.post-content')
    let span = document.querySelector('.post-content span')
    if (fold) {
      p.style.display = 'block'
      p.style.height = span.offsetHeight + 3 + 'px'
      setFlod(false)
    } else {
      p.style.display = '-webkit-box'
      p.style.height = '72px'
      setFlod(true)
    }
  }, [fold])
  let toInvite = useCallback(() => {
    if (data.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    pageStore.dispatch({
      type: 'invite',
      invite: true,
    })
  }, [data])
  return (
    <div className="post-main">
      <Skeleton title={{ width: 300 }} paragraph={false} loading={props.loading} round>
        <h1>{post.title}</h1>
      </Skeleton>
      <Skeleton active loading={props.loading} paragraph={{ rows: 2 }} round title={false}>
        <p className="post-content"><span>{post.content}</span></p>
      </Skeleton >
      <div className="post-footer-list">
        <Attention data={data} />
        <div className="answer" onClick={writeAnswer}><FormOutlined />写回答</div>
        <div className="admire-qus" onClick={toInvite}><UserAddOutlined />邀请回答</div>
        <ul className="other-info">
          <li className="comments-count">
            <MessageFilled />
            <span>{answerCount.length}&nbsp;条回答</span>
          </li>
          <li className="pageview"><FireFilled /><span>{post.pageview}&nbsp;浏览量</span></li>
          {/* <li className="unfold"><span>...</span></li> */}
          {hide &&
            <li className="hide" onClick={foldCutover}><span>{fold ? '展开' : '收起'}</span></li>
          }
        </ul>
      </div>

    </div>
  )
}


function Attention({ data }) {
  let { id } = useParams()
  let [attention, upVoke] = useState(pageStore.getState().attention)
  let attenRef = useRef()
  //attention
  let toAttention = useCallback(() => {
    if (data.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      pageStore.dispatch({
        type: 'toAttention',
        attention: !attention,
        pageId: id,
      })
    }
  }, [attention, id, data])

  useEffect(() => {
    let uns = pageStore.subscribe(() => upVoke(pageStore.getState().attention))

    if (attention) {
      attenRef.current.onmouseenter = () => {
        attenRef.current.innerText = '取消关注'
      }
      attenRef.current.onmouseleave = () => {
        attenRef.current.innerText = '已关注'
      }
    }
    function clearMousevent() {
      attenRef.current.onmouseenter = null;
      attenRef.current.onmouseleave = null
    }

    return () => { uns(); clearMousevent() }
  }, [attention, id])

  return (
    <div className={attention ? "revoke" : "guanzhu"} onClick={toAttention} ref={attenRef} >{attention ? "已关注" : "关注问题"}</div>
  )
}

function Poster(props) {
  let data = props.data
  let commenterInfo = data.commenterInfo || []
  let answerCount = commenterInfo.filter(it => it.status !== 'delete')
  let time = data.post && data.post.createdAt * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'

  return (
    <div className="post-other">
      <ul>
        <li className="post-other-line"><span>关注数</span><br />{data.attentionLength}</li>
        <li><span>回答数</span><br />{answerCount.length}</li>
      </ul>
      <div className="post-other-time"><span>发帖时间：</span>
        {parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
          moment(time).format("YYYY-MM-DD HH:mm:ss")
          : TIME
        }</div>
    </div>
  )
}
