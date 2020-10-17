import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserInfo, FooterBar, Recommend, UserSign } from './toolbar'
// import { HeartOutlined, CommentOutlined } from '@ant-design/icons';
import { pageStore, navStore, userStore } from '../redux/redux';
import PostsFooter from './postfooter'
import moment from 'moment';
import { Over, Attachment } from './invitation'
import axios from 'axios'
import CareMessage from './care-message'
import { withRouter } from 'react-router-dom'
import { Link } from "react-router-dom"
import { Skeleton } from 'antd';

export default function (props) {
  let [data, Update] = useState(pageStore.getState())
  useEffect(() => {
    let uns = pageStore.subscribe(() => Update(pageStore.getState()))
    return () => uns()
  })
  return (
    <div className="body-container post-container">
      <Comment data={data} loading={props.loading} />
      <ToolBar data={data} />
    </div>
  )
}


function Comment(props) {
  let commenterInfo = props.data.commenterInfo || []
  return (
    <div className="invitation">
      {props.data.writeAnswer ? <AnswerDiv /> : ''}
      <div className="comment-main">
        <ul className="comments-list">
          <CommentList commenterInfo={commenterInfo} loading={props.loading} />
        </ul>
      </div>
      <Over />
    </div>
  )
}
//发评论
function AnswerDiv() {
  let { id } = useParams()
  let submitAnswer = useCallback(() => {
    let postAnswer = {
      content: document.querySelector('.editing').value,
      createdAt: Date.now(),
    }
    getNewCommenter()
    async function getNewCommenter() {
      await axios.post(`/api/post-page/${id}`, postAnswer)
        .then(res => {
          pageStore.dispatch({
            type: 'postAnswer',
            commenterInfo: res.data,
          })
        })
        .catch(rej => {
          if (rej.response.status === 401) {
            navStore.dispatch({
              type: 'toSign',
              sign: false,
            })
          }
        })

    }
  }, [id])
  return (
    <div className="answer-outer">
      <textarea className="editing" placeholder="写回答..."></textarea>
      <div className="submit-answer" >
        <span onClick={submitAnswer}>提交回答</span>
      </div>
    </div>
  )
}

function CommentList(props) {
  let [data, Update] = useState(pageStore.getState())

  useEffect(() => {
    let uns = pageStore.subscribe(() => Update(pageStore.getState()))
    return () => uns()
  }, [])
  // debugger

  let commenterInfo = data.commenterInfo || new Array(5).fill('')
  let commentNoamal = commenterInfo.filter(it => it.status !== 'delete')

  let commentIdx = -1


  if (!props.loading && commentNoamal.length === 0) {
    return <li style={{ color: '#8590A6' }}>
      当前帖子还没有回答，赶紧去添加回答吧！
      </li>
  } else {
    return (
      commentNoamal.map((item) => {
        commentIdx++
        return < Skeleton loading={props.loading} >
          <CommentItem item={item} data={data} idx={commentIdx} key={item.createdAt} />
        </Skeleton>

      })
    )
  }

}

function CommentItem(props) {
  let item = props.item
  let data = props.data
  let idx = props.idx
  let time = item.createdAt * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'

  return (
    <li key={item.createdAt}>
      <div className="commenter-info" >
        <Link to={`/user/${item.userId}`}><i className="commenter-avatar" style={{ backgroundImage: `url(${item.avatar})` }}></i></Link>
        <div className="commenter-flag">
          <Link className="commenter-name" to={`/user/${item.userId}`}>{item.name}</Link>
          <span className="commenter-sign">{item.sign}</span>
          <Attachment state={data} post={item} type='comment' />
        </div>
      </div>
      <div className="content-div " name="content">
        <p className="flodContent"><span>{item.content}</span></p>
        <span className="answerAt">
          发布于 &nbsp;
        {parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
            moment(item.createdAt * 1).format("YYYY-MM-DD HH:mm:ss")
            : TIME
          }
        </span>
        <div className="commenter-footer">
          <PostsFooter comment={item} idx={idx} state={data} />
        </div>
      </div>

    </li>
  )
}

function ToolBar(props) {
  let data = props.data || {}
  let poster = data.poster || {}
  return (
    <div className="toolbar">
      <div className="toolbar-user-data">
        <h4 style={{ color: 'rgb(118,131,155)' }}>关于提问者</h4>
        {poster.name === data.cookieUser
          ? <>
            <UserInfo cookieUser={data.cookieUser} user={data.poster} />
            <UserSign data={data} />
          </>
          : <PosterInfo poster={poster} />
        }
      </div>
      <Recommend />
      <FooterBar />
    </div>
  )
}

function Info(props) {

  let poster = props.poster
  let toUserPage = useCallback((one, sen) => {
    props.history.push(`/user/${poster.userId}`)
    userStore.dispatch({
      type: 'activeSwitch',
      active: one,
    })
    if (sen !== undefined) {
      userStore.dispatch({
        type: 'collectActive',
        active: sen,
      })
    }
  }, [poster, props.history])
  return (
    <div className="posterInfo">
      <div className="posterInfo-user">
        <Link to={`/user/${poster.userId}`}>
          <i className="post-avatar" style={{ backgroundImage: `url(${poster.avatar})` }}></i>
        </Link>
        <div className="poster-userInfo">
          <Link to={`/user/${poster.userId}`}><h3>{poster.name}</h3></Link>
          <span>{poster.sign}</span>
        </div>
      </div>
      <div >
        <ul className="posterInfo-other">
          <li onClick={() => toUserPage(1)}><span>回答</span><br />{poster.commentCount}</li>
          <li onClick={() => toUserPage(2)}><span>提问</span><br />{poster.postCount}</li>
          <li onClick={() => toUserPage(4, 2)}><span>关注者</span><br />{poster.fans}</li>
        </ul>
        <CareMessage careInfo={poster} />
      </div>
    </div>
  )
}
const PosterInfo = withRouter(Info)

// function PoseteSections(props) {
//   return (
//     <></>
//   )
// }
