import React from 'react'

export default function Footer(props) {
  return (
    <div className={props.type === 'signup' ? 'signup-footer footer' : 'footer'}>
      <span> © 2020 知乎京 ICP 证 110745 号京 ICP 备 13052560 号 - 1京公网安备 11010802010035 号出版物经营许可证</span>
      <br />
      <span>侵权举报网上有害信息举报专区儿童色情信息举报专区违法和不良信息举报：010-82716601 </span>
    </div>
  )
}
