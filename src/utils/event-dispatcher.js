import {assign} from 'lodash';

export default ()=>({
  _listeners:null,
  addEventListener(event,callback){
    if(this._listeners==null) this._listeners=[];

    this._listeners.push({event,callback});
  },
  dispatchEvent(event,data={}){
    if(this._listeners==null) return;

    this._listeners
      .filter(v=>v.event==event)
      .forEach(
        v=>v.callback.call(this,assign({
          target:this,
          currentTarget:this,
        },data))
      )
  },
  removeEventListener(event,callback){
    if(this._listeners==null) return;

    this._listeners=this._listeners.filter(v=>v.event!=event || v.callback!=callback);
  },
});
