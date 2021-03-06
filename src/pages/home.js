import React, { useEffect, useState, useCallback } from 'react'
import Nav from '../components/header-nav'
import Question from '../components/question'
import { homeStore, navStore } from '../redux/redux'
import Container from '../components/body-container'
import axios from 'axios'
import { SearchOutlined } from '@ant-design/icons'
import { Link } from "react-router-dom"
export default function () {
  let [state, setState] = useState(homeStore.getState())
  // debugger

  useEffect(() => {
    axios.get('/api/home-data').then(res => {
      let initial = res.data
      homeStore.dispatch({
        type: 'getData',
        ...initial,
        posts: initial.posts.filter(it => it.status !== 'delete'),
        // postCount: initial.postCount,
      })
    })
    let uns = homeStore.subscribe(() => setState(homeStore.getState()))

    return () => uns()
  }, [])

  // useEffect(() => {
  //   let uns = homeStore.subscribe(() => setState(homeStore.getState()))
  //   console.log('shuxinle')
  //   return () => uns()
  // }, [])
  return (
    <>
      <Nav>
        <HomeNavChild state={state} />
      </Nav>
      {state.question &&
        <Question />
      }
      <Container />
    </>
  )
}

function HomeNavChild({ state }) {
  let postQuestion = useCallback(() => {
    if (state.cookieUser === undefined) {
      navStore.dispatch({
        type: 'toSign',
        sign: false,
      })
      return
    }
    homeStore.dispatch({
      type: 'question',
      question: true,
    })
  }, [state])
  return (
    <div className="top-nav home-slider-nav">
      <Link to="/" className="home-logo">
        <img src="/images/icon2.jpg" alt="zhi 呼" />
      </Link>
      <ContainerList />
      <div className="search-div">
        <label className="search-label">
          <input type="search" name="search" className="search" placeholder="功能尚未完善" />
          <SearchOutlined style={{ fontSize: '20px', color: '#9AA3B5' }} />
        </label>
        <input type="button" className="question" value="发帖" onClick={postQuestion} />
      </div>
    </div>
  )
}

export function ContainerList() {
  return (
    <ul className="home-list">
      <li><Link to="/">推荐</Link></li>
      <li><Link to="/">关注</Link></li>
      <li><Link to="/">热榜</Link></li>
    </ul>
  )
}
