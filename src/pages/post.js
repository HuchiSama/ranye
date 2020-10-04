import React, { useEffect, useState } from 'react'
import Nav from '../components/header-nav'
import Question from '../components/question'
import Post from '../components/post-page'
import { homeStore } from '../redux/redux'

export default function () {
  let [state, setState] = useState(homeStore.getState())

  useEffect(() => {
    let uns = homeStore.subscribe(() => setState(homeStore.getState()))
    return () => uns()
  }, [])

  return (
    <>
      <Nav />
      {state.question &&
        <Question />
      }
      <Post />
    </>
  )
}
