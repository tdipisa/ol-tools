OLTools.Tool.LinearAnnotation = OLTools.Class(OLTools.Tool, {

	layer: null,
	
	popup: null,
	
	featureAttributes: [],
	
	controls: [],
	
	panel: null,
	
	active: false,
	
	selectControlName: "Linear Annotation Select Feature",
	
    initialize: function(options) {
		OLTools.Tool.prototype.initialize.apply(this, arguments);
		this.popup = new OLTools.Tool.EditPopup(options); 
		
		this.styles = new OpenLayers.StyleMap({
			"default": new OpenLayers.Style(null, {
				rules: [
					new OpenLayers.Rule({
						symbolizer: {
							"Line": {
								strokeWidth: 2,
								strokeOpacity: 1,
								strokeColor: "#000000",
								orientation: true,        // to draw arows
								strokeLineJoinRadius: 0.5 // to draw curve between segments
							}
						}
					})
				]
			}),
			"select": new OpenLayers.Style(null, {
				rules: [
					new OpenLayers.Rule({
						symbolizer: {
							"Line": {
								strokeWidth: 2,
								strokeOpacity: 1,
								strokeColor: "#0000ff",
								orientation: true,        // to draw arows
								strokeLineJoinRadius: 0.5 // to draw curve between segments
							}
						}
					})
				]
			}),
			"temporary": new OpenLayers.Style(null, {
				rules: [
					new OpenLayers.Rule({
						symbolizer: {
							"Line": {
								strokeWidth: 2,
								strokeOpacity: 1,
								strokeColor: "#0000ff",
								orientation: true,        // to draw arows
								strokeLineJoinRadius: 0.5 // to draw curve between segments
							}
						}
					})
				]
			})
		});	
    },
	
	activate: function(){
		if(this.options){			
			// /////////////////////////////////////
			// Defining Layer Vector for this tool
			// /////////////////////////////////////		
			if(this.options.strategies && this.options.url){
				this.layer = new OpenLayers.Layer.Vector(this.options.vectorName || "linear-annotation-vector", {
					renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
					strategies: this.options.strategies,                
					protocol: new OpenLayers.Protocol.HTTP({
						url: this.options.url,
						format: new OpenLayers.Format.GeoJSON()
					}),
					styleMap: this.styles
				});
			}else{
				this.layer = new OpenLayers.Layer.Vector(this.options.vectorName || "linear-annotation-vector", {
					renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
					styleMap: this.styles
				});
			}	

			this.attachEventListeners();

			this.map.addLayers([this.layer]);
			
			// /////////////////////////////////////
			// Defining Draw and Modify controls
			// /////////////////////////////////////
			var drawLine = new OpenLayers.Control.DrawFeature(this.layer, OpenLayers.Handler.Path, {
				displayClass: 'olControlDrawFeaturePath'
			});
		
			drawLine.events.register('deactivate', this, function(){
				this.hideEditPopup();				
				if(!this.popup.featureModified.attributes 
					&& !this.popup.featureModified.saved &&
						this.popup.feature){
					this.layer.destroyFeatures([this.popup.feature]);					
				}
			});
			
			this.controls.push(drawLine);
			
			var edit_reshape = new OpenLayers.Control.ModifyFeature(this.layer, {
				title: "Modify Feature Reshape",
				displayClass: "olControlModifyFeature",
				mode:  OpenLayers.Control.ModifyFeature.RESHAPE
			});
			
			edit_reshape.events.register('deactivate', this, function(){
				this.hideEditPopup();
			});
			
			this.controls.push(edit_reshape);

			var del = new DeleteFeature(this.layer, {title: "Delete Feature"});
			
			del.events.register('activate', this, function(){
				this.hideEditPopup();
			});
		   
		    this.controls.push(del);
			
			var select = new OpenLayers.Control.SelectFeature(
				this.layer,
				{
					title: this.selectControlName,
					clickout: false, 
					toggle: false,
					multiple: false, 
					hover: false,
					displayClass: "olControlSelectFeature"
				}
			);
			
			select.events.register('deactivate', this, function(){
				select.unselectAll();
				this.hideEditPopup();
			});
			
			this.controls.push(select);
			
			this.panel = new OpenLayers.Control.Panel({
				displayClass: 'customEditingToolbar',
				allowDepress: true
			});

			this.panel.addControls(this.controls);			
			this.map.addControl(this.panel);
			
			this.active = true;
		}else{
			this.active = false;
		}
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


