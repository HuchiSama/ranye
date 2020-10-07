import React, { Fragment, useCallback, useEffect, useState } from 'react'
import moment from 'moment';
import { Link } from "react-router-dom"
import { Attachment } from './invitation'
import './user-page.css'
import { userStore } from '../redux/redux'
import PostsFooter from './postfooter'


export default function CollectList(props) {
  let [state, setState] = useState(userStore.getState() || {})
  let [active, setActive] = useState(userStore.getState().collectActive || 0)
  useEffect(() => {
    let uns = userStore.subscribe(() => {
      setActive(userStore.getState().collectActive)
      setState(userStore.getState())
    })
    return () => uns()
  }, [props])
  let dynamicList = props.dynamicList

  let changeView = useCallback((idx) => {
    userStore.dispatch({
      type: 'collectActive',
      collectActive: idx,
    })
  }, [])

  let quesIdx = -1
  let coomIdx = -1
  return (
    <>
      <div className="dynamicCareList collectHead">
        <ul>
          <li onClick={() => changeView(0)} className={active === 0 ? 'careListActive' : ''}>收藏的问题</li>
          <li onClick={() => changeView(1)} className={active === 1 ? 'careListActive' : ''}>收藏的回答</li>
        </ul>
      </div>
      <div>
        <ul className="posts user-Dynamic collect">
          {
            dynamicList.map((item, idx) => {
              if (active === 0 && item.status !== 'delete' && item.type === 'question') {
                quesIdx++
                return (
                  <Fragment key={idx}>
                    { <CollectQuestion item={item} state={state} idx={quesIdx} />}
                  </Fragment>
                )
              } else if (active === 1 && item.status !== 'delete' && item.type === 'comment') {
                coomIdx++
                return (
                  <Fragment key={idx}>
                    {<CollectComment item={item} state={state} idx={coomIdx} />}
                  </Fragment>
                )
              }
              return ""
            })
          }
        </ul>
      </div>
    </>
  )
}

export function CollectQuestion(props) {
  let idx = props.idx
  let [state, setState] = useState(userStore.getState() || {})
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [idx])
  let item = props.item
  let time = (item.likeAt || item.createdAt) * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'
  return (
    <li key={item.likeAt || item.createdAt}>
      <div className="dynamicList-header"><span>收藏了问题</span><span>
        {parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
          new Date(time).toLocaleDateString().slice(5)
          : TIME
        }</span></div>
      <div className="content-div" name="content">
        <Link className="post-title" to={`/post-page/${item.postId}`}>{item.title}</Link>
        <p className="post-content">
          <span>{item.content}</span>
        </p>
      </div>
      <PostsFooter type='question' post={item} idx={idx} state={state} />
    </li>
  )
}

export function CollectComment(props) {
  let idx = props.idx
  let [state, setState] = useState(userStore.getState() || {})
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [idx])
  let item = props.item
  let avatar = item.avatar
  let time = (item.likeAt || item.createdAt) * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'
  let POST_TIME = moment(item.createdAt * 1).endOf().fromNow(true) + '前'
  return (
    <li key={item.likeAt || item.createdAt}>
      <div className="dynamicList-header"><span>收藏了回答</span><span>
        {parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
          new Date(time).toLocaleDateString().slice(5)
          : TIME
        }</span></div>
      <div className="content-div" name="content">
        <Link className="post-title" to={`/post-page/${item.postId}`}>{item.title}</Link>
      </div>
      <div className="commenter-info dynamic-comment" >
        <i className="commenter-avatar" style={{ backgroundImage: `url(${avatar})` }}></i>
        <div className="commenter-flag">
          <Link className="commenter-name" to={`/user/${item.userId}`}>{item.name}</Link>
          <span className="commenter-sign">{item.sign}</span>
          <Attachment state={state} post={item} type='comment' />
        </div>
      </div>
      <div className="content-div" name="content">
        <p><span>{item.content}</span></p>
        <span className="answerAt">发布于 &nbsp;
        {parseInt(POST_TIME) >= 1 && /天/g.test(POST_TIME) ?
            moment(item.createdAt * 1).format("YYYY-MM-DD HH:mm:ss")
            : POST_TIME
          }
        </span>
        <div className="commenter-footer">
          <PostsFooter type={'comment'} comment={item} idx={idx} state={state} />
        </div>
      </div>
    </li>
  )
}
