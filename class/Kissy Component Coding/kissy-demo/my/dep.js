KISSY.add(function(S){
	console.log('Dep added!');
	S.one('#dep').html('My Dep loaded!');
	return {
		dep: 'My Dep loaded!'
	};
});