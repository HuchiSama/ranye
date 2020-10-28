import React, { Component, useState, useRef, useEffect } from 'react';
import E from 'wangeditor'   // 引用

export default function Editor(props) {
  let { setEditValue } = props
  // let [state, setState] = useState()
  let editorEl = useRef()
  let submit = useRef()
  let [editor, setEditor] = useState({})
  editor.txt = editor.txt || {}
  useEffect(() => {
    const elem = editorEl.current
    const sub = submit.current
    const editor = new E(elem)
    setEditor(editor)
    editor.config.placeholder = 'write something...'
    // editor.config.focus = false //是否获取焦点
    // editor.highlight = hljs
    editor.config.onchange = function (newHtml) {
      setEditValue({ html: newHtml, text: editor.txt.text() })
      // console.log(editor.txt.text())
      // console.log('change 之后最新的 html', newHtml)
    }
    editor.config.onchangeTimeout = 1000 // 修改为 500ms
    editor.config.pasteFilterStyle = true
    editor.config.uploadFileName = 'upImage' //置上传接口的文本流字段

    editor.config.uploadImgServer = '/api/edit-Image'//服务器接口地址
    editor.create()

    return () => {
      editor.destroy()
    }
  }, [])

  return (
    <div >
      <div ref={editorEl}>
      </div>
      {/* <button ref={submit} onClick={postmesg}>submit</button> */}
    </div>
  )
}
