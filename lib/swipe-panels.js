/*======================================================
************   Swipe panels   ************
======================================================*/
+function ($) {
    "use strict";

    function SwipePanels() {
        this.allowOpen = true;
        this.swipePanel = 'left'; //滑动打开侧栏
        this.swipePanelOnlyClose = true; //只允许滑动关闭，不允许滑动打开侧栏
        this.swipePanelCloseOpposite = true;
        this.swipePanelActiveArea = 0;
        this.swipePanelNoFollow = false;
        this.swipePanelThreshold = 2;
        this.init();
    }

    // open panel
    SwipePanels.prototype.open = function (panelPosition) {
        var swp = this;
        if (!swp.allowOpen) return false;
        var panel = $('.panel-' + panelPosition);
        if (panel.length === 0 || panel.hasClass('active')) return false;
        swp.close(); // Close if some panel is opened
        swp.allowOpen = false;
        var effect = panel.hasClass('panel-reveal') ? 'reveal' : 'cover';
        panel.css({ display: 'block' }).addClass('active');
        panel.trigger('open');

        // Trigger reLayout
        var clientLeft = panel[0].clientLeft;

        // Transition End;
        var transitionEndTarget = effect === 'reveal' ? $($.getCurrentPage()) : panel;
        var openedTriggered = false;

        function panelTransitionEnd() {
            transitionEndTarget.transitionEnd(function (e) {
                if ($(e.target).is(transitionEndTarget)) {
                    if (panel.hasClass('active')) {
                        panel.trigger('opened');
                    }
                    else {
                        panel.trigger('closed');
                    }
                    swp.allowOpen = true;
                }
                else panelTransitionEnd();
            });
        }
        panelTransitionEnd();

        $('body').addClass('with-panel-' + panelPosition + '-' + effect);
        return true;
    };

    // close panel
    SwipePanels.prototype.close = function () {
        var swp = this;
        var activePanel = $('.panel.active');
        if (activePanel.length === 0) return false;
        var effect = activePanel.hasClass('panel-reveal') ? 'reveal' : 'cover';
        var panelPosition = activePanel.hasClass('panel-left') ? 'left' : 'right';
        activePanel.removeClass('active');
        var transitionEndTarget = effect === 'reveal' ? $('.page') : activePanel;
        activePanel.trigger('close');
        swp.allowOpen = false;

        transitionEndTarget.transitionEnd(function () {
            if (activePanel.hasClass('active')) return;
            activePanel.css({ display: '' });
            activePanel.trigger('closed');
            $('body').removeClass('panel-closing');
            swp.allowOpen = true;
        });

        $('body').addClass('panel-closing').removeClass('with-panel-' + panelPosition + '-' + effect);
    };


    SwipePanels.prototype.init = function () {
        var swp = this;
        var panel, side;

        side = swp.swipePanel;
        panel = $('.panel.panel-' + side);

        //if (panel.length === 0) return;

        var currentPage;
        var panelOverlay = $('<div class="panel-overlay"></div>').prependTo(document.body);
        var isTouched, isMoved, isScrolling, touchesStart = {}, touchStartTime, touchesDiff, translate, overlayOpacity, opened, panelWidth, effect, direction;

        function handleTouchStart(e) {
            currentPage = $($.getCurrentPage());  //page may changed

            if (!swp.allowOpen || (!side && !swp.swipePanelOnlyClose) || isTouched) return;
            if ($('.modal-in, .photo-browser-in').length > 0) return;
            if (!(swp.swipePanelCloseOpposite || swp.swipePanelOnlyClose)) {
                if ($('.panel.active').length > 0 && !panel.hasClass('active')) return;
            }
            var position = $.getTouchPosition(e);
            touchesStart.x = position.x;
            touchesStart.y = position.y;
            if (swp.swipePanelCloseOpposite || swp.swipePanelOnlyClose) {
                if ($('.panel.active').length > 0) {
                    side = $('.panel.active').hasClass('panel-left') ? 'left' : 'right';
                }
                else {
                    if (swp.swipePanelOnlyClose) return;
                    side = swp.swipePanel;
                }
                if (!side) return;
            }
            panel = $('.panel.panel-' + side);
            opened = panel.hasClass('active');
            if (swp.swipePanelActiveArea && !opened) {
                if (side === 'left') {
                    if (touchesStart.x > swp.swipePanelActiveArea) return;
                }
                if (side === 'right') {
                    if (touchesStart.x < window.innerWidth - swp.swipePanelActiveArea) return;
                }
            }
            isMoved = false;
            isTouched = true;
            isScrolling = undefined;

            touchStartTime = (new Date()).getTime();
            direction = undefined;
        }
        function handleTouchMove(e) {
            if (!isTouched) return;
            if (e.f7PreventPanelSwipe) return;
            var position = $.getTouchPosition(e);
            var pageX = position.x;
            var pageY = position.y;
            if (typeof isScrolling === 'undefined') {
                isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
            }
            if (isScrolling) {
                isTouched = false;
                return;
            }
            if (!direction) {
                if (pageX > touchesStart.x) {
                    direction = 'to-right';
                }
                else {
                    direction = 'to-left';
                }

                if (
                    side === 'left' &&
                    (
                        direction === 'to-left' && !panel.hasClass('active')
                    ) ||
                    side === 'right' &&
                    (
                        direction === 'to-right' && !panel.hasClass('active')
                    )
                ) {
                    isTouched = false;
                    return;
                }
            }

            if (swp.swipePanelNoFollow) {
                var timeDiff = (new Date()).getTime() - touchStartTime;
                if (timeDiff < 300) {
                    if (direction === 'to-left') {
                        if (side === 'right') swp.open(side);
                        if (side === 'left' && panel.hasClass('active')) swp.close();
                    }
                    if (direction === 'to-right') {
                        if (side === 'left') swp.open(side);
                        if (side === 'right' && panel.hasClass('active')) swp.close();
                    }
                }
                isTouched = false;
                isMoved = false;
                return;
            }

            if (!isMoved) {
                effect = panel.hasClass('panel-cover') ? 'cover' : 'reveal';
                if (!opened) {
                    panel.show();
                    panelOverlay.show();
                }
                panelWidth = panel[0].offsetWidth;
                panel.transition(0);
            }

            isMoved = true;

            e.preventDefault();
            var threshold = opened ? 0 : -swp.swipePanelThreshold;
            if (side === 'right') threshold = -threshold;

            touchesDiff = pageX - touchesStart.x + threshold;

            if (side === 'right') {
                translate = touchesDiff - (opened ? panelWidth : 0);
                if (translate > 0) translate = 0;
                if (translate < -panelWidth) {
                    translate = -panelWidth;
                }
            }
            else {
                translate = touchesDiff + (opened ? panelWidth : 0);
                if (translate < 0) translate = 0;
                if (translate > panelWidth) {
                    translate = panelWidth;
                }
            }
            if (effect === 'reveal') {
                currentPage.transform('translate3d(' + translate + 'px,0,0)').transition(0);
                panelOverlay.transform('translate3d(' + translate + 'px,0,0)').transition(0);

            }
            else {
                panel.transform('translate3d(' + translate + 'px,0,0)').transition(0);
            }
        }
        function handleTouchEnd(e) {
            if (!isTouched || !isMoved) {
                isTouched = false;
                isMoved = false;
                return;
            }
            isTouched = false;
            isMoved = false;
            var timeDiff = (new Date()).getTime() - touchStartTime;
            var action;
            var edge = (translate === 0 || Math.abs(translate) === panelWidth);

            if (!opened) {
                if (translate === 0) {
                    action = 'reset';
                }
                else if (
                    timeDiff < 300 && Math.abs(translate) > 0 ||
                    timeDiff >= 300 && (Math.abs(translate) >= panelWidth / 2)
                ) {
                    action = 'swap';
                }
                else {
                    action = 'reset';
                }
            }
            else {
                if (translate === -panelWidth) {
                    action = 'reset';
                }
                else if (
                    timeDiff < 300 && Math.abs(translate) >= 0 ||
                    timeDiff >= 300 && (Math.abs(translate) <= panelWidth / 2)
                ) {
                    if (side === 'left' && translate === panelWidth) action = 'reset';
                    else action = 'swap';
                }
                else {
                    action = 'reset';
                }
            }
            if (action === 'swap') {
                swp.allowOpen = true;
                if (opened) {
                    swp.close();
                    if (edge) {
                        panel.css({ display: '' });
                        $('body').removeClass('panel-closing');
                    }
                }
                else {
                    swp.open(side);
                }
                if (edge) swp.allowOpen = true;
            }
            if (action === 'reset') {
                if (opened) {
                    swp.allowOpen = true;
                    swp.open(side);
                }
                else {
                    swp.close();
                    if (edge) {
                        swp.allowOpen = true;
                        panel.css({ display: '' });
                    }
                    else {
                        var target = effect === 'reveal' ? currentPage : panel;
                        $('body').addClass('panel-closing');
                        target.transitionEnd(function () {
                            swp.allowOpen = true;
                            panel.css({ display: '' });
                            $('body').removeClass('panel-closing');
                        });
                    }
                }
            }
            if (effect === 'reveal') {
                currentPage.transition('');
                currentPage.transform('');
            }
            panel.transition('').transform('');
            panelOverlay.css({ display: '' }).transform('').transition('').css('opacity', '');
        }
        $(document).on($.touchEvents.start, handleTouchStart);
        $(document).on($.touchEvents.move, handleTouchMove);
        $(document).on($.touchEvents.end, handleTouchEnd);
    };

    $(function () {
        var swipePanels = new SwipePanels();

        $(document).on('click', '.open-panel', function () {
            if ($('.panel').length === 1) {
                if ($('.panel').hasClass('panel-left')) swipePanels.open('left');
                else swipePanels.open('right');
            }
            else {
                if ($(this).data('panel') === 'right') swipePanels.open('right');
                else swipePanels.open('left');
            }
        })
        .on('click', '.close-panel,.panel-overlay', function () {
            swipePanels.close();
        });

        // Prevent scrolling
        if (!$.device.android) {
            $(document).on($.touchEvents.start, '.panel-overlay', function (e) {
                e.preventDefault();
            });
        }
    });
}(jQuery);
