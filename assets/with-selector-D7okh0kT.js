import{D as I}from"./index-BuVLeSXu.js";function M(e){var a,o,t="";if(typeof e=="string"||typeof e=="number")t+=e;else if(typeof e=="object")if(Array.isArray(e)){var d=e.length;for(a=0;a<d;a++)e[a]&&(o=M(e[a]))&&(t&&(t+=" "),t+=o)}else for(o in e)e[o]&&(t&&(t+=" "),t+=o);return t}function k(){for(var e,a,o=0,t="",d=arguments.length;o<d;o++)(e=arguments[o])&&(a=M(e))&&(t&&(t+=" "),t+=a);return t}var w={exports:{}},R={},g={exports:{}},j={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var D;function U(){if(D)return j;D=1;var e=I();function a(r,u){return r===u&&(r!==0||1/r===1/u)||r!==r&&u!==u}var o=typeof Object.is=="function"?Object.is:a,t=e.useState,d=e.useEffect,y=e.useLayoutEffect,E=e.useDebugValue;function b(r,u){var i=u(),f=t({inst:{value:i,getSnapshot:u}}),n=f[0].inst,v=f[1];return y(function(){n.value=i,n.getSnapshot=u,m(n)&&v({inst:n})},[r,i,u]),d(function(){return m(n)&&v({inst:n}),r(function(){m(n)&&v({inst:n})})},[r]),E(i),i}function m(r){var u=r.getSnapshot;r=r.value;try{var i=u();return!o(r,i)}catch{return!0}}function c(r,u){return u()}var s=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?c:b;return j.useSyncExternalStore=e.useSyncExternalStore!==void 0?e.useSyncExternalStore:s,j}var W;function A(){return W||(W=1,g.exports=U()),g.exports}/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var O;function G(){if(O)return R;O=1;var e=I(),a=A();function o(c,s){return c===s&&(c!==0||1/c===1/s)||c!==c&&s!==s}var t=typeof Object.is=="function"?Object.is:o,d=a.useSyncExternalStore,y=e.useRef,E=e.useEffect,b=e.useMemo,m=e.useDebugValue;return R.useSyncExternalStoreWithSelector=function(c,s,r,u,i){var f=y(null);if(f.current===null){var n={hasValue:!1,value:null};f.current=n}else n=f.current;f=b(function(){function x(l){if(!V){if(V=!0,h=l,l=u(l),i!==void 0&&n.hasValue){var S=n.value;if(i(S,l))return p=S}return p=l}if(S=p,t(h,l))return S;var q=u(l);return i!==void 0&&i(S,q)?(h=l,S):(h=l,p=q)}var V=!1,h,p,_=r===void 0?null:r;return[function(){return x(s())},_===null?void 0:function(){return x(_())}]},[s,r,u,i]);var v=d(c,f[0],f[1]);return E(function(){n.hasValue=!0,n.value=v},[v]),m(v),v},R}var z;function L(){return z||(z=1,w.exports=G()),w.exports}var C=L();export{k as c,C as w};
