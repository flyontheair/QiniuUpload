$(function () {
    var vm = new Vue({
        el: "#app",
        data: function () {
            return {
                uploadBoxVisible:false,
                title:"上传测试"
            }
        },
        methods: {
            closeUploadBox: function () {
                this.uploadBoxVisible = false;
            }

        }
    });
});