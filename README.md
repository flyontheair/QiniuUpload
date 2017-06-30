# 七牛上传

> 前端使用了Vue、element-UI框架，在集成七牛jssdk的时候，自己写了上传组件，没有使用`<el-upload>`,自写UI，部分改写qiniu.js

## 上传组件放在了`component/uploadQiniu`目录下
直接文件引用到项目组件中，在index.js根据自己的需求修改就行
生产环境引用
```js
<script src="./component/uploadQiniu/plupload.full.min.js"></script>
<script src="./component/uploadQiniu/m.qiniu.min.js"></script>
```
调试可以引用
```js
<script src="./uploadQiniu/moxie.js"></script>
<script src="./uploadQiniu/m.qiniu.js"></script>
<script src="./uploadQiniu/plupload.dev.js"></script>
```
调试修改完成后，最好压缩文件再引用

更多的开发过程可以在我个人博客上查看 [博客](https://flyontheair.github.io/2017/06/30/vue-qiniu-jssdk/)。
