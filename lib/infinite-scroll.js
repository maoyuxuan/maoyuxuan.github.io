/* ===============================================================================
************  Infinite Scroll   ************
=============================================================================== */
+ function ($) {
    'use strict';
    /* $.InfiniteScroll(selector[, pageCount][, delay])
     * @param {selector} string 滚动容器
     * @param {pageCount} int 可选 分页总数
     * @param {delay} boolean 可选  延迟加载数据true：1、存在pageCount参数，滚动加载从第二页数据开始；2、不存在pageCount，仅初始化滚动事件
     * @param {onInfinite} function 必填  状态“正在加载”回调函数
     */
    var InfiniteScroll = function (selector, pageCount, delay, onInfinite) {
        if (arguments.length == 0) return;
        this.init.apply(this, arguments);
    };
    InfiniteScroll.prototype = {
        init: function () {
            var self = this, count, delay = false;

            this.loading = false;  // 正在加载数据
            this.page = { index: 1, count: 0 };

            for (var i = 0; i < arguments.length; i++) {
                var arg = arguments[i];
                switch (typeof arg) {
                    case 'object':
                    case 'string': self.container = $(arg); break;
                    case 'number': count = self.page.count = arg; break;
                    case 'boolean': delay = arg; break;
                    case 'function': self.onInfinite = $.proxy(arg, self.container[0]); break;
                }
            }
            if (!delay) {
                self.layout('initing');
                this.dataHandler();
            }
            else if (count != undefined) {
                self.update(count > 1);
            }
        },
        reinit: function (pageCount, delay) {
            this.detacheEvents();
            this.init.apply(this, arguments);
        },
        update: function () {
            var self = this, page = this.page;
            if (page.count == 0) {
                self.layout('finished', true);
                return;
            }
            if (page.index == page.count) {
                self.layout('finished');
                return;
            }
            if (arguments[0]) {
                self.layout('initing');
            }
            page.index++;
        },
        layout: function (status, remove) {
            var self = this,
                container = self.container,
                layer = $('.infinite-scroll-layer', container)[0];

            if (!layer) {
                layer = $('<div class="infinite-scroll-layer"></div>').appendTo(container)[0];
            }
            switch (status) {
                case 'initing':
                    layer.innerHTML = '<div class="preloader"></div>';
                    self.attachEvents();
                    break;
                case 'finished':
                    self.detacheEvents();
                    if (remove) {
                        $(layer).remove();
                        break;
                    }
                    layer.innerHTML = '加载完成';
                    break;
            }
        },
        dataHandler: function () {
            if (this.loading) return;

            var self = this;
            self.loading = true;

            self.onInfinite(self.page, function () {
                self.loading = false;
                self.update();
            });
        },
        eventHandler: function (event) {
            var self = this, container = self.container;

            var scrollTop = container.scrollTop(),
                scrollHeight = container.scrollHeight(),
                height = container[0].offsetHeight,
                distance = container[0].getAttribute('data-distance'),
                onTop = container.hasClass('infinite-scroll-top');

            var virtualListContainer = container.find('.virtual-list'),
                virtualList;

            if (!distance) distance = 50;
            if (typeof distance === 'string' && distance.indexOf('%') >= 0) {
                distance = parseInt(distance, 10) / 100 * height;
            }
            if (distance > height) distance = height;
            if (onTop) {
                if (scrollTop < distance) {
                    self.dataHandler();
                }
            } else {
                if (scrollTop + height >= scrollHeight - distance) {
                    if (virtualListContainer.length > 0) {
                        virtualList = virtualListContainer[0].f7VirtualList;
                        if (virtualList && !virtualList.reachEnd) return;
                    }

                    self.dataHandler();
                }
            }
        },
        attachEvents: function (destroy) {
            var self = this,
                container = self.container,
                method = destroy ? 'off' : 'on',
                _eventHandler = $.proxy(self.eventHandler, self);

            container[method]('scroll', method == 'on' ? $.debounce(250, _eventHandler) : _eventHandler);
        },
        detacheEvents: function () {
            this.attachEvents(true);
        }
    };

    $.InfiniteScroll = InfiniteScroll;
}(jQuery);