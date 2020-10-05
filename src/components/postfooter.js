import React, { useCallback, useEffect, useState } from 'react'
// import axios from 'axios'
import { homeStore, pageStore, navStore } from '../redux/redux'
import { CaretUpFilled, CaretDownFilled, DownOutlined, UpOutlined, MessageFilled, StarFilled, HeartFilled } from '@ant-design/icons'
import AnsCommentList from './ansComment'

//首页
function useSelectState(props) {
  let ques = props.type === 'question'

  let [post, setPost] = useState(props.post || props.comment)
  let postId = ques ? post.postId : post.commentId
  // let post = props.post
  let [active, setActive] = useState()
  let [poorActive, setPoor] = useState()
  let [collectActive, setCollect] = useState()
  let [favoriteActive, setFavorite] = useState()
  // debugger
  useEffect(() => {
    //首页
    if (ques) {
      setActive(props.state.attention[postId])
      setPoor(props.state.poors[postId])
      setCollect(props.state.collect_quesActive[postId])
      setFavorite(props.state.favoriteQues[postId])
      let homeUns = homeStore.subscribe(() => {
        let newPost = homeStore.getState().posts.find(it => it.postId === postId)
        setPost(newPost)
      })
      return () => homeUns()

    } else {
      //post-page
      setActive(props.state.likes[postId])
      setPoor(props.state.commentPoors[postId])
      setCollect(props.state.collect_commActive[postId])
      setFavorite(props.state.favoriteComment[postId])

      let postUns = pageStore.subscribe(() => {
        let newComment = pageStore.getState().commenterInfo.find(it => it.commentId === postId)
        setPost(newComment || {})
      })
      return () => postUns()
    }

  }, [postId, ques, props])
  //home
  let toAttention = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      homeStore.dispatch({
        type: 'toAttention',
        postId,
        like: post.qusLike,
      })
    }
  }, [post, postId, props])

  let poorButton = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      if (ques) {
        homeStore.dispatch({
          type: 'poorButton',
          postId: postId,
          poor: post.poor,
        })
      } else {
        pageStore.dispatch({
          type: 'poorButton',
          commentId: postId,
          poor: post.poor,
        })
      }
    }
  }, [postId, post, ques, props])

  //page
  let likeComment = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      pageStore.dispatch({
        type: 'likeComment',
        commentId: postId,
        like: post.like,
      })
    }
  }, [post, postId, props])

  let getCollect = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      if (ques) {
        homeStore.dispatch({
          type: 'collect',
          collectId: postId,
          id: post.posterId
        })
      } else {
        pageStore.dispatch({
          type: 'collect',
          collectId: postId,
          id: post.commenterId
        })
      }
    }
  }, [ques, post, props, postId])
  let getFavorite = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
    } else {
      if (ques) {
        homeStore.dispatch({
          type: 'favorite',
          favoriteId: postId,
          id: post.posterId
        })
      } else {
        pageStore.dispatch({
          type: 'favorite',
          favoriteId: postId,
          id: post.commenterId
        })
      }
    }
  }, [ques, post, props, postId])

  return { post, active, poorActive, toAttention, poorButton, likeComment, getCollect, collectActive, getFavorite, favoriteActive }
}

export default function PostsFooter(props) {
  let idx = props.idx
  let ques = props.type === 'question'
  let { post = {}, active, poorActive, toAttention, likeComment, poorButton, getCollect, collectActive, getFavorite, favoriteActive } = useSelectState(props)

  let [fold, setFold] = useState(true)  // 收起展开
  let [hide, setHide] = useState(false)  // 显示/隐藏按钮
  useEffect(() => {
    let span = document.querySelectorAll('[name="content"] p span')
    if (span[idx] && span[idx].offsetHeight > 44) {
      let p = document.querySelectorAll('[name="content"] p')[idx]
      p.classList.add('flodContent')
      setHide(true)
    }
  }, [idx, ques])

  let foldContent = useCallback(() => {
    let p = document.querySelectorAll('[name="content"] p')[idx]
    let arr = Array.from(p.classList)
    let span = document.querySelectorAll('[name="content"] p span')
    if (!arr.includes('flodContent')) {
      p.classList.add('flodContent')
      setFold(true)
    } else {
      p.classList.remove('flodContent')
      p.style.maxHeight = span[idx].offsetHeight
      setFold(false)
    }
  }, [idx])

  let [ansComment, setAnsComment] = useState(false)
  let ansCommentflad = useCallback(() => {
    setAnsComment(!ansComment)
  }, [ansComment])
  return (
    <>
      <div className="postsfooter">
        <button type="button" className={active ? 'likeActive' : ''} onClick={ques ? toAttention : likeComment} ><CaretUpFilled /> {ques ? `关注 ${post.qusLike}` : `赞同 ${post.like}`} </button>
        <button type="button" className={poorActive ? 'likeActive' : ''} onClick={poorButton}><CaretDownFilled />{ques ? ` 踩 ${post.poor}` : ` 反对 ${post.poor}`}</button>
        <ul>
          <li onClick={ansCommentflad}><MessageFilled /> {ques ? `${props.post.answerCount} 条回答` : ansComment ? '收起评论' : `${props.comment.ansComments} 条评论`}</li>
          <li onClick={getCollect}><StarFilled />{collectActive ? '已收藏' : '收藏'} </li>
          <li onClick={getFavorite}><HeartFilled />{favoriteActive ? ' 已喜欢' : ' 喜欢'} </li>
        </ul>
        {hide && <>
          {fold
            ? <span onClick={foldContent}>全部展开 <DownOutlined /></span>
            : <span onClick={foldContent}>收起 <UpOutlined /></span>
          }</>
        }
      </div>
      {ansComment && !ques && <AnsCommentList id={post.commentId} />}
    </>
  )
}



/*
export default function PostsFooter(props) {
  let idx = props.idx
  let ques = props.type === 'question'
  let postId = ques ? props.post.postId : props.comment.commentId
  let [postLike, setPost] = useState({})
  let [active, setActive] = useState()
  let [poorActive, setPoor] = useState()
  let [fold, setFold] = useState(true)
  let [hide, setHide] = useState(false)
  // let [like,upLike] = useState(false)
  useEffect(() => {
    let span = document.querySelectorAll('[name="content"] p span')
    if (span[idx].offsetHeight > 41) {
      setHide(true)
    }
    //首页
    if (ques) {
      setPost(homeStore.getState().posts[idx])
      setActive(props.state.attention[postId])
      setPoor(props.state.poors[postId])

      let homeUns = homeStore.subscribe(() => setPost(homeStore.getState().posts[idx]))
      return () => homeUns()

    } else {
      //post-page
      setPost(pageStore.getState().commenterInfo[idx])
      setActive(props.state.likes[postId])
      setPoor(props.state.poors[postId])

      let postUns = pageStore.subscribe(() => setPost(pageStore.getState().commenterInfo[idx]))
      return () => postUns()
    }

  }, [idx])

  let foldContent = useCallback(() => {
    let p = document.querySelectorAll('[name="content"] p')[idx]
    let style = p.style.display
    if (style === 'block') {
      p.style.display = '-webkit-box'
      setFold(true)
    } else {
      p.style.display = 'block'
      setFold(false)
    }
  }, [idx])

  let toAttention = useCallback(() => {
    homeStore.dispatch({
      type: 'toAttention',
      postId,
      like: postLike.qusLike,
      idx,
    })
    setActive(homeStore.getState().attention[postId])
  }, [postLike, idx])

  let likeComment = useCallback(() => {
    pageStore.dispatch({
      type: 'likeComment',
      commentId: postId,
      like: postLike.like,
      idx,
    })
    setActive(pageStore.getState().likes[postId])
  }, [postLike, idx])

  let poorButton = useCallback(() => {
    if (ques) {
      homeStore.dispatch({
        type: 'poorButton',
        postId: postId,
        poor: postLike.poor,
        idx,
      })
      setPoor(homeStore.getState().poors[postId])
    } else {
      pageStore.dispatch({
        type: 'poorButton',
        commentId: postId,
        poor: postLike.poor,
        idx,
      })
      setPoor(pageStore.getState().poors[postId])
    }
  }, [postLike, idx])
  return (
    <div className="postsfooter">
      <button type="button" className={active ? 'likeActive' : ''} onClick={ques ? toAttention : likeComment} ><CaretUpFilled /> {ques ? `关注 ${postLike.qusLike}` : `赞同 ${postLike.like}`} </button>
      <button type="button" className={poorActive ? 'likeActive' : ''} onClick={poorButton}><CaretDownFilled />{ques ? ` 踩 ${postLike.poor}` : ` 反对 ${postLike.poor}`}</button>
      <ul>
        <li><MessageFilled /> {ques ? `${props.post.answerCount} 条回答` : `${props.comment.ansComments} 条评论`}</li>
        <li><StarFilled /> 收藏</li>
        <li><HeartFilled /> 喜欢</li>
      </ul>
      {hide && <>
        {fold
          ? <span onClick={foldContent}>全部展开 <DownOutlined /></span>
          : <span onClick={foldContent}>收起 <UpOutlined /></span>
        }</>
      }
    </div>
  )
}

// function poorButton() {

// }

*/
