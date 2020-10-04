import { createStore } from 'redux'
import { produce } from 'immer'
import axios from 'axios'


const navActions = {
  getInitial(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  },
  toSign(state, action) {
    return produce(state, draft => {
      draft.sign = action.sign
    })
  },
  toChat(state, action) {
    return produce(state, draft => {
      draft.chat = action.chat
    })
  },
}

function navReducer(state, action) {
  if (action.type in navActions) {
    return navActions[action.type](state, action)
  }
  return state
}

export const navStore = createStore(navReducer, {
  question: false,
  sign: true,
  invitedList: [],
  chat: false,
  chatList: [],
  cares: {}
})


const signActions = {
  formRedirect(state, action) {
    return produce(state, (draft) => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  },
  sucessSignup(state, action) {
    return produce(state, (draft) => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  }
}

function signReducer(state, action) {
  if (action.type in signActions) {
    return signActions[action.type](state, action)
  }
  return state
}

export const signStore = createStore(signReducer, {
  form: 'signin',
  captcha: true,
  protocol: "未注册手机验证后自动登录，注册即代表同意《知乎协议》《隐私保护指引》",
  buttonText: '登录',
  other: true
})


//homeStore
const homeActions = {
  postQuestion(state, action) {
    // debugger
    return produce(state, draft => {
      draft.question = action.question
      draft.postCount = action.postCount
      draft.posts = action.posts
    })
  },
  question(state, action) {
    return produce(state, draft => {
      draft.question = action.question
    })
  },
  getData(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  },
  toAttention(state, action) {
    return produce(state, draft => {
      if (draft.attention[action.postId]) {
        axios.post('/api/attention/', {
          qusId: action.postId,
          createdAt: Date.now(),
          type: 'revoke',
        })
        draft.posts.forEach(it => {
          if (it.postId === action.postId) {
            it.qusLike = action.like - 1
          }
        })
        draft.attention[action.postId] = false
      } else {
        axios.post('/api/attention/', {
          qusId: action.postId,
          createdAt: Date.now(),
          type: 'attention',
        })
        draft.posts.forEach(it => {
          if (it.postId === action.postId) {
            it.qusLike = action.like + 1
          }
        })
        draft.attention[action.postId] = true
      }
    })
  },
  poorButton(state, action) {
    // debugger
    return produce(state, draft => {
      if (draft.poors[action.postId]) {
        axios.post('/api/attention/', {
          qusId: action.postId,
          type: 'revoke',
          style: 'poor',
          createdAt: Date.now()
        })
        draft.poors[action.postId] = false
        draft.posts.forEach(it => {
          if (it.postId === action.postId) {
            it.poor = action.poor - 1
          }
        })

      } else {
        axios.post('/api/attention/', {
          qusId: action.postId,
          type: 'attention',
          style: 'poor',
          createdAt: Date.now()
        })
        draft.poors[action.postId] = true
        draft.posts.forEach(it => {
          if (it.postId === action.postId) {
            it.poor = action.poor + 1
          }
        })
      }
    })
  },
  deletePost(state, action) {
    return produce(state, draft => {
      draft.postCount = action.postCount
      draft.posts = action.posts
    })
  },
  collect(state, action) {
    return produce(state, draft => {
      if (draft.collect_quesActive[action.collectId]) {
        axios.post('/api/collect/', {
          id: action.id,
          collectId: action.collectId,
          type: 'revoke',
          style: 'question'
        })
        draft.collect_quesActive[action.collectId] = false
      } else {
        axios.post('/api/collect/', {
          id: action.id,
          collectId: action.collectId,
          type: 'collect',
          style: 'question'
        })
        draft.collect_quesActive[action.collectId] = true
      }
    })
  },
  favorite(state, action) {
    return produce(state, draft => {
      if (draft.favoriteQues[action.favoriteId]) {
        axios.post('/api/favorite/', {
          id: action.id,
          favoriteId: action.favoriteId,
          type: 'revoke',
          style: 'question'
        })
        draft.favoriteQues[action.favoriteId] = false
      } else {
        axios.post('/api/favorite/', {
          id: action.id,
          favoriteId: action.favoriteId,
          type: 'favorite',
          style: 'question'
        })
        draft.favoriteQues[action.favoriteId] = true
      }
    })
  },
  hoverAvatar(state, action) {
    return produce(state, draft => {
      draft.hover = action.hover
    })
  },

}

function homeReducer(state, action) {
  if (action.type in homeActions) {
    return homeActions[action.type](state, action)
  }
  return state
}
export const homeStore = createStore(homeReducer, {
  question: false,
  hover: false,
})

//post-pageStore
const pageActions = {
  writeAnswer(state, action) {
    return produce(state, draft => {
      draft.writeAnswer = action.writeAnswer
    })
  },
  getInitial(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  },
  postAnswer(state, action) {
    // debugger
    return produce(state, (draft) => {
      draft.commenterInfo = action.commenterInfo
      draft.writeAnswer = false
    })
  },
  toAttention(state, action) {
    return produce(state, (draft) => {
      if (action.attention) {
        axios.post('/api/attention/', {
          qusId: action.pageId,
          type: 'attention',
          createdAt: Date.now()
        })
        draft.attention = action.attention
        draft.attentionLength++
      } else {
        axios.post('/api/attention/', {
          qusId: action.pageId,
          type: 'revoke',
          createdAt: Date.now()
        })
        draft.attention = action.attention
        draft.attentionLength--
      }
    })
  },
  likeComment(state, action) {
    // debugger
    return produce(state, draft => {
      if (draft.likes[action.commentId]) {
        axios.post('/api/likeComment/', {
          commentId: action.commentId,
          type: 'revoke',
          createdAt: Date.now()
        })
        draft.commenterInfo.forEach(it => {
          if (it.commentId === action.commentId) {
            it.like = action.like - 1
          }
        })
        draft.poster ? draft.poster.agree -= 1 : draft.userInfo.agree -= 1
        draft.likes[action.commentId] = false
      } else {
        axios.post('/api/likeComment/', {
          commentId: action.commentId,
          type: 'active',
          createdAt: Date.now()
        })
        draft.commenterInfo.forEach(it => {
          if (it.commentId === action.commentId) {
            it.like = action.like + 1
          }
        })
        draft.poster ? draft.poster.agree += 1 : draft.userInfo.agree += 1
        draft.likes[action.commentId] = true
      }
    })
  },
  poorButton(state, action) {
    // debugger
    return produce(state, draft => {
      if (draft.commentPoors[action.commentId]) {
        axios.post('/api/likeComment/', {
          commentId: action.commentId,
          type: 'revoke',
          style: 'poor',
          createdAt: Date.now()
        })
        draft.commenterInfo.forEach(it => {
          if (it.commentId === action.commentId) {
            it.poor = action.poor - 1
          }
        })
        draft.commentPoors[action.commentId] = false
        // draft.commenterInfo[action.idx].poor = action.poor - 1
      } else {
        axios.post('/api/likeComment/', {
          commentId: action.commentId,
          type: 'active',
          style: 'poor',
          createdAt: Date.now()
        })
        draft.commenterInfo.forEach(it => {
          if (it.commentId === action.commentId) {
            it.poor = action.poor + 1
          }
        })
        draft.commentPoors[action.commentId] = true
        // draft.commenterInfo[action.idx].poor = action.poor + 1
      }
    })
  },
  deleteComment(state, action) {
    return produce(state, (draft) => {
      draft.commenterInfo = action.comments
    })
  },
  collect(state, action) {
    return produce(state, draft => {
      if (draft.collect_commActive[action.collectId]) {
        axios.post('/api/collect/', {
          id: action.id,
          collectId: action.collectId,
          type: 'revoke',
          style: 'comment',
        })
        draft.collect_commActive[action.collectId] = false
      } else {
        axios.post('/api/collect/', {
          id: action.id,
          collectId: action.collectId,
          type: 'collect',
          style: 'comment',
        })
        draft.collect_commActive[action.collectId] = true
      }
    })
  },
  favorite(state, action) {
    return produce(state, draft => {
      if (draft.favoriteComment[action.favoriteId]) {
        axios.post('/api/favorite/', {
          id: action.id,
          favoriteId: action.favoriteId,
          type: 'revoke',
          style: 'comment',
        })
        draft.favoriteComment[action.favoriteId] = false
      } else {
        axios.post('/api/favorite/', {
          id: action.id,
          favoriteId: action.favoriteId,
          type: 'favorite',
          style: 'comment',
        })
        draft.favoriteComment[action.favoriteId] = true
      }
    })
  },
  ansCommentList(state, action) {
    return produce(state, draft => {
      draft.commenterInfo.forEach(it => {
        if (it.commentId === action.id) {
          it.ansComments++
        }
      })
    })
  },
  invite(state, action) {
    return produce(state, (draft) => {
      draft.invite = action.invite
    })
  },
  upDateInvite(state, action) {
    return produce(state, (draft) => {
      draft.inviteList = action.inviteList
    })
  },
}


function pageReducer(state, action) {
  if (action.type in pageActions) {
    return pageActions[action.type](state, action)
  }
  return state
}
export const pageStore = createStore(pageReducer, {
  writeAnswer: false,
  invite: false,
  inviteList: [],
})

//userStore
const userActions = {
  getInitial(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  },
  editState(state, action) {
    return produce(state, draft => {
      draft.edit = action.edit
    })
  },
  editUserInfo(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        draft.userInfo[key] = action[key]
      }
    })
  },
  editEnd(state, action) {
    return produce(state, draft => {
      draft.edit = action.edit
    })
  },
  updateActive(state, action) {
    return produce(state, draft => {
      draft.attention = action.attention
      draft.poors = action.poors
    })
  },
  activeSwitch(state, action) {
    return produce(state, draft => {
      draft.active = action.active
    })
  },
  careActive(state, action) {
    return produce(state, draft => {
      draft.careActive = action.careActive
    })
  },
  collectActive(state, action) {
    return produce(state, draft => {
      draft.collectActive = action.collectActive
    })
  }
}
function userReducer(state, action) {
  if (action.type in userActions) {
    return userActions[action.type](state, action)
  }
  return state
}
export const userStore = createStore(userReducer, {
  writeAnswer: false,
  edit: false,
  question: false,
  active: 0,
  careActive: 0,
  collectActive: 0,
})

/*cares-Store*/

const careAction = {
  updateCare(state, action) {
    return produce(state, draft => {
      let len = draft.myCares.length
      if (len === 0) {
        draft.myCares[len] = { careId: action.id }
        return
      }
      for (let i = 0; i < len; i++) {
        if (draft.myCares[i].careId === action.id) {
          draft.myCares[i].careId = null
          break
        }
        if (i === len - 1) {
          draft.myCares[len] = { careId: action.id }
        }
      }
    })
  },
  getCare(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        draft[key] = action[key]
      }
    })
  },
}
function careReducer(state, action) {
  if (action.type in careAction) {
    return careAction[action.type](state, action)
  }
  return state
}


export const careStore = createStore(careReducer, {
  myCares: []
})


const ansComAction = {
  getInitial(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        if (key === 'id' || key === 'ansCommentList') {
          draft.ansCommentList[action.id] = action.ansCommentList
        } else {
          draft[key] = action[key]
        }
      }
    })
  },
  postComment(state, action) {
    return produce(state, draft => {
      draft.ansCommentList[action.id] = action.newList
    })
  },
  likeAnsComment(state, action) {
    return produce(state, draft => {
      if (draft.myLikeAnsComment[action.id]) {
        axios.post(`/api/ansCommentLike/${action.id}`, {
          style: 'like',
          type: 'revoke',
        })
        draft.ansCommentList[action.commentId].forEach(it => {
          if (it.ansCommentId === action.id) {
            it.like -= 1
          }
        })
        draft.myLikeAnsComment[action.id] = false
      } else {
        axios.post(`/api/ansCommentLike/${action.id}`, {
          style: 'like',
          type: 'active',
        })
        draft.ansCommentList[action.commentId].forEach(it => {
          if (it.ansCommentId === action.id) {
            it.like += 1
          }
        })
        draft.myLikeAnsComment[action.id] = true
      }
    })
  },
  poorAnsComment(state, action) {
    // debugger
    return produce(state, draft => {
      if (draft.myPoorAnsComment[action.id]) {
        axios.post(`/api/ansCommentLike/${action.id}`, {
          style: 'poor',
          type: 'revoke',
        })
        draft.ansCommentList[action.commentId].forEach(it => {
          if (it.ansCommentId === action.id) {
            it.poor -= 1
          }
        })
        draft.myPoorAnsComment[action.id] = false
      } else {
        axios.post(`/api/ansCommentLike/${action.id}`, {
          style: 'poor',
          type: 'active',
        })
        draft.ansCommentList[action.commentId].forEach(it => {
          if (it.ansCommentId === action.id) {
            it.poor += 1
          }
        })
        draft.myPoorAnsComment[action.id] = true
      }
    })
  },
  postEndComment(state, action) {
    return produce(state, draft => {
      draft.endCommentList[action.id] = action.newList
      draft.ansCommentList[action.commentId].forEach((it, idx) => {
        if (it.ansCommentId === action.id) {
          it.endComment += 1
        }
      })
    })
  },
  getEndCommentList(state, action) {
    return produce(state, draft => {
      for (let key in action) {
        if (key === 'id' || key === 'endCommentList') {
          draft.endCommentList[action.id] = action.endCommentList
        } else {
          draft[key] = action[key]
        }
      }
    })
  },
  likeEndComment(state, action) {
    return produce(state, draft => {
      if (draft.myLikeEndComment[action.id]) {
        axios.post(`/api/endCommentLike/${action.id}`, {
          style: 'like',
          type: 'revoke',
        })
        draft.endCommentList[action.ansCommentId].forEach(it => {
          if (it.endCommentId === action.id) {
            it.like -= 1
          }
        })
        draft.myLikeEndComment[action.id] = false
      } else {
        axios.post(`/api/endCommentLike/${action.id}`, {
          style: 'like',
          type: 'active',
        })
        draft.endCommentList[action.ansCommentId].forEach(it => {
          if (it.endCommentId === action.id) {
            it.like += 1
          }
        })
        draft.myLikeEndComment[action.id] = true
      }
    })
  },
  poorEndComment(state, action) {
    // debugger
    return produce(state, draft => {
      if (draft.myPoorEndComment[action.id]) {
        axios.post(`/api/endCommentLike/${action.id}`, {
          style: 'poor',
          type: 'revoke',
        })
        draft.endCommentList[action.ansCommentId].forEach(it => {
          if (it.endCommentId === action.id) {
            it.poor -= 1
          }
        })
        draft.myPoorEndComment[action.id] = false
      } else {
        axios.post(`/api/endCommentLike/${action.id}`, {
          style: 'poor',
          type: 'active',
        })
        draft.endCommentList[action.ansCommentId].forEach(it => {
          if (it.endCommentId === action.id) {
            it.poor += 1
          }
        })
        draft.myPoorEndComment[action.id] = true
      }
    })
  },
}
function ansComReducer(state, action) {
  if (action.type in ansComAction) {
    return ansComAction[action.type](state, action)
  }
  return state
}


export const ansComStore = createStore(ansComReducer, {
  ansCommentList: {},
  endComment: false,
  endCommentList: {},
})
