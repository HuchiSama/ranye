import React, { useEffect, useState ,useCallback} from 'react'
import Nav from '../components/header-nav'
import Question from '../components/question'
import { homeStore, pageStore, userStore } from '../redux/redux'
import UserHeader from '../components/user-header'
import UserContainer,{UserMain} from '../components/user-container'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import CareMessage from '../components/care-message'
export default function () {
  let { id } = useParams()
  let [state, setState] = useState(homeStore.getState())
  useEffect(() => {
    let uns = homeStore.subscribe(() => {
      let newData = homeStore.getState()
      let { posts = [] } = newData
      setState(newData)
      userStore.dispatch({
        type: 'getInitial',
        attention: newData.attention,
        poors: newData.poors,
        favoriteQues: newData.favoriteQues,
        collect_quesActive: newData.collect_quesActive,
        attentionDynamic: posts.filter(it => it.style === 'attention'),
        postDynamic: posts.filter(it => it.style === 'post'),
        collectQues: posts.filter(it => it.style === 'collect'),
      })
    })
    return () => uns()
  }, [id])
  useEffect(() => {
    if (id === 'undefined') {
      window.location.replace('/')
      return
    }
    axios.get(`/api/user-data/${id}`)
      .then(res => {
        let initial = res.data
        userStore.dispatch({
          type: 'getInitial',
          ...initial,
        })
        homeStore.dispatch({
          type: 'getData',
          ...initial,
          posts: [...initial.postDynamic, ...initial.attentionDynamic, ...initial.collectQues]
        })
        pageStore.dispatch({
          type: 'getInitial',
          ...initial,
          commenterInfo: [...initial.likeDynamic, ...initial.commentDynamic, ...initial.collectComment]
        })
      })

    let pageuns = pageStore.subscribe(() => {
      let newData = pageStore.getState()
      userStore.dispatch({
        type: 'getInitial',
        ...newData,
        favoriteComment: newData.favoriteComment,
        collect_commActive: newData.collect_commActive,
        likeDynamic: newData.commenterInfo.filter(it => it.style === 'likeComment'),
        commentDynamic: newData.commenterInfo.filter(it => it.style === 'comment'),
        collectComment: newData.commenterInfo.filter(it => it.style === 'collect'),
      })
    })
    return () => pageuns()
  }, [id])

  return (
    <>
      <Nav page={'user'}><UserNavSlider /></Nav>
      {state.question &&
        <Question />
      }
      <UserHeader />
      <UserContainer />
    </>
  )
}
function UserNavSlider(){
  let [state, setState] = useState({})
  let userInfo = state.userInfo || {}

  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [])
   let editState = useCallback(() => {
    userStore.dispatch({
      type: 'editState',
      edit: true
    })
  }, [])
  return (
    <div className="user-ndv-slider">
    <UserMain dynamic={false}/>
    {state.cookieUser === userInfo.name
    ? <div className="user-editing" onClick={editState}>编辑个人资料</div>
    : <div className="other-user"><CareMessage careInfo={state.userInfo} /></div>
    }
    </div>
  )
}
