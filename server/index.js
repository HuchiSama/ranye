const express = require('express')
const app = express()
var port = 3030
const cookie = require('cookie-parser')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')

const server = new WebSocket.Server({ port: 8080 })

// const { fips } = require('crypto')
const svgCaptcha = require('svg-captcha')
var db

const uploader = multer({ dest: __dirname + '/uploads/' })

sqlite.open({
  filename: __dirname + '/bbs.db',
  driver: sqlite3.Database
}).then(value => {
  db = value
})


app.use(express.static(__dirname + '/build'))
app.use(express.static(__dirname + '/public'))
app.use('/uploads/', express.static(__dirname + '/uploads'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookie('asdhjadsasdha'))

app.get('*', (request, response) => {
  response.sendFile(path.resolve(__dirname, 'build', 'index.html'))
})

var sessionStore = Object.create(null)
//派发session
app.use(function sessionMW(req, res, next) {
  if (req.cookies.sessionId) {
    req.session = sessionStore[req.cookies.sessionId]
    if (!req.session) {
      req.session = sessionStore[req.cookies.sessionId] = {}
    }
  } else {
    let id = Math.random().toString(16).slice(2)
    req.session = sessionStore[id] = {}
    res.cookie('sessionId', id, {
      maxAge: 86400000,
    })
  }
  next()
})

//私信接口
let clintList = new Map()
server.on('connection', async (ws, req) => {
  let targetReg = /(?<=targetId=)\d*(?=&&)/g
  let userReg = /(?<=userId=)\d*$/g

  let targetId = req.url.match(targetReg)[0]
  let userId = req.url.match(userReg)[0]
  let user = await db.get('SELECT * FROM users WHERE userId=?', userId)
  console.log(targetId, userId)
  // ws.userId = userId
  clintList.set(targetId, ws)
  async function getChatList(userWs) {
    let sendMeChat = await db.all('SELECT * FROM chat WHERE targetId=? and userId=?', [userId, targetId])
    let mySendChat = await db.all('SELECT * FROM chat WHERE targetId=? and userId=?', [targetId, userId])
    let chasList = [...sendMeChat, ...mySendChat].sort((a, b) => a.createdAt - b.createdAt)
    userWs.send(JSON.stringify(chasList))
  }
  ws.on('message', async data => {
    let msgData = JSON.parse(data)
    msgData.forEach(async it => {
      await db.run(`insert into chat values(?,?,?,?,?,?,?,?,?)`, [user.userId, user.name, user.avatar, it.targetId, it.targetName, it.targetAvatar, it.content, Date.now(), 'normal'])
      let getWs = clintList.get(userId)
      console.log(getWs)
      if (getWs) {
        getChatList(getWs)
      }
    })
    getChatList(ws)
  })
  getChatList(ws)
})




app.get('/api/home-data', async (req, res, next) => {
  let cookieUser = req.signedCookies.user
  let posts = await db.all(`SELECT * FROM posts LEFT JOIN users ON posts.posterId=userId ORDER BY posts.lastCommentAt DESC`)
  let user = await db.get('SELECT * FROM users WHERE name=?', cookieUser) || {}
  let recommend = await db.all(`SELECT * FROM posts ORDER BY posts.pageview DESC`)
  recommend = recommend.slice(0, 15)

  let attentionAll = await db.all(`select * from attention`)
  let attention = {}
  attentionAll.map(it => {
    if (it.userName == cookieUser) {
      attention[it.qusId] = true
    }
  })
  let poorAll = await db.all(`select * from poorPost`)
  let poors = {}
  poorAll.map(it => {
    if (it.userName == cookieUser) {
      poors[it.qusId] = true
    }
  })

  let collectQues = await db.all(`SELECT
      collects.collectId,
      collects.type,
      posts.postId,
      posts.title,
      posts.content,
      posts.qusLike,
      users.sign,
      users.avatar,
      users.sex,
      users.name,
      users.userId,
      posts.poor,
      posts.status,
      collects.createdAt,
      posts.posterId
      FROM
      collects
      INNER JOIN posts ON collects.collectId = posts.postId
      INNER JOIN users ON posts.posterId = users.userId
      WHERE collects.userId=? and collects.type='question'`, [user.userId])
  // res.json({ collectQues })
  // } else if (body.type === 'comment') {
  let collect_quesActive = {}
  collectQues.forEach(it => collect_quesActive[it.collectId] = true)


  let favoriteQuesAll = await db.all(`SELECT
  favorite.favoriteId,
  favorite.createdAt,
  favorite.type
  FROM
  posts
  INNER JOIN favorite ON favorite.favoriteId = posts.postId
  WHERE
  favorite.userId = ? and type='question'
  `, [user.userId])
  let favoriteQues = {}
  favoriteQuesAll.forEach(it => favoriteQues[it.favoriteId] = true)

  res.json({ posts, cookieUser, user, recommend, attention, poors, postCount: posts.length, collect_quesActive, favoriteQues })
})

app.route('/api/nav-data')
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let userInfo = await db.get(`select * from users where name=?`, [cookieUser])
    let careList = await db.all(`select * from cares where userName=?`, [cookieUser])
    let cares = {}
    careList.forEach(it => cares[it.careId] = true)
    res.json({ userInfo, cookieUser, cares })
  })

//发帖
app.route('/api/home_Page/')
  .post(async (req, res, next) => {
    let body = req.body
    let cookieUser = req.signedCookies.user
    if (cookieUser === undefined) {
      res.status(401)
      res.end('未登录')
    }
    let poster = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
    let nextPostId
    await db.get(`SELECT postId AS res FROM posts ORDER BY postId DESC`)
      .then(val => {
        nextPostId = val.res + 1
      })    // posts  ID 计数器
    // console.log(nextPostId)
    await db.run(`INSERT INTO posts VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, [nextPostId, poster.userId, body.title, body.content, Date.now(), 0, 0, 0, 0, 0, 'normal', Date.now()])

    await db.run(`update users set postCount=? where name=?`, [poster.postCount + 1, cookieUser])

    let posts = await db.all(`SELECT * FROM posts LEFT JOIN users ON posts.posterId=userId ORDER BY posts.postId DESC`)

    res.json({ posts, postCount: posts.length })
  })

//验证码
app.get('/api/captcha', async (req, res, next) => {
  let captcha = svgCaptcha.create()
  req.session.captcha = captcha.text
  console.log(captcha.text)
  res.type('svg')
  res.status(200).send(captcha.data)
})

app.route('/api/login/')
  //登陆页面
  .get((req, res, next) => {
    res.render('login.pug')
    console.log(req.session.captcha)
  })
  //提交登陆
  .post(async (req, res, next) => {
    let body = req.body
    let user = await db.get(`SELECT * FROM users WHERE name=?`, body.name)
    console.log(body.captcha, req.session.captcha)
    if (user) {
      if (body.captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
        res.send('3')
      } else {
        if (body.password == user.password) {
          res.clearCookie('user')
          res.cookie('user', body.name, {
            maxAge: 86400000,
            signed: true,
          })
          res.send('1')
          return
        } else {
          res.send('0')
        }
      }
    } else {
      res.send('0')
    }
  })
//清楚cookie
app.post('/api/clearCookie/', (req, res, next) => {
  res.clearCookie('user')
  res.end()
})

app.route('/api/sign_up/')
  //注册页面
  .get((req, res, next) => {
    res.render('sign_up.pug')
  })
  .post(async (req, res, next) => {
    let body = req.body
    console.log(body)
    let nextUserId
    await db.get(`SELECT count(userId) AS res FROM users`)
      .then(val => { nextUserId = val.res + 1 })    // posts  ID 计数器
    await db.run('insert into users values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [body.name, body.password, nextUserId, body.email, '/images/default.jpg', ' 当前还没有签名...', 'man', 0, 0, 0, '未知', '2020-01-01', '未知', '个人简介为空', '未知', 0, 0, 0, 0])
    res.send('true')
  })

//注册查询
app.post('/api/user-query/', async (req, res, next) => {
  let body = req.body
  console.log(body)
  let user = await db.get(`SELECT name FROM users WHERE name=?`, body.name)
  if (user) {
    res.send('0')
  } else {
    res.send('1')
  }
})
app.post('/api/email-query/', async (req, res, next) => {
  let body = req.body
  let email = await db.get(`SELECT email FROM users WHERE email=?`, body.email)
  let reg = new RegExp('@', 'g')
  let match = body.email.match(reg)
  if (email || (match && match.length !== 1) || !match) {
    console.log('222')
    res.send('0')
  } else {
    console.log('111')
    res.send('1')
  }
})
app.route('/api/get-care/:id')
  .get(async (req, res, next) => {

    let cookieUser = req.signedCookies.user
    let id = req.params.id
    // let itCares = await db.all(`SELECT * FROM cares WHERE userId=? `, [id])
    //关注者列表
    let myCares = await db.all(`SELECT
    cares.createdAt,
    cares.careName,
    users.name,
    users.avatar,
    users.sign,
    users.industry,
    cares.careId
    FROM
    cares
    INNER JOIN users ON cares.careId = users.userId
    WHERE
    cares.userName=?`, [cookieUser])
    let itCaresList = await db.all(`SELECT
        cares.createdAt,
        users.name,
        users.avatar,
        users.sign,
        users.sex,
        users.fans,
        users.agree,
        users.userId,
        users.commentCount,
        users.postCount
        FROM
        cares
        INNER JOIN users ON cares.careId = users.userId
        WHERE
        cares.userId= ?`, [id])

    //被关注列表
    let recevies = await db.all(`SELECT
    users.name,
    users.avatar,
    users.sign,
    users.sex,
    users.fans,
    users.agree,
    users.userId
    FROM
    cares
    INNER JOIN users ON cares.userId = users.userId
    WHERE
    cares.careId =?`, [id])

    res.json({ itCaresList, myCares, recevies, cookieUser })
  })

app.route('/api/post-page/:id')
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let id = req.params.id
    let post = await db.get(`SELECT * FROM posts WHERE postId=?`, id)
    let views = simpleCount(post.pageview)
    // console.log(views)
    await db.run(`UPDATE posts SET pageview=? WHERE postId=?`, views, id)
    let poster = await db.get(`SELECT * FROM users WHERE userId=?`, post.posterId)
    let commenterInfo = await db.all(`SELECT * FROM comments LEFT JOIN users ON comments.commenterId=users.userId where comments.postId=? ORDER BY comments.like-comments.poor DESC,comments.createdAt DESC`, id)
    let attentionAll = await db.all(`select * from attention where qusId=?`, [id])
    let attention = attentionAll.some(it => it.userName == cookieUser)
    attentionLength = attentionAll.length


    let likedAll = await db.all(`select * from commentLike`)
    let likes = {}
    likedAll.map(it => {
      if (it.userName == cookieUser) {
        likes[it.commentId] = true
      }
    })
    let poordAll = await db.all(`select * from commentPoor`)
    let commentPoors = {}
    poordAll.map(it => {
      if (it.userName == cookieUser) {
        commentPoors[it.commentId] = true
      }
    })

    // res.json({ collectQues })
    // } else if (body.type === 'comment') {
    let collectComment = await db.all(`SELECT
    collects.collectId,
    collects.createdAt as likeAt,
    collects.type,
    users.name,
    users.userId,
    users.avatar,
    users.sign,
    users.sex,
    comments.postId,
    comments.commentId,
    comments.content,
    comments.createdAt,
    comments."like",
    comments.poor,
    comments.status,
    posts.title,
    comments.commenterId
    FROM
    collects
    INNER JOIN comments ON collects.collectId = comments.commentId
    INNER JOIN users ON comments.commenterId = users.userId
    INNER JOIN posts ON comments.postId = posts.postId
    WHERE
    collects.userName=? and collects.type=?`, [cookieUser, 'comment'])

    let collect_commActive = {}
    collectComment.forEach(it => collect_commActive[it.collectId] = true)

    let favoriteCommentAll = await db.all(`SELECT
    favorite.favoriteId,
    favorite.createdAt,
    favorite.type
    FROM
    comments
    INNER JOIN favorite ON favorite.favoriteId = comments.commentId
    WHERE
    favorite.userName = ? and type='comment'
    `, [cookieUser])
    let favoriteComment = {}
    favoriteCommentAll.forEach(it => favoriteComment[it.favoriteId] = true)

    res.json({ post, poster, commenterInfo, cookieUser, attention, attentionLength, likes, commentPoors, collect_commActive, collectComment, favoriteComment })
  })
  //评论帖子
  .post(async (req, res, next) => {
    let body = req.body
    let id = req.params.id
    let cookieUser = req.signedCookies.user
    if (cookieUser === undefined) {
      res.status(401)
      res.end('未登录')
    }
    let user = await db.get(`SELECT * FROM users  WHERE name=?`, [cookieUser])
    let commenter = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
    let comments = await db.get(`SELECT * FROM comments ORDER BY commentId DESC`)
    await db.run(`INSERT INTO comments VALUES(?,?,?,?,?,?,?,?,?,?)`, [comments.commentId + 1, commenter.userId, commenter.name, id, body.content, body.createdAt, 0, 0, 0, 'normal'])

    let post = await db.get(`SELECT * FROM posts WHERE postId=?`, [id])

    await db.run(`update users set commentCount=? where name=?`, [user.commentCount + 1, cookieUser])

    await db.run(`update posts set answerCount=? where postId=?`, [post.answerCount + 1, id])
    await db.run(`update posts set lastCommentAt=? where postId=?`, [Date.now(), id])

    let commenterInfo = await db.all(`SELECT * FROM comments LEFT JOIN users ON comments.commenterId=users.userId WHERE comments.postId=? ORDER BY comments.like-comments.poor DESC,comments.createdAt DESC`, id)
    res.json(commenterInfo)
  })

//用户界面
app.route('/api/user-data/:id')
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let id = req.params.id
    let userInfo = await db.get(`select * from users where userId=?`, [id])

    let posts = await db.all(`SELECT * FROM posts LEFT JOIN users ON posts.posterId=userId ORDER BY posts.postId DESC`)

    //关注问题动态
    let attentionDynamic = await db.all(`SELECT
        attention.createdAt as likeAt,
        attention.userId,
        posts.postId,
        posts.posterId,
        posts.title,
        posts.content,
        posts.createdAt,
        posts.answerCount,
        posts.qusLike,
        posts.poor,
        posts.status,
        users.avatar as posterSign,
        users.sign as posterSign,
        users.name as posterName
        FROM
        attention
        INNER JOIN posts ON attention.qusId = posts.postId
        INNER JOIN users ON posts.posterId = users.userId
        WHERE
        attention.userId=?`, [id])
    //点赞动态
    let likeDynamic = await db.all(`SELECT
        comments.commentId,
        commentLike.userId,
        commentLike.createdAt as likeAt,
        comments.postId,
        comments.content,
        comments.createdAt,
        comments."like",
        comments.ansComments,
        comments.poor,
        comments.status,
        posts.title,
        users.name ,
        users.avatar ,
        users.sign ,
        users.userId as commenterId
        FROM
        commentLike
        INNER JOIN comments ON commentLike.commentId = comments.commentId
        INNER JOIN posts ON comments.postId = posts.postId
        INNER JOIN users ON comments.commenterId = users.userId
        WHERE
        commentLike.userId=?`, [id])
    //发帖动态
    let postDynamic = await db.all(`SELECT
    posts.title,
    posts.content,
    posts.createdAt,
    posts.qusLike,
    posts.poor,
    posts.status,
    posts.answerCount,
    posts.postId,
    users.userId,
    users.name
    FROM
    posts
    INNER JOIN users ON posts.posterId = users.userId
    WHERE
    posts.posterId = ?`, [id])
    //评论动态
    let commentDynamic = await db.all(`SELECT
    comments.postId,
    comments.createdAt,
    comments."like",
    comments.poor,
    comments.ansComments,
    comments.status,
    posts.title,
    comments.content,
    comments.commenterName AS name,
    comments.commentId
    FROM
    comments
    INNER JOIN posts ON comments.postId = posts.postId
    WHERE
    comments.commenterId =?`, [id])
    attentionDynamic.map(it => it.style = 'attention')
    likeDynamic.map(it => it.style = 'likeComment')
    postDynamic.map(it => it.style = 'post')
    commentDynamic.map(it => it.style = 'comment')

    let likedAll = await db.all(`select * from commentLike`)
    let likes = {}
    likedAll.map(it => {
      if (it.userName == cookieUser) {
        likes[it.commentId] = true
      }
    })
    let poordAll = await db.all(`select * from commentPoor`)
    let commentPoors = {}
    poordAll.map(it => {
      if (it.userName == cookieUser) {
        commentPoors[it.commentId] = true
      }
    })

    let attentionAll = await db.all(`select * from attention`)
    let attention = {}
    attentionAll.map(it => {
      if (it.userName == cookieUser) {
        attention[it.qusId] = true
      }
    })
    let poorAll = await db.all(`select * from poorPost`)
    let poors = {}
    poorAll.map(it => {
      if (it.userName == cookieUser) {
        poors[it.qusId] = true
      }
    })

    // 收藏 
    let collectQues = await db.all(`SELECT
          collects.collectId,
          collects.type,
          posts.postId,
          posts.title,
          posts.content,
          posts.qusLike,
          users.sign,
          users.avatar,
          users.sex,
          users.name,
          users.userId,
          posts.poor,
          posts.status,
          collects.createdAt,
          posts.answerCount,
          posts.posterId
          FROM
          collects
          INNER JOIN posts ON collects.collectId = posts.postId
          INNER JOIN users ON posts.posterId = users.userId
          WHERE collects.userId=? AND collects.type=?`, [id, 'question'])
    // res.json({ collectQues })
    // } else if (body.type === 'comment') {
    let collectComment = await db.all(`SELECT
          collects.collectId,
          comments.commentId,
          collects.createdAt as likeAt,
          collects.type,
          users.name,
          users.userId,
          users.avatar,
          users.sign,
          users.sex,
          comments.postId,
          comments.content,
          comments.createdAt,
          comments."like",
          comments.poor,
          comments.status,
          comments.ansComments,
          posts.title,
          comments.commenterId
          FROM
          collects
          INNER JOIN comments ON collects.collectId = comments.commentId
          INNER JOIN users ON comments.commenterId = users.userId
          INNER JOIN posts ON comments.postId = posts.postId
          WHERE
          collects.userId=? AND collects.type=?`, [id, 'comment'])

    let myCollectQues = await db.all(`SELECT * from collects where userName=? and type='question'`, [cookieUser])
    let myCollectcomm = await db.all(`SELECT * from collects where userName=? and type='comment'`, [cookieUser])
    collectQues.map(it => it.style = 'collect')
    collectComment.map(it => it.style = 'collect')
    let collect_quesActive = {}
    let collect_commActive = {}
    myCollectQues.forEach(it => collect_quesActive[it.collectId] = true)
    myCollectcomm.forEach(it => collect_commActive[it.collectId] = true)

    //喜欢

    let myFavoriteQues = await db.all(`SELECT * from favorite where userName=? and type='question'`, [cookieUser])
    let favoriteQues = {}
    myFavoriteQues.forEach(it => favoriteQues[it.favoriteId] = true)


    let myFavoritecomm = await db.all(`SELECT * from favorite where userName=? and type='comment'`, [cookieUser])
    let favoriteComment = {}
    myFavoritecomm.forEach(it => favoriteComment[it.favoriteId] = true)

    res.json({ posts, userInfo, attentionDynamic, likeDynamic, postDynamic, commentDynamic, likes, commentPoors, attention, poors, cookieUser, collectQues, collectComment, collect_quesActive, collect_commActive, favoriteQues, favoriteComment })
  })

app.route('/api/ansComment/:id')
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let id = req.params.id
    let ansCommentList = await db.all(`SELECT
      ansComment.createdAt,
      ansComment."like",
      ansComment.poor,
      ansComment.status,
      ansComment.content,
      ansComment.endComment,
      ansComment.ansCommentId,
      ansComment.commentId,
      users.name,
      users.userId,
      users.avatar
      FROM
      ansComment
      INNER JOIN users ON ansComment.ansCommenterId = users.userId
      where ansComment.commentId=?
      ORDER BY
      ansComment."like"- ansComment.poor DESC, ansComment.createdAt DESC
      `, [id])
    let myAnsCommentLike = await db.all(`select  * from  ansCommentLike where userName=?`, [cookieUser])
    let myLikeAnsComment = {}
    myAnsCommentLike.forEach(it => myLikeAnsComment[it.ansCommentId] = true)
    let myAnsCommentPoor = await db.all(`select  * from  ansCommentPoor where userName=?`, [cookieUser])
    let myPoorAnsComment = {}
    myAnsCommentPoor.forEach(it => myPoorAnsComment[it.ansCommentId] = true)
    res.json({ ansCommentList, myLikeAnsComment, myPoorAnsComment, cookieUser })
  })
  .post(async (req, res, next) => {
    let body = req.body
    let id = req.params.id
    let cookieUser = req.signedCookies.user
    if (cookieUser === undefined) {
      res.status(401)
      res.end('未登录')
    }

    let commenter = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
    let ansComments = await db.get(`SELECT * FROM ansComment ORDER BY ansCommentId DESC`)
    await db.run(`INSERT INTO ansComment VALUES(?,?,?,?,?,?,?,?,?,?)`, [ansComments.ansCommentId + 1, commenter.userId, commenter.name, id, body.content, Date.now(), 0, 0, 'normal', 0])

    let comment = await db.get(`SELECT * FROM comments WHERE commentId=?`, [id])

    await db.run(`update comments set ansComments=? where commentId=?`, [comment.ansComments + 1, id])

    let newAnsCommentList = await db.all(`SELECT
    ansComment.createdAt,
    ansComment."like",
    ansComment.poor,
    ansComment.status,
    ansComment.content,
    ansComment.endComment,
    ansComment.ansCommentId,
    ansComment.commentId,
    users.name,
    users.userId,
    users.avatar
    FROM
    ansComment
    INNER JOIN users ON ansComment.ansCommenterId = users.userId
    where ansComment.commentId=?
    ORDER BY
    ansComment."like"- ansComment.poor DESC, ansComment.createdAt DESC
    `, [id])
    res.json({ newAnsCommentList })
  })

app.route('/api/endComment/:id')
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let id = req.params.id
    let endCommentList = await db.all(`SELECT
      endComment.endCommentId,
      endComment.content,
      endComment.createdAt,
      endComment."like",
      endComment.status,
      endComment.targetUserId,
      endComment.targetName,
      users.name,
      users.userId,
      users.avatar,
      endComment.poor,
      endComment.ansCommentId
      FROM
      endComment
      INNER JOIN users ON endComment.endCommenterId = users.userId
      WHERE
      endComment.ansCommentId = ?
      ORDER BY
      endComment.createdAt ASC`, [id])
    let myEndCommentLike = await db.all(`select  * from  endCommentLike where userName=?`, [cookieUser])
    let myLikeEndComment = {}
    myEndCommentLike.forEach(it => myLikeEndComment[it.endCommentId] = true)
    let myEndCommentPoor = await db.all(`select  * from  endCommentPoor where userName=?`, [cookieUser])
    let myPoorEndComment = {}
    myEndCommentPoor.forEach(it => myPoorEndComment[it.endCommentId] = true)
    res.json({ endCommentList, myLikeEndComment, myPoorEndComment, cookieUser })
  })
  .post(async (req, res, next) => {
    let body = req.body
    let id = req.params.id
    let cookieUser = req.signedCookies.user
    if (cookieUser === undefined) {
      res.status(401)
      res.end('未登录')
    }
    let targetUser = await db.get(`select * from users where userId=?`, body.targetUserId)
    let commenter = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
    let endComment = await db.get(`SELECT * FROM endComment ORDER BY endCommentId DESC`)
    await db.run(`INSERT INTO endComment VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, [endComment.endCommentId + 1, commenter.userId, commenter.name, id, targetUser.userId, targetUser.name, body.commentId, body.content, 0, 0, 'normal', Date.now()])
    let ansComment = await db.get(`SELECT * FROM ansComment where ansCommentId=?`, [id])
    await db.run(`update ansComment set endComment=? where ansCommentId=?`, [ansComment.endComment + 1, id])
    let newEndCommentList = await db.all(`SELECT
        endComment.endCommentId,
        endComment.content,
        endComment.createdAt,
        endComment."like",
        endComment.status,
        endComment.targetUserId,
        endComment.targetName,
        users.name,
        users.userId,
        users.avatar,
        endComment.poor,
        endComment.ansCommentId
        FROM
        endComment
        INNER JOIN users ON endComment.endCommenterId = users.userId
        WHERE
        endComment.ansCommentId = ?
        ORDER BY
        endComment.createdAt ASC`, [id])
    res.json({ newEndCommentList })
  })

//检测登陆状态
app.use((req, res, next) => {
  let cookieUser = req.signedCookies.user
  if (cookieUser === undefined) {
    console.log('未登录')
    res.status(401)
    res.end('未登录')
  } else {
    next()
  }
})

//邀请
app.get('/api/invite/:id', async (req, res, next) => {
  let id = req.params.id
  let cookieUser = req.signedCookies.user
  let inviteList = await db.all(`select * from invite where userName=? and postId=?`, [cookieUser, id])
  res.json({ inviteList })
})
app.post('/api/clear-invited', async (req, res, next) => {
  let cookieUser = req.signedCookies.user
  await db.run(`update invite set status=? where targetName=?`, ['view', cookieUser])
  await db.run(`update cares set status=? where careName=?`, ['view', cookieUser])
  await db.run(`update commentLike set status=? where commenterName=?`, ['view', cookieUser])
  let invitedList = await db.all(`select * from invite where targetName=? order by createdAt DESC`, [cookieUser])
  let byCareList = await db.all(`SELECT
  users.name,
  users.userId,
  users.sign,
  users.avatar,
  cares.status
  FROM
  cares
  INNER JOIN users ON cares.userId = users.userId
  WHERE
  cares.careName = ?
  ORDER BY
  cares.createdAt DESC`, [cookieUser])

  let byCommentLike = await db.all(`SELECT
  comments.content,
  commentLike.createdAt,
  commentLike.status,
  commentLike.userId,
  commentLike.userName,
  commentLike.commentId,
  comments.postId,
  comments.commenterName,
  posts.postId,
  posts.title
  FROM
  comments
  INNER JOIN commentLike ON comments.commentId = commentLike.commentId
  INNER JOIN posts ON comments.postId = posts.postId
  WHERE
  comments.commenterName = ?
  ORDER BY
  commentLike.createdAt DESC`, [cookieUser])
  res.json({ invitedList, byCareList, byCommentLike })
})
app.route('/api/invite')
  //b被邀请/关注/点赞
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let invitedList = await db.all(`select * from invite where targetName=? order by createdAt DESC`, [cookieUser])
    let byCareList = await db.all(`SELECT
    users.name,
    users.userId,
    users.sign,
    users.avatar,
    cares.status
    FROM
    cares
    INNER JOIN users ON cares.userId = users.userId
    WHERE
    cares.careName = ?
    ORDER BY
    cares.createdAt DESC`, [cookieUser])

    let byCommentLike = await db.all(`SELECT
    comments.content,
    commentLike.createdAt,
    commentLike.status,
    commentLike.userId,
    commentLike.userName,
    commentLike.commentId,
    comments.postId,
    comments.commenterName,
    posts.postId,
    posts.title
    FROM
    comments
    INNER JOIN commentLike ON comments.commentId = commentLike.commentId
    INNER JOIN posts ON comments.postId = posts.postId
    WHERE
    comments.commenterName = ?
    ORDER BY
    commentLike.createdAt DESC`, [cookieUser])
    res.json({ invitedList, byCareList, byCommentLike })
  })
  .post(async (req, res, next) => {
    let { postId, targetId, targetName, type } = req.body
    let post = await db.get(`select * from posts where postId=?`, [postId])
    let cookieUser = req.signedCookies.user
    let user = await db.get(`select * from users where name=?`, [cookieUser])
    if (type === 'active') {
      await db.run(`INSERT INTO invite VALUES(?,?,?,?,?,?,?,?)`, [user.userId, cookieUser, postId, post.title, targetId, targetName, Date.now(), 'normal'])
    } else {
      await db.run(`delete from invite where postId=? and targetId=?`, [postId, targetId])
    }

    let newInvites = await db.all(`select * from invite where userName=? and postId=?`, [cookieUser, postId])
    res.json({ newInvites })
  })
//聊天
app.get('/api/chat-list', async (req, res, next) => {
  let cookieUser = req.signedCookies.user
  let chatWithMe = await db.all(`select * from chat where targetName=? order by createdAt DESC`, [cookieUser])
  let myChat = await db.all(`select * from chat where userName=? order by createdAt DESC`, [cookieUser])

  let chatObj = {}
  chatWithMe.forEach(it => {
    if (!chatObj[it.userId]) {
      chatObj[it.userId] = [it]
    } else {
      chatObj[it.userId].push(it)
    }
  })
  myChat.forEach(it => {
    if (!chatObj[it.targetId]) {
      chatObj[it.targetId] = [it]
    } else {
      chatObj[it.targetId].push(it)
    }
  })
  for (let key in chatObj) {
    chatObj[key] = chatObj[key].sort((a, b) => b.createdAt - a.createdAt)
  }
  let chatList = Object.values(chatObj).sort((a, b) => a[0].createdAt - b[0].createdAt)
  res.json({ chatList })
})
app.post('/api/userInfo-serach', async (req, res, next) => {
  let id = req.body.id
  // let cookieUser = req.signedCookies.user
  let userInfo = await db.get(`select * from users where userId=?`, [id])
  res.json({ userInfo })
})
app.post('/api/clear-chat', async (req, res, next) => {
  let cookieUser = req.signedCookies.user
  let body = req.body
  await db.run(`update chat set status=? where targetName=? and userName=?`, ['view', cookieUser, body.targetName])

  res.json({})
})
//回答的评论点赞/踩
app.post('/api/ansCommentLike/:id', async (req, res, next) => {
  let body = req.body
  let id = req.params.id
  let cookieUser = req.signedCookies.user
  let userInfo = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
  let ansComment = await db.get(`SELECT * FROM ansComment WHERE ansCommentId=?`, id)
  // let commenter = await db.get(`SELECT * FROM users WHERE userId=?`, comment.commenterId)
  if (body.type == 'active') {
    if (body.style == 'poor') {
      await db.run(`INSERT INTO ansCommentPoor VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, id, Date.now()])
      await db.run(`UPDATE ansComment SET poor=? WHERE ansCommentId=?`, [ansComment.poor + 1, id])
    } else {
      await db.run(`INSERT INTO ansCommentLike VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, id, Date.now()])
      await db.run(`UPDATE ansComment SET like=? WHERE ansCommentId=?`, [ansComment.like + 1, id])
    }
    res.json('已关注')
  } else {
    if (body.style == 'poor') {
      await db.run(`DELETE FROM ansCommentPoor WHERE userId=? AND ansCommentId=?`, [userInfo.userId, id])

      await db.run(`UPDATE ansComment SET poor=? WHERE ansCommentId=?`, [ansComment.poor - 1, id])
    } else {
      await db.run(`DELETE FROM ansCommentLike WHERE userId=? AND ansCommentId=?`, [userInfo.userId, id])

      await db.run(`UPDATE ansComment SET like=? WHERE ansCommentId=?`, [ansComment.like - 1, id])

    }

    res.json('取消关注')
  }
})
//楼中楼 点赞/踩
app.post('/api/endCommentLike/:id', async (req, res, next) => {
  let body = req.body
  let id = req.params.id
  let cookieUser = req.signedCookies.user
  let userInfo = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
  let endComment = await db.get(`SELECT * FROM endComment WHERE endCommentId=?`, id)
  // let commenter = await db.get(`SELECT * FROM users WHERE userId=?`, comment.commenterId)
  if (body.type == 'active') {
    if (body.style == 'poor') {
      await db.run(`INSERT INTO endCommentPoor VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, id, Date.now()])
      await db.run(`UPDATE endComment SET poor=? WHERE endCommentId=?`, [endComment.poor + 1, id])
    } else {
      await db.run(`INSERT INTO endCommentLike VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, id, Date.now()])
      await db.run(`UPDATE endComment SET like=? WHERE endCommentId=?`, [endComment.like + 1, id])
    }
    res.json('已关注')
  } else {
    if (body.style == 'poor') {
      await db.run(`DELETE FROM endCommentPoor WHERE userId=? AND endCommentId=?`, [userInfo.userId, id])

      await db.run(`UPDATE endComment SET poor=? WHERE endCommentId=?`, [endComment.poor - 1, id])
    } else {
      await db.run(`DELETE FROM endCommentLike WHERE userId=? AND endCommentId=?`, [userInfo.userId, id])

      await db.run(`UPDATE endComment SET like=? WHERE endCommentId=?`, [endComment.like - 1, id])

    }

    res.json('取消关注')
  }
})
//更换头像
app.route('/api/user-avatar/')
  .post(uploader.single('avatar'), async (req, res, next) => {
    let file = req.file
    let cookieUser = req.signedCookies.user
    let targetName = file.path + '-' + file.originalname
    await fs.promises.rename(file.path, targetName)
    let avatarUrl = '/uploads/' + path.basename(targetName)
    console.log(avatarUrl)
    await db.run(`update users set avatar=? where name=?`, [avatarUrl, cookieUser])
    res.json(avatarUrl)
  })

//修改签名
app.post('/api/sign-edit/', async (req, res, next) => {
  let body = req.body
  let cookieUser = req.signedCookies.user
  console.log(body)
  await db.run(`update users set sign=? where name=?`, [body.user_sign, cookieUser])
  res.end('')
})


function simpleCount(num) {
  num = num * 1
  if (num <= 1000) return num + 1
  else return (num + 1) % 1000 + 'k'
}
//删帖 / 评论
app.post('/api/deletePost/', async (req, res, next) => {
  let body = req.body
  let cookieUser = req.signedCookies.user
  let user = await db.get(`SELECT * FROM users  WHERE name=?`, [cookieUser])
  if (body.type === 'post') {
    await db.run(`UPDATE posts set status=? WHERE postId=?`, ['delete', body.postId])
    let posts = await db.all(`SELECT * FROM posts LEFT JOIN users ON posts.posterId=userId ORDER BY posts.postId DESC`)
    let postNormal = posts.filter(it => {
      it.status === 'normal'
    })
    await db.run(`update users set postCount=? where name=?`, [user.postCount - 1, cookieUser])

    res.json({ posts, postNormal })
  } else {
    await db.run(`UPDATE comments set status=? WHERE commentId=?`, ['delete', body.postId])
    let comment = await db.get(`select * from comments WHERE commentId=?`, [body.postId])
    let post = db.get(`SELECT * FROM posts WHERE postId=?`, [body.id])
    let comments = await db.all(`SELECT * FROM comments LEFT JOIN users ON comments.commenterId=userId where postId=? ORDER BY comments.createdAt DESC`, [body.id])
    await db.run(`update users set commentCount=? where name=?`, [user.commentCount - 1, cookieUser])
    await db.run(`update users set agree=? where name=?`, [user.agree - comment.like, cookieUser])
    await db.run(`UPDATE posts set answerCount=? WHERE postId=?`, [post.answerCount - 1, body.postId])
    res.json({ comments, })
  }
})

app.post('/api/attention/', async (req, res, next) => {
  let body = req.body
  let cookieUser = req.signedCookies.user
  let userInfo = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
  // let 
  let post = await db.get(`SELECT * FROM posts WHERE postId=?`, body.qusId) // 当前帖子信息
  // console.log(post)
  console.log(body)
  if (body.type == 'attention') {
    if (body.style == 'poor') {
      await db.run(`INSERT INTO poorPost VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, body.qusId, body.createdAt])
      await db.run(`UPDATE posts SET poor=? WHERE postId=?`, [post.poor + 1, body.qusId])
    } else {
      await db.run(`INSERT INTO attention VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, body.qusId, body.createdAt])
      await db.run(`UPDATE posts SET qusLike=? WHERE postId=?`, [post.qusLike + 1, body.qusId])
    }
  } else if (body.type == 'revoke') {
    if (body.style == 'poor') {
      await db.run(`DELETE FROM poorPost WHERE userId=? AND qusId=?`, [userInfo.userId, body.qusId])

      await db.run(`UPDATE posts SET poor=? WHERE postId=?`, [post.poor - 1, body.qusId])
    } else {
      await db.run(`DELETE FROM attention WHERE userId=? AND qusId=?`, [userInfo.userId, body.qusId])

      await db.run(`UPDATE posts SET qusLike=? WHERE postId=?`, [post.qusLike - 1, body.qusId])
    }
  }
  let attentions = await db.all(`SELECT * FROM attention WHERE userName=?`, cookieUser)
  let attention = {}
  attentions.forEach(it => {
    attention[it.postId] = true
  })
  let postPoors = await db.all(`SELECT * FROM poorPost WHERE userName=?`, cookieUser)
  let poors = {}
  postPoors.forEach(it => {
    poors[it.postId] = true
  })
  res.json({ attention, poors })
})

app.post('/api/likeComment/', async (req, res, next) => {
  let body = req.body
  let cookieUser = req.signedCookies.user
  let userInfo = await db.get(`SELECT * FROM users WHERE name=?`, cookieUser)
  let comment = await db.get(`SELECT * FROM comments WHERE commentId=?`, body.commentId)
  let commenter = await db.get(`SELECT * FROM users WHERE userId=?`, comment.commenterId)
  if (body.type == 'active') {
    if (body.style == 'poor') {
      await db.run(`INSERT INTO commentPoor VALUES(?,?,?,?)`, [userInfo.userId, userInfo.name, body.commentId, body.createdAt])
      await db.run(`UPDATE comments SET poor=? WHERE commentId=?`, [comment.poor + 1, body.commentId])
    } else {
      await db.run(`INSERT INTO commentLike VALUES(?,?,?,?,?,?)`, [userInfo.userId, userInfo.name, body.commentId, body.createdAt, 'normal', comment.commenterName])
      await db.run(`UPDATE comments SET like=? WHERE commentId=?`, [comment.like + 1, body.commentId])
      await db.run(`UPDATE users SET agree=? WHERE userId=?`, [commenter.agree + 1, comment.commenterId])
    }
    res.json('已关注')
  } else {
    if (body.style == 'poor') {
      await db.run(`DELETE FROM commentPoor WHERE userId=? AND commentId=?`, [userInfo.userId, body.commentId])

      await db.run(`UPDATE comments SET poor=? WHERE commentId=?`, [comment.poor - 1, body.commentId])
    } else {
      await db.run(`DELETE FROM commentLike WHERE userId=? AND commentId=?`, [userInfo.userId, body.commentId])

      await db.run(`UPDATE comments SET like=? WHERE commentId=?`, [comment.like - 1, body.commentId])
      await db.run(`UPDATE users SET agree=? WHERE userId=?`, [commenter.agree - 1, comment.commenterId])
    }

    res.json('取消关注')
  }
})

// app.post('//')


//收藏
app.route('/api/collect/')
  .get(async (req, res, next) => {

  })
  .post(async (req, res, next) => {
    let body = req.body
    let cookieUser = req.signedCookies.user
    if (!cookieUser) {
      res.sendStatus(401)
      return
    }
    console.log(cookieUser)
    let id = body.id
    let user = await db.get(`select * from users where name=?`, [cookieUser])
    let collecter = await db.get(`select * from users where userId=?`, [id])
    if (body.type === 'collect') {
      if (body.style === 'question') {
        await db.run(`insert into collects values(?,?,?,?,?)`, [user.userId, cookieUser, body.collectId, Date.now(), 'question'])

      } else if (body.style === 'comment') {
        await db.run(`insert into collects values(?,?,?,?,?)`, [user.userId, cookieUser, body.collectId, Date.now(), 'comment'])
      }
      await db.run(`update users set collect=? where userId=?`, [collecter.collect + 1, id])
    } else if (body.type === 'revoke') {
      await db.run(`delete from collects where collectId=?`, [body.collectId])
      await db.run(`update users set collect=? where userId=?`, [collecter.collect - 1, id])
    }
    let userCollects = await db.get(`select * from collects where userName=?`, [cookieUser])
    res.json({ userCollects })
  })

app.route('/api/favorite/')
  .get(async (req, res, next) => {

  })
  .post(async (req, res, next) => {
    let body = req.body
    let cookieUser = req.signedCookies.user
    let id = body.id
    let user = await db.get(`select * from users where name=?`, [cookieUser])
    let favoriter = await db.get(`select * from users where userId=?`, [id])
    if (body.type === 'favorite') {
      if (body.style === 'question') {
        await db.run(`insert into favorite values(?,?,?,?,?)`, [user.userId, cookieUser, body.favoriteId, Date.now(), 'question'])

      } else if (body.style === 'comment') {
        await db.run(`insert into favorite values(?,?,?,?,?)`, [user.userId, cookieUser, body.favoriteId, Date.now(), 'comment'])
      }
      await db.run(`update users set favorite=? where userId=?`, [favoriter.favorite + 1, id])
    } else if (body.type === 'revoke') {
      await db.run(`delete from favorite where favoriteId=?`, [body.favoriteId])
      await db.run(`update users set favorite=? where userId=?`, [favoriter.favorite - 1, id])
    }
    let userFavorite = await db.get(`select * from favorite where userName=?`, [cookieUser])
    res.json({ userFavorite })
  })


app.route('/api/edit-userInfo')
  .post(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let body = req.body
    if (body.type === 'sex') {
      await db.run(`UPDATE users SET sex=? WHERE name=?`, [body.sex, cookieUser])
    }
    if (body.type === 'sign') {
      await db.run(`UPDATE users SET sign=? WHERE name=?`, [body.sign, cookieUser])
    }
    if (body.type === 'address') {
      await db.run(`UPDATE users SET address=? WHERE name=?`, [body.address, cookieUser])
    }
    if (body.type === 'industry') {
      await db.run(`UPDATE users SET industry=? WHERE name=?`, [body.industry, cookieUser])
    }
    if (body.type === 'birthday') {
      await db.run(`UPDATE users SET birthday=? WHERE name=?`, [body.birthday, cookieUser])
    }
    if (body.type === 'introduction') {
      await db.run(`UPDATE users SET introduction=? WHERE name=?`, [body.introduction, cookieUser])
    }
    if (body.type === 'sociality') {
      await db.run(`UPDATE users SET sociality=? WHERE name=?`, [body.sociality, cookieUser])
    }
    res.sendStatus(200)
  })

app.route('/api/care')
  .get(async (req, res, next) => {
    let cookieUser = req.signedCookies.user
    let myCares = await db.all(`SELECT
    cares.createdAt,
    cares.careName,
    users.name,
    users.avatar,
    users.sign,
    users.industry,
    cares.careId
    FROM
    cares
    INNER JOIN users ON cares.careId = users.userId
    WHERE
    cares.userName=?`, [cookieUser])
    res.json({ myCares })
  })
  .post(async (req, res, next) => {
    let body = req.body
    let cookieUser = req.signedCookies.user
    let careId = body.careId
    let user = await db.get(`SELECT * FROM users WHERE name=?`, [cookieUser])
    let receive = await db.get(`SELECT * FROM users WHERE userId=? `, [careId])
    // console.log(receive)
    if (body.type === 'toCare') {
      await db.run(`INSERT INTO cares VALUES(?,?,?,?,?,?)`, [user.userId, cookieUser, careId, receive.name, Date.now(), 'normal'])
      await db.run(`update users set fans=? where userId=?`, [receive.fans + 1, careId])
      await db.run(`update users set care=? where name=?`, [user.care + 1, cookieUser])
    } else {
      await db.run(`DELETE FROM cares WHERE careId=? AND userId=?`, [careId, user.userId])
      await db.run(`update users set fans=? where userId=?`, [receive.fans - 1, careId])
      await db.run(`update users set care=? where name=?`, [user.care - 1, cookieUser])
    }
    let myCares = await db.all(`SELECT
    cares.createdAt,
    cares.careName,
    users.name,
    users.avatar,
    users.sign,
    users.industry,
    cares.careId
    FROM
    cares
    INNER JOIN users ON cares.careId = users.userId
    WHERE
    cares.userId=? `, [user.userId])

    res.json({ myCares })
  })

app.use((err, req, res, next) => {
  console.log(err)
  res.status(err.status || 500)
  res.send('error 请再试一次。')
})


app.listen(port, () => {
  console.log('server is listening...')
})
