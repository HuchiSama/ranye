import React, { useCallback, useState } from 'react'
import moment from 'moment';
import axios from 'axios'
import { Comment, Form, Button, Input } from 'antd';
import { ansComStore, navStore } from '../redux/redux';
import { DislikeFilled, MessageFilled, LikeFilled, } from '@ant-design/icons';
const { TextArea } = Input;


export default function () {
  return (
    <div></div>
  )
}

export function EndCommentList({ item, commentId, state, ansCommentId }) {
  let { myLikeEndComment = {}, myPoorEndComment = {} } = state
  let [value, setValue] = useState('')
  let [endComment, setEndComment] = useState(false)

  let id = item.endCommentId
  let inputComment = useCallback((e) => {
    setValue(e.target.value)
  }, [])
  let sendComment = useCallback(() => {
    setEndComment(!endComment)
  }, [endComment])
  let likeORpoor = useCallback((t) => {
    if (t === '赞') {
      ansComStore.dispatch({
        type: 'likeEndComment',
        id: id,
        ansCommentId: item.ansCommentId
      })
    } else {
      ansComStore.dispatch({
        type: 'poorEndComment',
        id: id,
        ansCommentId: item.ansCommentId
      })
    }
  }, [id, item])
  let toSendEndComment = useCallback(() => {
    if (state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    if (value.trim() === '') { return }
    axios.post(`/api/endComment/${ansCommentId}`, {
      content: value,
      targetUserId: item.userId,
      commentId: commentId
    })
      .then(res => {
        ansComStore.dispatch({
          type: 'postEndComment',
          id: ansCommentId,
          newList: res.data.newEndCommentList,
        })
      })
    setValue('')
  }, [ansCommentId, value, item, commentId, state])
  let action = (
    <>
      <ul className="ansComment-action">
        <li onClick={() => likeORpoor('赞')} className={myLikeEndComment[id] ? 'activeAnsComment' : ''}><LikeFilled /> {item.like}</li>
        <li onClick={() => likeORpoor('踩')} className={myPoorEndComment[id] ? 'activeAnsComment' : ''}><DislikeFilled /> 踩</li>
        <li onClick={sendComment}><MessageFilled /> {endComment ? '取消回复' : '回复'}</li>
      </ul>
      {endComment &&
        <Form.Item>
          <TextArea autoSize={true} placeholder={' 回复 ' + item.name} className="endComment" style={{ width: '490px', marginRight: '15px' }} onInput={inputComment} value={value} />
          <Button htmlType="submit" type="primary" onClick={toSendEndComment}>
            发送
          </Button>
        </Form.Item>
      }
    </>
  )
  let author = (
    <div className="ansComment-header">
      <i style={{ backgroundImage: `url(${item.avatar})` }} className="endComment-avatar"></i>
      <a href={`/user/${item.userId}`}>{item.name}{item.userId === commentId ? '(作者)' : ''}</a>
      &nbsp;&nbsp;回复&nbsp;&nbsp;
      <a href={`/user/${item.targetUserId}`}>{item.targetName}{item.targetUserId === commentId ? '(作者)' : ''}</a>
    </div>
  )
  let TIME = moment(item.createdAt * 1).endOf().fromNow(true) + '前'
  return (
    <Comment actions={[action]} author={[author]} datetime={
      parseInt(TIME) * 1 > 1 && /天/g.test(TIME) ?
        moment(item.createdAt * 1).format("MM-DD HH:mm:ss")
        : TIME
    } content={<p>{item.content}</p>}>
    </Comment>
  )
}
