OLTools.Tool = OLTools.Class({

	map: null,
	
	initialize: function(options) {	
		if(options && options.map){
			this.map = options.map;
		}
	}
	
});