KISSY.add(function(S, Dep) {
	console.log('Mod Added!');
	S.one('#mod').html(Dep.toString());
	return 'Mod & Dep loaded!';
}, {requires: ['./dep'] });