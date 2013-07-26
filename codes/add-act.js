KISSY.add('add-act', function(S,DOM,Node,Event,IO,Overlay,Autocomplete,Calendar){

    var $ = S.all, _ = S.one;

    function AddAct(config){
        var self = this;
        //调用父类构造函数
        AddAct.superclass.constructor.call(self, config);
        self.init(config);
    }

    S.extend(AddAct, S.Base, /** @lends AddAct.prototype*/{

        /**
         * Init
         * @param config
         */
        init: function(config){

            // init flight list and hotel item list
            var self = this;
            var flightList = config['flightList'];
            var hotelList = config['hotelList'];
            if(flightList != ''){
                self.set('flightList', flightList.split(';'));
            }
            self.set('hotelList', hotelList == '' ? {} : S.JSON.parse(hotelList));

            // init form param data in the vm
            self.formParam = {
                subActivityId: config.subActivityId,
                agentId: config.agentId,
                userId: config.userId,
                _tb_token_: config._tb_token_
            };

            // init calendars
            self._initCalendars();

            // init city autocomplete component
            self._initCitySelectors();

            // init hotel list iframe overlay
            self._initProductDialog(config.hotelListUrl);

            // bind events
            self.bindEvent();
        },

        /**
         * Init calendars in the page
         * @private
         */
        _initCalendars: function(){
            var self = this;
            Node.all('td.J_Calendar').each(function(item){
                var id = item.attr('id');
                var calendar = new Calendar({
                    triggerNode: '#' + id + ' .start',
                    finalTriggerNode: '#' + id + ' .end'
                });
                calendar.on('show', function(e){

                    self._procCalendarShow(e.node, this);
                }).on('dateclick', function(e){

                        self._procCalendarDateClick(e.date, this);
                    });

                item.all('input').on('keydown', function(e){

                    e.preventDefault();
                    self._procCalendarInputDelete(e.keyCode, $(this), calendar);
                });

                item.data('calendar', calendar);
            });
        },

        /**
         * proc calendar show event listener
         * @param node      get event trigger node
         * @param calendar  relative calendar object
         * @private
         */
        _procCalendarShow: function(node, calendar){
            var dateType = S.one('#dateGapSel').val();
            if(node.hasClass('start')){
                calendar.set('minDate', new Date);
                var maxDate = (dateType == "2") ? '' : (calendar.get('endDate') || '');
                calendar.set('maxDate', maxDate);
                calendar.render();
            }else if(node.hasClass('end')){
                calendar.set('minDate', this.get('startDate') || new Date);
                calendar.set('maxDate', '');
                calendar.render();
            }
        },

        /**
         * proc calendar date click event listener
         * @param date      get event trigger node selected date
         * @param calendar  relative calendar object
         * @private
         */
        _procCalendarDateClick: function(date, calendar){
            var dateType = S.one('#dateGapSel').val();
            if((dateType == "2") && !(calendar.get('endDate'))){
                S.one(calendar.get('finalTriggerNode')).val(date);
            }
        },

        /**
         * process calendar input field keydown event, only backspace keydown is available
         * @param keyCode   key code
         * @param node      input field node
         * @param calendar  relative calendar
         * @private
         */
        _procCalendarInputDelete: function(keyCode, node, calendar){
            // if user entered backspace key
            var BACKSPACE_KEY = 8;
            if(keyCode == BACKSPACE_KEY){

                node.val('');
                node.hasClass('start') && calendar.set('startDate', '');
                node.hasClass('end') && calendar.set('endDate', '');
            }
        },

        /**
         * init city autocomplete component
         * @private
         */
        _initCitySelectors: function(){
            var self = this;
            Node.all('input.J_City_Selector').each(function(item){
                var autocomplete = new Autocomplete({
                    inputNode        : new Node(item),
                    source           : 'http://s.jipiao.trip.taobao.com/city_search.do?lines={maxResults}&q={query}',
                    resultListLocator: function(results){
                        self._citySelectorResultListLocator(results);
                    },
                    resultTextLocator: 'cityName',//指定文本内容
                    activeFirstItem  : true,
                    hotSource : 'http://www.taobao.com/go/rgn/trip/chinahotcity_jsonp.php', //hot suggestions
                    resultFormatter  : function (query, results) {//对展示进行格式化
                        self._citySelectorResultFormatter(query, results);
                    }
                });

                // bind select/queryChange event listener
                autocomplete.on('select', function(e){

                    self._setCityCode(e.result.raw.cityCode, e.target.inputNode);
                }).on('afterQueryChange', function(e){

                    //处理删除清空时inputNode绑定的cityCode
                    if(e.newVal.inputValue == ''){
                        self._setCityCode('', this.get('inputNode'));
                    }
                });
            });
        },

        /**
         * result list locator for city autocomplete component
         * @param results
         * @returns {Array}
         * @private
         */
        _citySelectorResultListLocator: function(results){
            results = results.result;
            var filtedData = [];
            // process nearCity data based on the interface
            S.each(results, function(_item){
                if(_item.hasAirport){
                    filtedData.push(_item);
                }else{
                    var nearCities = _item.nearCity;
                    S.each(nearCities, function(nearCity){
                        var nearCityFormat = S.mix(nearCity, {
                            nearCity: _item.cityName
                        });
                        filtedData.push(nearCityFormat);
                    });
                }
            });
            return filtedData;
        },

        /**
         * result formatter for city autocomplete component
         * @param query     inputted query value
         * @param results   raw list data
         * @returns {Array} formatted list
         * @private
         */
        _citySelectorResultFormatter: function(query, results){
            var result = [];
            var tmpl = '<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityname}</span><span class="ks-ac-intro">{py}</span></div>';
            var prevNearCity = '';
            //临近城市的显示处理
            for(var idx in results){
                var _item = results[idx];
                if(!_item.raw.nearCity){
                    //有机场，未设置nearCity
                    result.push(S.substitute(tmpl, {
                        cityname: _item.text.replace(new RegExp(query, 'gi'), '<span class="ks-ac-message-hightlight">' + query + '</span>'),
                        py      : _item.raw.py.replace(new RegExp(query, 'gi'), '<span class="ks-ac-message-hightlight">' + query + '</span>')
                    }));
                }else{
                    //无机场，处理附近城市
                    var html = '<div class="ks-ac-item"><div class="ks-ac-near-tip">"' + _item.raw.nearCity + '"&nbsp;没有机场</div>';
                    var nearAirportTpl = '<div class="ks-ac-item-inner ks-ac-item-inner-sub">' +
                        '<span class="ks-ac-name">邻近机场：{cityName}&nbsp;--&nbsp;距离{distance}公里</span></div>';
                    var cityHtml = S.substitute(nearAirportTpl, {
                        cityName: _item.text,
                        distance: _item.raw.distance
                    });

                    if(_item.raw.nearCity != prevNearCity){
                        //对于首个附近机场城市，加入tip
                        html += cityHtml + '</div>';
                        prevNearCity = _item.raw.nearCity;
                    }else{
                        html = cityHtml;
                    }
                    result.push(html);
                }
            }
            return result;
        },

        /**
         * 用户选中某个城市后，将该城市的编码绑定到输入框data域
         * @param cityCode
         * @param node
         * @private
         */
        _setCityCode: function(cityCode, node){
            node.data('cityCode', cityCode);
        },

        _initProductDialog: function(hotelUrl){
            var self = this;
            var dialog = new Overlay.Dialog({
                width: 600,
                bodyContent: '<iframe id="addProdFrame" scrolling="no" height="500" width="598" frameborder="0" name="addProdFrame" src="'+ hotelUrl +'"></iframe>',
                mask: true,
                align:{
                    node: '#content',
                    points: ['tc', 'cc'],
                    offset:  [0, 200]
                }
            });
            self.productDialog = dialog;
        },


        /**
         * Event bind center
         */
        bindEvent: function(){

            var self = this;

            // mix validation nodes to execute validation functions
            S.mix(self, {
                actName: _('#prom-name'),
                dateGapSel: ('#dateGapSel'),
                flightListNode: _('#added-flights td'),
                addFlightBtn: _('#add-flight'),
                flightNumberInp: _('#flight-number input'),
                hotelListNode: _('#J_HotelProductList'),
                addHotelShowBtn: _('#add-product'),
                discountInp: _('#discount input'),
                prefContentInps: $('#copywPrice, #copywType'),
                submitBtn: _('#J_save'),

                iframeDoc: $(frames["addProdFrame"].document),
                addHotelBtn: this.iframeDoc.one('#add-confirm')

            });

            /* validation events */
            self.actName.on('change', self.validators.actNameValidate);
            self.flightNumberInp.on('change', self.validators.flightNumberValidate);
            self.discountInp.on('change', self.validators.discountValidate);
            self.prefContentInps.on('blur', self.validators.prefContentValidate);


            /* interaction events */
            // process activity switch action
            self.dateGapSel.on('change', self.actDateSwitch);

            // process flight interact events
            self.addFlightBtn.on('click', self._addFlight);
            self.flightListNode.delegate('click', 'a.del-flight', function(e){
                if(confirm('确定要删除吗？')){
                    self._removeFlight($(e.currentTarget).parent().attr('data-key'));
                    self.fire('flightListChange');
                }
            });

            // process product(hotel) interact events
            self.addHotelShowBtn.on('click', self._addProductShow);
            self.addHotelBtn.on('click', self._addProduct);
            self.hotelListNode.delegate('click', 'button.del-hotel', function(e){
                if(confirm('确定要删除吗？')){
                    var key = new Node(e.currentTarget.parentNode).attr('data-id');
                    self._removeProduct(key);
                    self.fire('hotelListChange');
                }
            });

            // form submit event
            self.submitBtn.on('click', self.submit);

            /* Custom Events */
            self.on('flightListChange', self._renderFlightList);
            self.on('hotelListChange', self._renderHotelList);
        },

        /**
         * validators for the form
         */
        validators: {
            /**
             * act name validation (length limit)
             * @returns {boolean}
             */
            actNameValidate: function(){
                var self = this;
                var val = S.trim(self.actName.val());
                if(val.length > 5){
                    return self.validateWarning(self.actName, self.actName.siblings('.tip'));
                }
                return true;
            },

            /**
             * flight number format validation and value reformat
             * @returns {boolean}
             */
            flightNumberValidate: function(){
                var node = self.flightNumberInp,
                    value = S.trim(node.val());
                if(value != ''){
                    if(!(/^([a-zA-Z0-9\*]*;)*([a-zA-Z0-9\*]*)$/.test(value))){
                        return self.validateWarning(node, node.siblings('.tip'));
                    }else{
                        value = value.split(';');
                        var uniqueArr = [];
                        S.each(value, function(item){
                            if(!S.inArray(item, uniqueArr) && (S.trim(item) != '')){
                                uniqueArr.push(item);
                            }
                        });
                        node.val(uniqueArr.join(';'));
                    }
                }
            },

            /**
             * discount validation
             * Must be positive
             * Must be in range (0, 10)
             * Must reserve 0~2 bit decimal
             * @returns {boolean}
             */
            discountValidate: function(){
                var node = self.discountInp,
                    value = parseFloat(S.trim(node.val())),
                    tipSelector = '';
                node.val(value || 0);
                if(!value || value < 0){
                    tipSelector = '.positive';
                }else if(value >= 10){
                    tipSelector = '.range';
                }else if(value.toString().length > 4){
                    tipSelector = '.decimal';
                }else{
                    return true;
                }
                return self.validateWarning(node, node.siblings(tipSelector));
            },

            /**
             * validate prefer promotion content
             * rmb should in (0.1, 999999)
             * discount should in (0.1, 9.9)
             * reserved decimal should less than 1 bit
             * @returns {boolean}
             */
            prefContentValidate: function(){
                var td = _('#pref-content'),
                    val = parseFloat(td.one('#copywPrice').val()),
                    prefType = td.one('#copywType').val(),
                    decimal = val.toString().split('.')[1],
                    tip = '';
                if(prefType == '1' && !(val >= 0.1 && val <= 999999)){
                    tip = 'span.tip';
                }else if(prefType == '2' && !(val >= 0.1 && val <= 9.9)){
                    tip = 'span.dis-tip';
                }else if(decimal && decimal.length > 1){
                    tip = 'span.decimal-tip';
                }else{
                    return true;
                }
                return self.validateWarning(td, td.one(tip));
            }
        },

        /**
         * activity date switch between "the day" and "time bucket"
         * @param node  the switch node
         */
        actDateSwitch: function(){
            var selNode = self.dateGapSel,
                cal = selNode.closest('td.J_Calendar').data('calendar'),
                endDiv = selNode.next('div.calendar-wrap');
            // when selecting "the day", remove the limit for maxDate/endDate
            if(selNode.val() == '2'){
                cal.set({
                    'endDate': '',
                    'maxDate': ''
                });
                endDiv.one('input').val(cal.get('startDate'));
            }
            endDiv.toggle();
        },

        /**
         * render html string based on flightlist template and data
         * @private
         */
        _renderFlightList: function(){
            var self = this,
                listData = self.get('flightList'),
                tpl = self.get('flightListTpl'),
                htmlStr = '';
            S.each(listData, function(item){
                var flightArr = item.split('|')[1].split(','),
                    obj = {
                        key: item,
                        depCity: flightArr[0],
                        arrCity: flightArr[1],
                        flightType: flightArr[2]
                    };
                htmlStr += S.substitute(tpl, obj);
            });

            self.flightListNode.html(htmlStr);
        },

        /**
         * add flight line
         * @private
         */
        _addFlight: function(){
            var self = this,
                btn = self.addFlightBtn,
                roundtripRadio = $('#roundtrip input'),
                roundtrip = 0;

            // process roundtrip validation
            if(roundtripRadio[0].checked){
                roundtrip = 1;
            }else if(roundtripRadio[1].checked){
                roundtrip = 2;
            }else{
                alert('请选择往返程！');
                return;
            }

            //处理出发/到达城市
            var cities = btn.parent().all('.inp-text'),
                fromCity = $(cities[0]),
                toCity = $(cities[1]);
            var fromVal = S.trim(fromCity.val()),
                toVal = S.trim(toCity.val());
            if(fromVal == '' && toVal == ''){
                alert('出发城市和到达城市不得同时为不限！');
            }else if(fromVal == toVal){
                alert('出发城市不得和到达城市相同！');
            }else{
                //处理添加
                if(fromVal == ''){
                    fromVal = '不限';
                    fromCity.data('cityCode', '');
                }
                var key = (fromCity.data('cityCode') || '*') + ","
                    + (toCity.data('cityCode') || '*') + ","
                    + roundtrip + "|" + (fromVal || '不限') + ","
                    + (toVal || '不限') + ","
                    + roundtripRadio[roundtrip - 1].value;

                var curList = self.get('flightList');
                self._addItem(curList, key);
                self.fire('flightListChange');

                //处理输入清理
                roundtripRadio[roundtrip - 1].checked = false;
                fromCity.val('');
                fromCity.data('cityCode', '');
                toCity.val('');
                toCity.data('cityCode', '');
            }
        },

        /**
         * remove flight line according to the given key
         * @param key
         * @private
         */
        _removeFlight: function(key){
            var self = this;
            var curList = self.get('flightList');
            self._removeItem(curList, key);
            self.fire('flightListChange');
        },

        /**
         * render html string based on hotel list template and data
         * @private
         */
        _renderHotelList: function(){
            var self = this,
                listData = self.get('hotelList'),
                tpl = self.get('hotelListTpl'),
                htmlStr = '';
            S.each(listData, function(item, idx){
                var obj = {
                    id: idx,
                    img: item.img,
                    title: item.title,
                    price: item.price
                };
                htmlStr += S.substitute(tpl, obj);
            });

            self.flightListNode.html(htmlStr);

            // for required-field check
            var listVal = S.isEmptyObject(listData) ? '' : listData;
            _('#itemList').val(listVal);
        },

        /**
         * open add hotel product dialog
         * @private
         */
        _addProductShow: function(){
            var self = this;
            self.productDialog.show();
        },

        /**
         * add product in the overlay page
         * @private
         */
        _addProduct: function(){
            var self = this,
                curList = self.get('hotelList');

            self.iframeDoc.all('#prod-list input').each(function(inp){
                inp = inp[0];
                if(inp.checked){
                    var val = S.trim(inp.value),
                        item = $(inp).closest('div.hotel-item');

                    self._addItem(curList, val, {
                        img: item.one('img').attr('src'),
                        title: item.one('h4').text(),
                        price: item.one('.t-price').text()
                    });

                    //清理checked
                    inp.checked = '';
                }
            });
            self.fire('hotelListChange');
        },

        /**
         * remove hotel product
         * @param key   product id
         * @private
         */
        _removeProduct: function(key){
            var self = this,
                curList = self.get('hotelList');
            self._removeItem(curList, key);
            self.fire('hotelListChange');
        },

        /**
         * validate to-be-submit data
         * @returns {*} false(validation failure) or formatted data(validation pass)
         */
        validateData: function(){
            var self = this;
            var result = true;

            // process required fields
            $('td.required-field').each(function(item){
                item.all('input').each(function(node){
                    if(S.trim(node.val()) == ''){
                        var td = node.closest('td'),
                            tip = td.one('span.req-tip');
                        if(tip == null){
                            tip = new Node('<span class="tip req-tip">该项为必填项</span>');
                            td.append(tip);
                        }
                        result = self.ValidateFailCallback(item, tip);
                    }
                    return result;
                });
                return result;
            });

            // process required checkbox checked
            if(result){
                $('.need-check').each(function(item){
                    if(item.one('input:checked') == null){
                        result = self.ValidateFailCallback(item, item.one('.tip'));
                    }
                    return result;
                });
            }

            // process form validation
            if(result){
                S.each(self.validators, function(validateFunc){
                    result && validateFunc.call();
                });
            }

            return result && self._formatData();
        },

        /**
         * format to-submit data
         * @returns {{activityName: string, activityStart: *, activityEnd: *, promotionType: string, discount: *, perPurchase: (*|undefined|String|String[]|Number), flightLinesStr: string, flightTimeStart: *, flightTimeEnd: *, flightsStr: *, refundTicket: *, cabinType: (*|undefined|String|String[]|Number), copywPrice: (*|undefined|String|String[]|Number), copywType: (*|undefined|String|String[]|Number), copywContent: string, itemsStr: string}}
         * @private
         */
        _formatData: function(){
            var self = this,
                _trim = S.trim,
                actTime = $('#prom-time input'),
                actStartTime = actTime[0].value,
                dateGapSel = _('#dateGapSel').val();
            return S.merge(self.formParam, {
                'activityName': encodeURI(_trim(_('#prom-name').val())),
                'activityStart' : _trim(actStartTime),
                'activityEnd' : _trim(dateGapSel == '1' ? actTime[1].value : actStartTime),
                'promotionType': "1",
                'discount': _trim(_('#discount input').val()),
                'perPurchase': _('#perPurchase').val(),
                'flightLinesStr': encodeURI(self.get('flightList').join(';')),
                'flightTimeStart': _trim($('#flight-time input')[0].value),
                'flightTimeEnd': _trim($('#flight-time input')[1].value),
                'flightsStr': _trim(_('#flight-number input').val()),
                'refundTicket': _trim(_('#refundTicket input:checked').val()),
                'cabinType': _('#cabinType input:checked').val(),
                'copywPrice': _('#pref-content input').val(),
                'copywType': _('#copywType').val(),
                'copywContent': encodeURI(_('#copywContent').val()),
                'itemsStr' : S.keys(self.get('hotelList')).join(';')
            });
        },

        /**
         * submit form data using ajax
         */
        submit: function(){
            var self = this,
                data = self.validateData();
            if(data){
                IO({
                    url : "json/seller_rule_set_json.htm",
                    type : "post",
                    data : data,
                    dataType : "json",
                    success : function (json){
                        if (json.success){
                            alert("保存成功");
                            window.location.href = 'seller_act_manager.htm';
                        }
                        else{
                            alert(json.msg);
                        }
                    },
                    error : function (){
                        alert("失败！");
                        //window.location.reload();
                    }
                });
            }
        },


        /**
         * validate field failure callback function
         * @param node  field node
         * @param tip   referred tip node
         * @returns {boolean}
         */
        validateWarning: function(node, tip){
            DOM.scrollIntoView(node, window);
            tip.show().fadeOut(4);
            return false;
        },


        /**
         * add item(string/{key:value} object) to list
         * @param source    array/object
         * @param item      string for array, object's key for object
         * @param value     object's value for object
         * @private
         */
        _addItem: function(source, item){
            if(S.isArray(source)){
                if(!S.inArray(item, source)){
                    source.push(item);
                }
            }else if(S.isObject(item)){
                source[item] = arguments[2];
            }
        },


        /**
         * delete item(string) from array or object
         * @param source array/object
         * @param item string
         * @private
         */
        _removeItem: function(source, item){
            if(S.isArray(source)){
                source.splice(S.indexOf(item), 1);
            }else if(S.isObject(source)){
                delete source[item];
            }
        }

    }, {ATTRS: /** @lends AddAct*/{

        flightList: {
            value: []
        },
        hotelList: {
            value: {}
        },

        flightListTpl: {
            value: '<span class="flight-added" data-key="{key}">{depCity}-{arrCity}({flightType}) ' +
                '<a class="del-flight"  class="t-link" href="javascript:;">删除</a></span>'
        },

        hotelListTpl: {
            value: '<div class="hotel-added" data-id="{id}"><img src="{img}"/><h4>{title}</h4>' +
                '<span class="hotel-price">售价：<span class="t-price">{price}</span></span>' +
                '<button type="button" class="t-btn t-btn-big t-btn-danger del-hotel">删除</button></div>'
        }

    }});

    return AddAct;
},{
    requires: ['dom','node','event','ajax','overlay','gallery/autocomplete/1.0/','gallery/calendar/1.1/','sizzle']
})