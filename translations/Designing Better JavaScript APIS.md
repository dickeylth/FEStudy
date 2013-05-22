# [译]设计更好的JavaScript API

By Rodney Rehm

原文链接：[http://coding.smashingmagazine.com/2012/10/09/designing-javascript-apis-usability/](http://coding.smashingmagazine.com/2012/10/09/designing-javascript-apis-usability/)

**某些时候，你会发现你自己写的JavaScript代码比一个jQuery插件代码行数更多。你的代码需要做一大堆的工作，（理想情况下）它会被许多以不同方式访问你的代码的人所使用。他们拥有不同的需求、学识和期望。**

![Time Spend with The Library](http://media.smashingmagazine.com/wp-content/uploads/2012/10/Pie-chart.jpg "Time Spend on Creating/Using The Library")

本文讨论了在你编写你自己的应用和库之前和期间需要考虑的一些重要的事情。我们将关注于如何使你的代码对其他开发者 *易于理解* 。虽然在示例中会有很多话题论及jQuery，然而这篇文章既不是关于jQuery也不是关于为jQuery编写插件。

Perter Drucker曾经说过：“计算机是个白痴”。不要为白痴写代码，为人而写吧！让我们展开讨论如何设计开发者们会喜欢使用的API。

## 目录
* 连贯接口
* 一致性
* 处理参数
* 可扩展性
* 钩子机制
* 生成访问器
* 引用之怖
* 连续性问题
* 处理错误
* 处理异步
* 调试连贯接口
* 文档化API
* 结论

## 连贯接口
[连贯接口](http://en.wikipedia.org/wiki/Fluent_interface#JavaScript)通常被称为 *链式调用* （尽管不全对）。对于初学者它看上去像 *jQuery风格* 。虽然我相信这种API风格是jQuery大获成功的一个重要因素，但它并不是由jQuery开发者们创造的。这项荣誉似乎应该归于Martin Fowler。早在2005年，大约jQuery发布一年前，他就[创造了这个词](http://martinfowler.com/bliki/FluentInterface.html)。然而Fowler仅仅对它进行了命名，事实上连贯接口已经存在很久了。

除了主要的简化，jQuery还平整了严重的浏览器差异。这种连贯接口设计一直是我对这个极为成功的库最喜欢的一点。我如此喜欢这种特别的API风格，以至于我想要立刻将这种风格也应用到[URI.js](http://medialize.github.io/URI.js/)中。在调整URI.js的API期间，我经常浏览jQuery源码，发现了一些可以使我的实现尽可能简单的小技巧。我发现并非只有我在做这种尝试。[Lea Verou](https://twitter.com/leaverou)创建了[chainvas](http://lea.verou.me/chainvas/)——一个用来将规则的getter/setter API包装为亲切的连贯接口的工具。UnderScore的`_.chain()`也实现了相似的功能。事实上，大部分新生的库都支持链式调用。

### 链式调用
链式调用的主要思想就是使代码尽可能流畅易读，从而可以更快地被理解。有了 *链式调用* ，我们可以将代码组织为类似语句的片段，使代码易读的同时减少干扰。

	// regular API calls to change some colors and add an event-listener
	var elem = document.getElementById("foobar");
	elem.style.background = "red";
	elem.style.color = "green";
	elem.addEventListener('click', function(event) {
	  alert("hello world!");
	}, true);
	
	// (imaginary) method chaining API
	DOMHelper.getElementById('foobar')
	  .setStyle("background", "red")
	  .setStyle("color", "green")
	  .addEvent("click", function(event) {
	    alert("hello world");
	});

注意我们如何不必将元素的引用赋给一个变量然后一再地重复书写代码。

### 命令查询分离
[命令查询分离](http://en.wikipedia.org/wiki/Command-query_separation)（Command and Query Separation，CQS）是继承自命令式编程的一个概念。改变对象的状态（内部的值）的函数称为 *命令* ，而检索值的函数称为 *查询* 。原则上，查询函数返回数据，命令函数返回状态，各司其职。这个概念是今天我们所见的大部分库中普遍的getter和setter方法的依据之一。由于 *连贯接口* 返回一个自引用以实现链式方法调用，我们已经打破了为 *命令* 设定的规则，因为它们本来不应返回值。除了这一点（很容易被忽略）以外，我们还（有意）打破这个概念从而使API尽可能保持简单。jQuery中的`css()`方法就是这种实践的一个很好的例子：

	var $elem = jQuery("#foobar");
	
	// CQS - command
	$elem.setCss("background", "green");
	// CQS - query
	$elem.getCss("color") === "red";
	
	// non-CQS - command
	$elem.css("background", "green");
	// non-CQS - query
	$elem.css("color") === "red";

正如你所见的，getter和setter方法都被合并到一个单一的方法中。要执行（即 *查询* 或 *命令* ）的功能是由被传入到这个函数的参数个数所决定，而不是哪个函数被调用。这允许我们暴露更少的方法，相应地以更少的代码实现同样的目标。

将getter和setter方法压缩到单一方法中以创建一个连贯接口并不是必要的，这取决于个人喜好。你的文档应该对你决定采用的方法提供清晰的描述。后文中我会讲到API文档化，但在这里我想指出，记录多函数签名可能会比较困难。

### 变得流畅
虽然方法链已经为实现流畅的代码完成了大量的工作，但不仅仅于此。为了说明实现 *流畅* 的下一步，我们假定要写一个处理日期间隔的简短的库。一个日期间隔以一个日期开始，并且以另一个日期结束。一个日期并不必要与一个日期间隔相关联。于是我们得出这个简单的构造器：

	// create new date interval
	var interval = new DateInterval(startDate, endDate);
	// get the calculated number of days the interval spans
	var days = interval.days();

虽然初看上去是对的，下面这个例子可以看出问题所在：

	var startDate = new Date(2012, 0, 1);
	var endDate = new Date(2012, 11, 31)
	var interval = new DateInterval(startDate, endDate);
	var days = interval.days(); // 365

我们写了一大堆可能并不需要的变量和其他东西。更好的解决方案是在Date对象上添加一个函数来返回一个时间间隔。

	// DateInterval creator for fluent invocation
	Date.prototype.until = function(end) {
	
	  // if we weren't given a date, make one
	  if (!(end instanceof Date)) {
	    // create date from given arguments,
	    // proxy the constructor to allow for any parameters
	    // the Date constructor would've taken natively
	    end = Date.apply(null, 
	      Array.prototype.slice.call(arguments, 0)
	    );
	  }
	
	  return new DateInterval(this, end);
	};

现在我们可以以一种流畅、易写易读的方式创建`DateInterval`：

	var startDate = new Date(2012, 0, 1);
	var interval = startDate.until(2012, 11, 31);
	var days = interval.days(); // 365
	
	// condensed fluent interface call:
	var days = (new Date(2012, 0, 1))
	  .until(2012, 11, 31) // returns DateInterval instance
	  .days(); // 365

正如你在最后这个例子中所见，只需要声明更少的变量、书写更少的代码就可以完成同样的功能，并且执行语句读起来几乎就像一个英语句子。通过这个例子，你会意识到，方法链只是连贯接口的一部分，它们算不上是同义词。为了保证流畅性，你必须考虑代码流——从哪里来、要朝哪里去。

上面这个例子是通过在原生对象上扩展出自定义方法来说明流畅性。这就和是否使用分号一样像是一种宗教信仰。在[《扩展内置原生对象，应不应该？》](http://perfectionkills.com/extending-built-in-native-objects-evil-or-not/)这篇文章中，[kangax](https://twitter.com/kangax)说明了这种方法的优缺点。尽管这个问题见仁见智，但保持一致性是每个人认可的准则。顺便说一句，即使是那些“不应以自定义方法污染原生对象”的拥护者可能也会接受下面有些技巧性的代码：

	String.prototype.foo = function() {
	  return new Foo(this);
	}
	
	"I'm a native object".foo()
	  .iAmACustomFunction();

通过这种方式，你自定义的函数仍然在你的命名空间下，但是可以通过其他对象访问到它。确保你的代码中的`.foo()`方法是非通用的，避免与其他的API冲突，并确保你的代码中提供了恰当的`.valueOf()`和`.toString()`方法以重置回原先的基本类型。

## 一致性
[Jake Archibald](https://twitter.com/jaffathecake)曾经在一张幻灯片上定义了 *一致性* 。它可以简单读作 *[拒绝PHP](http://www.slideshare.net/slideshow/embed_code/5426258?startSlide=59)* 。永远不要在你的代码中出现类似 *str\_repeat()* 、 *str\_pos()* 、 *substr()* 这样的函数命名，并且不要交换参数的位置。如果你在某处声明了`find_in_array(haystack, needle)`函数，再定义`findInString(needle, haystack)`函数将会使你的代码变得像噩梦一般。

### 命名
>“There are only two hard problems in computer science: cache-invalidation and naming things.”
>
>“在计算机科学领域只有2个难题：缓存失效和命名。”
>
— Phil Karlton

我已经参加过许多讲授命名的细节的讨论和会话，每次在离开前都会听到上面这句引述，但还是没有学会如何真正地命名。我的建议归纳为 *保持简短但具有描述性并且跟随你的直觉* 。但是最重要的是，保持一致性。

上面的`DateInterval`的例子引入了一个名为`until()`的方法。我们本可以将其命名为`interval()`。后者会与返回值更为接近，然而前者 *可读性* 更好。找出一行你喜欢的用词并且坚持下去。一致性占据90%的重要性。选择一种风格并且保持下去——即使在将来某个时候你发现你开始反感这种风格了。

## 处理参数
![Good Intentions](http://media.smashingmagazine.com/wp-content/uploads/2012/10/good-intention.jpg)

你的方法如何接收数据比让它们具有可链性更为重要。虽然方法链是非常普遍的，你可以很容易在你的代码中实现，但是处理参数却不是这样。你需要考虑你提供的方法最有可能被如何使用。调用你的API的代码会不会重复调用某个函数？为什么会重复调用？如何使你的API帮助开发者减少这种重复调用函数的干扰？

jQuery的`css()`方法可以在一个DOM元素上设置样式：

	jQuery("#some-selector")
	  .css("background", "red")
	  .css("color", "white")
	  .css("font-weight", "bold")
	  .css("padding", 10);

这里有一个范例！每个方法调用都为一种样式指定一个值。这就要求这种方法能接收一个映射作为参数传入：

	jQuery("#some-selector").css({
	  "background" : "red",
	  "color" : "white",
	  "font-weight" : "bold",
	  "padding" : 10
	});

jQuery的`on()`方法可以注册事件处理器。和`css()`一样它也可以接收映射格式的一组事件，但更进一步地，它允许单一处理器可以被多个事件注册：

	// binding events by passing a map
	jQuery("#some-selector").on({
	  "click" : myClickHandler,
	  "keyup" : myKeyupHandler,
	  "change" : myChangeHandler
	});
	
	// binding a handler to multiple events:
	jQuery("#some-selector").on("click keyup change", myEventHandler);

你可以采用下面的 *方法模式* 实现上面的函数签名：

	DateInterval.prototype.values = function(name, value) {
	  var map;
	
	  if (jQuery.isPlainObject(name)) {
	    // setting a map
	    map = name;
	  } else if (value !== undefined) {
	    // setting a value (on possibly multiple names), convert to map
	    keys = name.split(" ");
	    map = {};
	    for (var i = 0, length = keys.length; i < length; i++) {
	      map[keys[i]] = value;
	    }
	  } else if (name === undefined) {
	    // getting all values
	    return this.values;
	  } else {
	    // getting specific value
	    return this.values[name];
	  }
	
	  for (var key in map) {
	    this.values[name] = map[key];
	  }
	
	  return this;
	};

如果你需要处理集合，考虑一下你可以为减少API用户可能需要执行的循环次数做些什么。假设我们有一堆想要设置默认值的`<input>`元素：
	
	<input type="text" value="" data-default="foo">
	<input type="text" value="" data-default="bar">
	<input type="text" value="" data-default="baz">

我们也许会以一个循环这样实现：

	jQuery("input").each(function() {
	  var $this = jQuery(this);
	  $this.val($this.data("default"));
	});

如果我们可以绕过这个方法，采用一个简单的回调函数应用到集合中每个`<input>`元素上呢？jQuery开发者已经想到这一点并且允许我们写更少的代码：

	jQuery("input").val(function() {
	  return jQuery(this).data("default");
	});

正是像这些接收映射参数、回调函数或序列化的属性名的细节，让你的API使用起来不仅更清晰，而且更舒服和高效。显然并非你的所有的API方法都会从这种方法模式中受益——何时这样做有意义，何时这样做是浪费时间，这完全由你来决定。尽可能人性化地在这方面保持一致。 *采用上面的技巧减少样版代码的需要，API用户会感激你的。*  

### 处理类型
每当你定义一个含参函数时，你会决定这个函数应该接受怎样的数据。一个计算两个日期之间间隔的天数的函数会是像这样：

	DateInterval.prototype.days = function(start, end) {
	  return Math.floor((end - start) / 86400000);
	};

可见，这个函数期望的输入是数字类型——准确来说，一个微秒级的时间戳。尽管这个函数完成了我们所预期的效果，但它还不够通用。如果我们要处理`Date`对象或是代表日期的字符串这样的参数呢？难道用户每次调用这个函数前都必须转换数据格式吗？不！只需要在集中的位置对输入进行验证并且转换为我们需要的格式，而不是凌乱地分散在调用API的代码中：

	DateInterval.prototype.days = function(start, end) {
	  if (!(start instanceof Date)) {
	    start = new Date(start);
	  }
	  if (!(end instanceof Date)) {
	    end = new Date(end);
	  }
	
	  return Math.floor((end.getTime() - start.getTime()) / 86400000);
	};

在添加了这6行之后，我们为这个函数添加了接受Date对象、数字型的时间戳、甚至像`Sat Sep 08 2012 15:34:35 GMT+0200 (CEST)`这样的日期字符串等类型的参数的处理能力。我们并不知道他人会如何和因何使用我们的代码，但是多一点远见，就可以确保整合我们的代码会很轻松。

有经验的开发者会在上面的示例代码中注意到另一个问题。我们假定了`start`日期在`end`日期之前。如果API用户偶然交换了这两个日期传入函数中，就会得到一个负的日期间隔。停下来好好考虑下这些场景吧。如果你得出的结论是负值不合理，那么就修复它吧：

	DateInterval.prototype.days = function(start, end) {
	  if (!(start instanceof Date)) {
	    start = new Date(start);
	  }
	  if (!(end instanceof Date)) {
	    end = new Date(end);
	  }
	
	  return Math.abs(Math.floor((end.getTime() - start.getTime()) / 86400000));
	};

JavaScript允许多种形式的类型转换。如果你需要处理基本类型（字符串、数字、布尔型），这种转换可以如此简单（而且很“简短”）：

	function castaway(some_string, some_integer, some_boolean) {
	  some_string += "";
	  some_integer += 0; // parseInt(some_integer, 10) is the safer bet
	  some_boolean = !!some_boolean;
	}

我并不提倡随时随地都这么做。但是当整合你的代码时，这些看上去无害的代码也许会节省时间和减少麻烦。

### 把`UNDEFINED`看作预期值
有时候你的API事实上期望获得一个`undefined`值来设置一个属性值，可能是为了将一个属性值设为“未置值”状态，也可能只是优雅地处理错误输入使你的API更加健壮。为了确定`undefined`是不是确实被传入到你的方法中，你可以检查`arguments`对象：

	function testUndefined(expecting, someArgument) {
	  if (someArgument === undefined) {
	    console.log("someArgument was undefined");
	  }
	  if (arguments.length > 1) {
	    console.log("but was actually passed in");
	  }
	}
	
	testUndefined("foo");
	// prints: someArgument was undefined
	testUndefined("foo", undefined);
	// prints: someArgument was undefined, but was actually passed in

### 命名参数
	event.initMouseEvent(
	  "click", true, true, window, 
	  123, 101, 202, 101, 202, 
	  true, false, false, false, 
	  1, null);

`Event.initMouseEvent`的函数签名像是噩梦成真。开发者绝无可能不用查看文档就能想起来 `1`（倒数第二个参数）的意思。不管你的文档写的有多么好，尽你所能让人们不必去查阅它！

### 其他语言是如何做的
越过我们热爱的语言之外，我们发现Python中有个名为[命名参数](http://www.diveintopython.net/power_of_introspection/optional_arguments.html)的概念。它允许你在声明一个函数时为参数提供默认值，允许你在调用上下文中声明属性名：

	function namesAreAwesome(foo=1, bar=2) {
	  console.log(foo, bar);
	}
	
	namesAreAwesome();
	// prints: 1, 2
	
	namesAreAwesome(3, 4);
	// prints: 3, 4
	
	namesAreAwesome(foo=5, bar=6);
	// prints: 5, 6
	
	namesAreAwesome(bar=6);
	// prints: 1, 6

有了这种设计，initMouseEvent()就可以变得像一个自解释的函数调用了：

	event.initMouseEvent(
	  type="click", 
	  canBubble=true, 
	  cancelable=true, 
	  view=window, 
	  detail=123,
	  screenX=101, 
	  screenY=202, 
	  clientX=101, 
	  clientY=202, 
	  ctrlKey=true, 
	  altKey=false, 
	  shiftKey=false, 
	  metaKey=false, 
	  button=1, 
	  relatedTarget=null);

目前JavaScript中还不可能这样书写。虽然“JavaScript的下一版本”（通常被称为ES.next，ES6，或者Harmony）会有[默认参数值](http://wiki.ecmascript.org/doku.php?id=harmony:parameter_default_values)和[可变参数](http://wiki.ecmascript.org/doku.php?id=harmony:rest_parameters)，但是命名参数仍然遥遥无期。

### 参数映射
JavaScript不是Python（而且ES.next还很遥远），要克服“参数森林”的障碍，留给我们的可选方案非常少。jQuery（以及差不多它提供的每一个恰当的API）采用了“选项对象”的概念。`jQuery.ajax()`方法签名提供了一个很好的例子。我们只需要传入一个对象，而不是一堆参数：

	function nightmare(accepts, async, beforeSend, cache, complete, /* and 28 more */) {
	  if (accepts === "text") {
	    // prepare for receiving plain text
	  }
	}
	
	function dream(options) {
	  options = options || {};
	  if (options.accepts === "text") {
	    // prepare for receiving plain text
	  }
	}

这样不仅避免了疯狂冗长的函数签名，也使得函数调用起来更加有描述性：

	nightmare("text", true, undefined, false, undefined, /* and 28 more */);
	
	dream({
	  accepts: "text",
	  async: true,
	  cache: false
	});

此外，在更新的版本中如果我们会引入新的特性，也不必影响到函数签名（添加一个新的参数）。

### 默认参数值
[jQuery.extend()](http://api.jquery.com/jQuery.extend/)、[_.extend()](http://underscorejs.org/#extend)和Prototype的[Object.extend](http://api.prototypejs.org/language/Object/extend/)都可以帮你合并对象，允许你将预置的选项对象输入合并：

	var default_options = {
	  accepts: "text",
	  async: true,
	  beforeSend: null,
	  cache: false,
	  complete: null,
	  // …
	};
	
	function dream(options) {
	  var o = jQuery.extend({}, default_options, options || {});
	  console.log(o.accepts);
	}
	
	// make defaults public
	dream.default_options = default_options;
	
	dream({ async: false });
	// prints: "text"

默认值可以公开访问了，恭喜你获得了附加分。这样一来，任何人都可以在集中的位置修改`accepts`的值为"json"，因而可以避免一再地指定这个选项。注意这个例子中总是会在初次读取选项对象时附加一个`|| {}`操作，从而可以使得无参传入时也能调用这个函数。

### 好意 —— 也可能是“陷阱”
既然你已经知道了如何更加弹性地接收参数，我们需要回到一条古谚：

>“With great power comes great responsibility!”
>
>“能力越大，责任越大！”
>
— Voltaire

类似大部分弱类型语言，JavaScript在需要时会自动进行类型转换。一个简单的例子是测试真假与否：

	var foo = 1;
	var bar = true;
	
	if (foo) {
	  // yep, this will execute
	}
	
	if (bar) {
	  // yep, this will execute
	}

我们相当习惯了这种自动转换。正是因为太习惯，以至于我们忘记了，即使有些值是真实存在的，从布尔值的角度它可能并不会被判为“真”。有些API设计得如此的弹性以至于有些 *过于聪明* 了。看看[jQuery.toggle()](http://api.jquery.com/toggle/)方法的签名吧：

	.toggle( /* int */ [duration] [, /* function */  callback] )
	.toggle( /* int */ [duration] [, /* string */  easing] [, /* function */ callback] )
	.toggle( /* bool */ showOrHide )

要解释明白为什么这些行为表现 *完全* 不同需要费点时间：

	var foo = 1;
	var bar = true;
	var $hello = jQuery(".hello");
	var $world = jQuery(".world");
	
	$hello.toggle(foo);
	$world.toggle(bar);

我们的 *预期* 是在两种情况下都使用`showOrHide`签名。然而事实上，`$hello`会以一秒的`duration`执行一次切换。这不是jQuery中的一个缺陷，这只是一个*与期望不符*的案例。即使你是一个有经验的jQuery开发者，你也会不时被这种问题绊倒。

你尽可以如你所愿添加尽可能多的便利——但是同时不要牺牲API的简洁性和健壮性（多半会）。如果你的代码中也提供了类似的API，考虑一下提供一个单独的方法，例如`.toggleIf(bool)`。不论采用什么办法，记得保持你的API的一致性！

## 可扩展性
![Developing Possibilities](http://media.smashingmagazine.com/wp-content/uploads/2012/10/developing-possibilities.jpg)

在选项对象部分，我们谈到了可扩展的配置的话题。让我们来讨论下允许API用户扩展核心和API本身。这是一个重要的话题，因为它可以使你的代码关注重要的事情，同时可以使API用户自己处理边界情况。好的API设计都很简约。提供丰富的配置项当然很好，但是过多的配置项会导致你的API变得臃肿晦涩。关注主要的应用场景，只提供大部分你的API用户需要的功能，其他的东西应该留给他们决定。为了允许API用户扩展你的代码以适应他们的需要，你可以有很多选择：

### 回调函数
回调函数可以用来根据配置实现可扩展性。你可以使用回调函数来允许API用户覆盖你的代码中的某些部分。当你感觉某些任务可能不会像你提供的默认的代码那样处理，将这部分代码重构为一个可配置的回调函数，来允许API用户易于重载：

	var default_options = {
	  // ...
	  position: function($elem, $parent) {
	    $elem.css($parent.position());
	  }
	};
	
	function Widget(options) {
	  this.options = jQuery.extend({}, default_options, options || {});
	  this.create();
	};
	
	Widget.prototype.create = function() {
	  this.$container = $("<div></div>").appendTo(document.body);
	  this.$thingie = $("<div></div>").appendTo(this.$container);
	  return this;
	};
	
	Widget.protoype.show = function() {
	  this.options.position(this.$thingie, this.$container);
	  this.$thingie.show();
	  return this;
	};


	var widget = new Widget({
	  position: function($elem, $parent) {
	    var position = $parent.position();
	    // position $elem at the lower right corner of $parent
	    position.left += $parent.width();
	    position.top += $parent.height();
	    $elem.css(position);
	  }
	});
	widget.show();

回调函数也是一种常见的允许API用户对你的代码创建的元素进行定制的方式：

	// default create callback doesn't do anything
	default_options.create = function($thingie){};
	
	Widget.prototype.create = function() {
	  this.$container = $("<div></div>").appendTo(document.body);
	  this.$thingie = $("<div></div>").appendTo(this.$container);
	  // execute create callback to allow decoration
	  this.options.create(this.$thingie);
	  return this;
	};


	var widget = new Widget({
	  create: function($elem) {
	    $elem.addClass('my-style-stuff');
	  }
	});
	widget.show();

一旦你的API接受回调函数，确保文档化其签名，并提供示例帮助API用户自定义你的代码。确保回调函数所执行的上下文（`this`的指向），以及接收的参数保持一致性。

### 事件
当需要与DOM打交道时，事件就会自然而然出现。在大型的应用中我们以各种形式（例如PubSub）使用事件使模块间通讯变得可能。当处理UI控件时，事件尤为有用并且很自然。像jQuery这样的库提供了简单的接口，允许你易于实现这方面的需求。

当有事情发生的时候事件配合工作最佳——这正是得名由来。显示或是隐藏一个控件可能取决于你的范围之外的环境。当控件显示时更新它也是很常见的工作。借助于jQuery的事件接口，这些都很容易实现，甚至允许使用事件委托：
	
	Widget.prototype.show = function() {
	  var event = jQuery.Event("widget:show");
	  this.$container.trigger(event);
	  if (event.isDefaultPrevented()) {
	    // event handler prevents us from showing
	    return this;
	  }
	
	  this.options.position(this.$thingie, this.$container);
	  this.$thingie.show();
	  return this;
	};
	
	
	// listen for all widget:show events
	$(document.body).on('widget:show', function(event) {
	  if (Math.random() > 0.5) {
	    // prevent widget from showing
	    event.preventDefault();
	  }
	
	  // update widget's data
	  $(this).data("last-show", new Date());
	});
	
	var widget = new Widget();
	widget.show();

你可以任意选择事件名。避免在处理专有的事件使用原生事件，并且考虑将你的事件放入命名空间下。jQuery UI的事件名都是由空间名和事件名组合而成的，例如`dialogshow`。我觉得这样难以阅读所以常将其改为`dialog:show`的默认写法，主要是因为这样一看便知是一个自定义事件，而不是什么个别浏览器的私有实现。

## 钩子机制
传统的getter/setter方法尤为可以从钩子机制中受益。钩子机制通常在数量和如何注册方面有别于回调函数。回调函数通常应用于特定任务的实例级，而钩子则往往应用于全局级别自定义值或是调度自定义行为。为了演示钩子如何使用，让我们看看[jQuery’s cssHooks](http://api.jquery.com/jQuery.cssHooks/)中的例子：

	// define a custom css hook
	jQuery.cssHooks.custombox = {
	  get: function(elem, computed, extra) {
	    return $.css(elem, 'borderRadius') == "50%"
	      ? "circle"
	      : "box";
	  },
	  set: function(elem, value) {
	    elem.style.borderRadius = value == "circle"
	      ? "50%"
	      : "0";
	  }
	};
	
	// have .css() use that hook
	$("#some-selector").css("custombox", "circle");

通过注册`custombox`这个钩子，jQuery的`.css()`方法拥有了可以处理一个之前无法处理的CSS属性的能力。在我的[jQuery hooks](http://blog.rodneyrehm.de/archives/11-jQuery-Hooks.html)一文中，我谈到了jQuery提供的一些其他的钩子，以及在实践中如何应用。你可以像处理回调一样提供钩子：

	DateInterval.nameHooks = {
	  "yesterday" : function() {
	    var d = new Date();
	    d.setTime(d.getTime() - 86400000);
	    d.setHours(0);
	    d.setMinutes(0);
	    d.setSeconds(0);
	    return d;
	  }
	};
	
	DateInterval.prototype.start = function(date) {
	  if (date === undefined) {
	    return new Date(this.startDate.getTime());
	  }
	
	  if (typeof date === "string" && DateInterval.nameHooks[date]) {
	    date = DateInterval.nameHooks[date]();
	  }
	
	  if (!(date instanceof Date)) {
	    date = new Date(date);
	  }
	
	  this.startDate.setTime(date.getTime());
	  return this;
	};


	var di = new DateInterval();
	di.start("yesterday");

从某种程度上讲，钩子是被设计为以你自己的代码来处理自定义值的一系列回调函数。有了钩子，你可以将差不多任何东西保持在可控范围内，同时提供API用户进行自定义的选择。

## 生成访问器
![duplication](http://media.smashingmagazine.com/wp-content/uploads/2012/10/duplication.jpg)

任何一个API多半都会有完成类似工作的多种访问方法（getters，setters，executors）。回到`DateInterval`的例子，我们应该会提供`start()`和`end()`方法以允许对时间间隔的操作。可以像这样简单解决：

	DateInterval.prototype.start = function(date) {
	  if (date === undefined) {
	    return new Date(this.startDate.getTime());
	  }
	
	  this.startDate.setTime(date.getTime());
	  return this;
	};
	
	DateInterval.prototype.end = function(date) {
	  if (date === undefined) {
	    return new Date(this.endDate.getTime());
	  }
	
	  this.endDate.setTime(date.getTime());
	  return this;
	};

如你所见，这里有很多重复性代码。采用生成器模式可以提供一种DRY（Don’t Repeat Yourself）解决方案：

	var accessors = ["start", "end"];
	for (var i = 0, length = accessors.length; i < length; i++) {
	  var key = accessors[i];
	  DateInterval.prototype[key] = generateAccessor(key);
	}
	
	function generateAccessor(key) {
	  var value = key + "Date";
	  return function(date) {
	    if (date === undefined) {
	      return new Date(this[value].getTime());
	    }
	
	    this[value].setTime(date.getTime());
	    return this;
	  };
	}

这种方式允许你生成多种类似的访问器方法，而不是单独定义每个方法。如果你的访问器方法需要更多的数据以配置，而不是一个简单的字符串，考虑像下面的方式书写代码：

	var accessors = {"start" : {color: "green"}, "end" : {color: "red"}};
	for (var key in accessors) {
	  DateInterval.prototype[key] = generateAccessor(key, accessors[key]);
	}
	
	function generateAccessor(key, accessor) {
	  var value = key + "Date";
	  return function(date) {
	    // setting something up 
	    // using `key` and `accessor.color`
	  };
	}

在 *处理参数* 那一节我们讨论到一种方法模式，允许你的getters/setters方法接受多种有用的类型，例如映射和数组。这种方法模式本身就是非常通用的，并且可以很容易转为一个生成器：

	function wrapFlexibleAccessor(get, set) {
	  return function(name, value) {
	    var map;
	
	    if (jQuery.isPlainObject(name)) {
	      // setting a map
	      map = name;
	    } else if (value !== undefined) {
	      // setting a value (on possibly multiple names), convert to map
	      keys = name.split(" ");
	      map = {};
	      for (var i = 0, length = keys.length; i < length; i++) {
	        map[keys[i]] = value;
	      }
	    } else {
	      return get.call(this, name);
	    }
	
	    for (var key in map) {
	      set.call(this, name, map[key]);
	    }
	
	    return this;
	  };
	}
	
	DateInterval.prototype.values = wrapFlexibleAccessor(
	  function(name) { 
	    return name !== undefined 
	      ? this.values[name]
	      : this.values;
	  },
	  function(name, value) {
	    this.values[name] = value;
	  }
	);

深入讲述编写符合DRY原则的代码不在本文讨论范围内。如果你对这个主题还比较生疏，[Rebecca Murphey](https://twitter.com/rmurphey)的[《Patterns for DRY-er JavaScript》](http://rmurphey.com/blog/2010/07/12/patterns-for-dry-er-javascript/)一文和[Mathias Bynens](https://twitter.com/mathias)的幻灯片[《how DRY impacts JavaScript performance》](http://slideshare.net/mathiasbynens/how-dry-impacts-javascript-performance-faster-javascript-execution-for-the-lazy-developer)都是很好的起步教程。

## 引用之怖
不同于其他语言，JavaScript中不存在 *按引用传递* 和 *按值传递* 的概念。按值传递是比较安全的做法，可以确保你的API中输入和输出的数据在外部被修改时，不需要告知其状态的变化。按引用传值往往是为了保持较低的内存开销，按引用传递的值可能会在你的API之外的任何地方被修改并影响其状态。

在JavaScript中无法判断参数应该按应用传递还是按值传递。基本类型（字符串、数字、布尔值）都被处理为 *按值传递* ，但是对象（任何对象，包括Array、Date）都以类似于按 *引用传递* 的方式进行处理。如果你初次接触这个话题，下面这个例子可以让你明白：

	// by value
	function addOne(num) {
	  num = num + 1; // yes, num++; does the same
	  return num;
	}
	
	var x = 0;
	var y = addOne(x);
	// x === 0 <--
	// y === 1
	
	// by reference
	function addOne(obj) {
	  obj.num = obj.num + 1;
	  return obj;
	}
	
	var ox = {num : 0};
	var oy = addOne(ox);
	// ox.num === 1 <--
	// oy.num === 1

如果你不注意，对对象的按引用处理有可能会回过头来给你带来麻烦。回到`DateInterval`的例子，看看下面这个棘手的问题：

	var startDate = new Date(2012, 0, 1);
	var endDate = new Date(2012, 11, 31)
	var interval = new DateInterval(startDate, endDate);
	endDate.setMonth(0); // set to january
	var days = interval.days(); // got 31 but expected 365 - ouch!

除非DateInterval的构造器为它接受的值 *创建拷贝* （创建拷贝的术语是`clone`），否则任何在原始对象上的改变都会直接反映到DateInterval的内部。这 *往往* 不是我们所想要或是所期望的。

注意，你的API中的返回值同样存在这样的隐患。如果你只是返回一个内部对象，你的API外部的任何变化都会反映到内部数据中。毫无疑问这并非你想要的。[jQuery.extend()](http://api.jquery.com/jQuery.extend/)、[_.extend()](http://underscorejs.org/#extend) 以及Protoype的[Object.extend](http://api.prototypejs.org/language/Object/extend/) 让你可以轻松摆脱引用之怖。

如果这里总结得还不够，你还可以读一读O'Reilly的[《JavaScript – The Definitive Guide》](http://docstore.mik.ua/orelly/webprog/jscript/index.htm)一书中[《By Value Versus by Reference》](http://docstore.mik.ua/orelly/webprog/jscript/ch11_02.htm)，讲得非常棒。

## 连续性问题
在连贯接口中，链上的每个方法都会被执行，不论对象主体处于什么状态。考虑在一个不包含任何DOM元素的jQuery实例上调用一些方法：

	jQuery('.wont-find-anything')
	  // executed although there is nothing to execute against
	  .somePlugin().someOtherPlugin();

在非链式的代码中，我们可以避免这些方法被执行：

	var $elem = jQuery('.wont-find-anything');
	if ($elem.length) {
	  $elem.somePlugin().someOtherPlugin();
	}

只要我们将方法链接起来，我们就无法避免这样的事情发生——我们无法从链中逃出来。只要API开发者能意识到对象可能处于这种境地：方法实际上不做任何事而`return this;`，一切就都还好。根据你的方法内的动作，在前面加一个简单的`is-empty`检测可以会有帮助：

	jQuery.fn.somePlugin = function() {
	  if (!this.length) {
	    // "abort" since we've got nothing to work with
	    return this;
	  }
	
	  // do some computational heavy setup tasks
	  for (var i = 10000; i > 0; i--) {
	    // I'm just wasting your precious CPU!
	    // If you call me often enough, I'll turn
	    // your laptop into a rock-melting jet engine
	  }
	
	  return this.each(function() {
	    // do the actual job
	  });
	};

## 处理错误
![Fail faster](http://media.smashingmagazine.com/wp-content/uploads/2012/10/fail-faster.jpg)

我说我们无法从链中逃出来，这其实是谎言——对于这条规则有一个`Exception`（请不要介意这个双关语☺）

通过抛出错误（异常）我们就可以强制退出。抛出错误往往被认为是当前执行流的蓄意中止，往往可能是因为你陷入无法恢复的状态。但是当心——并不是所有的错误都会帮助开发者调试：

	// jQuery accepts this
	$(document.body).on('click', {});
	
	// on click the console screams
	//   TypeError: ((p.event.special[l.origType] || {}).handle || l.handler).apply is not a function 
	//   in jQuery.min.js on Line 3

遇到这样的错误信息是调试时最痛苦的事。不要浪费他人的时间。如果API用户做错了什么，请告知他：

	if (Object.prototype.toString.call(callback) !== '[object Function]') { // see note
	  throw new TypeError("callback is not a function!");
	}

注意：`typeof callback === "function"`不应被使用，因为老式浏览器会认为对象是`function`，事实上它们不是。Chrome（直到版本12）中的`RegExp`就是如此。为了方便，使用[jQuery.isFunction()](http://api.jquery.com/jQuery.isfunction/)或是[_.isFunction()](http://underscorejs.org/#isFunction)。

对于语言（内置弱类型域）不在意严格的输入验证这一点，我接触过的大部分库采取了无视的态度。老实说，我也只在预感开发者会出错的时候在代码中进行校验。没有人真的做了，但是我们都应该去做。程序员是一个懒惰的群体——我们不会只是为了写代码或者什么我们并不真正相信的理由而写代码。Perl6的开发者已经意识到这是个问题，并且决定引入叫做*参数约束*的东西。在JavaScript中，它可能会是这样实现：

	function validateAllTheThings(a, b {where typeof b === "numeric" and b < 10}) {
	  // Interpreter should throw an Error if b is
	  // not a number or greater than 9
	}

尽管语法上看上去很丑陋，这种想法是要使输入验证称为这门语言的一个顶级公民。JavaScript与这样的东西差之千里。这样挺好——不管怎样，我不愿在函数签名中塞满这样一些约束。承认这个（弱类型语言中的）问题是这个故事中有意思的部分。

JavaScript既不弱也不低等，我们只是需要更努力一点工作以使我们的代码变得真正健壮。使代码具有健壮性并不意味着不论接受什么数据，只要挥挥魔杖就能得到结果。健壮性是指不接受垃圾 *并且告之开发者* 。

换个角度考虑输入验证：在你的API后面加几行代码，就可以确保开发者不必花费几个小时来跟踪诡异的错误，结果发现原来他们意外地给你的代码中传入了字符串而不是数字。这种时候你应该告诉用户 *他们输入有误* ，他们实际上会喜欢你这么做的。

## 处理异步
目前我们只讨论了同步的API。异步方法通常接受一个回调函数，从而在某个任务完成时通知外部世界。虽然在连贯接口中这样并不是非常合适：

	Api.protoype.async = function(callback) {
	  console.log("async()");
	  // do something asynchronous
	  window.setTimeout(callback, 500);
	  return this;
	};
	Api.protoype.method = function() {
	  console.log("method()");
	  return this;
	};

	// running things
	api.async(function() {
	  console.log('callback()');
	}).method();
	
	// prints: async(), method(), callback()

这个例子演示了什么情况下异步方法`async()`虽然开始执行但立即返回，却会导致`method()`在`async()`真正完成前就被调用了。某些时候我们需要这么做，但通常我们都期望`method()`在`async()`完成任务*之后*才会被执行。

### 延迟机制（允诺）
某种程度上，我们可以借助[允诺](http://wiki.commonjs.org/wiki/Promises/A)来解决同步和异步API调用混搭导致的混乱。jQuery称之为[延迟机制](http://api.jquery.com/category/deferred-object/)。用延迟替代常见的`this`，从而迫使你从方法链中强行退出。这起初看上去有点怪，但是可以有效地避免在调用一个异步方法之后继续同步执行：

	Api.prototype.async = function() {
	  var deferred = $.Deferred();
	  console.log("async()");
	
	  window.setTimeout(function() {
	    // do something asynchronous
	    deferred.resolve("some-data");
	  }, 500);
	
	  return deferred.promise();
	};


	api.async().done(function(data) {
	  console.log("callback()");
	  api.method();
	});
	
	// prints: async(), callback(), method()

延迟对象使你可以使用`.done()`、`.fail()`、`.always()`注册一些处理器，当异步任务完成或失败时，或者不关心状态如何，再调用它们。关于延迟机制更详细的介绍参见[《Promise Pipelines In JavaScript》](http://sitr.us/2012/07/31/promise-pipelines-in-javascript.html)。

## 调试连贯接口
虽然 *连贯接口* 更便于开发中使用，但就可调试性而言，会带来一些限制。

对于任何代码， *测试驱动开发* (TDD)是减少调试需求的一种简单方法。在使用TDD完成URI.js中，就调试代码而言，我没有遇到什么严重的痛苦。然而，TDD仅仅 *减少* 了调试的需要——并不会完全替代之。

网上有些言论声称，在单独的行中书写链中的每个部件，从而在堆栈跟踪时获得正确的行号。

	foobar.bar()
	  .baz()
	  .bam()
	  .someError();

这种技巧确实有它的好处（尽管不包括更好的调试技术）。像上面例子中这样书写代码更易于阅读。基于行的差异（在例如SVN、GIT这样的版本控制系统中有用到）也会带来细微的优势。关于智能调试，（目前）只有Chrome会将`someError()`展示在第四行，而其他浏览器则仍将其看作第一行。

添加一个简单的方法记录你的对象会很有用——尽管这样会被视为“手工调试”，并且会被那些习惯了“真实”的调试器的人看不惯：

	DateInterval.prototype.explain = function() {
	  // log the current state to the console
	  console.dir(this);
	};
	
	var days = (new Date(2012, 0, 1))
	  .until(2012, 11, 31) // returns DateInterval instance
	  .explain() // write some infos to the console
	  .days(); // 365

### 函数名
在本文中你随处可见很多`Foo.prototype.something = function(){}`这种风格的演示代码。这种风格是为了保持例子比较简洁。当编写API时你可能会考虑如下方式之一来使你的控制台正确地识别出函数名：

	Foo.prototype.something = function something() {
	  // yadda yadda
	};

------------------------------------------------------------------

	Foo.prototype.something = function() {
	  // yadda yadda
	};
	Foo.prototype.something.displayName = "Foo.something";

第二种方式中`displayName`是由WebKit引入的，之后被Firebug/Firefox所采纳。`displayName`需要多写点代码，但是允许任意的名字，包括命名空间或是关联对象。两者中的任何一种都对于处理匿名函数很有帮助。

关于这个话题的更多细节参见[kangax](https://twitter.com/kangax)的[《Named function expressions demystified》](http://kangax.github.com/nfe/)。

## 文档化API
软件开发中最困难的任务之一就是文档化。几乎所有人都讨厌做这件事，然而所有人都感叹他们需要使用的工具的文档纰漏或是缺失。目前有各种各样应该会提供帮助和自动文档化你的代码的工具：

- [YUIDoc](http://yui.github.com/yuidoc/) (requires Node.js, npm)
- [JsDoc Toolkit](https://github.com/p120ph37/node-jsdoc-toolkit) (requires Node.js, npm)
- [Markdox](https://github.com/cbou/markdox) (requires Node.js, npm)
- [Dox](https://github.com/visionmedia/dox) (requires Node.js, npm)
- [Docco](http://jashkenas.github.com/docco/) (requires Node.js, Python, CoffeeScript)
- [JSDuck](https://github.com/senchalabs/jsduck) (reqires Ruby, gem)
- [JSDoc 3](https://github.com/jsdoc3/jsdoc) (requires Java)

所有这些工具都会在某些方面不尽如人意。JavaScript是一种非常动态的语言，尤其在表达方式上特别多样化。这使得很多东西对这些工具而言比较困难。下面重点列出了一些我决定采用普通的HTML、markdown或是[DocBoock](http://en.wikipedia.org/wiki/DocBook)（如果这个项目足够大）制定文档的原因。譬如，jQuery同样遇到了这些问题，并且根本不在代码中文档化API。

1. 函数签名并不是你需要的唯一的文档化产出，但是大多数工具都只关注于此；
2. 示例代码可以为解释工作原理带来极大的帮助，但普通的API文档通常无法以合理的折衷来阐释；
3. API文档解释 *幕后*  的东西（流、事件等等）时会遭遇滑铁卢；
4. 文档化多签名方法往往实在痛苦；
5. 文档化使用选项对象的方法通常并不简单；
6. 生成方法不容易被文档化，默认回调也是。

如果你不能（或不想）调整你的代码以适应列出的文档化工具之一，类似[Document-Bootstrap](http://gregfranko.com/Document-Bootstrap/)这样的项目可能会节省你一些时间来建立你自己酝酿的文档。

确保你的文档化不只是一些生成的API文档。你的用户会感激你提供的示例。告诉他们你的软件如何工作的，以及当执行某件事时都会牵涉到哪些事件。如果有助于他们理解你的软件到底做了些什么，为他们画一张图。最重要的是，保持你的文档与你的代码同步！

### 自解释的代码
提供优秀的文档并不会使开发者不用阅读你的代码——你的代码本身就是文档的一部分。当文档不够用时（每个文档都是有限的），开发者会回到阅读源代码获取答案。事实上，你也是他们中的一员。很可能你会一边又一遍地阅读你自己的代码，几周、几个月甚至几年之间。

你应该编写可以解释自身的代码。大部分时候这并不是个问题，只有当你为命名事物（函数、变量等等）殚精竭虑、坚持核心概念时才会涉及到。如果你发现你在写代码注释以文档化你的代码如何工作，你很可能在浪费时间——你的时间，还有读者的时间。在你的代码中的注释应该解释 *为何* 你以这种特殊的方式解决问题，而不是解释你 *如何* 解决问题。 *如何* 解决问题应该在你的代码中很明显，所以不要自我重复。注意，使用注释以标示你的代码中的区块，或是解释普通概念，这些都是完全可接受的。

### 总结
- API是你（提供者）和用户（消费者）之间的契约。不要在版本之间发生变化。
- 你应该投入和解决 *我的软件内部如何工作？* 的问题同样多的时间，来解决 *用户会如何使用我的软件？* 这个问题。
- 只要一些简单的技巧你就可以很显著地减少开发者的辛苦（就代码行数而言）
- 尽可能早地处理非法输入——抛出错误
- 好的API都是弹性的，更好的API不会让你犯错

继续阅读[《Reusable Code for good or for awesome》](http://vimeo.com/35689836)（[幻灯片](http://www.slideshare.net/jaffathecake/reusable-code-for-good-or-for-awesome)），这是[Jake Archibald](https://twitter.com/jaffathecake)关于设计API的一番讨论。早在2007年Joshua Bloch在Google技术讲座上做了题为[《How to Design A Good API and Why it Matters》](http://www.youtube.com/watch?v=heh4OeB9A-c)演讲。虽然他的讨论并不集中于JavaScript，他解释的基本原理仍然适用。

既然你已经掌握了关于API设计的最新进展，读一读[Addy Osmani](https://twitter.com/addyosmani)写的[《Essential JS Design Patterns》](http://addyosmani.com/resources/essentialjsdesignpatterns/book/)来了解更多关于如何组织你的内部代码吧。

*感谢[@bassistance](https://twitter.com/bassistance)、[@addyosmani](https://twitter.com/addyosmani)和[@hellokahlil](https://twitter.com/hellokahlil)抽出时间校验本文。*