
// function GetDynamicList(active) {
//   let [state, setState] = useState(userStore.getState() || {})

//   let [attentionDynamic, setAttentionDynamic] = useState([])
//   let [commentDynamic, setCommentDynamic] = useState([])
//   let [likeDynamic, setLikeDynamic] = useState([])
//   let [postDynamic, setPostDynamic] = useState([])

//   useEffect(() => {
//     let uns = userStore.subscribe(() => setState(userStore.getState()))

//     return () => uns()
//   }, [active])

//   useEffect(() => {
//     setAttentionDynamic(state.setAttentionDynamic || [])
//     setCommentDynamic(state.setCommentDynamic || [])
//     setLikeDynamic(state.setLikeDynamic || [])
//     setPostDynamic(state.setPostDynamic || [])
//   }, [state])

//   return { attentionDynamic, commentDynamic, likeDynamic, postDynamic }
// }

function PostMain(props) {
  let active = props.active
  let [state, setState] = useState(userStore.getState() || {})
  let { attentionDynamic = [], commentDynamic = [], likeDynamic = [], postDynamic = [] } = state
  // let [dynamic, setDynamic] = useState()
  // let [dynamicArray, setDynamicArray] = useState()
  let dynamic = [...attentionDynamic, ...commentDynamic, ...likeDynamic, ...postDynamic]
  // let dynamicArray = [commentDynamic, postDynamic, likeDynamic, attentionDynamic]

  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))

    return () => uns()
  }, [])

  let dynamicList = sortAtTime(dynamic)
  // if (active === 0) {
  //   dynamicList = sortAtTime(dynamic)
  // } else {
  //   dynamicList = sortAtTime(dynamicArray[active - 1])
  // }
  let Idx = -1
  return (
    <>
      {active === 4 &&
        <AttentionDynamic dynamicList={dynamicList} state={state} />}
      {active === 0 && <ul className="posts user-Dynamic">
        {
          dynamicList.map(item => {
            if (item.status !== 'delete') {
              Idx++
              return (
                <li key={item.likeAt || item.createdAt}>
                  {item.type === 'comment' && <AnswerDynamic item={item} state={state} idx={Idx} />}
                  {item.type === 'post' && <PostDynamic item={item} state={state} idx={Idx} />}
                  {item.type === 'likeComment' && <LikeDynamic item={item} state={state} idx={Idx} />}
                  {item.type === 'attention' && <AttentionQuestion item={item} state={state} idx={Idx} />}
                </li>
              )
            }
            return ""
          })
        }
      </ul>}
      {active === 1 && <AnswerDynamic />}
      {active === 2 && <PostDynamic />}




    </>
  )
}





function AnswerDynamic(props) {
  let { id } = useParams()
  let [state, setState] = useState(userStore.getState())
  let [commentDynamic, getCommentDynamic] = useState(userStore.getState().commentDynamic)
  let { userInfo = {} } = state
  let avatar = userInfo.avatar
  useEffect(() => {
    // axios.get(`/api/user-data/${id}`)
    //   .then(res => {
    //     let newData = res.data
    //     userStore.dispatch({
    //       type: 'getInitial',
    //       ...newData
    //     })
    //   })
    let uns = userStore.subscribe(() => {
      setState(userStore.getState())
      getCommentDynamic(userStore.getState().commentDynamic)
    })
    return () => uns()
  }, [])
  let dynamicList = sortAtTime(commentDynamic)
  let idx = -1
  return (
    <ul className="posts user-Dynamic">
      {dynamicList.map(item => {
        if (item.status !== 'delete') {
          idx++
          let time = (item.likeAt || item.createdAt) * 1
          return (
            <li key={item.likeAt || item.createdAt}> <div className="dynamicList-header"><span>回答了问题</span><span>{new Date(time).toLocaleDateString().slice(5)}</span></div>
              <div className="content-div" name="content">
                <a className="post-title" href={`/post-page/${item.postId}`}>{item.title}</a>
              </div>
              <div className="commenter-info dynamic-comment" >
                <i className="commenter-avatar" style={{ backgroundImage: `url(${avatar})` }}></i>
                <div className="commenter-flag">
                  <a className="commenter-name" href=".">{userInfo.name}</a>
                  <span className="commenter-sign">{userInfo.sign}</span>
                  <Attachment state={state} post={item} type='comment' />
                </div>
              </div>
              <div className="content-div" name="content">
                <p><span>{item.content}</span></p>
                <span className="answerAt">发布于 {new Date(time).toLocaleString().slice(0, 10)}{new Date(time).toTimeString().slice(0, 9)}</span>
                <div className="commenter-footer">
                  <PostsFooter type={'comment'} comment={item} idx={idx} state={state} />
                </div>
              </div>

            </li>
          )
        }
        return ""
      })
      }
    </ul>
  )
}

function PostDynamic(props) {
  let { id } = useParams()
  let [state, setState] = useState(userStore.getState())
  let [postDynamic, getPostDynamic] = useState(userStore.getState().postDynamic)
  useEffect(() => {
    // axios.get(`/api/user-data/${id}`)
    //   .then(res => {
    //     let newData = res.data
    //     userStore.dispatch({
    //       type: 'getInitial',
    //       ...newData
    //     })
    //   })
    let uns = userStore.subscribe(() => {
      setState(userStore.getState())
      getPostDynamic(userStore.getState().postDynamic)
    })
    return () => uns()
  }, [])
  // let item = props.item
  // let time = (item.likeAt || item.createdAt) * 1
  let idx = -1
  let dynamicList = sortAtTime(postDynamic)

  return (
    <ul className="posts user-Dynamic">
      {dynamicList.map(item => {
        if (item.status !== 'delete') {
          idx++
          let time = (item.likeAt || item.createdAt) * 1
          return (
            <li key={item.likeAt || item.createdAt}>
              <div className="dynamicList-header User-post-time"><span>发布了问题</span><span>&nbsp;&nbsp;:&nbsp; {new Date(time).toLocaleString().slice(0, 10)}{new Date(time).toTimeString()}</span>
                <Attachment state={state} post={item} type='post' />
              </div>
              <div className="content-div" name="content">
                <a className="post-title" href={`/post-page/${item.postId}`}>{item.title}</a>
                <p className="post-content">
                  <span>{item.content}</span>
                </p>
              </div>
              <PostsFooter type={'question'} post={item} idx={idx} state={state} />
            </li>
          )
        }
        return ""
      })
      }
    </ul>
  )
}
