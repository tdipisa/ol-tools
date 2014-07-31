OLTools.Tool.Annotation = OLTools.Class(OLTools.Tool, {
	
	layer: null,
	
	popup: null,
	
	featureAttributes: [],
	
	controls: [],
	
	panel: null,
	
	active: false,
	
    initialize: function(options) {
	    OLTools.Tool.prototype.initialize.apply(this, arguments);
		this.popup = new OLTools.Tool.EditPopup(options); 
    },
	
	activate: function(){
		this.active = true;
	},
	
	deactivate: function(){
		if(this.active === true){
			// destroy map controls of this tool
			for(var i=0; i< this.controls.length; i++){
				var control = this.controls[i];
				this.map.removeControl(control);
				control.destroy();					
			}
			
			this.controls = [];
			
			// destroy the tools panel contained
			this.map.removeControl(this.panel);
			this.panel.destroy();
			
			// erase the vector layer and then destroy it
			this.layer.removeAllFeatures();
			this.map.removeLayer(this.layer);
			this.layer.destroy();			
			
			this.featureAttributes = [];
			
			this.hideEditPopup();
			
			this.active = false;
		}
	},
		
	attachEventListeners: function(){
		this.layer.events.on({
			featureselected: function (event) {
				var feature = event.feature;
				
				// Check if the select control is active, in this case don't show buttons in popup
				var control = this.map.getControlsBy("title", this.selectControlName)[0];
				this.showEditPopup(feature, control.active ? false : true);
			},
			featureadded: function(event){
				var feature = event.feature;
				
				// Save the feature attribute locally at startup
				if(this.featureAttributes.length < 1){
					for(attribute in feature.attributes){
						this.featureAttributes.push(attribute);
					}
				}
				
				// Populate the new added feature by the user with FeatureType attributes
				if(jQuery.isEmptyObject(feature.attributes)){
					for(var i=0; i<this.featureAttributes.length; i++){
						var attribute = this.featureAttributes[i];
						feature.attributes[attribute] = "";
					}
					
					this.showEditPopup(feature, true);
				}
			},
			beforefeaturemodified: function(evt){
				this.popup.prevFeature = evt.feature.clone();
			},
            scope: this
		});
	},
	
	showEditPopup: function(feature, edit){
		
		var centerLonLat = feature.lonlat ? feature.lonlat  : feature.geometry.bounds.getCenterLonLat();
		var location = this.map.getPixelFromLonLat(centerLonLat);
		
		var popupOtps = {
			feature: feature,
			location: location,
			edit: edit
		};
		
		this.popup.show(popupOtps);
	},
	
	hideEditPopup: function(){
		this.popup.hide();
	}
	
});


