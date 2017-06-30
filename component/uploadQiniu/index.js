Vue.component("com-upload-qiniu", function (resolve, reject) {
    var com = {
        name: "com-upload-qiniu",
        props: {
            productId: '',
            title: {
                type: String,
                default: "上传附件"
            },
            visible: {
                type: Boolean,
                default: false
            }
        },
        data: function () {
            return {
                privateVisible: false,
                files: [],
                progress: {},
                error: {},

                uploader: null
            };
        },
        computed: {
            fileTotalCount: function () {
                return this.files.length;
            },
            fileTotalSize: function () {
                var size = this.files.reduce(function (acc, item) {
                    return acc + item.size;
                }, 0);
                return size != 0 ? (size / (1024 * 1024)).toFixed(2) : 0;
            },
            uploadCompleted: function () {
                var vm = this;
                return Object.keys(this.progress).every(function (key) {
                    return vm.progress[key] == 100
                });
            }
        },
        watch: {
            privateVisible: function (val) {
                if (!val) {
                    this.close();
                }
            },
            visible: function (val) {
                this.privateVisible = val;
            }
        },
        methods: {
            open: function () {
                this.privateVisible = true;
                this.$emit('open');
                this.$nextTick(function () {
                    //this.initWebUploader();
                    this.qiniu();
                });
            },
            close: function () {
                var vm = this;
                for (var i = 0; i < vm.files.length; i++) {
                    if (vm.files[i]) {
                        vm.uploader.removeFile(vm.files[i]);
                        vm.files.splice(i, 1);
                        i--;
                    }
                }
                this.privateVisible = false;
                this.$emit('close');
            },
            cancelFile: function (file) {
                if (!this.uploader) return;
                this.uploader.removeFile(file);
                var i;
                this.files.find(function (item, index) {
                    if (item.id == file.id) {
                        i = index;
                        return true;
                    }
                });
                //console.log(`cancel file, name=${file.name}, index=${i}`);
                if (i != undefined) {
                    this.files.splice(i, 1);
                }
            },
            cancelAll: function () {
                //全部取消，遍历
                var vm = this;
                var indexs = ",";
                this.files.find(function (item, index) {
                    if (item.percent != 100) {
                        vm.uploader.removeFile(item);
                        indexs += item.id + ",";
                    }
                });
                for (var i = 0; i < vm.files.length; i++) {
                    if (indexs.indexOf("," + vm.files[i].id + ",") >= 0) {
                        vm.files.splice(i, 1);
                        i--;
                    }
                }
            },

            //Max
            qiniu: function () {
                if (!this.$el || this.uploader) return;
                var vm = this;
                var mConfig = {
                    Image: {//key
                        typeKey: "bmp,jpeg,jpg,png,gif",//后缀名,不区分大小写,filters有性能问题，全部使用后缀名匹配类型
                        reOption: {//需要改写覆盖的otption，默认七牛,
                            'url': '',
                            'headers': {
                                'Authorization': window.localStorage.getItem('token') ? "Bearer " + window.localStorage.getItem('token') : ''
                            },
                            'file_data_name': 'BD_PRODUCT_IMG.content',//文件bucket，自有api上传需要
                            'get_new_uptoken': false
                        }
                    },
                    Doc: {
                        typeKey: "xls,xlsx,ppt,pptx,doc,docx,txt,pdf",
                        reOption: {
                            'url': '',
                            'headers': {
                                'Authorization': window.localStorage.getItem('token') ? "Bearer " + window.localStorage.getItem('token') : ''
                            },
                            'file_data_name': 'BD_PRODUCT_DOC.content',
                            'get_new_uptoken': false
                        }
                    },
                    Video: {
                        typeKey: "mkv,mp4,avi,rm,rmvb,tiff,tif",//后缀名
                        //没有reOption配置，默认七牛
                        reOption: {
                            chunk_size: '4mb'//需要分片，强制改写
                        }
                    },
                    Others: {
                        //没有typeKey，属于“Others”配置里
                        reOption: {//需要改写的otption，默认七牛
                            'url': '',
                            'headers': {
                                'Authorization': window.localStorage.getItem('token') ? "Bearer " + window.localStorage.getItem('token') : ''
                            },
                            'file_data_name': 'BD_PRODUCT_OTHER.content',
                            'get_new_uptoken': false
                        }
                    }
                };
                vm.uploader = Qiniu.uploader({
                    mConfig: mConfig,
                    runtimes: 'html5,flash,html4',
                    browse_button: 'pickfiles',//触发dom的id
                    container: 'container',
                    drop_element: 'container',//拖拽dom
                    max_file_size: '1000mb',
                    flash_swf_url: './Moxie.swf',
                    dragdrop: true,
                    chunk_size: 0,//系统默认置0即不分片，需要分片，显示声明
                    multi_selection: !(moxie.core.utils.Env.OS.toLowerCase() === "ios"),
                    uptoken_url: "/uptoken",
                    //uptoken_func: function(file,cb){//后端接口请求token，一般用这个
                    //    $.api('upload.getQiniuUploadToken',{async:false}).done(function (result) {
                    //        if($.apiResultSync(result).code==0){
                    //            cb($.apiResultSync(result).data.value);
                    //        }
                    //    }).fail(function () {
                    //        console.log('custom uptoken_func err');
                    //        cb('');
                    //    });
                    //},
                    domain: "http://7xocov.com1.z0.glb.clouddn.com/",//七牛配置domain域名
                    get_new_uptoken: true,//默认开启
                    auto_start: true,
                    log_level: 5,
                    init: {
                        'BeforeChunkUpload': function (up, file) {
                            //console.log("before chunk upload:",file.name);
                        },
                        'FilesAdded': function (up, files) {
                            //files.forEach(function (item)
                            for (var i = 0; i < files.length; i++) {
                                var item = files[i];
                                var names = item.name.split('.');
                                if (!vm.checkFile(item)) {
                                    $.notify('warning', names[names.length - 1] + '的文件格式暂不支持上传');
                                    this.removeFile(item);
                                    files.splice(i, 1);
                                    i--;
                                    continue;
                                }
                                if (item.size) {
                                    if (item.size / 1024 / 1024 > 1) {
                                        item.sizeStr = (item.size / 1024 / 1024).toFixed(1) + 'MB';
                                    } else {
                                        item.sizeStr = Math.floor(item.size / 1024) + 'KB';
                                    }
                                }
                                item.speed = 0;
                                vm.files.push(item);
                                vm.$set(vm.progress, item.id, 0);

                                //rm、rmvb特殊处理
                                if (names[names.length - 1] == "rm" || names[names.length - 1] == "rmvb") {
                                    vm.rmFile(item);
                                }
                            }
                        },
                        'BeforeUpload': function (up, file) {
                        },
                        'UploadProgress': function (up, file) {
                            var val = file.percent;
                            vm.$set(vm.progress, file.id, val);
                        },
                        'UploadComplete': function () {

                        },
                        'FileUploaded': function (up, file, info) {
                            if (info.status == 200) {
                                if (mConfig[file.upType].reOption && mConfig[file.upType].reOption.url) {
                                    var fileUrl="";//处理上传结果
                                    vm.afterUploaded(file, "fileUrl");
                                } else {//七牛
                                    var fileUrl = up.settings.domain + "/" + encodeURIComponent(JSON.parse(info.response).key);//文件路径的文件名编码
                                    vm.afterUploaded(file, fileUrl);
                                }
                                console.log("info.response", info.response);
                            } else {
                                var message = "上传失败";
                                vm.$set(vm.error, file.id, message);
                            }
                        },
                        'Error': function (up, err, errTip) {
                            $.notify('warning', '上传错误：' + errTip);
                        }
                        // ,
                        // 'Key': function(up, file) {
                        //     var key = "";
                        //     // do something with key
                        //     return key
                        // }
                    }
                });
            },
            addFile: function () {
                this.$refs.filesAdd.click();
            },
            checkFile: function (file) {//自定义判断文件类型合法性
                var types = ",rm,rmvb,mkv,avi,mp4,bmp,jpeg,jpg,gif,png,zip,rar,ai,tiff,tif,pdf,xls,xlsx,ppt,pptx,doc,docx,txt,";
                var names = file.name.split('.');
                if (file && types.indexOf("," + names[names.length - 1].toLowerCase() + ",") >= 0) {
                    return true;
                }
                return false;
            },
            rmFile: function (file) {//rm、rmvb特殊处理
                var names = file.name.split('.');
                if (names[names.length - 1].toLowerCase() == "rm" || names[names.length - 1].toLowerCase() == "rmvb") {
                    file.type = "video/" + names[names.length - 1].toLowerCase();
                    file.upType = "Video";
                }
            },
            afterUploaded: function (file, url) {
                //上传结束的业务处理
                //保存信息(upType:mConfig里的元素key,文件类型)
            }
        },
        created: function () {
            this.privateVisible = this.visible;
        },
        mounted: function () {
        }
    };

    var tplUrl = "./component/uploadQiniu/index.html";
    $.get(tplUrl + "?t=" + Math.random()).done(function (html) {
        com.template = html;
        resolve(com);
    }).fail(function () {
        resolve(com);
    });
});