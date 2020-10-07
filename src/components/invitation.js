import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { homeStore, pageStore } from '../redux/redux'
import PostsFooter from './postfooter'
import { useParams } from 'react-router-dom'
import moment from 'moment';
import { Link } from "react-router-dom"

export default function () {
  let [state, setState] = useState(homeStore.getState())

  useEffect(() => {
    let uns = homeStore.subscribe(() => setState(homeStore.getState()))

    return () => uns()
  }, [])

  return (
    <div className="invitation">
      <PostMain state={state} />
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

function PostMain(props) {
  let data = props.state
  let postCount = data.postCount
  let [posts, upPosts] = useState(data.posts || [])
  useEffect(() => {
    upPosts(homeStore.getState().posts || [])
  }, [postCount, props])
  let postIdx = -1
  return (
    <ul className="posts">
      {
        posts.map(post => {
          if (post.status !== 'delete') {
            let time = post.createdAt * 1
            let TIME = moment(time).endOf().fromNow(true) + '前'
            postIdx++
            return (
              <li key={post.postId}>
                <div className="user-date">
                  <Link to={`/user/${post.posterId}`}><img alt="" style={{ backgroundImage: `url(${post.avatar})` }} className="userAvatar" /></Link>
                  <span className="post-username"><Link to={`/user/${post.posterId}`}>{post.name}</Link>  ,<span className="post-time">  发布于
                  {parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
                      moment(time).format("YYYY-MM-DD HH:mm:ss")
                      : TIME
                    }
                  </span></span>
                  <Attachment state={props.state} post={post} type='post' />
                </div>
                <div className="content-div" name="content">
                  <Link className="post-title" to={`/post-page/${post.postId}`}>{post.title}</Link>
                  <p className="post-content">
                    <span>{post.content}</span>
                  </p>
                </div>
                <PostsFooter post={post} idx={postIdx} type="question" state={data} />
              </li>
            )
          }
          return ""
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
