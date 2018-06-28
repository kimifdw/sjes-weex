import Vue from 'vue';
import App from './app.vue';
import Weex from 'weex-vue-render';

Weex.init(Vue);

new Vue({
  el: '#app',
  render: h => h(App)
})