import React, { useEffect, useState } from 'react'
import Nav from '../components/header-nav'
import Question from '../components/question'
import { homeStore } from '../redux/redux'
import Container from '../components/body-container'
import axios from 'axios'

export default function () {
  let [state, setState] = useState(homeStore.getState())
  // debugger

  useEffect(() => {
    axios.get('/api/home-data').then(res => {
      let initial = res.data
      homeStore.dispatch({
        type: 'getData',
        ...initial,
        postCount: initial.posts.length,
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
      <Nav />
      {state.question &&
        <Question />
      }
      <Container />
    </>
  )
}
