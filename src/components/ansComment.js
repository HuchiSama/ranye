import React, { Fragment, useCallback, useEffect, useState } from 'react'
import moment from 'moment';
import axios from 'axios'
import { Comment, Form, Button, Input } from 'antd';
import { ansComStore, navStore, pageStore } from '../redux/redux';
import { DislikeFilled, WechatFilled, MessageFilled, LikeFilled, } from '@ant-design/icons';
import { EndCommentList } from './endComment'
const { TextArea } = Input;

// import { useParams } from 'react-router-dom'

export default function (props) {
  let id = props.id
  let [state, setState] = useState({ ansCommentList: [] })
  useEffect(() => {
    axios.get(`/api/ansComment/${id}`)
      .then(res => {
        let initial = res.data
        ansComStore.dispatch({
          type: 'getInitial',
          id: id,
          ansCommentList: initial.ansCommentList,
          myLikeAnsComment: initial.myLikeAnsComment,
          myPoorAnsComment: initial.myPoorAnsComment,
          cookieUser: initial.cookieUser,
        })
      })
  }, [id])
  let ansCommentList = state.ansCommentList[id] || []
  useEffect(() => {
    let uns = ansComStore.subscribe(() => setState(ansComStore.getState()))
    return () => uns()
  }, [])

  return (
    <div className="ansComment-outer">
      <div className="ansComment-head" ><h4>{ansCommentList.length} 条评论</h4></div>
      <ul className="ansComment-container">
        {ansCommentList.map((item, idx) => {
          return (
            <Fragment key={idx}>
              <CommentAns item={item} state={state} />
            </Fragment>
          )
        })
        }
      </ul>
      <div className="ansComment-put">
        <AnsComment state={state} id={id} />
      </div>
    </div>
  )
}

function CommentAns(props) {
  let item = props.item
  let id = item.ansCommentId
  let { myLikeAnsComment = {}, myPoorAnsComment = {} } = props.state
  let [endComment, setEndComment] = useState(false)
  let [value, setValue] = useState('')
  let [allView, setAllView] = useState(false)
  let [hide, setHide] = useState(true)
  let [endCommentList, updateEndCommentList] = useState(props.state.endCommentList[id] || [])
  let [commentIcon, setCommIcon] = useState(false)
  useEffect(() => {
    if (item.endComment > 0) {
      setCommIcon(true)
    } else {
      setCommIcon(false)
    }
  }, [item])
  useEffect(() => {
    let uns = ansComStore.subscribe(() => {
      let newData = ansComStore.getState().endCommentList[id]
      updateEndCommentList(newData)
      return () => uns()
    })
  }, [id])

  let inputComment = useCallback((e) => {
    setValue(e.target.value)
  }, [])
  useEffect(() => {
    axios.get(`/api/endComment/${id}`)
      .then(res => {
        let initial = res.data
        ansComStore.dispatch({
          type: 'getEndCommentList',
          id: id,
          endCommentList: initial.endCommentList,
          myLikeEndComment: initial.myLikeEndComment,
          myPoorEndComment: initial.myPoorEndComment,
          cookieUser: initial.cookieUser,
        })
      })
  }, [id])
  let likeORpoor = useCallback((t) => {
    if (t === '赞') {
      ansComStore.dispatch({
        type: 'likeAnsComment',
        id: id,
        commentId: item.commentId
      })
    } else {
      ansComStore.dispatch({
        type: 'poorAnsComment',
        id: id,
        commentId: item.commentId
      })
    }
  }, [id, item])
  let sendComment = useCallback(() => {
    setEndComment(!endComment)
  }, [endComment])
  let toSendEndComment = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    if (value.trim() === '') { return }
    axios.post(`/api/endComment/${id}`, {
      content: value,
      targetUserId: item.userId,
      commentId: item.commentId
    })
      .then(res => {
        ansComStore.dispatch({
          type: 'postEndComment',
          id: id,
          newList: res.data.newEndCommentList,
          commentId: item.commentId,
        })
        setHide(false)
        setAllView(true)
      })

    setValue('')
  }, [id, value, props, item])
  let hideORview = useCallback(() => {
    setHide(!hide)
    if (hide === true) {
      setAllView(false)
    }
  }, [hide])
  let action = (
    <>
      <ul className="ansComment-action">
        <li onClick={() => likeORpoor('赞')} className={myLikeAnsComment[id] ? 'activeAnsComment' : ''}><LikeFilled /> {item.like}</li>
        <li onClick={() => likeORpoor('踩')} className={myPoorAnsComment[id] ? 'activeAnsComment' : ''}><DislikeFilled /> 踩</li>
        {commentIcon &&
          <li onClick={hideORview} ><WechatFilled />{hide ? ' 查看回复' : ' 隐藏回复'} </li>
        }
        <li onClick={sendComment}><MessageFilled /> {endComment ? '取消回复' : '回复'}</li>
      </ul>
      {endComment &&
        <Form.Item>
          <TextArea autoSize={true} placeholder={' 回复 ' + item.name} className="endComment" style={{ width: '535px', marginRight: '15px' }} onInput={inputComment} value={value} />
          <Button htmlType="submit" type="primary" onClick={toSendEndComment}>
            发送
          </Button>
        </Form.Item>
      }
    </>
  )
  let author = (
    <div className="ansComment-header">
      <i className="endComment-avatar" style={{ backgroundImage: `url(${item.avatar})` }}></i>
      <a href={`/user/${item.userId}`}>{item.name}{item.userId === item.commentId ? '(作者)' : ''}</a>
    </div>
  )
  let TIME = moment(item.createdAt * 1).endOf().fromNow(true) + '前'

  return (
    <>
      <Comment actions={[action]} author={[author]} datetime={
        parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
          moment(item.createdAt * 1).format("MM-DD HH:mm:ss")
          : TIME
      } content={<p>{item.content}</p>}>
        {!hide &&
          <>
            {!allView && endCommentList.slice(0, 2).map(it => {
              return (<EndCommentList item={it} commentId={item.commentId} state={props.state} ansCommentId={id} />)
            })}
            {endCommentList.length > 2 && <span className="all-endComment" onClick={() => setAllView(true)} style={{ display: allView ? 'none' : 'block' }}>查看全部{endCommentList.length}条回复</span>}
            {allView &&
              endCommentList.map(it => {
                return (<EndCommentList item={it} commentId={item.commentId} state={props.state} ansCommentId={id} />)
              })
            }
          </>
        }
      </Comment>
    </>
  )
}
function AnsComment(props) {
  let id = props.id
  let [value, setValue] = useState('')
  let inputComment = useCallback((e) => {
    setValue(e.target.value)
  }, [])
  let postComment = useCallback(() => {
    if (props.state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    if (value.trim() === '') { return }
    axios.post(`/api/ansComment/${id}`, {
      content: value,
    })
      .then(res => {
        ansComStore.dispatch({
          type: 'postComment',
          id: id,
          newList: res.data.newAnsCommentList,
        })
        pageStore.dispatch({
          type: 'ansCommentList',
          id: id,
        })
        setValue('')
      })
  }, [id, value, props])
  return (
    <>
      <Form.Item>
        <TextArea rows={2} placeholder="请输入评论内容" onInput={inputComment} value={value} />
      </Form.Item>
      <Form.Item>
        <Button htmlType="submit" type="primary" onClick={postComment}>
          添加评论
      </Button>
      </Form.Item>
    </>
  )
}

