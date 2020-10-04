import React, { useEffect, useState, useCallback } from 'react'
import { Input, Radio, Button, DatePicker } from 'antd'
import { EditFilled } from '@ant-design/icons';
// import { Redirect } from 'react-router-dom'
import { userStore } from '../redux/redux.js'
import './signin-component.css'
import 'antd/dist/antd.css'
import axios from 'axios'
// import locale from 'antd/es/locale/zh_CN';
// import Footer from './footer'
// import Sign from './sign'

export default function () {
  let [state, setState] = useState(userStore.getState())
  let { userInfo = {} } = state
  useEffect(() => {
    let uns = userStore.subscribe(() => setState(userStore.getState()))
    return () => uns()
  }, [])
  let editEnd = useCallback(() => {
    userStore.dispatch({
      type: 'editEnd',
      edit: false,
    })
  }, [])
  return (
    <div className="edit-container-bg">
      <div className="edit-outer">
        <form action="/api/edit-userInfo" method="post" className="edit-form">
          <ul>
            <li><h2>王司徒</h2><span style={{ fontWeight: '100' }}>* 鼠标移到用户头像即可修改头像</span><Button onClick={editEnd} type="primary">修改完成</Button></li>
            <Sex sex={userInfo.sex} />
            <Birthday birthday={userInfo.birthday} />
            <Address address={userInfo.address} />
            <Sign sign={userInfo.sign} />
            <Industry industry={userInfo.industry} />
            <Introduction introduction={userInfo.introduction} />
            <Sociality sociality={userInfo.sociality} />
          </ul>
        </form>
      </div>
    </div>
  )
}

function Sex(props) {
  let [state, setState] = useState(false)
  let [sex, setSex] = useState(props.sex)
  let editSex = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'sex',
      sex,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        sex,
      })
      setState(false)
    })
  }, [sex])
  return (
    <li className="edit-sex">
      <span>性别</span>
      {state
        ? <div>
          <Radio.Group value={sex} onChange={() => sex === 'man' ? setSex('female') : setSex('man')}>
            <Radio value={'man'} checked={props.sex === 'man'}>男</Radio>
            <Radio value={'female'} checked={props.sex === 'female'}>女</Radio>
          </Radio.Group>
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => setState(false)}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{sex === 'man' ? '男' : '女'}</span><EditFilled onClick={editSex} style={{ color: '#40a9ff' }} /></div>
      }
    </li>
  )
}

function Sign(props) {
  let [state, setState] = useState(false)
  let [sign, setSign] = useState(props.sign)
  let [limit, setLimit] = useState(false)
  let editSign = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'sign',
      sign,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        sign,
      })
      setState(false)
    })
  }, [sign])

  let editSignInput = useCallback((e) => {
    if (e.target.value.length > 30) {
      setLimit(true)
      return
    } else {
      setLimit(false)
      setSign(e.target.value)
    }
  }, [])
  return (
    <li className="edit-sign">
      <span>一句话介绍</span>
      {state
        ? <div>
          <Input value={sign} onInput={editSignInput} style={limit ? { borderColor: 'red' } : {}} />
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => { setState(false); setSign(props.sign) }}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{sign}</span><EditFilled onClick={editSign} style={{ color: '#40a9ff' }} /></div>
      }
    </li >
  )
}

function Address(props) {
  let [state, setState] = useState(false)
  let [address, setAddress] = useState(props.address)
  let [limit, setLimit] = useState(false)
  let editaddress = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'address',
      address,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        address,
      })
      setState(false)
    })
  }, [address])

  let editAddressIput = useCallback((e) => {
    if (e.target.value.length > 10) {
      setLimit(true)
      return
    } else {
      setLimit(false)
      setAddress(e.target.value)
    }
  }, [])
  return (
    <li className="edit-address">
      <span>现居地</span>
      {state
        ? <div>
          <Input value={address} onInput={editAddressIput} style={limit ? { borderColor: 'red' } : {}} />
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => { setState(false); setAddress(props.address) }}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{props.address}</span><EditFilled onClick={editaddress} style={{ color: '#40a9ff' }} /></div>
      }
    </li >
  )
}

function Birthday(props) {
  let [state, setState] = useState(false)
  let [birthday, setBirthday] = useState(props.birthday)
  let editState = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'birthday',
      birthday,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        birthday,
      })
      setState(false)
    })
  }, [birthday])

  let editBirthday = useCallback((e) => {
    let date = document.querySelector('.edit-birthday input')
    setBirthday(date.value)
  }, [])
  return (
    <li className="edit-birthday">
      <span>生日</span>
      {state
        ? <div>
          <DatePicker onChange={editBirthday} />
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => { setState(false); setBirthday(props.birthday) }}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{birthday.slice(5)}</span><EditFilled onClick={editState} style={{ color: '#40a9ff' }} /></div>
      }
    </li >
  )
}

function Industry(props) {
  let [state, setState] = useState(false)
  let [industry, setIndustry] = useState(props.industry)
  let [limit, setLimit] = useState(false)
  let editIndustry = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'industry',
      industry,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        industry,
      })
      setState(false)
    })
  }, [industry])

  let editIndustryIput = useCallback((e) => {
    if (e.target.value.length > 10) {
      setLimit(true)
      return
    } else {
      setLimit(false)
      setIndustry(e.target.value)
    }
  }, [])
  return (
    <li className="edit-industry">
      <span>所在行业</span>
      {state
        ? <div>
          <Input value={industry} onInput={editIndustryIput} style={limit ? { borderColor: 'red' } : {}} />
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => { setState(false); setIndustry(props.industry) }}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{props.industry}</span><EditFilled onClick={editIndustry} style={{ color: '#40a9ff' }} /></div>
      }
    </li >
  )
}


const { TextArea } = Input;
function Introduction(props) {
  let [state, setState] = useState(false)
  let [summary, setSummary] = useState(props.introduction)
  let [limit, setLimit] = useState(false)
  let editSummary = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'introduction',
      introduction: summary,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        introduction: summary,
      })
      setState(false)
    })
  }, [summary])

  let editIntroduction = useCallback((e) => {
    if (e.target.value.length > 150) {
      setLimit(true)
      return
    } else {
      setLimit(false)
      setSummary(e.target.value)
    }
  }, [])
  return (
    <li className="edit-introduction">
      <span>个人简介</span>
      {state
        ? <div>
          <TextArea value={summary} onInput={editIntroduction} style={limit ? { borderColor: 'red' } : {}} />
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => { setState(false); setSummary(props.introduction) }}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{summary}</span><EditFilled onClick={editSummary} style={{ color: '#40a9ff' }} /></div>
      }
    </li >
  )
}

function Sociality(props) {
  let [state, setState] = useState(false)
  let [sociality, setSociality] = useState(props.sociality)
  let [limit, setLimit] = useState(false)
  let editSociality = useCallback(() => {
    setState(!state)
  }, [state])

  let saveEdit = useCallback(() => {
    axios.post('/api/edit-userInfo', {
      type: 'sociality',
      sociality,
    }).then(res => {
      userStore.dispatch({
        type: 'editUserInfo',
        sociality,
      })
      setState(false)
    })
  }, [sociality])

  let editSocialityIput = useCallback((e) => {
    if (e.target.value.length > 50) {
      setLimit(true)
      return
    } else {
      setLimit(false)
      setSociality(e.target.value)
    }
  }, [])
  return (
    <li className="edit-industry">
      <span>社交地址</span>
      {state
        ? <div>
          <Input value={sociality} onInput={editSocialityIput} style={limit ? { borderColor: 'red' } : {}} />
          <div className="saveEdit">
            <Button size="small" type="primary" onClick={saveEdit}>保存</Button>
            <Button size="small" onClick={() => { setState(false); setSociality(props.sociality) }}>取消</Button>
          </div>
        </div>

        : <div className="saveEdit"><span>{sociality}</span><EditFilled onClick={editSociality} style={{ color: '#40a9ff' }} /></div>
      }
    </li >
  )
}
