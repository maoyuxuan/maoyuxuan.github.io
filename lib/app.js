/* detect $.os,$.browser */
+ function ($) {
    "use strict";
    function detect(ua, platform) {
        var os = this.os = {},
            browser = this.browser = {},
            webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
            android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
            osx = !!ua.match(/\(Macintosh\; Intel /),
            ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
            ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
            iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
            webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
            win = /Win\d{2}|Windows/.test(platform),
            wp = ua.match(/Windows Phone ([\d.]+)/),
            touchpad = webos && ua.match(/TouchPad/),
            kindle = ua.match(/Kindle\/([\d.]+)/),
            silk = ua.match(/Silk\/([\d._]+)/),
            blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
            bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
            rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
            playbook = ua.match(/PlayBook/),
            chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
            firefox = ua.match(/Firefox\/([\d.]+)/),
            firefoxos = ua.match(/\((?:Mobile|Tablet); rv:([\d.]+)\).*Firefox\/[\d.]+/),
            ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/),
            webview = !chrome && ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/),
            safari = webview || ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/);

        if (browser.webkit = !!webkit) browser.version = webkit[1];

        if (android) os.android = true, os.version = android[2];
        if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.');
        if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.');
        if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
        if (wp) os.wp = true, os.version = wp[1];
        if (webos) os.webos = true, os.version = webos[2];
        if (touchpad) os.touchpad = true;
        if (blackberry) os.blackberry = true, os.version = blackberry[2];
        if (bb10) os.bb10 = true, os.version = bb10[2];
        if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2];
        if (playbook) browser.playbook = true;
        if (kindle) os.kindle = true, os.version = kindle[1];
        if (silk) browser.silk = true, browser.version = silk[1];
        if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true;
        if (chrome) browser.chrome = true, browser.version = chrome[1];
        if (firefox) browser.firefox = true, browser.version = firefox[1];
        if (firefoxos) os.firefoxos = true, os.version = firefoxos[1];
        if (ie) browser.ie = true, browser.version = ie[1];
        if (safari && (osx || os.ios || win)) {
            browser.safari = true;
            if (!os.ios) browser.version = safari[1];
        }
        if (webview) browser.webview = true;

        os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
            (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)));
        os.phone = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
            (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
            (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))));
    }

    detect.call($, navigator.userAgent, navigator.platform);
}($);

// $.device
+function ($) {
    "use strict";
    var device = {};
    var ua = navigator.userAgent;

    var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
    var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
    var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
    var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);

    device.ios = device.android = device.iphone = device.ipad = device.androidChrome = false;

    // Android
    if (android) {
        device.os = 'android';
        device.osVersion = android[2];
        device.android = true;
        device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
    }
    if (ipad || iphone || ipod) {
        device.os = 'ios';
        device.ios = true;
    }
    // iOS
    if (iphone && !ipod) {
        device.osVersion = iphone[2].replace(/_/g, '.');
        device.iphone = true;
    }
    if (ipad) {
        device.osVersion = ipad[2].replace(/_/g, '.');
        device.ipad = true;
    }
    if (ipod) {
        device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
        device.iphone = true;
    }
    // iOS 8+ changed UA
    if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
        if (device.osVersion.split('.')[0] === '10') {
            device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
        }
    }

    // Webview
    device.webView = (iphone || ipad || ipod) && ua.match(/.*AppleWebKit(?!.*Safari)/i);

    // Minimal UI
    if (device.os && device.os === 'ios') {
        var osVersionArr = device.osVersion.split('.');
        device.minimalUi = !device.webView &&
                            (ipod || iphone) &&
                            (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7) &&
                            $('meta[name="viewport"]').length > 0 && $('meta[name="viewport"]').attr('content').indexOf('minimal-ui') >= 0;
    }

    // Check for status bar and fullscreen app mode
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    device.statusBar = false;
    if (device.webView && (windowWidth * windowHeight === screen.width * screen.height)) {
        device.statusBar = true;
    }
    else {
        device.statusBar = false;
    }

    // Classes
    var classNames = [];

    // Pixel Ratio
    device.pixelRatio = window.devicePixelRatio || 1;
    classNames.push('pixel-ratio-' + Math.floor(device.pixelRatio));
    if (device.pixelRatio >= 2) {
        classNames.push('retina');
    }

    // OS classes
    if (device.os) {
        classNames.push(device.os, device.os + '-' + device.osVersion.split('.')[0], device.os + '-' + device.osVersion.replace(/\./g, '-'));
        if (device.os === 'ios') {
            var major = parseInt(device.osVersion.split('.')[0], 10);
            for (var i = major - 1; i >= 6; i--) {
                classNames.push('ios-gt-' + i);
            }
        }

    }
    // Status bar classes
    if (device.statusBar) {
        classNames.push('with-statusbar-overlay');
    }
    else {
        $('html').removeClass('with-statusbar-overlay');
    }

    // Add html classes
    if (classNames.length > 0) $('html').addClass(classNames.join(' '));

    $.device = device;
}($);

// utils WebKitCSSMatrix:true
+function ($) {
    "use strict";

    $.noop = function () { };

    //support
    $.support = (function () {
        var support = {
            touch: (window.Modernizr && Modernizr.touch === true) || (function () {
                return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
            })(),
            // css3 浏览器是否支持属性值
            css3Value: function (property, value) {
                var dummy = document.createElement('p');
                var prefixes = ['', '-webkit-', '-moz-', '-o-', '-ms-'];
                var len = prefixes.length;

                for (var i = 0; i < len; i++) {
                    dummy.style[property] = prefixes[i] + value;
                    if (dummy.style[property]) return true;
                }

                return false;
            }
        };
        return support;
    })();

    $.touchEvents = {
        start: $.support.touch ? 'touchstart' : 'mousedown',
        move: $.support.touch ? 'touchmove' : 'mousemove',
        end: $.support.touch ? 'touchend' : 'mouseup',
        cancel: $.support.touch ? 'touchcancel' : ''
    };

    $.getTouchPosition = function (e) {
        e = e.originalEvent || e; //jquery wrap the originevent
        if (e.type === 'touchstart' || e.type === 'touchmove' || e.type === 'touchend') {
            return {
                x: e.targetTouches[0].pageX,
                y: e.targetTouches[0].pageY
            };
        } else {
            return {
                x: e.pageX,
                y: e.pageY
            };
        }
    };

    $.requestAnimationFrame = function (callback) {
        var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) { window.setTimeout(callback, 1000 / 60); };

        return rAF(callback);
    };
    $.cancelAnimationFrame = function (id) {
        if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
        else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
        else if (window.mozCancelAnimationFrame) return window.mozCancelAnimationFrame(id);
        else {
            return window.clearTimeout(id);
        }
    };

    $.getTranslate = function (el, axis) {
        var matrix, curTransform, curStyle, transformMatrix;

        // automatic axis detection
        if (typeof axis === 'undefined') {
            axis = 'x';
        }

        curStyle = window.getComputedStyle(el, null);
        if (window.WebKitCSSMatrix) {
            // Some old versions of Webkit choke when 'none' is passed; pass
            // empty string instead in this case
            transformMatrix = new WebKitCSSMatrix(curStyle.webkitTransform === 'none' ? '' : curStyle.webkitTransform);
        }
        else {
            transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
            matrix = transformMatrix.toString().split(',');
        }

        if (axis === 'x') {
            //Latest Chrome and webkits Fix
            if (window.WebKitCSSMatrix)
                curTransform = transformMatrix.m41;
                //Crazy IE10 Matrix
            else if (matrix.length === 16)
                curTransform = parseFloat(matrix[12]);
                //Normal Browsers
            else
                curTransform = parseFloat(matrix[4]);
        }
        if (axis === 'y') {
            //Latest Chrome and webkits Fix
            if (window.WebKitCSSMatrix)
                curTransform = transformMatrix.m42;
                //Crazy IE10 Matrix
            else if (matrix.length === 16)
                curTransform = parseFloat(matrix[13]);
                //Normal Browsers
            else
                curTransform = parseFloat(matrix[5]);
        }

        return curTransform || 0;
    };

    $.fn.transitionEnd = function (callback) {
        var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
            i, dom = this;

        function fireCallBack(e) {
            /*jshint validthis:true */
            if (e.target !== this) return;
            callback.call(this, e);
            for (i = 0; i < events.length; i++) {
                dom.off(events[i], fireCallBack);
            }
        }
        if (callback) {
            for (i = 0; i < events.length; i++) {
                dom.on(events[i], fireCallBack);
            }
        }
        return this;
    };
    $.fn.animationEnd = function (callback) {
        var events = ['webkitAnimationEnd', 'OAnimationEnd', 'MSAnimationEnd', 'animationend'],
            i, dom = this;

        function fireCallBack(e) {
            callback(e);
            for (i = 0; i < events.length; i++) {
                dom.off(events[i], fireCallBack);
            }
        }
        if (callback) {
            for (i = 0; i < events.length; i++) {
                dom.on(events[i], fireCallBack);
            }
        }
        return this;
    };
    $.fn.transition = function (duration) {
        if (typeof duration !== 'string') {
            duration = duration + 'ms';
        }
        for (var i = 0; i < this.length; i++) {
            var elStyle = this[i].style;
            elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
        }
        return this;
    };
    $.fn.transform = function (transform) {
        for (var i = 0; i < this.length; i++) {
            var elStyle = this[i].style;
            elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
        }
        return this;
    };

    $.fn.scrollHeight = function () {
        return this[0].scrollHeight;
    };
    /** axis y (animate)  
     * @param target : 'max'||percentage||DOMElement|| jQuery selector
     * @param [duration]: animate duration
     * @param [callback]: after animate callback
     *
     * $(selector).scrollTo('max'); 滚动到底部
     * $(selector).scrollTo('50%'); 
     * $(selector).scrollTo(selector); selector jQuery / DOMElement
     */
    $.fn.scrollTo = function (target, duration, callback) {
        if (target === undefined) { return; }
        if (target === 'max') { target = 9e9; }

        return this.each(function () {
            var elem = this,
                $elem = $(elem),
                _target = target,
                scrollTop;

            var max = elem.scrollHeight - $elem.height();

            switch (typeof _target) {
                case 'number':
                case 'string':
                    if (/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(_target)) {
                        var top = _target;
                        // Handle percentage values
                        scrollTop = top.slice && top.slice(-1) === '%' ? parseFloat(top) / 100 * max : top;
                        break;
                    }
                    _target = $(_target, elem);
                case 'object':
                    if (_target.length === 0) {
                        return;
                    }
                    scrollTop = _target.offset().top + ($elem.scrollTop() - $elem.offset().top);
                    break;
            }

            // Number or 'number'
            if (/^\d+$/.test(scrollTop)) {
                scrollTop = scrollTop <= 0 ? 0 : Math.min(scrollTop, max);
            }
            console.log('scrolltop--' + scrollTop);
            $elem.animate({ scrollTop: scrollTop }, {
                duration: duration || 0,
                complete: callback && function () {
                    callback.call(elem);
                }
            });
        });
    };
}($);

// utils
+function ($) {
    "use strict";
    /**比较一个字符串版本号
     *a > b === 1
     *a = b === 0
     *a < b === -1
    */
    $.compareVersion = function (a, b) {
        var as = a.split('.');
        var bs = b.split('.');
        if (a === b) return 0;

        for (var i = 0; i < as.length; i++) {
            var x = parseInt(as[i]);
            if (!bs[i]) return 1;
            var y = parseInt(bs[i]);
            if (x < y) return -1;
            if (x > y) return 1;
        }
        return 1;
    };

    /**
     * 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，至少每隔 wait毫秒调用一次该函数。控制触发频率较高的事件
     */
    $.throttle = function (wait, no_trailing, func, debounce_mode) {
        var timeout_id,

          last_exec = 0;

        if (typeof no_trailing !== 'boolean') {
            debounce_mode = func;
            func = no_trailing;
            no_trailing = undefined;
        }

        function wrapper() {
            var that = this,
              elapsed = +new Date() - last_exec,
              args = arguments;

            function exec() {
                last_exec = +new Date();
                func.apply(that, args);
            };

            function clear() {
                timeout_id = undefined;
            };

            if (debounce_mode && !timeout_id) {
                exec();
            }

            timeout_id && clearTimeout(timeout_id);

            if (debounce_mode === undefined && elapsed > wait) {
                exec();

            } else if (no_trailing !== true) {
                timeout_id = setTimeout(debounce_mode ? clear : exec, debounce_mode === undefined ? wait - elapsed : wait);
            }
        };

        if ($.guid) {
            wrapper.guid = func.guid = func.guid || $.guid++;
        }

        return wrapper;
    };

    /**
     * $.debounce(wait, function, [immediate]) 是空闲时间必须大于或等于 一定值的时候，才会执行调用方法。
     * 返回 function 函数的防反跳版本, 将延迟函数的执行(真正的执行)在函数最后一次调用时刻的 wait 毫秒之后。
     * 传参 immediate 为 true， debounce会在 wait 时间间隔的开始调用这个函数 。在 wait 的时间之内，不会再次调用
     *
     * //绑定事件
     * $(document).on('touchmove', $.debounce(250, touchmoveHander));//频繁滚动，每250ms，执行一次touchmoveHandler
     *
     * //解绑事件
     * $(document).off('touchmove', touchmoveHander);//注意这里面off还是touchmoveHander,而不是$.throttle返回的function
     *
     */
    $.debounce = function (wait, immediate, func) {
        return func === undefined
          ? $.throttle(wait, immediate, false)
          : $.throttle(wait, func, immediate !== false);
    };

    $.fn.hasAttr = function (name) {
        return this[0].hasAttribute(name);
    };

    /* alert重写
     * msg 必填 文本
     * type 可选 text|success|error|warning 默认text
     * time 延迟消失时间
     */
    window.alert = function (msg, type, time) {
        var template = {
            text: '{{value}}',
            success: '<span class="ui-icon-alert-check color-success"></span>{{value}}',
            error: '<span class="ui-icon-alert-cancel color-danger"></span>{{value}}</div>',
            warning: '<span class="ui-icon-alert-warning color-warning"></span>{{value}}'
        };
        var _alert = $('<div class="modal window-alert">' + template[type || 'text'].replace('{{value}}', msg) + '</div>').appendTo(document.body);
        _alert.show().css({
            marginLeft: -Math.round(parseInt(window.getComputedStyle(_alert[0]).width) / 2) + 'px'
        }).addClass('modal-in');

        setTimeout(function () {
            _alert.removeClass('modal-in').addClass('modal-out').transitionEnd(function (e) {
                _alert.remove();
            });
        }, time || 1500);
    };

    $.showIndicator = function (page) {
        $(page).append('<div class="preloader-indicator-overlay"></div><div class="preloader-indicator-modal"><span class="preloader preloader-white"></span></div>');
    };
    $.hideIndicator = function (page) {
        $('.preloader-indicator-overlay, .preloader-indicator-modal', page).remove();
    };
    /* toast
     * text 文本
     * stype 可选 checked|cancel|forbidden|text|loading 默认为checked
     * callback remove时触发的回调函数
     */
    $.toast = function (text, style, callback) {
        if (typeof style === "function") {
            callback = style;
            style = undefined;
        }
        var overlayer = $('<div class="toast-overlay"></div>').appendTo(document.body);
        var style = style || 'checked';
        var html = [];
        html.push('<div class="modal modal-toast modal-toast-');
        html.push(style);
        html.push('">');
        html.push('<i class="ui-icon-toast-');
        html.push(style);
        html.push('"></i>');
        html.push('<p class="modal-toast-content">');
        html.push(text || "已经完成");
        html.push('</p>');
        html.push('</div>');

        var toast = $(html.join('')).appendTo(document.body);

        toast.show().addClass('modal-in');

        setTimeout(function () {
            toast.removeClass('modal-in').addClass('modal-out').transitionEnd(function (e) {
                overlayer.remove();
                toast.remove();
                callback && callback(toast);
            });
        }, 1500);
    };
    // Prevent scrolling
    if (!$.device.android) {
        $(document).on($.touchEvents.start, '.modal, .preloader-indicator-overlay, .preloader-indicator-modal', function (e) {
            e.preventDefault();
        });
    }
}($);

// page init
+function ($) {
    "use strict";

    $.getCurrentPage = function () {
        return $(".page-current")[0] || $(".page")[0] || document.body;
    };

    var getPage = function () {
        var $page = $(".page-current");
        if (!$page[0]) {
            $page = $(".page").eq(0).addClass("page-current");
        }
        return $page;
    };

    var init = function () {
        var $page = getPage();
        var id = $page[0].id;
        if ($page.hasClass("page-inited")) {
            $page.trigger("pageReinit", [id, $page]);
        } else {
            $page.addClass("page-inited");
            $page.trigger("pageInit", [id, $page]);
        }
    };

    $(function () {
        init();

        $(document).on("pageInitInternal", function (e, id, $page) {
            init();
        });

    });
}($);

// FastClick 消除click与物理tap之间300ms的延迟
+function ($) {
    'use strict';
    var activeState = true,
        activeStateElements = 'a, button, label, span',        
        fastClicks = true,
        fastClicksDistanceThreshold = 10,
        fastClicksDelayBetweenClicks = 50,
        fastClicksExclude = '',
        tapHold = false,
        tapHoldDelay = 750,
        tapHoldPreventClicks = true;
    if (activeState) {
        $('html').addClass('watch-active-state');
    }
    if ($.device.ios && $.device.webView) {
        // Strange hack required for iOS 8 webview to work on inputs
        window.addEventListener('touchstart', function () { });
    }

    var touchStartX, touchStartY, touchStartTime, targetElement, trackClick, activeSelection, scrollParent, lastClickTime, isMoved, tapHoldFired, tapHoldTimeout;
    var activableElement, activeTimeout, needsFastClick, needsFastClickTimeOut;
    var rippleWave, rippleTarget, rippleTransform, rippleTimeout;
    function findActivableElement(el) {
        var target = $(el);
        var parents = target.parents(activeStateElements);
        var activable;
        if (target.is(activeStateElements)) {
            activable = target;
        }
        if (parents.length > 0) {
            activable = activable ? activable.add(parents) : parents;
        }
        return activable ? activable : target;
    }
    function isInsideScrollableView(el) {
        var pageContent = el.parents('.page-content, .panel');

        if (pageContent.length === 0) {
            return false;
        }

        // This event handler covers the "tap to stop scrolling".
        if (pageContent.prop('scrollHandlerSet') !== 'yes') {
            pageContent.on('scroll', function () {
                clearTimeout(activeTimeout);
                clearTimeout(rippleTimeout);
            });
            pageContent.prop('scrollHandlerSet', 'yes');
        }

        return true;
    }
    function addActive() {
        if (!activableElement) return;
        activableElement.addClass('active-state');
    }
    function removeActive(el) {
        if (!activableElement) return;
        activableElement.removeClass('active-state');
        activableElement = null;
    }
    function isFormElement(el) {
        var nodes = ('input select textarea label').split(' ');
        if (el.nodeName && nodes.indexOf(el.nodeName.toLowerCase()) >= 0) return true;
        return false;
    }
    function androidNeedsBlur(el) {
        var noBlur = ('button input textarea select').split(' ');
        if (document.activeElement && el !== document.activeElement && document.activeElement !== document.body) {
            if (noBlur.indexOf(el.nodeName.toLowerCase()) >= 0) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }
    function targetNeedsFastClick(el) {
        var $el = $(el);
        if (el.nodeName.toLowerCase() === 'input' && (el.type === 'file' || el.type === 'range')) return false;
        if (el.nodeName.toLowerCase() === 'select' && $.device.android) return false;
        if ($el.hasClass('no-fastclick') || $el.parents('.no-fastclick').length > 0) return false;
        if (fastClicksExclude && $el.is(fastClicksExclude)) return false;
        return true;
    }
    function targetNeedsFocus(el) {
        if (document.activeElement === el) {
            return false;
        }
        var tag = el.nodeName.toLowerCase();
        var skipInputs = ('button checkbox file image radio submit').split(' ');
        if (el.disabled || el.readOnly) return false;
        if (tag === 'textarea') return true;
        if (tag === 'select') {
            if ($.device.android) return false;
            else return true;
        }
        if (tag === 'input' && skipInputs.indexOf(el.type) < 0) return true;
    }
    function targetNeedsPrevent(el) {
        el = $(el);
        var prevent = true;
        if (el.is('label') || el.parents('label').length > 0) {
            if ($.device.android) {
                prevent = false;
            }
            else if ($.device.ios && el.is('input')) {
                prevent = true;
            }
            else prevent = false;
        }
        return prevent;
    }

    // Send Click
    function sendClick(e) {
        var touch = e.changedTouches[0];
        var evt = document.createEvent('MouseEvents');
        var eventType = 'click';
        if ($.device.android && targetElement.nodeName.toLowerCase() === 'select') {
            eventType = 'mousedown';
        }
        evt.initMouseEvent(eventType, true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
        evt.forwardedTouchEvent = true;
        targetElement.dispatchEvent(evt);
    }

    // Touch Handlers
    function handleTouchStart(e) {
        isMoved = false;
        tapHoldFired = false;
        if (e.targetTouches.length > 1) {
            if (activableElement) removeActive();
            return true;
        }
        if (e.touches.length > 1 && activableElement) {
            removeActive();
        }
        if (tapHold) {
            if (tapHoldTimeout) clearTimeout(tapHoldTimeout);
            tapHoldTimeout = setTimeout(function () {
                if (e && e.touches && e.touches.length > 1) return;
                tapHoldFired = true;
                e.preventDefault();
                $(e.target).trigger('taphold');
            }, tapHoldDelay);
        }
        if (needsFastClickTimeOut) clearTimeout(needsFastClickTimeOut);
        needsFastClick = targetNeedsFastClick(e.target);

        if (!needsFastClick) {
            trackClick = false;
            return true;
        }
        if ($.device.ios || ($.device.android && 'getSelection' in window)) {
            var selection = window.getSelection();
            if (selection.rangeCount && selection.focusNode !== document.body && (!selection.isCollapsed || document.activeElement === selection.focusNode)) {
                activeSelection = true;
                return true;
            }
            else {
                activeSelection = false;
            }
        }
        if ($.device.android) {
            if (androidNeedsBlur(e.target)) {
                document.activeElement.blur();
            }
        }

        trackClick = true;
        targetElement = e.target;
        touchStartTime = (new Date()).getTime();
        touchStartX = e.targetTouches[0].pageX;
        touchStartY = e.targetTouches[0].pageY;

        // Detect scroll parent
        if ($.device.ios) {
            scrollParent = undefined;
            $(targetElement).parents().each(function () {
                var parent = this;
                if (parent.scrollHeight > parent.offsetHeight && !scrollParent) {
                    scrollParent = parent;
                    scrollParent.f7ScrollTop = scrollParent.scrollTop;
                }
            });
        }
        if ((e.timeStamp - lastClickTime) < fastClicksDelayBetweenClicks) {
            e.preventDefault();
        }

        if (activeState) {
            activableElement = findActivableElement(targetElement);
            // If it's inside a scrollable view, we don't trigger active-state yet,
            // because it can be a scroll instead. Based on the link:
            // http://labnote.beedesk.com/click-scroll-and-pseudo-active-on-mobile-webk
            if (!isInsideScrollableView(activableElement)) {
                addActive();
            } else {
                activeTimeout = setTimeout(addActive, 80);
            }
        }
    }
    function handleTouchMove(e) {
        if (!trackClick) return;
        var _isMoved = false;
        var distance = fastClicksDistanceThreshold;
        if (distance) {
            var pageX = e.targetTouches[0].pageX;
            var pageY = e.targetTouches[0].pageY;
            if (Math.abs(pageX - touchStartX) > distance || Math.abs(pageY - touchStartY) > distance) {
                _isMoved = true;
            }
        }
        else {
            _isMoved = true;
        }
        if (_isMoved) {
            trackClick = false;
            targetElement = null;
            isMoved = true;
            if (tapHold) {
                clearTimeout(tapHoldTimeout);
            }
            if (activeState) {
                clearTimeout(activeTimeout);
                removeActive();
            }
        }
    }
    function handleTouchEnd(e) {
        clearTimeout(activeTimeout);
        clearTimeout(tapHoldTimeout);

        if (!trackClick) {
            if (!activeSelection && needsFastClick) {
                if (!($.device.android && !e.cancelable)) {
                    e.preventDefault();
                }
            }
            return true;
        }

        if (document.activeElement === e.target) {
            if (activeState) removeActive();
            if (material && materialRipple) {
                rippleTouchEnd();
            }
            return true;
        }

        if (!activeSelection) {
            e.preventDefault();
        }

        if ((e.timeStamp - lastClickTime) < fastClicksDelayBetweenClicks) {
            setTimeout(removeActive, 0);
            return true;
        }

        lastClickTime = e.timeStamp;

        trackClick = false;

        if ($.device.ios && scrollParent) {
            if (scrollParent.scrollTop !== scrollParent.f7ScrollTop) {
                return false;
            }
        }

        // Add active-state here because, in a very fast tap, the timeout didn't
        // have the chance to execute. Removing active-state in a timeout gives
        // the chance to the animation execute.
        if (activeState) {
            addActive();
            setTimeout(removeActive, 0);
        }

        // Trigger focus when required
        if (targetNeedsFocus(targetElement)) {
            if ($.device.ios && $.device.webView) {
                if ((event.timeStamp - touchStartTime) > 159) {
                    targetElement = null;
                    return false;
                }
                targetElement.focus();
                return false;
            }
            else {
                targetElement.focus();
            }
        }

        // Blur active elements
        if (document.activeElement && targetElement !== document.activeElement && document.activeElement !== document.body && targetElement.nodeName.toLowerCase() !== 'label') {
            document.activeElement.blur();
        }

        // Send click
        e.preventDefault();
        sendClick(e);
        return false;
    }
    function handleTouchCancel(e) {
        trackClick = false;
        targetElement = null;

        // Remove Active State
        clearTimeout(activeTimeout);
        clearTimeout(tapHoldTimeout);
        if (activeState) {
            removeActive();
        }
    }

    function handleClick(e) {
        var allowClick = false;

        if (trackClick) {
            targetElement = null;
            trackClick = false;
            return true;
        }
        if (e.target.type === 'submit' && e.detail === 0 || e.target.type === 'file') {
            return true;
        }
        if (!targetElement) {
            if (!isFormElement(e.target)) {
                allowClick = true;
            }
        }
        if (!needsFastClick) {
            allowClick = true;
        }
        if (document.activeElement === targetElement) {
            allowClick = true;
        }
        if (e.forwardedTouchEvent) {
            allowClick = true;
        }
        if (!e.cancelable) {
            allowClick = true;
        }
        if (tapHold &&tapHoldPreventClicks && tapHoldFired) {
            allowClick = false;
        }
        if (!allowClick) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            if (targetElement) {
                if (targetNeedsPrevent(targetElement) || isMoved) {
                    e.preventDefault();
                }
            }
            else {
                e.preventDefault();
            }
            targetElement = null;
        }
        needsFastClickTimeOut = setTimeout(function () {
            needsFastClick = false;
        }, ($.device.ios || $.device.androidChrome ? 100 : 400));

        if (tapHold) {
            tapHoldTimeout = setTimeout(function () {
                tapHoldFired = false;
            }, ($.device.ios || $.device.androidChrome ? 100 : 400));
        }

        return allowClick;
    }
    if ($.support.touch) {
        document.addEventListener('click', handleClick, true);

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchCancel);
    }
}($);