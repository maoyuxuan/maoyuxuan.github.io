/* ajax */
+function ($) {
    'use strict';
    
    var caches = {}, uuid = 0;

    // abort xhr
    function abortXHR(id,uuid) {
        var xhr = caches[id][uuid];
        if (xhr.readyState < 4) {
            xhr.onreadystatechange = $.noop
            xhr.abort();
        }
    }

    // remove xhr from caches
    function removeXHR(id, uuid) {
        // current page's caches
        var _caches = caches[id] = caches[id] || {};
        for (var key in _caches) {
            // remove single xhr
            if (uuid) { 
                if (key === uuid) {
                    abortXHR(id, key);
                    return;
                }
            }
            // remove current page's all xhrs
            else { 
                abortXHR(id, key)
            }
        }
    }

    $._ajax = function (parms) {
        var page = null, xhr = null, id;
        parms = parms || {};

        page = $(".page-current")[0];
        id = page.id || (page.id = "page-" + (+new Date()));
        uuid = parms.uuid || ++uuid;

        // abort and remove the same uuid xhr
        removeXHR(id, uuid);

        // append indicator
        parms.indicator = function () {
            var idc = parms.indicator == undefined ? true : parms.indicator;
            if (idc) {
                $.showIndicator(page);
            }
            return idc;
        }();

        // 和仁接口通用
        //xhr = $.ajax({
        //    url: parms.url + '?_' + +new Date,
        //    contentType: 'application/json',
        //    dataType: 'json',
        //    type: parms.type || 'POST',
        //    data: JSON.stringify(parms.data || {}),
        //    async: parms.async === undefined ? true : parms.async,
        //    timeout: 2e4, // 20s
        //})
        
        xhr = $.ajax({
            url: parms.url ,
            dataType: 'json',
            type: parms.type || 'POST',
            data: parms.data || {},
            async: parms.async === undefined ? true : parms.async,
            timeout: 2e4, // 20s
        })
        // success
        .done(function (ret) {
            // your code...
            if (ret.code == 0) {
                try {
                    (parms.done || $.noop)(ret.data);
                }
                catch (e) {
                    alert('程序出错');
                }
            } else {
                (parms.fail || alert)(ret.message || ret.code);
            }
        })
        // error
        .fail(function (XMLHttpRequest, textStatus, errorThrown) {
            if (textStatus == "abort") {
                console.log(textStatus);
                return;
            }
            var readyState = XMLHttpRequest.readyState,
                _readyState = { 0: "初始化", 1: "发送请求", 2: "响应", 3: "解析", 4: "" }[readyState],
                _textStatus = { "timeout": "超时", "error": "错误", "abort": "终止", "parsererror": "parsererror" }[textStatus],
                _status = XMLHttpRequest.status,
                _thrown = '';

            switch (readyState) {
                case 0:
                    if (!navigator.onLine) {

                        _thrown = '无法连接到网络<br/>';

                    } else if (errorThrown) {

                        _thrown = errorThrown + '<br/>'
                    }
                    break;
                default: _thrown = errorThrown + '<br/>'; break;
            };

            alert(_readyState + _textStatus + '<br/><span class="light">' + _thrown + 'CODE:' + _status + '</span>');
        })
        .always(function () {
            //remove indicator
            if (parms.indicator) {
                $.hideIndicator(page);
            }
            // remove cache
            delete caches[id][uuid];
            // always callback
            (parms.always || $.noop)();
        });

        caches[id][uuid] = xhr;
    };
    
    //abort the page's xhrs before the current page hide
    $(document).on('beforePageHide.ajax', '.page-current', function (event) {
        if (!this.id) return;
        removeXHR(this.id);
    });

    // form submit 参数同$._ajax
    $.fn._submit = function (parms) {
        var form = this;

        parms.url = parms.url || form.attr('action');
        parms.data = form.serializeArray(); // 数组[ { name: a, value: 1 }, { name: b, value: 2 },...]

        $._ajax(parms);
    };
}($);
