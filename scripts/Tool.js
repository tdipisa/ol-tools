OLTools.Tool = OLTools.Class({

	map: null,
	
	options: null,
	
	initialize: function(options) {
		this.options = options;
		
		if(this.options && this.options.map){
			this.map = this.options.map;
		}
	}
	
});