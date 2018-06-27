import App from './views/home/index.vue';
import Vue from 'vue';
import Weex from 'weex-vue-render';

Weex.init(Vue);

new Vue({
  el: '#root',
  render: h => h(App)
});