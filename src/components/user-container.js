import React, { useCallback, useEffect, useState, Fragment } from 'react'
// import axios from 'axios'
// import { ManOutlined, DownOutlined, UpOutlined, MailOutlined } from '@ant-design/icons'
import moment from 'moment';
import UserBar from './user-Bar'
import { Over, Attachment } from './invitation'
// import { homeStore } from '../redux/redux'
import './user-page.css'
import { userStore } from '../redux/redux'
// import { useParams } from 'react-router-dom'
import PostsFooter from './postfooter'
import AttentionDynamic from './caresList'
import CollectList, { CollectQuestion, CollectComment } from './collectList'

export default function () {

  return (
    <div className=" user-container">
      <div className="body-container">
        <UserMain />
        <UserBar />
      </div>
    </div>
  )
}

function UserMain() {
  let [flag, setFlag] = useState(20)
  let [active, reActive] = useState(userStore.getState().active || 0)
  useEffect(() => {
    let uns = userStore.subscribe(() => reActive(userStore.getState().active))
    return () => uns()
  })
  useEffect(() => {
    setFlag(30 * active + 20 + 40 * active)
  }, [active])
  let getMain = useCallback((idx) => {
    userStore.dispatch({
      type: 'activeSwitch',
      active: idx,
    })
    // reActive(idx)
  }, [])

  return (
    <div className="invitation">
      <div className="user-main">
        <ul className="user-main-header">
          <li onClick={() => getMain(0)}>动态</li>
          <li onClick={() => getMain(1)}>回答</li>
          <li onClick={() => getMain(2)}>提问</li>
          <li onClick={() => getMain(3)}>赞同</li>
          <li onClick={() => getMain(4)}>关注</li>
          <li onClick={() => getMain(5)}>收藏</li>
        </ul>
        <div className="user-main-flag" style={{ left: flag + 'px' }}></div>
        <DynamicList active={active} />
      </div>
      <Over />
    </div>
  )
}

function DynamicList(props) {
  let [state, setState] = useState(userStore.getState() || {})
  let { userInfo = {} } = state
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))

    return () => uns()
  }, [])
  // debugger
  return (
    <div className="dynamicList">
      { props.active !== 4 && props.active !== 5 &&
        <div className="dynamic-head">
          <span>
            {userInfo.name === state.cookieUser
              ? <span>我的{['动态', '回答', '提问', '赞同'][props.active]}</span>
              : <span>{userInfo.sex === 'man' ? '他' : '她'}的{['动态', '回答', '提问', '赞同'][props.active]}</span>
            }
          </span>
        </div>
      }
      <div>
        <PostMain active={props.active} />
      </div>

    </div>
  )
}


function PostMain(props) {
  let active = props.active
  let [state, setState] = useState(userStore.getState() || {})
  let { attentionDynamic = [], commentDynamic = [], likeDynamic = [], postDynamic = [], collectComment = [], collectQues = [] } = state

  let dynamic = [...attentionDynamic, ...commentDynamic, ...likeDynamic, ...postDynamic, ...collectComment, ...collectQues]
  let dynamicArray = [commentDynamic, postDynamic, likeDynamic, attentionDynamic, [...collectComment, ...collectQues]]

  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [])

  // console.log(state)
  // debugger
  let dynamicList
  if (active === 0) {
    dynamicList = sortAtTime(dynamic)
  } else {
    dynamicList = sortAtTime(dynamicArray[active - 1])
  }
  let Idx = -1
  return (
    <>
      {active === 4
        ? <AttentionDynamic dynamicList={dynamicList} state={state} />
        : <>
          {active === 5 && <CollectList dynamicList={dynamicList} state={state} />}
          {active !== 4 && active !== 5 &&
            <ul className="posts user-Dynamic">
              {
                dynamicList.map((item, i) => {
                  if (item.status !== 'delete') {
                    Idx++
                    return (
                      <Fragment key={i}>
                        {item.style === 'comment' && <AnswerDynamic item={item} state={state} idx={Idx} />}
                        {item.style === 'post' && <PostDynamic item={item} state={state} idx={Idx} />}
                        {item.style === 'likeComment' && <LikeDynamic item={item} state={state} idx={Idx} />}
                        {item.style === 'attention' && <AttentionQuestion item={item} state={state} idx={Idx} />}
                        {item.style === 'collect' &&
                          <>
                            {item.type === 'question' && <CollectQuestion item={item} state={state} idx={Idx} />}
                            {item.type === 'comment' && <CollectComment item={item} state={state} idx={Idx} />}
                          </ >
                        }
                      </Fragment>
                    )
                  }
                  return ""
                })
              }
            </ul>
          }
        </>

      }

    </>
  )
}





function AnswerDynamic(props) {
  let idx = props.idx
  // let state = props.state
  let state = props.state || {}
  let { userInfo = {} } = state
  let item = props.item
  let avatar = userInfo.avatar
  let time = (item.likeAt || item.createdAt) * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'
  let POST_TIME = moment(item.createdAt * 1).endOf().fromNow(true) + '前'

  return (
    <li key={item.likeAt || item.createdAt}>
      <div className="dynamicList-header"><span>回答了问题</span><span>
        {TIME[0] * 1 > 5 && TIME[2] === '天' ?
          new Date(time).toLocaleDateString().slice(5)
          : TIME
        }
      </span></div>
      <div className="content-div" name="content">
        <a className="post-title" href={`/post-page/${item.postId}`}>{item.title}</a>
      </div>
      <div className="commenter-info dynamic-comment" >
        <i className="commenter-avatar" style={{ backgroundImage: `url(${avatar})` }}></i>
        <div className="commenter-flag">
          <a className="commenter-name" href=".">{userInfo.name}</a>
          <span className="commenter-sign">{userInfo.sign}</span>
          <Attachment state={state} post={item} type='comment' />
        </div>
      </div>
      <div className="content-div" name="content">
        <p><span>{item.content}</span></p>
        <span className="answerAt">发布于 &nbsp;
        {POST_TIME[0] * 1 >= 1 && POST_TIME[2] === '天' ?
            moment(item.createdAt * 1).format("YYYY-MM-DD HH:mm:ss")
            : POST_TIME
          }</span>
        <div className="commenter-footer">
          <PostsFooter type={'comment'} comment={item} idx={idx} state={state} />
        </div>
      </div>
    </li>
  )
}

function PostDynamic(props) {
  let idx = props.idx
  let state = props.state || {}

  let item = props.item
  let time = (item.likeAt || item.createdAt) * 1

  let TIME = moment(time).endOf().fromNow(true) + '前'

  return (
    <li key={item.likeAt || item.createdAt}>
      <div className="dynamicList-header User-post-time"><span>发布了问题</span><span>&nbsp;&nbsp;:&nbsp;
         {TIME[0] * 1 >= 1 && TIME[2] === '天' ?
          moment(item.createdAt * 1).format("YYYY-MM-DD HH:mm:ss")
          : TIME
        }</span>
        <Attachment state={state} post={item} type='post' />
      </div>
      <div className="content-div" name="content">
        <a className="post-title" href={`/post-page/${item.postId}`}>{item.title}</a>
        <p className="post-content">
          <span>{item.content}</span>
        </p>
      </div>
      <PostsFooter type={'question'} post={item} idx={idx} state={state} />
    </li>
  )
}


function LikeDynamic(props) {
  let idx = props.idx
  let state = props.state || {}

  let item = props.item
  let avatar = item.avatar
  let time = (item.likeAt || item.createdAt) * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'
  let POST_TIME = moment(item.createdAt * 1).endOf().fromNow(true) + '前'
  return (
    <li key={item.likeAt || item.createdAt}>
      <div className="dynamicList-header"><span>赞同了回答</span><span>
        {TIME[0] * 1 > 5 && TIME[2] === '天' ?
          new Date(time).toLocaleDateString().slice(5)
          : TIME
        }</span></div>
      <div className="content-div" name="content">
        <a className="post-title" href={`/post-page/${item.postId}`}>{item.title}</a>
      </div>
      <div className="commenter-info dynamic-comment" >
        <i className="commenter-avatar" style={{ backgroundImage: `url(${avatar})` }}></i>
        <div className="commenter-flag">
          <a className="commenter-name" href={`/user/${item.commenterId}`}>{item.name}</a>
          <span className="commenter-sign">{item.sign}</span>
          <Attachment state={state} post={item} type='comment' />
        </div>
      </div>
      <div className="content-div" name="content">
        <p><span>{item.content}</span></p>
        <span className="answerAt">发布于  &nbsp;
        {POST_TIME[0] * 1 >= 1 && POST_TIME[2] === '天' ?
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

export function AttentionQuestion(props) {
  let idx = props.idx
  let state = props.state || {}

  let item = props.item
  let time = (item.likeAt || item.createdAt) * 1
  let TIME = moment(time).endOf().fromNow(true) + '前'

  return (
    <li key={item.likeAt || item.createdAt}>
      <div className="dynamicList-header"><span>关注了问题</span><span>
        {TIME[0] * 1 > 5 && TIME[2] === '天' ?
          new Date(time).toLocaleDateString().slice(5)
          : TIME
        }
      </span></div>
      <div className="content-div" name="content">
        <a className="post-title" href={`/post-page/${item.postId}`}>{item.title}</a>
        <p className="post-content">
          <span>{item.content}</span>
        </p>
      </div>
      <PostsFooter type={'question'} post={item} idx={idx} state={state} />
    </li>
  )
}

//根据时间排序

function sortAtTime(array = []) {
  return Array.from(array).sort((a, b) => {
    let bCreated = b.likeAt ? b.likeAt * 1 : b.createdAt * 1
    let aCreated = a.likeAt ? a.likeAt * 1 : a.createdAt * 1
    return bCreated - aCreated
  })
}

//处理时间 
// function dateTime(time) {
//   let org = 
// }



