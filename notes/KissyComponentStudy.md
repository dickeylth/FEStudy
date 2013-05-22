# Kissy组件化学习 #
-------------------------
## 目录 ##
+ Kissy简介
	+ 特点
	+ 架构
+ 模块化机制
	+ 由来
	+ 模块化设计
	+ Kissy中的模块化
+ 现有组件分析
	+ 表单label浮动功能组件[sliding-labels](http://docs.kissyui.com/kissy-gallery/gallery/sliding-labels/1.0/demo.html)
	+ 日历组件[Calendar](http://docs.kissyui.com/kissy-gallery/gallery/calendar/1.1/demo.html)
+ 组件开发基础
	+ 开发流程
	+ 更好的API设计
+ 动手写组件——城市选择器
	+ API设计
	+ 编写源码
+ 参考文献

## Kissy 简介 ##
### Kissy 特点 ###
+ 小巧灵活，简洁实用
+ 吸收jQuery和YUI的优点：
	+ jQuery：DOM核心
	+ YUI：模块化、按需加载
+ 贴近淘宝应用的组件库

### Kissy 架构 ###
![Kissy整体架构图](http://img03.taobaocdn.com/tps/i3/T1QDBbXDliXXaoYMUR-865-661.png)

#### [Seed](https://github.com/kissyteam/kissy/tree/1.3.0/src/seed/src) ####
<img src="img/Seed.png" alt="Seed结构" width="400"/>

+ 类似目前流行的AMD模块化机制实现
+ 提供`each`、`mix`、`param`、`ready`等常用的静态工具方法
+ 提供`Path`、`URI`、`Promise`、`UA`等模块化需要用到的基础类


#### 核心模块 ####
+ 处理DOM兼容性
+ 渐进增强能力，提供一致的模块名、API
	+ 问题：渐进增强与优雅降级的区别？
		+ 关注视角的区别，自底向上 vs. 自顶向下
		+ 优雅降级：面向先进/全能的浏览器构建网站，为旧浏览器提供基本的可用性体验（*poor, but passable*）
		+ 渐进增强：关注于内容，*just think from the content out*，根据场景（浏览器/设备能力）不同提供差异化JavaScript体验

#### 组件架构 ####
+ [rich-base模块](http://www.36ria.com/6130)
	+ 基于base增强，面向需要插件机制的组件，使用时务必考虑业务场景
	> RichBase定义了一套统一且完整的组件生命周期，包括组件的配置、构造、调用、注入插件、析构。
+ component模块
	+ 所有UI组件渲染机制的基类
+ 模板引擎xtemplate

#### 组件 ####
+ 独立可用的KISSY组件，用户可自由组合继承搭建最终页面。包括：
	+ 工具模块，例如拖放，调整大小，操作 swf，操作样式表，mvc（model，router）架构等。
	+ UI 组件，例如弹窗，菜单，标签，日历等。

#### Gallery ####
+ 丰富的贴近淘宝应用的组件库

## 模块化机制 ##

### 由来 ###
> 随着网站逐渐变成"互联网应用程序"，嵌入网页的Javascript代码越来越庞大，越来越复杂。
> 
> 网页越来越像桌面程序，需要一个团队分工协作、进度管理、单元测试等等......开发者不得不使用软件工程的方法，管理网页的业务逻辑。
> 
> Javascript模块化编程，已经成为一个迫切的需求。理想情况下，开发者只需要实现核心的业务逻辑，其他都可以加载别人已经写好的模块。
> 
> 但是，Javascript不是一种模块化编程语言，它不支持"类"（class），更遑论"模块"（module）了。（正在制定中的ECMAScript标准第六版，将正式支持"类"和"模块"，但还需要很长时间才能投入实用。）

关于模块化规范的历史，参见玉伯的issue：[前端模块化开发那点历史](https://github.com/seajs/seajs/issues/588)

+ [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD)（异步模块定义，Asynchronous Module Definition， RequireJS 在推广过程中对模块定义的规范化产出）
+ [CMD](https://github.com/seajs/seajs/issues/242)（通用模块定义，Common Module Definition，SeaJS 在推广过程中对模块定义的规范化产出）
+ 此外还有 CommonJS Modules/2.0 规范，是 BravoJS 在推广过程中对模块定义的规范化产出。等等。。。

### 模块化设计 ###
> 一种将系统分离成独立功能部分的方法
> 
> + 函数分割成独立功能组
> + 使用面向对象来描述模块接口
> + 通过使用工业标准达到系统的透明可扩展
> 
> + 优点：
> 	+ 可维护性
> 		+ 灵活架构，焦点分离
> 		+ 方便模块间组合，分解
> 		+ 方便单个模块功能调试，升级
> 		+ 多人协作互不干扰
> 	+ 可测试性

> + 缺点： 模块间消息通信导致性能受损

模块化机制需要处理的最核心的两个问题：命名冲突 & 文件依赖。

#### 命名冲突 ####
一个最简单的例子：

util.js

	function print(str) {
	    doSomething();
	}

于是调用时：

	<script src="util.js"></script>
	<script>print('xxxxxxx');</script>
	
问题来了：
another.js
	
	function print(str){
		doSomething2();
	}

当页面中同时加载这2个js时，命名冲突会发生覆盖问题。

模仿Java引入命名空间？！JavaScript原生不包含命名空间，不过可以用对象模拟之：

util_v2.js

	var Mine = {};
	Mine.print = function(str){
		doSomething3();
	}

但是调用起来就麻烦一点：

	<script src="util_v2.js"></script>
	<script>Mine.print('xxxxxxx');</script>

但也只是降低函数命名冲突的概率而已，命名空间仍然可能会冲突。为了尽可能降低冲突概率，不得不拉长命名空间，于是Yahoo!的一个开源项目中出现了这样的代码：

	if (org.cometd.Utils.isString(response)) {
	    return org.cometd.JSON.fromJSON(response);
	}
	if (org.cometd.Utils.isArray(response)) {
	    return response;
	}

可见采用命名空间的方式，虽然可以一定程度上解决问题，但同时也可能需要付出不划算的代价。
> 在 YUI3 项目中，引入了一种新的命名空间机制。
> 
	 YUI().use('node', function (Y) {
		// Node 模块已加载好
		// 下面可以通过 Y 来调用
		var foo = Y.one('#foo');
	});
> YUI3 通过沙箱机制，很好的解决了命名空间过长的问题。然而，也带来了新问题。
>
	YUI().use('a', 'b', function (Y) {
	  Y.foo();
	  // foo 方法究竟是模块 a 还是 b 提供的？
	  // 如果模块 a 和 b 都提供 foo 方法，如何避免冲突？
	});

#### 文件依赖 ####
当业务逻辑变得越来越复杂，即使组件之间保持较高的解耦性，如果没有较好地处理文件依赖管理，会给代码维护带来巨大的问题。常见的简单的文件依赖与分子结构中的关联很相似：

![分子结构图](http://img01.taobaocdn.com/tps/i1/T1dA9GXypgXXXsFoPS-300-298.jpg)

采用人肉的方式来管理文件依赖，在文件依赖关系比较简单时还可以应对，但当文件之间依赖关系变得越来越复杂时，比如复杂到下面这种地步：

![C60](http://img02.taobaocdn.com/tps/i2/T1el5JXDXXXXajO.zS-300-280.jpg)

很显然此时人工维护依赖关系的成本会很巨大。

### Kissy中的模块化 ###

#### 原则 ####
+ 内聚性
+ 松耦合
+ 零重复
+ 封装
+ 可测试性
+ 可读性
+ 单一职责

Kissy 1.3的模块化机制与目前的AMD规范比较类似，并根据淘宝自身业务特点加入了自动combo功能。

#### AMD ####

>AMD的核心是`define`函数。调用`define`函数最常见的方式是传入三个参数——模块名（也就是说不再与文件名绑定）、该模块依赖的模块标识符数组、以及将会返回该模块定义的工厂函数。（调用define函数的其他方式——详细信息请参阅AMD wiki）。
>
>调用`define`函数的其他方式——详细信息请参阅[AMD wiki](https://github.com/amdjs/amdjs-api/wiki/AMD)
>
	// 定义calculator（计算器）模块。——译注
	define('calculator', ['adder'], function(adder) {
	    // 返回具有add方法的匿名对象。——译注
	    return {
	        add: function(n1, n2) {
	            /*
	             * 实际调用的是adder（加法器）模块的add方法。
	             * 而且adder模块已在前一参数['adder']中指明了。——译注
	             */
	            return adder.add(n1, n2);
	        }
	    };
	});
>
>由于此模块的定义包在`define`函数的调用中，因此这意味着可以欣然将多个模块都放在单个js文件中。此外，由于当调用模块工厂函数`define`时，模块加载器已拥有控制权，因此它可以自行安排时间去解决（模块间的）依赖关系——对于那些需要先异步下载的模块，真可谓得心应手。

#### YUI3中的模块化 ####

利用function wrapper 分离load，execute，引入模块概念

模块定义：

	YUI.add("module1",function(S){
		S.Module1=function(){};
	});

模块注册：

	YUI.add({module1:{
		fullpath: "xxx.js"
	}});

模块使用：

	YUI().use("module1",function(S){
		//useS.Module1
	});

#### Kissy中的模块化 ####

+ 命名空间
	+ 借助文件url唯一性
+ 文件依赖
	+ require属性

<img src="http://img01.taobaocdn.com/tps/i1/T1iqmNXytcXXaRAN2u-1143-574.png" width="900" title="Kissy Loader" alt="Kissy Loader"/>

##### 1. 模块名的命名空间 #####

	KISSY.add("event-target",function(){
		KISSY.Event.Target= function(){};
	});

*命名空间精简:*

	KISSY.add("event/target",function(){
		var EventTarget= function(){}
		return EventTarget;
	});
模块中直接返回值，不用在KISSY这个全局变量下挂靠太多的模块对象
##### 2. 去除模块名 #####
*根据文件系统确定模块名字*

event / base.js :

	KISSY.add(function(){});

就表示模块event/base

##### 3. 包配置 #####

*包与路径约定，批量注册模块集合*

	S.config({
		packages:[{
			name: "m1",
			path: "http://xx.com/"
		}]
	});
	S.use("m1/base")->http://xx.com/m1/base.js

##### 4. 依赖注入 #####

*定义模块*

	KISSY.add("xx",function(S,DOM){
		//Your code
	},{
		requires:["dom"]
	});

自动根据requires中的模块名注入到回调函数中的参数表中，dom->DOM

*使用模块*

	S.use("dom",function(S,DOM){
		//useDOM
	});

同样自动根据use中的模块名序列注入到回调函数中的参数表中


## 现有组件分析

###  表单label浮动功能组件[sliding-labels](http://docs.kissyui.com/kissy-gallery/gallery/sliding-labels/1.0/demo.html) ###

1. 构造器接口

	function SlidingLabels(container, config) {
	
	});

2. 配置接口

	axis              // 移动方向, 水平方向(x) or 垂直方向(y)

	position          // px, 水平和垂直方向上, 相对于父元素的位置, x or [x, y], 不设置时, 取 [5, 5]

	offset            // label 和 input 之间的距离

	zIndex            // zIndex

	duration          // 动画速度

	focusStyle        // 输入框获取焦点时, label 的样式

	blurStyle         // 输入框失去焦点时, label 的样式

3. 原型成员

	container          // 容器元素

代码核心结构：

	KISSY.add('gallery/sliding-labels/1.0/index', function (S, undefined) {
	    
	    /**
	     * @class SlidingLabels
	     * @constructor
	     * @param {Element} container
	     * @param {Object} config
	     */
	    function SlidingLabels(container, config) {
	        var self = this;
	        SlidingLabels.superclass.constructor.call(self, config);
	        self._init();
	    }
	
	    SlidingLabels.ATTRS = {
	        axis:{             // 移动方向, 水平方向(x) or 垂直方向(y)
	            value:X
	        },
	        position:{         //
	            value:defaultPosition,
	            setter:function (v) {...},
	            getter:function (v) {...}
	        },
		...
	    };
	
	    S.extend(SlidingLabels, S.Base);
	
	    S.augment(SlidingLabels, {
	        /**
	         * 初始化 label 状态及绑定 focus/blur 事件
	         * @private
	         */
	        _init:function () {
	            var self = this,
	                blurStyle = self.get(BLUR_STYLE),
	                position = self.get(POSITION);
	
	            self.container.all('label').each(function (elem) {
			  ...
	                // 绑定事件
	                self._bindUI(area, lab);
	            });
	        },
	
	        /**
	         * 绑定 focusin/focusout 事件
	         * @param {Node} area
	         * @param {Node} lab
	         * @private
	         */
	        _bindUI:function (area, lab) {...},
		...
	    });
	    return SlidingLabels;
	});

### 日历组件[Calendar](http://docs.kissyui.com/kissy-gallery/gallery/calendar/1.1/demo.html) ###

代码核心结构：

	KISSY.add('gallery/calendar/1.1/index', function (S, Node, Base) {

	    /**
	     * 创建日历构造函数
	     *
	     * @class   Calendar
	     * @extends {Base}
	     * @param   {Object} config 配置对象 (详情见API)
	     * @constructor
	     */
	    function Calendar() {
	        Calendar.superclass.constructor.apply(this, arguments);
	        this.initializer();
	    }
	
	    return S.TripCalendar = S.extend(Calendar, Base, {
	
	            /**
	             * 日历初始化
	             *
	             * @method initializer
	             */
	            initializer: function () {
	                ...
	            },
	
	            /**
	             * 渲染日历结构
	             *
	             * @method renderUI
	             */
	            renderUI: function () {
	                ...
	            },
	
	            /**
	             * 事件绑定
	             *
	             * @method bindUI
	             */
	            bindUI: function () {
	                ...
	            },
	
	
	            /**
	             * 获取nodeList中匹配自定义属性的node
	             *
	             * @method _getAttrNode
	             * @param {Object} nodeList
	             * @param {String} attr 自定义属性
	             * @param {String} value 自定义属性值
	             * @return node
	             */
	            _getAttrNode: function (nodeList, attr, value) {
	                ...
	            },
	
	
	            /**
	             * 鼠标移入事件
	             *
	             * @method _mouseenter
	             * @param {Event} oTarget 事件对象
	             * @private
	             */
	            _mouseenter: function (oTarget) {
	                ...
	            },
	
	            /**
	             * 鼠标移出事件
	             *
	             * @method _mouseleave
	             * @private
	             */
	            _mouseleave: function () {
	                ...
	            },
	
	            /**
	             * 事件代理
	             *
	             * @type {Object}
	             */
	            _DELEGATE: {
	                // 日历点击事件处理函数
	                'click': function (e) {
	                    ...
	                    }
	                },
	
	                // select元素日期选择事件处理函数
	                'change': function (e) {
				...
	                },
	
	                // 鼠标移入/移出事件处理函数
	                'mouse': function (e) {
	                    ...
	                },
	
	                // 触发元素获取焦点处理函数
	                'focusin': function (e) {
	                    ...
	                },
	
	                // 输入框输入事件处理函数
	                'keyup': function (e) {
	                    ...
	                },
	            },
	        },
	        {
	            /**
	             * 日间处理表态方法
	             * @type {Object}
	             */
	            DATE: {
	                /**
	                 * 将日期字符串转为日期对象
	                 *
	                 * @method parse
	                 * @param {String} v 日期字符串
	                 * @private
	                 * @return {Date} 日期对象
	                 */
	                parse: function (v) {
	                    v = v.match(REG);
	                    return v ? new Date(v[0], v[1] - 1, v[2]) : null;
	                },
	
	                /**
	                 * 将日期对象转为日期字符串
	                 *
	                 * @method stringify
	                 * @param {Date} v 日期对象
	                 * @private
	                 * @return {String} 日期字符串
	                 */
	                stringify: function (v) {
	                    if (!S.isDate(v)) return null;
	                    return v.getFullYear() + '-' + this.filled(v.getMonth() * 1 + 1) + '-' + this.filled(v.getDate());
	                },

	                ...
	            },
	            /**
	             * 日历模板
	             *
	             * @property CALENDAR_TEMPLATE
	             * @type String
	             * @static
	             */
	            CALENDAR_TEMPLATE: '...',
	
	            DATE_TEMPLATE: '...',
	
	            SELECT_TEMPLATE: '...',

			...
	
	            /**
	             * 默认属性配置
	             *
	             * @property ATTRS
	             * @type {Object}
	             * @protected
	             * @static
	             */
	            ATTRS: {
	
	                /**
	                 * 日历外容器
	                 *
	                 * @attribute boundingBox
	                 * @type {Node}
	                 */
	                boundingBox: {
	                    readOnly: true
	                },
	
	                /**
	                 * 日历初始日期
	                 *
	                 * @attribute date
	                 * @type {Date|String}
	                 * @default new Date()
	                 */
	                date: {
	                    value: new Date(),
	                    setter: function (v) {
	                        if (!S.isDate(v)) {
	                            v = RDATE.test(v) ? v : new Date();
	                        }
	                        return v;
	                    },
	                    getter: function (v) {
	                        if (S.isDate(v)) return v;
	                        if (S.isString(v)) {
	                            v = v.match(REG);
	                            return new Date(v[0], v[1] - 1);
	                        }
	                    }
	                },
	
	                ...
	
	                ...
	            }
	        });
	
	}, {requires: ['node', 'base', 'sizzle', './assets/index.css']});

### S.extend & S.augment

+ augment

> Function KISSY.augment ( r, s1 [, s2 , ...] )

将 s1,s2.... 的 prototype 属性的成员复制到 r.prototype 上。

Parameters:	

	r (function) – 将要扩充的函数
	s1 (function|object) – 扩充来源函数或对象. 非函数对象时复制的就是 s 的成员.

Returns:	

	r

Return type:	

	function

+ extend

>Function KISSY.extend (r,s[,px,sx])

让函数对象 r 继承函数对象 s

Parameters:	

	r (function) – receiver,将要继承的子类函数
	s (function|object) – supplier,继承自的父类函数
	px (object) – prototype members, 需要添加/覆盖的原型成员
	sx (object) – static members, 需要添加/覆盖的静态成员.

Returns:	

	r

Return type:	

	function

## 组件开发基础 ##

### 开发流程 ###

+ [十五分钟开发一个kissy组件](http://gallery.kissyui.com/quickstart)
+ [如何开发 KISSY 组件](http://docs.kissyui.com/docs/html/tutorials/workflow/dev-demo.html)
<img src="http://docs.kissyui.com/source/raw/workflow/workflow.png" alt="KISSY组件开发流程" title="KISSY组件开发流程" width="900"/>

1. 准备工作：起名（组件名、接口名）、目录结构
2. 确定API：
	+ 构造器接口
	+ 配置接口
	+ 原型成员
3. 模块编写
4. demo编写
5. 文档

### API设计 ###
+ Fluent Interface
	+ 语句流畅易读
+ 一致性
	+ str_repeat() 、 str_pos() 、 substr() 
+ 参数处理
	+ 批量设置
	+ 类型转换
	+ 默认值
+ 可扩展性
	+ 回调函数
	+ 事件
+ 引用
+ 处理错误
	+ 健壮性是指不接受垃圾 并且告之开发者 
+ 文档化API

更多内容参考[Designing Better JavaScript APIs](http://coding.smashingmagazine.com/2012/10/09/designing-javascript-apis-usability/)

个人翻译：[[译]设计更好的JavaScript API](http://gitlab.alibaba-inc.com/tiehang.lth/festudy/blob/master/translations/Designing%20Better%20JavaScript%20APIS.md)

## 动手写组件 ##
标签云演示

##  参考文献  ##
+ [模块化高扩展性的前端框架 KISSY](http://ued.taobao.com/blog/2013/03/modular-scalable-kissy/)
+ [前端模块化开发的价值](https://github.com/seajs/seajs/issues/547)
+ [Why SeaJS](http://chaoskeh.com/blog/why-seajs.html)
+ [Javascript模块化编程（一）：模块的写法](http://www.ruanyifeng.com/blog/2012/10/javascript_module.html)
+ [JavaScript模块化开发一瞥](http://www.ituring.com.cn/article/1091)