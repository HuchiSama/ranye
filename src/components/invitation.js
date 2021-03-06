import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { homeStore, pageStore } from '../redux/redux'
import PostsFooter from './postfooter'
import { useParams } from 'react-router-dom'
import moment from 'moment';
import { Link } from "react-router-dom"
import { Skeleton } from 'antd';
import { ContainerList } from '../pages/home'

export default function () {
  // let [state, setState] = useState(homeStore.getState())

  // useEffect(() => {
  //   let uns = homeStore.subscribe(() => setState(homeStore.getState()))

  //   return () => uns()
  // }, [])
  // debugger
  return (
    <div className="invitation">
      <ContainerList />
      <PostMain />
      <Over />
    </div>
  )
}

export function Attachment(props) {
  let { id } = useParams()
  let mePost = props.state.cookieUser === props.post.name
  let postId = props.type === 'post' ? props.post.postId : props.post.commentId
  let [attachment, setAttachment] = useState(false)
  // let [status, UpStatus] = useState(false)

  useEffect(() => {
    let attachmentClick = () => {
      setAttachment(false)
    }
    window.addEventListener('click', attachmentClick)
    return () => window.removeEventListener('click', attachmentClick)
  }, [attachment])
  let deletePost = useCallback(() => {
    if (props.type === 'post') {
      axios.post('/api/deletePost/', { postId, type: 'post' })
        .then(res => {
          homeStore.dispatch({
            type: 'deletePost',
            postCount: res.data.postNormal.length,
            posts: res.data.posts,
          })
        })
    } else {

      axios.post('/api/deletePost/', { id, postId, type: 'comment' })
        .then(res => {
          pageStore.dispatch({
            type: 'deleteComment',
            // postCount: res.data.postNormal.length,
            comments: res.data.comments,
          })
        })
    }

  }, [postId, props, id])

  let changeAttachment = useCallback((e) => {
    e.stopPropagation()
    setAttachment(!attachment)
  }, [attachment])

  return (
    <>
      <span className="deletePost" onClick={changeAttachment}>...</span>
      {attachment && <i className="deletePost-flag"></i>
      }
      <div className={attachment ? 'deAttachment deAttaHeight' : 'deAttachment'}>
        <ul>
          <li onClick={mePost ? deletePost : () => { }} >
            <span className={mePost ? '' : 'disableDelete'}>删除</span>
          </li>
          <li><span>举报</span></li>
        </ul>
      </div>
    </>
  )
}

function PostMain() {
  let [state, setState] = useState(homeStore.getState())
  let [posts, upPosts] = useState(new Array(6).fill(''))
  let [loading, setLoading] = useState(true)
  let [footer, setFooter] = useState(false)
  useEffect(() => {
    axios.get('/api/home-data').then(res => {
      let initial = res.data
      homeStore.dispatch({
        ...initial,
        type: 'getData',
        posts: initial.posts.filter(it => it.status !== 'delete'),
      })
      setLoading(false)
    })
    let uns = homeStore.subscribe(() => {
      setState(homeStore.getState())
      upPosts(homeStore.getState().posts || [])
    })
    return () => uns()
  }, [])
  useEffect(() => {
    let postContent = document.querySelectorAll('.content-div >p >span')
    postContent.forEach((it, idx) => {
      let post = posts[idx].content
      it.innerHTML = post[0] === "{" ? JSON.parse(post).html : post
    })
    if (postContent.length) { setFooter(true) }

  }, [loading])
  let postIdx = -1
  return (
    <ul className="posts">
      {
        posts.map(post => {
          let time = post.createdAt * 1
          let TIME = moment(time).endOf().fromNow(true) + '前'
          if (post.status !== 'delete') {
            ++postIdx
            return (
              <li key={post.postId}>
                <Skeleton active round loading={loading}>
                  <div className="user-date">
                    <Link to={`/user/${post.posterId}`}><img alt="" style={{ backgroundImage: `url(${post.avatar})` }} className="userAvatar" /></Link>
                    <span className="post-username"><Link to={`/user/${post.posterId}`}>{post.name}</Link>  ,<span className="post-time">  发布于
                    {parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
                        moment(time).format("YYYY-MM-DD HH:mm:ss")
                        : TIME
                      }
                    </span></span>
                    <Attachment state={state} post={post} type='post' />
                  </div>
                  <div className="content-div" name="content">
                    <Link className="post-title" to={`/post-page/${post.postId}`}>{post.title}</Link>
                    <p className="post-content flodContent post-defaultHeight">
                      <span></span>
                    </p>
                  </div>
                  <PostsFooter post={post} idx={postIdx} type="question" state={state} footer={footer} />
                </Skeleton>
              </li>
            )
          } else {
            return null
          }
        })
      }
    </ul>
  )
}
// withRouter(PostMain)



export function Over() {
  return (
    <div className="over">
      <span>没有更多内容了...</span>
    </div>
  )
}
