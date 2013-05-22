KISSY.use('dom, node', function(S, DOM, Node){
	var html = Node.one('#code').html();
	Node.one('#source').html('<pre>' + html + '</pre>');
});