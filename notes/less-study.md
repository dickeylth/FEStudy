# Less学习笔记
-----------------------------------

## 概况
### 变量
- 一处定义，多处使用

### Mixins
- 嵌入其他类下的属性
- 可作为函数来用，接收参数（可设默认值）
- 多种样式之间存在继承关系时

### 嵌套规则
- 选择器嵌套
- 继承关系清晰，样式表更短

**注意对伪类的继承写法**：

	a { text-decoration: none;
      	&:hover { border-width: 1px }
    }

### 函数&操作符
- 处理*数值*的加减乘除调整设值
- 以括号执行操作
- 函数与JavaScript代码一一映射

示例：

	// LESS
	@base-color: #111;
	@red:        #842210;

	#footer {
	  color: (@base-color + #003300);
	  border-color: desaturate(@red, 10%);
	}

## 客户端使用
- 易于使用和开发
- 生产环境下，尤其注重性能时，更推荐采用预编译
- 可配置

示例如下：

	<script type="text/javascript">
	less = {
	    env: "development", // or "production"
	    async: false,       // load imports async
	    fileAsync: false,   // load imports async when in a page under
	                        // a file protocol
	    poll: 1000,         // when in watch mode, time in ms between polls
	    functions: {},      // user functions, keyed by name
	    dumpLineNumbers: "comments", // or "mediaQuery" or "all"
	    relativeUrls: false,// whether to adjust url's to be relative
	                        // if false, url's are already relative to the
	                        // entry less file
	    rootpath: ":/a.com/"// a path to add on to the start of every url
	                        //resource
	};
	</script>
	<script src="less.js" type="text/javascript"></script>

- 在加载完所有样式表之后才引入less.js

### Watch模式
- 目的：修改样式时自动刷新
- 两种方法启用：
	- 地址栏URL后添加'#!watch'
	- 控制台执行 `less.watch()`

### 修改变量
- `modifyVars`，在*运行时*（Run-Time）修改LESS变量
- 当按新值调用时，LESS文件可以重新编译而不用重新加载

示例：

	less.modifyVars({
	    '@buttonFace': '#5B83AD',
	    '@buttonText': '#D9EEF2'
	});

### 调试
- 输出CSS中的规则，从而允许调试工具定位规则源
- 两种启用方法：
	- 配置项中按如上示例指定`dumpLineNumbers` 
	- URL后添加` !dumpLineNumbers:mediaQuery`
- Firefox中：
	- `dumpLineNumbers` 设置为`comments`：安装扩展[FireLESS](https://addons.mozilla.org/en-us/firefox/addon/fireless/)
	-  `dumpLineNumbers` 设置为`mediaQuery`：Firebug中调试
- Chrome中：
	- 参考：[http://robdodson.me/blog/2012/12/28/debug-less-with-chrome-developer-tools/](http://robdodson.me/blog/2012/12/28/debug-less-with-chrome-developer-tools/)

## 服务器端使用

基于node/npm

### 安装

	$ npm install -g less

### 命令行

	$ lessc style.less									//输出到屏幕

	$ lessc styles.less > styles.css					//输出到文件

	$ lessc -x styles.less > styles.css					//css压缩

	$ lessc  --yui-compress styles.less > styles.css	//更复杂的yui压缩配置

### 代码中使用
	var less = require('less');
	
	less.render('.class { width: (1 + 1) }', function (e, css) {
	    console.log(css);
	});

	//输出：
	.class {
	  width: 2;
	}

# [Less简介以及与Sass的对比](http://coding.smashingmagazine.com/2011/09/09/an-introduction-to-less-and-comparison-to-sass/)

## Less 与 Sass 的相同点
- Mixins —— 为class创建类
- 含参Mixins——可传参的类，类似函数
- 规则嵌套——以class创建class，减少重复代码
- 操作符——CSS的运算
- 颜色函数——编辑颜色
- 命名空间——按引用调用分组样式
- 作用域——局部修改
- JavaScript赋值——CSS中利用JavaScript表达式赋值