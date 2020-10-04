import React, { useCallback } from 'react'
import './question.css'
import { homeStore, navStore } from '../redux/redux'
import axios from 'axios'


export default function () {

  let submitQus = useCallback(() => {

    let postContent = document.querySelector('.neirong').value
    let postTitle = document.querySelector('#fileName').value
    let post = {
      title: postTitle,
      content: postContent
    }
    if (post.title.trim() === '' || post.content.trim() === '') {
      return
    }
    axios.post('/api/home_Page/', post)
      .then(res => {
        homeStore.dispatch({
          type: 'postQuestion',
          question: false,
          postCount: res.data.postCount,
          posts: res.data.posts,
        })
      }).catch(rej => {
        if (rej.response.status === 401) {
          navStore.dispatch({
            type: 'toSign',
            sign: false,
          })
          homeStore.dispatch({
            type: 'question',
            question: false,
          })
        }
      })

  }, [])

  let closeQUs = useCallback(() => {
    homeStore.dispatch({
      type: 'question',
      question: false,
    })
  }, [])

  return (
    <>
      <label className="clear-qus" onClick={closeQUs}>x</label>
      <div id="questionDiv">
        <div className="question-outer">
          <div className="header">
            <input type="text" id="fileName" placeholder="请输入标题" name="title" />
          </div>
          <section>
            <textarea className="neirong" contentEditable name="content"></textarea>
          </section>
          <label className="qst-submit" onClick={submitQus}>发布问题</label>
        </div>
      </div>
    </>
  )
}
