/**
 * @fileoverview function
 * @desc function description
 * @author your-name<your-email>
 */

// 模块名字
KISSY.add('gallery/tag-cloud/1.0/index', function(S) {

    var D = S.DOM, E = S.Event, doc = document;

    //定义变量和常量
    var conWidth, conHeight, radius, d = 1000, dtr = Math.PI / 180, active=false;
    var lasta = 1, lastb = 1, tspeed = 10, size;
    var mouseX = 0, mouseY = 0;
    var tagNodes = new Array();

    /**
     * 功能
     * @param {String} [triggerCls = 'S_ViewCode'] 触发元素的class。注释具体格式参见jsdoc规范。
     */
    function TagCloud(container, tags, config) {

        var self = this;

        if(!(self instanceof TagCloud)){
            return new TagCloud(container, tags, config);
        }

        //参数处理
        self.container = container = S.one(container);
        if(!container) return;

        container.addClass('tagCloud');
        conWidth = container.width(),
        conHeight = container.height();
        radius = (conWidth > conHeight ? conHeight : conWidth) / 3;
        size = radius * 2;
		config && (+config.speed > 0) && (tspeed = config.speed);
        //对象属性赋值
        TagCloud.superclass.constructor.call(self, config);

        //初始化
        self._init(tags);
    }

    //默认配置

    //类继承
    S.extend(TagCloud, S.Base);

    //原型扩展
    S.augment(TagCloud, S.EventTarget, {

        /**
         * 处理动态更新标签云
         */
        update: function(self) {

            var a, b, c = 0;

            if (active) {
                a = (-Math.min(Math.max(-mouseY, -size), size) / radius ) * tspeed;
                b = (Math.min(Math.max(-mouseX, -size), size) / radius ) * tspeed;
            } else {
                a = lasta * 0.98;
                b = lastb * 0.98;
            }
            lasta = a;
            lastb = b;

            if (Math.abs(a) <= 0.01 && Math.abs(b) <= 0.01) {
                return;
            }

            var self = self ? self : this,
                sin = self._sin,
                cos = self._cos;
            for (var j = 0; j < tagNodes.length; j++) {
                var node = tagNodes[j];
                var rx1 = node.data('cx');
                var ry1 = node.data('cy') * cos(a) + node.data('cz') * (-sin(a));
                var rz1 = node.data('cy') * sin(a) + node.data('cz') * cos(a);

                var rx2 = rx1 * cos(b) + rz1 * sin(b);
                var ry2 = ry1;
                var rz2 = rx1 * (-sin(b)) + rz1 * cos(b);

                var rx3 = rx2 * cos(c) + ry2 * (-sin(c));
                var ry3 = rx2 * sin(c) + ry2 * cos(c);
                var rz3 = rz2;

                node.data('cx', rx3);
                node.data('cy', ry3);
                node.data('cz', rz3);

                //推测控制景深的，z轴上的坐标
                var per = d / (d + rz3);
                node.scale = per;
                node.alpha = (per - 0.6) * (10 / 6);
            }

            self.refreshPosition();
            self.sortByDepth();
        },

        /**
         * 处理动态更新标签云
         */
        sortByDepth: function(){

            tagNodes.sort(function(vItem1, vItem2) {
                if (vItem1.data('cz') > vItem2.data('cz')) {
                    return -1;
                } else if (vItem1.data('cz') < vItem2.data('cz')) {
                    return 1;
                } else {
                    return 0;
                }
            });

            /*
             * 根据景深定z-index
             */
            for (var i = 0; i < tagNodes.length; i++) {
                tagNodes[i].css('z-index', i);
            }
        },

        /**
         * 处理刷新定位
         */
        refreshPosition: function(){
            for (var i = 0; i < tagNodes.length; i++) {
                var node = tagNodes[i];
                node.css('left', node.data('cx') + conWidth/2 - node.width() / 2 + 'px')
                    .css('top', node.data('cy') + conHeight/2 - node.height() / 2 + 'px')
                    .css('filter', "alpha(opacity=" + 100 * node.alpha + ")")
                    .css('opacity', node.alpha);
            }
        },

        /**
         * private function
         * @param x 为 degree
         * @return sin值
         */
        _sin: function(x){
            return Math.sin(x * dtr);
        },

        /**
         * private function
         * @param x 为 degree
         * @return cos值
         */
        _cos: function(x){
            return Math.cos(x * dtr);
        },

        /**
         * private function
         * @param xxx
         * @return
         */
        _method:function(xxx) {
            var self = this;
        },

        /**
         * 初始化
         * @param tags 标签元素数组
         * @private
         */
        _init: function(tags){
            //预处理tags
            var length = tags.length;
            for(var i = 0; i < length; i++){
                var item = tags[i];
                //为每一个item创建node节点
                if(S.isObject(item)){
                    var node = new S.Node('<a class="tag-cloud-item"></a>').text(item.t);
                    if(item.u){
                        node.attr('href', item.u);
                    }
                    var phi = Math.acos(-1 + (2 *(i + 1) - 1)/length),
                        theta = Math.sqrt(length * Math.PI) * phi;

                    node.data('cx', radius * Math.cos(theta) * Math.sin(phi));
                    node.data('cy', radius * Math.sin(theta) * Math.sin(phi));
                    node.data('cz', radius * Math.cos(phi));

                    S.DOM.append(node, self.container);
                    node.css('left', node.data('cx') + conWidth/2 - node.width()/2 + 'px');
                    node.css('top', node.data('cy') + conHeight/2 - node.height()/2 + 'px');
                    node.addClass('level-' + Math.ceil(item.r * 10));

                    //插入数组
                    tagNodes.push(node);
                }

            }
            E.on(self.container, 'mouseover', function(){
                active = true;
            });
            E.on(self.container, 'mouseout', function(){
                active = false;
            });
            E.on(self.container, 'mousemove', function(e){
                mouseX = (e.clientX - (self.container.offsetLeft + conWidth/2)) / 5;
                mouseY = (e.clientY - (self.container.offsetTop + conHeight/2)) / 5;
            });
            S.later(this.update, 20, true, null, this);
        }
    });

    //私有方法
    return TagCloud;
}, {
    requires: ['gallery/tag-cloud/1.0/assets/tag-cloud.css']
});