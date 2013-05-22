// 模块名字
KISSY.add('gallery/calendar/1.0/index', function(S) {

    function Calendar() {
        alert('My Calendar!');
        return 'Custome Calendar';
    }

    //默认配置

    //类继承
    S.extend(Calendar, S.Base);

    //私有方法
    return Calendar;
}, {
    requires: []
});