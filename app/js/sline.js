/**
 * Created by JIAQIANG on 2015/10/19.
 */
(function ($, window, undefined) {
    'use strict';
    var dom = X.dom;

    var COLOR_M = '#FF0000', //中线
        COLOR_W = '#F2F2F2', //外线
        COLOR_S = '#F8F8F8', //网格线W
        COLOR_P = '#3788CB', //分时线
        COLOR_Q = '#546980', //十字线
        COLOR_H = '#D0402D',//
        COLOR_L = '#01B28E',//
        COLOR_B = '#333333',
        COLOR_T = '#999999';

    var Sline = function (opts) {
        //物理值
        this.wrap = document.getElementById(opts.wrap) || document.body;
        this.svg = dom.createNS('svg');
        this.baseG = dom.createNS('g');//框架分组
        this.chartG = dom.createNS('g');//图形分组
        this.textG = dom.createNS('g');//标记分组
        this.hoverG = dom.createNS('g');//触摸提示分组
        this.pathEl = null;//分时图path
        this.pathBgEl = null;//分时图背景path
        this.cacheEl = [];//其他需要实时更新的缓存元素
        this.cacheData = [];//[x,y,current,time]缓存计算数据，用于十字线显示

        //数据值
        this.period = opts.period || [['09:30', '11:30'], ['13:00', '15:00']];
        this.periodIntl = [];
        this.isStock = false;//是否是股票
        this.data = opts.data || {};//行情的数据{930:{current:float, volume:float, time:number}}
        this.code = '';//行情代码
        this.moments = null;//行情绘制的总的时间单位数组[number]
        this.quoteTime = null;//行情的最后时间
        this.close = 0;

        this.maxPrice = 0; //数据组中的最高价格
        this.minPrice = 0; //数据组中的最低价格
        this.beginPrice = 0; //A股里的开始价格，因为A股的行情是对等分段，即涨跌区域上下一致，而外盘的是可以不对等分段的
        this.endPrice = 0; //结束价格

        this.totalHours = 4;//长时间交易的时段数
        this.PART = 8;//价格分段
        this.scale = opts.scale != undefined ? opts.scale : 2;//数值小数位数
        this.showHeartBeat = true;
        this.init();
    };

    Sline.prototype = {
        init: function () {
            dom.attr(this.svg, {'xmlns': 'http://www.w3.org/2000/svg', 'version': '1.1'});
            this.svg.appendChild(this.baseG);
            this.svg.appendChild(this.chartG);
            this.svg.appendChild(this.textG);
            this.svg.appendChild(this.hoverG);
            this.wrap.appendChild(this.svg);

            //this.svg.appendChild(this.gPricesEl);
            //分段时间转换为基本单元
            //this.moments = this._period2moments();
            //计算布局框架
            this.resize();
            //画主面板
            this._drawFrame();
            //画价格线
            this._drawBasePriceLine();
            //加载提示元素
            this._reticle()
        },
        resize: function () {
            var padding = 0;
            this.svgWidth = dom.getSize(this.wrap).width;
            this.svgHeight = dom.getSize(this.wrap).height;

            this.priceChartBox = {
                x: {
                    begin: padding,
                    end: this.svgWidth - padding,
                    width: this.svgWidth - padding * 2
                },
                y: {
                    begin: padding,
                    end: this.svgHeight - padding - 20,
                    height: this.svgHeight - padding * 2 - 20
                }
            };
        },
        /**
         * 已有数据直接画
         * @param opts Object
         * opts {
         *  data: {
         *      current: float,
                volume: float,
                time: number
         *  },
            close: float,
            high: float,
            low: float,
            quoteTime: number,
            code: String,
            period: array,
            isIntl: true
         * }
         */
        draw: function (opts) {
            this._draw(opts);
        },
        /**
         * 新数据增量画
         * @param data Object
         * data: {
         *      current: float,
                volume: float,
                time: number
         *  }
         * @param opts Object
         * opts {
            close: float,
            high: float,
            low: float,
            quoteTime: number,
            code: String,
            period: array,
            isIntl: true
         * }
         */
        perDraw: function (data, opts) {
            this.data[data.time] = data;
            this._draw(opts);
        },
        /**
         * 分时图绘制的主方法
         * @param opts
         * @private
         */
        _draw: function (opts) {
            this.process(opts);
            this._clear();
            // var flag;
            // for (var key in this.data) {
            //     flag = true;
            //     break;
            // }
            //X.log(this.data)
            if (Object.keys(this.data).length) {
                //画时间段线
                this._drawPeriodLine();
                this._drawChart();
                if (this.isStock) {
                    this._drawChartData();
                } else {
                    this._drawIntlChartData();
                }
            }
        },
        /**
         * 加工数据
         * @param opts object
         */
        process: function (opts) {
            if (opts) {
                this._setConfig(opts);
            }
            if (opts && opts.data) {
                this.data = opts.data;
            }

            this._setMaxMin();
            this._setBEPrice();
        },
        /**
         * 清空缓存数据和擦除已经过时的标签
         * 该方法的实现主要依赖与cacheEl（array），所有可能被清除的数据和标签都存在这个缓存数组里
         * @private
         */
        _clear: function () {
            $.each(this.cacheEl, function (i, el) {
                el && dom.remove(el);
            });
            this.cacheEl.length = 0;
        },
        _reticle: function () {
            var t = this, g = t.hoverG;
            t.hLineEl = t._line(g, 0, 0, 0, 0, COLOR_Q);
            t.vLineEl = t._line(g, 0, 0, 0, 0, COLOR_Q);
            t.priceRectEl = t._rect(g, -100, 0, 0, 13, 2, 2, COLOR_Q);
            t.timeRectEl = t._rect(g, -100, 0, 32, 13, 2, 2, COLOR_Q);
            t.priceTextEl = t._text(g, -100, 0, '100', '#FFF');
            t.timeTextEl = t._text(g, -100, 0, '100', '#FFF');
            t._wait();
        },
        _wait: function () {
            var t = this, cacheData = t.cacheData, isMobile = X.browser.mobile,
                startTime, tapping = false, timer1,
                top = $(t.svg).offset().top,
                left = $(t.svg).offset().left,
                touchstart = isMobile ? "touchstart" : "mousedown",
                touchend = isMobile ? "touchend" : "mouseup",
                touchmove = isMobile ? "touchmove" : "mousemove";

            $(t.svg).on(touchstart, function (e) {
                e.stopPropagation();
                startTime = Date.now();
                timer1 = setTimeout(function(){
                    tapping = true;
                    var ev = !isMobile ? e : e.originalEvent.touches[0];
                    t._handler(cacheData, ev.pageX, ev.pageY, top, left);
                }, 500);
            }).on(touchend, function (e) {
                var diff = Date.now() - startTime;
                if (tapping && diff < 500) {
                    tapping = false;
                    timer1 && clearTimeout(timer1);
                    t._handler([], 0, 0, 0, 0);
                }
            }).on(touchmove, function (e) {
                e.preventDefault();//阻止滑动默认行为
                if(tapping){
                    var ev = !isMobile ? e : e.originalEvent.touches[0];
                    t._handler(cacheData, ev.pageX, ev.pageY, top, left);
                }
            })
        },
        _handler: function (cacheData, pageX, pageY, top, left) {
            var t = this, box = t.priceChartBox, bx = box.x, by = box.y, width = bx.width, height = by.height;
            //修正坐标
            pageX = pageX - left;
            pageY = pageY - top;
            var data = t._getCacheData(cacheData, pageX);
            //限制坐标范围
            pageY = height >= pageY ? pageY : height;
            pageY = 0 <= pageY ? pageY : 0;
            pageX = width >= pageX ? pageX : width;
            pageX = 0 <= pageX ? pageX : 0;

            var time = t._toTime(data[3]);
            var pirce = t._getPrice(pageY, height);
            var pirceWidth = t._getTextWidth(pirce);
            var timeX = data[0] - 16 < 0 ? 0 : data[0] + 16 > width ? width - 32 : data[0] - 16;
            var priceX = pageX < width / 2 ? width - pirceWidth : 0;
            var priceY = pageY - 6.5 < 0 ? 0 : pageY - 6.5;

            if(!cacheData.length){
                pageY = -1000;
                timeX = -1000;
                priceX = -1000;
                priceY = -1000;
            }

            dom.attr(t.hLineEl, {
                x1: bx.begin,
                y1: t.half(pageY),
                x2: bx.end,
                y2: t.half(pageY)
            });

            dom.attr(t.vLineEl, {
                x1: t.half(data[0]),
                y1: by.begin,
                x2: t.half(data[0]),
                y2: by.end
            });

            //时间
            dom.attr(t.timeRectEl, {
                x: timeX,
                y: by.end
            });

            dom.attr(t.timeTextEl, {
                x: timeX + 1,
                y: by.end + 10.5
            });
            dom.textContent(t.timeTextEl, time);

            //价格
            dom.attr(t.priceRectEl, {
                x: priceX,
                y: priceY,
                width: pirceWidth
            });
            dom.attr(t.priceTextEl, {
                x: priceX + 1,
                y: priceY + 11
            });
            dom.textContent(t.priceTextEl, pirce);
        },
        _getCacheData: function (data, pageX) {
            var result = [-1e3, -1e3, 0, 0], len = data.length, x1, x2, first, last, w;
            if (len) {
                first = data[0];
                last = data[len - 1];
                x1 = data[0][0];
                x2 = data[1] ? data[1][0] : data[0][0];
                w = (x2 - x1) / 2;

                data.forEach(function (d) {
                    var x = d[0];
                    if (pageX >= x - w && pageX < x + w) {
                        result = d;
                    }
                });

                if (-1e3 === result[0]) {
                    if (pageX <= first[0]) {
                        result = first;
                    } else if (pageX > last[0]) {
                        result = last;
                    }
                }
            }
            return result;
        },
        _getTextWidth: function (txt) {
            var hasPoint = txt.indexOf('.') != -1,
                len = txt.length;
            len = hasPoint ? len - 1 : len;
            return len * 6.8 + (hasPoint ? 3 : 0) + 2;
        },
        _getPrice: function (pageY, height) {
            var t = this,
                bp = t.isStock ? t.beginPrice : t.maxPrice + (t.maxPrice - t.minPrice) * 0.1,
                ep = t.isStock ? t.endPrice : t.minPrice - (t.maxPrice - t.minPrice) * 0.1,
                pageY = pageY > 0 ? pageY : 0,
                diff = bp - ep,
                n = bp - pageY / height * diff;
            return n.toFixed(t.scale);
        },
        _toTime: function (time) {
            var hour = time / 100 | 0, min = time % 100;
            return (10 > hour ? "0" : "") + hour + ":" + (10 > min ? "0" : "") + min;
        },
        _drawFrame: function () {
            var t = this, g = t.baseG, pbox = t.priceChartBox, bx = pbox.x, by = pbox.y, d = '';
            var topLine = 'M' + bx.begin + ',' + t.half(by.begin) + 'L' + bx.end + ',' + t.half(by.begin);
            var rightLine = 'M' + t.half(bx.end) + ',' + by.begin + 'L' + t.half(bx.end) + ',' + by.end;
            var bottomLine = 'M' + bx.end + ',' + t.half(by.end) + 'L' + bx.begin + ',' + t.half(by.end);
            var leftLine = 'M' + t.half(bx.begin) + ',' + by.end + 'L' + t.half(bx.begin) + ',' + by.begin;
            d = topLine + bottomLine;
            var path = this._path(d, COLOR_W, 'none', '');
            dom.append(g, path);
        },
        _drawBasePriceLine: function () {
            var t = this, PART = t.PART,//价格段
                g = t.baseG,
                bx = t.priceChartBox.x,
                by = t.priceChartBox.y;

            var h = (by.height - 2) / PART;//去掉上下1px边框
            for (var i = 1; i < PART; i++) {
                var x1 = bx.begin + 1,
                    y1 = t.half(by.begin + i * h),
                    x2 = bx.end - 1,
                    y2 = y1;
                var d = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
                //区分中线
                //var path = this._path(d, i % (PART / 2) === 0 ? COLOR_M : COLOR_S, 'none', '', '3,1');
                var path = this._path(d, COLOR_S, 'none', '');//, '3,1'
                dom.append(g, path);
            }
        },
        _drawPeriodLine: function () {
            var t = this,
                g = t.baseG,
                cacheEl = t.cacheEl,
                bx = t.priceChartBox.x,
                by = t.priceChartBox.y;

            var period = t.isIntl ? this._parsePeriodIntlToPeriod() : this.period;

            var len = period.length,
                moments = t.moments,
                mlen = moments.length,
                unitWidth = (bx.width - 1) / (mlen - 1),
                last = len - 1, timeObj = {};

            //此处变更了原来的算法，之前的算法是把开始时间和结束时间转换为分钟数，用结束分钟减去开始时间获取总的分钟数
            //因为moments是每分钟一个数据，这样就能获取当前时间段所占的总的份额，但是如果出现跨天的情况就会出现问题
            //因为跨天的时候会出现结束时间减去开始时间为负数的情况。
            period.forEach(function (arr, i) {
                var stime = arr[0], etime = arr[1];
                timeObj[stime] = moments.indexOf(stime.replace(":", "") - 0);
                if (i == last) {
                    timeObj[etime] = mlen - 1;
                }
            });

            var k, v, x, d, path, timeStr, anchor;
            for (k in timeObj) {
                v = timeObj[k];
                x = t.half(v * unitWidth);
                d = 'M' + (bx.begin + x) + ',' + (by.begin + 1) + 'L' + (bx.begin + x) + ',' + (by.end - 1);
                path = t._path(d, COLOR_S, 'none', '');//, '3,1'
                dom.append(g, path);
                cacheEl.push(path);
                anchor = v == 0 ? 'start' : v == (mlen - 1) ? 'end' : 'middle';
                timeStr = t._text(g, (bx.begin + x), by.end + 15, k, COLOR_T, anchor);
                cacheEl.push(timeStr);
            }
        },
        _drawChart: function () {
            this._drawPath();
        },
        _drawPath: function () {
            var t = this,
                data = t.data,
                cacheData = t.cacheData,
                bx = t.priceChartBox.x,
                by = t.priceChartBox.y,
            //外盘当中获取开始结束时间用最大最小值
                bp = t.isStock ? t.beginPrice : t.maxPrice + (t.maxPrice - t.minPrice) * 0.1,
                ep = t.isStock ? t.endPrice : t.minPrice - (t.maxPrice - t.minPrice) * 0.1,
                g = t.chartG,
                moments = t.moments,
                mLen = moments.length,
                last = mLen - 1,
                width = bx.width - 2,//减去主框架边框
                height = by.height - 2;

            var w = width / last;

            cacheData.length = 0;

            var c2x = function (i) {
                    var x = i === 0 ? 0 : i === last ? width : w * i;
                    return (bx.begin + 1 + x).toFixed(4) - 0;
                },
                c2y = function (p) {
                    if (bp == ep) {
                        return height / 2;
                    }
                    var h = (bp - p) / (bp - ep) * height;
                    return (by.begin + 1 + h).toFixed(4) - 0;
                },
                c2close = function (x1, x2) {
                    return 'L' + c2x(x1) + ',' + t.half(by.end) +
                        'L' + c2x(x2) + ',' + t.half(by.end) + 'Z';
                };
            var beginX = 0, lastX = 0, lastObj, x = 0, y = 0, d = '', dz = '';
            moments.forEach(function (time, i) {
                if (!t._isTradeTime(time)) {
                    return false;
                }
                var o = data[time];
                if (o == null) {
                    o = lastObj;
                }

                if (o != null) {
                    if (lastObj === undefined) {
                        d += 'M';
                        beginX = i;
                    } else {
                        d += 'L';
                    }

                    x = c2x(i);
                    y = c2y(o.current);

                    d += x + ',' + y;
                    lastX = i;
                    lastObj = o;

                    cacheData.push([x, y, o.current, time]);
                }
            });

            if (d) {
                dz = d + c2close(lastX, beginX);
                if (this.pathEl == null) {
                    this.pathEl = this._path(d, COLOR_P, 'none', '', '');
                    this.pathBgEl = this._path(dz, 'none', COLOR_P, 0.2, '');
                    dom.append(g, this.pathEl);
                    dom.append(g, this.pathBgEl);
                } else {
                    dom.attr(this.pathEl, 'd', d);
                    dom.attr(this.pathBgEl, 'd', dz);
                }
            }

            t._setHeartBeat(x, y, g);
        },
        _setHeartBeat: function (x, y, g) {
            var t = this;
            //SVG's SMIL animations (<animate>, <set>, etc.) are deprecated and will be removed. Please use CSS animations or Web animations instead.
            var ani = dom.createNS('animate');
            dom.attr(ani, {
                attributeName: "r", values: "1;1.5;1", dur: ".5s", repeatCount: "indefinite"
            });
            x = this.showHeartBeat ? x : -1000;
            if (t.heartbeat) {
                dom.attr(t.heartbeat, {cx: x, cy: y});
            } else {
                t.heartbeat = t._circle({
                    cx: x,
                    cy: y,
                    r: 1,
                    stroke: '#F3976C',
                    fill: '#FF3366',
                    'stroke-width': 1.5
                    //'fill-opacity': 0.2,
                    //'class': 'heartbeat'
                }, g);
                dom.append(t.heartbeat, ani)
            }
        },
        _drawChartData: function () {
            var t = this, g = t.textG, box = t.priceChartBox, bx = box.x, by = box.y, cacheEl = t.cacheEl, close = t.close, max = t.beginPrice, min = t.endPrice;
            var diff = max - close;
            var rote = diff / close * 100;
            var dataCloseEl = t._text(g, bx.begin, by.begin + (by.height / 2) - 3, close.toFixed(2), COLOR_T);
            var dataMaxEl = t._text(g, bx.begin, by.begin + 12, max.toFixed(2), COLOR_H);
            var dataMinEl = t._text(g, bx.begin, by.end - 3, min.toFixed(2), COLOR_L);
            var roteMaxEl = t._text(g, bx.end, by.begin + 12, '+' + rote.toFixed(2) + '%', COLOR_H, 'end');
            var roteMinEl = t._text(g, bx.end, by.end - 3, '-' + rote.toFixed(2) + '%', COLOR_L, 'end');
            var roteCloseEl = t._text(g, bx.end, by.begin + (by.height / 2) - 3, '0.00%', COLOR_T, 'end');
            var line = t._line(g, bx.begin, t.half(by.height / 2), bx.end, t.half(by.height / 2), COLOR_M, '3,1');
            cacheEl.push(line, dataCloseEl, dataMaxEl, dataMinEl, roteMaxEl, roteMinEl, roteCloseEl);
        },
        _drawIntlChartData: function () {
            var t = this,
                g = t.textG,
                box = t.priceChartBox,
                bx = box.x,
                by = box.y,
                cacheEl = t.cacheEl,
                close = t.close,
                max = t.maxPrice + (t.maxPrice - t.minPrice) * 0.1,
                min = t.minPrice - (t.maxPrice - t.minPrice) * 0.1;

            var maxRote = (max - close) / close * 100;
            var minRote = (min - close) / close * 100;
            var MaxTag = maxRote > 0 ? '+' : maxRote < 0 ? '' : '';
            var MinTag = minRote > 0 ? '+' : minRote < 0 ? '' : '';
            var MaxColor = maxRote > 0 ? COLOR_H : maxRote < 0 ? COLOR_L : COLOR_T;
            var MinColor = minRote > 0 ? COLOR_H : minRote < 0 ? COLOR_L : COLOR_T;

            var dataMaxEl = t._text(g, bx.begin, by.begin + 12, max.toFixed(t.scale), MaxColor);
            var dataMinEl = t._text(g, bx.begin, by.end - 3, min.toFixed(t.scale), MinColor);
            var roteMaxEl = t._text(g, bx.end, by.begin + 12, MaxTag + maxRote.toFixed(2) + '%', MaxColor, 'end');
            var roteMinEl = t._text(g, bx.end, by.end - 3, MinTag + minRote.toFixed(2) + '%', MinColor, 'end');
            cacheEl.push(dataMaxEl, dataMinEl, roteMaxEl, roteMinEl);
            if (close < t.maxPrice && close > t.minPrice) {
                var y = t.half(c2y(close));
                var dataCloseEl = t._text(g, bx.begin, y - 3, close.toFixed(t.scale), COLOR_T);
                var roteCloseEl = t._text(g, bx.end, y - 3, '0.00%', COLOR_T, 'end');
                cacheEl.push(dataCloseEl, roteCloseEl, t._line(g, bx.begin, y, bx.end, y, COLOR_M, '3,1'));
            }

            function c2y(p) {
                var h = (max - p) / (max - min) * by.height;
                return by.begin + 1 + h;
            }
        },
        _circle: function (attr, refEl) {
            var elem = dom.createNS('circle');
            dom.attr(elem, attr);
            refEl && refEl.appendChild(elem);
            return elem;
        },
        _rect: function (g, x, y, w, h, rx, ry, color, refEl) {
            var elem = dom.createNS('rect');
            dom.attr(elem, {
                x: x,
                y: y,
                width: w,
                height: h,
                rx: rx,
                ry: ry,
                fill: color ? color : COLOR_S
            });
            refEl ? dom.insert(g, elem, refEl) : dom.append(g, elem);
            return elem;
        },
        _line: function (g, x1, y1, x2, y2, color, dash, refEl) {
            var elem = dom.createNS('line');
            dom.attr(elem, {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                stroke: color ? color : COLOR_S,
                'stroke-dasharray': dash
            });
            if (dash) {
                dom.attr(elem, 'stroke-dasharray', dash);
            }
            refEl ? dom.insert(g, elem, refEl) : dom.append(g, elem);
            return elem;
        },
        _text: function (g, x, y, txt, color, anchor, refEl) {
            var elem = dom.createNS('text');
            dom.attr(elem, {
                x: x,
                y: y,
                fill: color || COLOR_T,
                style: {
                    'text-anchor': anchor || 'start',
                    'font-size': '12px'
                }
            });
            dom.textContent(elem, txt);
            refEl ? dom.insert(g, elem, refEl) : dom.append(g, elem);
            return elem;
        },
        _path: function (d, stroke, fill, opacity, dash) {
            var attrObj = {}, path = dom.createNS('path');
            if (d) {
                attrObj['d'] = d;
            }
            if (stroke) {
                attrObj['stroke'] = stroke;
            }
            if (fill) {
                attrObj['fill'] = fill;
            }
            if (opacity) {
                attrObj['fill-opacity'] = opacity;
            }
            if (dash) {
                attrObj['stroke-dasharray'] = dash;
            }
            dom.attr(path, attrObj);
            return path;
        },
        _parsePeriodIntlToPeriod: function () {
            var t = this, periodIntl = t.periodIntl, begin = periodIntl[0], i, ret = [];
            for (i = 1; i < periodIntl.length; i++) {
                ret.push([
                    begin, begin = periodIntl[i]
                ]);
            }
            return ret;
        },
        _setConfig: function (opts) {
            // opts {close: float, high: float, low: float, quoteTime: number, code: String, period: array, isIntl: true, isStock:boolearn}
            if (opts.quoteTime) {
                this.quoteTime = opts.quoteTime;
            }
            if (opts.close) {
                this.close = opts.close;
            }
            if (opts.high) {
                this.high = opts.high;
            }
            if (opts.low) {
                this.low = opts.low;
            }
            if (opts.period && this.period != opts.period) {
                this.period = opts.period;
                this.data = {};
            }
            if (opts.code) {
                this.code = opts.code;
            }
            this.moments = opts.isIntl ? this._period2moments_intl() : this._period2moments();
            this.isStock = !!opts.isStock;
            this.isIntl = !!opts.isIntl;
        },
        _setMaxMin: function () {
            var t = this,
                data = this.data,
                moments = this.moments;
            // for (var key in this.data) {
            //     flag = true;
            //     break;
            // }
            if (Object.keys(this.data).length) {
                moments.forEach(function (time) {
                    var o = data[time];
                    if (o != null) {
                        if (t.maxPrice == 0 || t.minPrice == 0) {
                            t.maxPrice = t.minPrice = o.current;
                        }
                        t.maxPrice = Math.max(t.maxPrice, o.current);
                        t.minPrice = Math.min(t.minPrice, o.current);
                    }
                });
            }
            //X.log(this.data);
            //X.log(t.maxPrice, t.minPrice)
        },
        /**
         * 画股票需要的开始价格和结束价格，此方法是加工最大值和最小值的
         * 因为在股票行情中，分时图以昨收为分界线，涨跌一致，即涨多少与跌多少相等
         * @private
         */
        _setBEPrice: function () {
            var max = this.maxPrice,
                min = this.minPrice,
                close = this.close;

            var diff = this.PART / 2 / 100 * close;
            if (max == min) {
                this.beginPrice = close + diff;
                this.endPrice = close - diff;
                return;
            }
            var uabs = Math.abs(close - max),
                dabs = Math.abs(close - min);

            if (uabs > dabs) {
                this.beginPrice = max;
                this.endPrice = close - uabs;
            } else {
                this.beginPrice = close + dabs;
                this.endPrice = min;
            }
        },
        _period2moments_intl: function () {
            var t = this, period = t.period,
                beginTime = period[0][0].replace(":", "") - 0, beginTimeHour = beginTime / 100 | 0,
                endTime = period[period.length - 1][1].replace(":", "") - 0, endTimeHour = endTime / 100 | 0,
                hours = [], h = beginTimeHour;

            while (true) {
                if (h == 24) {
                    h = 0;
                }
                hours.push(h);
                if (h == endTimeHour) {
                    break;
                }
                h++;
            }
            var totalHours = t.totalHours, quoteTime = t.quoteTime, quoteTimeHour = quoteTime / 100 | 0,
                quoteTimeHour = quoteTimeHour == endTimeHour ? quoteTimeHour - 1 : quoteTimeHour, index = hours.indexOf(quoteTimeHour);

            t.periodIntl = [];//清空原来的数据
            index = index - totalHours + 1;
            index = index < 0 ? 0 : index;

            var retPeriod = [];

            for (var i = 0; i < totalHours; i++) {
                quoteTimeHour = hours[index++];
                for (var j = 0; j < 60; j++) {
                    retPeriod.push(quoteTimeHour + X.fill(j) - 0);
                }
                t.periodIntl.push(X.fill(quoteTimeHour) + ':00');
            }
            quoteTimeHour += 1;
            retPeriod.push(quoteTimeHour + '00' - 0);
            t.periodIntl.push(X.fill(quoteTimeHour) + ':00');
            // X.log(retPeriod);
            // X.log(t.periodIntl);
            return retPeriod;
        },
        _period2moments: function () {
            var moments = [];
            $.each(this.period, function (i, arr) {
                var s = arr[0],
                    e = arr[1];

                var sa = s.split(':'),
                    sh = sa[0] - 0,
                    sm = sa[1] - 0;

                var ea = e.split(':'),
                    eh = ea[0] - 0,
                    em = ea[1] - 0;

                for (; sh <= eh; sm++) {
                    if (sm === 60) {
                        sh += 1;
                        sm = 0;
                    }
                    //如果不计算最后一分钟则使用sm > em - 1
                    if (sh === eh && sm > em) {
                        break;
                    }
                    moments.push(sh + X.fill(sm) - 0);
                }
            });
            return moments;
        },
        _isTradeTime: function (sTime) {
            var moments = this.moments, beginTime = moments[0], endTime = moments[moments.length - 1], time = sTime - 0, quoteTime = this.quoteTime;
            //存在跨天
            if (beginTime > endTime) {
                //在前半夜
                if (quoteTime >= beginTime && quoteTime < 2400) {
                    return time >= beginTime && time <= quoteTime;
                }
                if (time >= beginTime && time < 2400) {
                    return true;
                }
            }
            //不夸天的直接判断
            return time <= quoteTime;
        },
        half: function (n) {
            return (n | 0) + 0.5;
        }
    };
    X.Sline = Sline;
})(jQuery, window);