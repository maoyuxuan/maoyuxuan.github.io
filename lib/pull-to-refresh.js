/*
 * Pull to refresh
 */
+function ($, window, document, Math) {
    'use strict';

    var utils = (function () {
        var me = {};

        var _elementStyle = document.createElement('div').style;
        var _vendor = (function () {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for (; i < l; i++) {
                transform = vendors[i] + 'ransform';
                if (transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
            }

            return false;
        })();

        function _prefixStyle(style) {
            if (_vendor === false) return false;
            if (_vendor === '') return style;
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        }

        me.getTime = Date.now || function getTime() { return new Date().getTime(); };
        me.time = function () {
            var time = new Date();
            var h = time.getHours(),
                m = time.getMinutes();
            return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
        };
        me.extend = function (target, obj) {
            for (var i in obj) {
                target[i] = obj[i];
            }
        };
        me.addEvent = function (el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        };
        me.triggerEvent = function (el, type) {
            var evObj = document.createEvent('MouseEvents');
            evObj.initEvent(type, true, false);
            el.dispatchEvent(evObj);
        };
        me.removeEvent = function (el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        };
        me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
            var distance = current - start,
                speed = Math.abs(distance) / time,
                destination,
                duration;

            deceleration = deceleration === undefined ? 0.0006 : deceleration;

            destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
            duration = speed / deceleration;

            if (destination < lowerMargin) {
                destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
                distance = Math.abs(destination - current);
                duration = distance / speed;
            } else if (destination > 0) {
                destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
                distance = Math.abs(current) + destination;
                duration = distance / speed;
            }

            return {
                destination: Math.round(destination),
                duration: duration
            };
        };

        var _transform = _prefixStyle('transform');

        me.extend(me, {
            hasTransform: _transform !== false
        });

        /*
        This should find all Android browsers lower than build 535.19 (both stock browser and webview)
        - galaxy S2 is ok
        - 2.3.6 : `AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`
        - 4.0.4 : `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
       - galaxy S3 is badAndroid (stock brower, webview)
         `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
       - galaxy S4 is badAndroid (stock brower, webview)
         `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
       - galaxy S5 is OK
         `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
       - galaxy S6 is OK
         `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
      */
        me.isBadAndroid = (function () {
            var appVersion = window.navigator.appVersion;
            // Android browser is not a chrome browser.
            if (/Android/.test(appVersion) && !(/Chrome\/\d/.test(appVersion))) {
                var safariVersion = appVersion.match(/Safari\/(\d+.\d)/);
                if (safariVersion && typeof safariVersion === "object" && safariVersion.length >= 2) {
                    return parseFloat(safariVersion[1]) < 535.19;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        })();

        me.extend(me.style = {}, {
            transform: _transform,
            transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
            transitionDuration: _prefixStyle('transitionDuration'),
            transitionDelay: _prefixStyle('transitionDelay'),
            transformOrigin: _prefixStyle('transformOrigin'),
            touchAction: _prefixStyle('touchAction')
        });

        me.hasClass = function (e, c) {
            var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
            return re.test(e.className);
        };
        me.addClass = function (e, c) {
            if (me.hasClass(e, c)) {
                return;
            }

            var newclass = e.className.split(' ');
            newclass.push(c);
            e.className = newclass.join(' ');
        };
        me.removeClass = function (e, c) {
            if (!me.hasClass(e, c)) {
                return;
            }
            var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
            e.className = e.className.replace(re, ' ').replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
        me.extend(me.eventType = {}, {
            touchstart: 1,
            touchmove: 1,
            touchend: 1
        });
        me.extend(me.ease = {}, {
            quadratic: {
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function (k) {
                    return k * (2 - k);
                }
            },
            circular: {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function (k) {
                    return Math.sqrt(1 - (--k * k));
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function (k) {
                    var b = 4;
                    return (k = k - 1) * k * ((b + 1) * k + b) + 1;
                }
            },
            bounce: {
                style: '',
                fn: function (k) {
                    if ((k /= 1) < (1 / 2.75)) {
                        return 7.5625 * k * k;
                    } else if (k < (2 / 2.75)) {
                        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                    } else if (k < (2.5 / 2.75)) {
                        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                    } else {
                        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function (k) {
                    var f = 0.22,
                        e = 0.4;

                    if (k === 0) { return 0; }
                    if (k == 1) { return 1; }

                    return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
                }
            }
        });

        return me;
    })();
    function PullToRefresh(el, options) {
        this.windowHeight = $(window).height();
        this.scroller = typeof el == 'string' ? document.querySelector(el) : el;
        this.scrollerStyle = this.scroller.style;		// cache style for better performance
        this.clientHeight = this.scroller.clientHeight;
        this.maxScrollY = this.clientHeight - this.scroller.scrollHeight;

        this.options = {
            // INSERT POINT: OPTIONS
            startY: 0,
            momentum: true,

            bounce: true,
            bounceTime: 600,
            bounceEasing: '',

            type: 1,
            onRefresh: function () { },
            // setting texts when type !==2
            refreshTexts: {
                'pull-down': '下拉刷新',
                'pull-up': '松开立即刷新',
                'refreshing': '正在刷新...'
            }
        };
        if (typeof options === 'function') {
            this.options.onRefresh = options;
            options = undefined;
        }
        options = options || {};

        for (var i in options) {
            this.options[i] = options[i];
        }

        this.options.useTransform = utils.hasTransform;
        this.options.bounceEasing = utils.ease.circular;

        // https://github.com/cubiq/iscroll/issues/1029
        if (!this.options.useTransform) {
            if (!(/relative|absolute/i).test(this.scrollerStyle.position)) {
                this.scrollerStyle.position = "relative";
            }
        }

        // Some defaults
        this.y = 0;
        this.endTime = 0;
        this.triggerDistance = ((this.options.type === 3 || this.options.type === 4) ? 1.1 : 2.2) * parseFloat($('html').css('fontSize'));
        this._events = {};

        this._initEvents();
        this._initRefresh();
    }

    PullToRefresh.prototype = {
        destroy: function () {
            this._initEvents(true);
            this._execEvent('destroy');
        },
        _transitionEnd: function (e) {
            if (e.target != this.scroller || !this.isInTransition) {
                return;
            }
            if (!this.resetPosition(this.options.bounceTime)) {
                this.isInTransition = false;
                this._execEvent('scrollEnd');
            }
        },
        _start: function (e) {
            if (this.initiated && utils.eventType[e.type] !== this.initiated) {
                return;
            }

            var point = e.touches ? e.touches[0] : e,
                pos;
            this.initiated = utils.eventType[e.type];
            this.moved = false;
            this.distY = 0;
            this.triggerEnd = false;

            this.startTime = utils.getTime();

            if (this.isAnimating) {
                this.isAnimating = false;
                this._execEvent('scrollEnd');
            }

            this.startY = this.y;
            this.absStartY = this.y;
            this.pointY = point.pageY;

            this._execEvent('beforeScrollStart');
        },
        _move: function (e) {
            if (this.triggerEnd || utils.eventType[e.type] !== this.initiated) {
                return;
            }

            var point = e.touches ? e.touches[0] : e,
                deltaY = point.pageY - this.pointY,
                timestamp = utils.getTime(),
                newY,
                absDistY,
                scrollTop = this.scroller.scrollTop;

            // pull to refresh
            if ((scrollTop == 0 && (deltaY > 0 || this.y > 0)) || scrollTop < 0) {
                e.preventDefault();

                this.pointY = point.pageY;

                // ios uc浏览器，触摸超过windowHeight,不触发touchend  （4s/5s机子都有问题）
                if (this.pointY > this.windowHeight) {
                    utils.triggerEvent(this.scroller, 'touchend');
                    this.triggerEnd = true;
                    return;
                }

                this.distY += deltaY;
                absDistY = Math.abs(this.distY);

                // We need to move at least 10 pixels for the scrolling to initiate
                if (timestamp - this.endTime > 300 && absDistY < 10) {
                    return;
                }

                newY = this.y + deltaY;
                if (newY > 0 || newY < this.maxScrollY) {
                    newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
                }
                
                if (!this.moved) {
                    this._execEvent('scrollStart');
                }

                this.moved = true;

                this._translate(newY);

                if (timestamp - this.startTime > 300) {
                    this.startTime = timestamp;
                    this.startY = this.y;
                }

                this._execEvent('scroll');
            }
            else {
            }
        },
        _end: function (e) {
            if (utils.eventType[e.type] !== this.initiated) {
                return;
            }

            var point = e.changedTouches ? e.changedTouches[0] : e,
                momentumY,
                duration = utils.getTime() - this.startTime,
                newY = Math.round(this.y),
                distanceY = Math.abs(newY - this.startY),
                time = 0,
                easing = '';

            this.isInTransition = false;
            this.initiated = 0;
            this.endTime = utils.getTime();

            // update refresh status
            this._execEvent('refresh');

            // reset if we are outside of the boundaries
            if (this.resetPosition(this.options.bounceTime)) {
                return;
            }

            this.scrollTo(newY);// ensures that the last position is rounded

            // we scrolled less than 10 pixels
            if (!this.moved) {
                this._execEvent('scrollCancel');
                return;
            }

            if (this._events.flick && duration < 200 && distanceY < 100) {
                this._execEvent('flick');
                return;
            }

            // start momentum animation if needed
            if (this.options.momentum && duration < 300) {
                momentumY = utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.clientHeight : 0, this.options.deceleration);
                newY = momentumY.destination;
                time = momentumY.duration;
                this.isInTransition = true;
            }

            if (newY != this.y) {
                // change easing function when scroller goes out of the boundaries
                if (newY > 0 || newY < this.maxScrollY) {
                    easing = utils.ease.quadratic;
                }
                this.scrollTo(newY, time, easing);
                return;
            }
            this._execEvent('scrollEnd');
        },
        resetPosition: function (time) {
            var y = this.y;

            time = time || 0;

            if (utils.hasClass(this.scroller, 'refreshing') && this.y > 0) {
                y = this.triggerDistance;
            }
            else if (this.y > 0) {
                y = 0;
            }
            else if (this.y < this.maxScrollY) {
                y = this.maxScrollY;
            }

            if (y == this.y) {
                return false;
            }
            this.scrollTo(y, time, this.options.bounceEasing);

            return true;
        },
        on: function (type, fn) {
            if (!this._events[type]) {
                this._events[type] = [];
            }

            this._events[type].push(fn);
        },
        off: function (type, fn) {
            if (!this._events[type]) {
                return;
            }

            var index = this._events[type].indexOf(fn);

            if (index > -1) {
                this._events[type].splice(index, 1);
            }
        },
        _execEvent: function (type) {
            if (!this._events[type]) {
                return;
            }

            var i = 0,
                l = this._events[type].length;

            if (!l) {
                return;
            }

            for (; i < l; i++) {
                this._events[type][i].apply(this, [].slice.call(arguments, 1));
            }
        },
        scrollTo: function (y, time, easing) {
            easing = easing || utils.ease.circular;

            this.isInTransition = false;
            var transitionType = false;
            if (!time || transitionType) {
                if (transitionType) {
                    this._transitionTimingFunction(easing.style);
                }
                this._translate(y);
            } else {
                this._animate(y, time, easing.fn);
            }
        },
        _transitionTimingFunction: function (easing) {
            this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


            if (this.indicators) {
                for (var i = this.indicators.length; i--;) {
                    this.indicators[i].transitionTimingFunction(easing);
                }
            }


            // INSERT POINT: _transitionTimingFunction

        },
        _translate: function (y) {
            if (this.options.useTransform) {
                this.scrollerStyle[utils.style.transform] = 'translate(0,' + y + 'px)';
            }
            else {
                y = Math.round(y);
                this.scrollerStyle.top = y + 'px';
            }

            this.y = y;

            if (this.indicators) {
                for (var i = this.indicators.length; i--;) {
                    this.indicators[i].updatePosition();
                }
            }
        },
        _animate: function (destY, duration, easingFn) {
            var that = this,
                startY = this.y,
                startTime = utils.getTime(),
                destTime = startTime + duration;

            var _now;


            function step() {
                var now = utils.getTime(),
                    newY,
                    easing;
                if (now >= destTime) {
                    that.isAnimating = false;
                    
                    that._translate(destY);

                    if (!that.resetPosition(that.options.bounceTime)) {
                        that._execEvent('scrollEnd');
                    }

                    return;
                }

                now = (now - startTime) / duration;
                easing = easingFn(now);
                newY = (destY - startY) * easing + startY;

                that._translate(newY);

                if (that.isAnimating) {
                    $.requestAnimationFrame(step);
                }

                that._execEvent('scroll');
            }

            this.isAnimating = true;
            step();
        },
        _initEvents: function (remove) {
            var eventType = remove ? utils.removeEvent : utils.addEvent;

            if ($.support.touch) {
                eventType(this.scroller, 'touchstart', this);
                eventType(this.scroller, 'touchmove', this);
                eventType(this.scroller, 'touchcancel', this);
                eventType(this.scroller, 'touchend', this);
            }

            eventType(this.scroller, 'transitionend', this);
            eventType(this.scroller, 'webkitTransitionEnd', this);
            eventType(this.scroller, 'oTransitionEnd', this);
            eventType(this.scroller, 'MSTransitionEnd', this);

            document.addEventListener($.touchEvents.move, function (e) { setTimeout(function () { }, 0); }, { capture: false, passive: false });
        },
        _refresyLayout: function () {
            var container = $(this.scroller);
            var type = this.options.type;

            var tpl = [],
                _icon = '<div class="icon"></div>',
                _text = '<div class="text"><var></var></div>',
                _time = '<div class="time">最后更新：<var>' + utils.time() + '</var></div>';

            tpl.push('<div class="pull-to-refresh-layer');
            if (type !== 3) {
                tpl.push(' flex');
            }
            if (type === 0 || type === 4) {
                tpl.push(' column');
            }
            tpl.push('">');
            // type type: L=left,R=right,T=top,B=bottom,C=center
            switch (type) {
                case 4: // icon:LT, text:RT, time:CB
                    tpl.push('<div class="flex">');
                    tpl.push(_icon);
                    tpl.push(_text);
                    tpl.push('</div>');
                    tpl.push(_time);
                    break;
                case 3: // icon:LC, text:RT, time:RB
                    tpl.push(_icon);
                    tpl.push('<div class="flex column">');
                    tpl.push(_text);
                    tpl.push(_time);
                    tpl.push('</div>');
                    break;
                case 2: // icon: CC
                    tpl.push(_icon);
                    break;
                case 1: // icon:LC, text:RC
                case 0: // icon:CT, text:CB
                    tpl.push(_icon);
                    tpl.push(_text);
                    break;
            }
            tpl.push('</div>');
            this.layer = $(tpl.join('')).prependTo(this.scroller);
            if (type !== 2) {
                this.text = $('.text var', this.layer);
            }
            if (type === 3 || type === 4) {
                this.time = $('.time var', this.layer);
            }
            utils.addClass(this.scroller, 'pull-to-refresh-content ptr-type-' + type);
        },
        // repaint text or time
        _refreshRepaint: function (addCls, removeCls, callback) {
            var ptr = this,
                container = $(ptr.scroller),
                options = ptr.options,
                type = options.type,
                text,
                transform = '';

            if (addCls) {
                if (type !== 2) {
                    text = options.refreshTexts[addCls];
                    if (text) {
                        this.text.html(text);
                    }
                }
            }
            if (removeCls === 'refreshing') {
                if (type === 3 || type === 4) {
                    this.time.html(utils.time());
                }
            }
            utils.addClass(this.scroller, addCls);
            utils.removeClass(this.scroller, removeCls);
        },
        _initRefresh: function () {
            this._refresyLayout();

            /* beforeScrollStart 
             * scrollStart
             * scroll
             * scrollCancel
             * scrollEnd
             * destroy */

            // pull-down  pull-up
            this.on('scroll', function () {
                if (utils.hasClass(this.scroller, 'refreshing')) {
                    return;
                }
                // bug 当回弹时出现
                if (this.y > this.triggerDistance) {
                    this._refreshRepaint('pull-up', 'pull-down');
                }
                else {
                    this._refreshRepaint('pull-down', 'pull-up');
                }
            });

            // refreshing
            this.on('refresh', function () {
                if (utils.hasClass(this.scroller, 'refreshing')) {
                    return;
                }
                if (utils.hasClass(this.scroller, 'pull-up') && this.y > this.triggerDistance) {
                    this._refreshRepaint('refreshing', 'pull-up');
                    $.proxy(this.options.onRefresh, this)();
                }
            });

            this.on('scrollEnd', function () {
                if (utils.hasClass(this.scroller, 'pull-down')) {
                    this._refreshRepaint(null, 'pull-down');
                }
            });
        },
        // reset refresh
        reset: function () {
            this._refreshRepaint(null, 'refreshing');
            if (!this.isAnimating) {
                this.resetPosition(this.options.bounceTime);
            }
        },
        handleEvent: function (e) {
            switch (e.type) {
                case 'touchstart':
                    this._start(e);
                    break;
                case 'touchmove':
                    this._move(e);
                    break;
                case 'touchend':
                case 'touchcancel':
                    if (this.triggerEnd) {
                        break;
                    }
                    this._end(e);
                    break;
                case 'transitionend':
                case 'webkitTransitionEnd':
                case 'oTransitionEnd':
                case 'MSTransitionEnd':
                    this._transitionEnd(e);
                    break;
            }
        }
    };

    $.PullToRefresh = PullToRefresh;

    // 预加载图标
    $(function () {
        var icons = [];
        icons.push('<div class="hidden-icons">');
        icons.push('<img src="');
        icons.push("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%201024%201024'%3E%3Cpath%20d%3D'M680.471273%20722.269091l-163.816727%20204.8-163.816727-204.8%20122.856727%200L475.694545%20107.938909l81.92%200%200%20614.330182L680.471273%20722.269091z'%20fill%3D'%238c8c8c'%3E%3C%2Fpath%3E%3C%2Fsvg%3E")
        icons.push('">');
        icons.push('<img src="');
        icons.push("data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D'0%200%20120%20120'%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20xmlns%3Axlink%3D'http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink'%3E%3Cdefs%3E%3Cline%20id%3D'l'%20x1%3D'60'%20x2%3D'60'%20y1%3D'7'%20y2%3D'27'%20stroke%3D'%236c6c6c'%20stroke-width%3D'11'%20stroke-linecap%3D'round'%2F%3E%3C%2Fdefs%3E%3Cg%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.27'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.27'%20transform%3D'rotate(30%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.27'%20transform%3D'rotate(60%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.27'%20transform%3D'rotate(90%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.27'%20transform%3D'rotate(120%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.27'%20transform%3D'rotate(150%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.37'%20transform%3D'rotate(180%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.46'%20transform%3D'rotate(210%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.56'%20transform%3D'rotate(240%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.66'%20transform%3D'rotate(270%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.75'%20transform%3D'rotate(300%2060%2C60)'%2F%3E%3Cuse%20xlink%3Ahref%3D'%23l'%20opacity%3D'.85'%20transform%3D'rotate(330%2060%2C60)'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")
        icons.push('">');
        icons.push('</div>');
        $(icons.join(''));
    });
}(jQuery, window, document, Math);
