// below is the plugin code
'use strict';

var TH_Slider = (function () {

    const PARENT = document.querySelector('#TH-slider');

    var TH_SlideShow = function (settings) {
        var _ = this;
        _.options = {
            target: PARENT.querySelector('.slider'),
            dotsWrapper: PARENT.querySelector('.dots-wrapper'),
            arrowLeft: PARENT.querySelector('.arrow-left'),
            arrowRight: PARENT.querySelector('.arrow-right'),
            speed: 500,
            easing: "",
            delay: 3500,
            autoHeight: true,
            slideH: parseInt(PARENT.querySelector('.slider').offsetHeight),
            curSlide: 0,
            swipe: true,
            autoplay: true,
            interval: null,
            stopInterval: false,
            isDots: true,
            isArrows: true,
            isResize: null,
        };
        _.def = _.merge(_.options, settings);

        _.setBackgroundImage();

        window.addEventListener("resize", TH_resize(function () {
            _.setBackgroundImage();
        }), false);


        _.init();

        _.autoplay();

    }

    TH_SlideShow.prototype.merge = function (obj1, obj2) {
        return {...obj1, ...obj2}
    };

    TH_SlideShow.prototype.init = function () {
        var _ = this;

        var nowHTML = _.def.target.innerHTML;
        _.def.target.innerHTML = '<div class="slider-inner">' + nowHTML + '</div>';

        _.totalSlides = _.def.target.querySelectorAll(".slide").length;

        _.curBottom = 0;

        _.sliderInner = PARENT.querySelector('.slider-inner');

        var cloneFirst = PARENT.querySelectorAll('.slide')[0].cloneNode(true);
        _.sliderInner.appendChild(cloneFirst);

        var cloneLast = _.def.target.querySelectorAll('.slide')[_.totalSlides - 1].cloneNode(true);
        _.sliderInner.insertBefore(cloneLast, _.sliderInner.firstChild);

        _.def.curSlide++;

        _.allSlides = PARENT.querySelectorAll('.slide');

        _.sliderInner.style.height = (_.totalSlides + 2) * 100 + "%";

        _.sliderInner.style.bottom = 0;

        for (var i = 0; i < _.allSlides.length; i++) {
            _.allSlides[i].style.height = 100 / (_.totalSlides + 2) + "%";
        }

        var display = _.def.isArrows ? 'block' : 'none';
        _.def.arrowLeft.style.display = display;
        _.def.arrowRight.style.display = display;

        _.initArrows();
        _.buildDots();
        _.setDot(1);

        window.addEventListener("resize", TH_resize(function () {
            _.updateSliderDimension();

            setTimeout(function () {
                _.autoplay();
            }, _.def.delay);

        }), false);

        if (_.def.swipe) {
            addListenerMulti(_.sliderInner, 'mousedown touchstart', startSwipe);
        }

        function addListenerMulti(el, s, fn) {
            s.split(' ').forEach(function (e) {
                return el.addEventListener(e, fn, false);
            });
        }

        function removeListenerMulti(el, s, fn) {
            s.split(' ').forEach(function (e) {
                return el.removeEventListener(e, fn, false);
            });
        }

        _.isSwiping = false;

        function startSwipe(e) {
            var touch = e;
            _.getCurBottom();
            if (!_.isSwiping) {
                if (e.type == 'touchstart') {
                    touch = e.targetTouches[0] || e.changedTouches[0];
                }
                _.startY = touch.pageY;
                addListenerMulti(_.sliderInner, 'mousemove touchmove', swipeMove);
                addListenerMulti(document.querySelector('body'), 'mouseup touchend', swipeEnd);
            }
        }

        function swipeMove(e) {
            var touch = e;
            if (e.type == 'touchmove') {
                touch = e.targetTouches[0] || e.changedTouches[0];
            }
            _.moveY = touch.pageY;

            if (Math.abs(_.moveY - _.startY) < 40) return;

            _.isSwiping = true;
            TH_addClass(_.def.target, 'isSwiping');
        }

        function swipeEnd(e) {

            _.getCurBottom();

            if (Math.abs(_.moveY - _.startY) === 0) return;

            _.stayAtCur = Math.abs(_.moveY - _.startY) < 40 || typeof _.moveY === "undefined" ? true : false;

            if (!_.stayAtCur) {
                if (_.startY > _.moveY) {
                    clearInterval(_.def.interval);

                    if (_.def.curSlide == 1) {
                        _.def.curSlide = _.totalSlides + 1;
                        _.sliderInner.style.bottom = -_.def.curSlide * _.def.slideH + 'px';
                    }

                    _.def.curSlide--;
                    setTimeout(function () {
                        _.gotoSlide();
                    }, 20);

                    setTimeout(function () {
                        _.autoplay();
                    }, _.def.delay);
                }

                if (_.startY < _.moveY) {

                    clearInterval(_.def.interval);

                    if (_.def.curSlide == _.totalSlides) {
                        _.def.curSlide = 0;
                        _.sliderInner.style.bottom = -_.def.curSlide * _.def.slideH + 'px';
                    }

                    _.def.curSlide++;
                    setTimeout(function () {
                        _.gotoSlide();
                    }, 20);

                    setTimeout(function () {
                        _.autoplay();
                    }, _.def.delay);
                }
            }

            delete _.startY;
            delete _.moveY;

            _.isSwiping = false;
            TH_removeClass(_.def.target, 'isSwiping');
            removeListenerMulti(_.sliderInner, 'mousemove touchmove', swipeMove);
            removeListenerMulti(document.querySelector('body'), 'mouseup touchend', swipeEnd);
        }
    };

    TH_SlideShow.prototype.getCurBottom = function () {
        var _ = this;
        _.curBottom = parseInt(_.sliderInner.style.bottom.split('px')[0]);
    };

    TH_SlideShow.prototype.setBackgroundImage = function () {
        var images = PARENT.querySelectorAll(".slide");

        if (window.innerWidth <= 767.98 || document.body.clientWidth <= 767.98 || document.documentElement.clientWidth <= 767.98) {
            for (let j = 0; j < images.length; j++) {
                let image = images[j].getAttribute('slide-sp') ? images[j].getAttribute('slide-sp') : images[j].getAttribute('slide-pc');
                images[j].style.backgroundImage = 'url(' + image + ')';
            }
        } else {
            for (let j = 0; j < images.length; j++) {
                images[j].style.backgroundImage = 'url(' + images[j].getAttribute('slide-pc') + ')';
            }
        }

    };

    TH_SlideShow.prototype.updateSliderDimension = function () {
        var _ = this;

        clearInterval(_.def.interval);
        _.def.curSlide = 1;
        _.sliderInner.style.bottom = 0;

        _.def.slideH = parseInt(PARENT.querySelector('.slider').offsetHeight);

        for (var i = 0; i < _.allSlides.length; i++) {
            _.allSlides[i].style.height = 100 / (_.totalSlides + 2) + "%";
        }
    };

    TH_SlideShow.prototype.buildDots = function () {
        var _ = this;

        _.def.isDots ? _.def.dotsWrapper.style.display = 'block' : _.def.dotsWrapper.style.display = 'none';

        for (var i = 0; i < _.totalSlides; i++) {
            var dot = document.createElement('li');
            dot.setAttribute('data-slide', i + 1);
            _.def.dotsWrapper.appendChild(dot);
        }

        _.def.dotsWrapper.addEventListener('click', function (e) {

            if (e.target && e.target.nodeName == "LI") {
                clearInterval(_.def.interval);

                _.def.curSlide = e.target.getAttribute('data-slide');
                setTimeout(function () {
                    _.gotoSlide();
                }, 20);

                setTimeout(function () {
                    _.autoplay();
                }, _.def.delay);
            }
        }, false);
    };

    TH_SlideShow.prototype.setDot = function (curSlide) {
        var _ = this;
        var tardot = curSlide - 1;

        for (var j = 0; j < _.totalSlides; j++) {
            TH_removeClass(_.def.dotsWrapper.querySelectorAll('li')[j], 'active');
        }

        if (_.def.curSlide - 1 < 0) {
            tardot = _.totalSlides - 1;
        } else if (_.def.curSlide - 1 > _.totalSlides - 1) {
            tardot = 0;
        }

        TH_addClass(_.def.dotsWrapper.querySelectorAll('li')[tardot], 'active');
    };

    TH_SlideShow.prototype.initArrows = function () {
        var _ = this;

        if (_.def.arrowLeft != '') {
            _.def.arrowLeft.addEventListener('click', function () {
                if (!TH_hasClass(_.def.target, 'isSwiping')) {

                    clearInterval(_.def.interval);

                    if (_.def.curSlide == 1) {
                        _.def.curSlide = _.totalSlides + 1;
                        _.sliderInner.style.bottom = -_.def.curSlide * _.def.slideH + 'px';
                    }

                    _.def.curSlide--;
                    setTimeout(function () {
                        _.gotoSlide();
                    }, 20);

                    setTimeout(function () {
                        _.autoplay();
                    }, _.def.delay);
                }
            }, false);
        }

        if (_.def.arrowRight != '') {
            _.def.arrowRight.addEventListener('click', function () {
                if (!TH_hasClass(_.def.target, 'isSwiping')) {

                    clearInterval(_.def.interval);

                    if (_.def.curSlide == _.totalSlides) {
                        _.def.curSlide = 0;
                        _.sliderInner.style.bottom = -_.def.curSlide * _.def.slideH + 'px';
                    }

                    _.def.curSlide++;
                    setTimeout(function () {
                        _.gotoSlide();
                    }, 20);

                    setTimeout(function () {
                        _.autoplay();
                    }, _.def.delay);
                }
            }, false);
        }
    };

    TH_SlideShow.prototype.gotoSlide = function () {
        var _ = this;

        _.sliderInner.style.bottom = -_.def.curSlide * _.def.slideH + "px";
        _.sliderInner.style.transition = "bottom " + _.def.speed / 1000 + "s " + _.def.easing;

        TH_addClass(_.def.target, "isSwiping");
        setTimeout(function () {
            _.sliderInner.style.transition = "";
            TH_removeClass(_.def.target, "isSwiping");
            _.setDot(_.def.curSlide);
        }, _.def.speed);
    };

    TH_SlideShow.prototype.autoplay = function () {
        var _ = this;

        if (!_.def.autoplay) {
            return;
        }

        clearInterval(_.def.interval);
        _.def.interval = setInterval(function () {
            if (_.def.curSlide == _.totalSlides) {
                _.def.curSlide = 0;
                _.sliderInner.style.bottom = -_.def.curSlide * _.def.slideH + 'px';
            }

            _.def.curSlide++;

            setTimeout(function () {
                _.gotoSlide();
                _.setDot(_.def.curSlide);
            }, 20);

        }, _.def.delay);
    };

    function TH_hasClass(el, className) {
        return el.classList ? el.classList.contains(className) : new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }

    function TH_addClass(el, className) {
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    }

    function TH_removeClass(el, className) {
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    function TH_resize(c, t) {
        onresize = function () {
            clearTimeout(t);
            t = setTimeout(c, 100);
        };

        return onresize;
    }

    return TH_SlideShow;

})();




