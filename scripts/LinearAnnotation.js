OLTools.Tool.LinearAnnotation = OLTools.Class(OLTools.Tool, {

	map: null,
	
	vectorLayer: null,
	
	popup: null,
	
	featureAttributes: [],
	
    initialize: function(options) {
	    this.$super('initialize', options);
		
		if(options && options.map){
			this.map = options.map;
			
			this.popup = new OLTools.Tool.EditPopup(this.map); 
			
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
			
			// /////////////////////////////////////
			// Defining Layer Vector for this tool
			// /////////////////////////////////////		
			if(options.strategies && options.protocol){
				this.vectorLayer = new OpenLayers.Layer.Vector(options.vectorName || "linear-annotation-vector", {
					renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
					strategies: options.strategies,                
					protocol: options.protocol,
					styleMap: this.styles
				});
			}else{
				this.vectorLayer = new OpenLayers.Layer.Vector(options.vectorName || "linear-annotation-vector", {
					renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
					styleMap: this.styles
				});
			}	

			this.attachEventListeners();

			this.map.addLayers([this.vectorLayer]);
			
			// /////////////////////////////////////
			// Defining Draw and Modify controls
			// /////////////////////////////////////
			var drawLine = new OpenLayers.Control.DrawFeature(this.vectorLayer, OpenLayers.Handler.Path, {
				displayClass: 'olControlDrawFeaturePath'
			});
			
			drawLine.events.register('deactivate', this, function(){
				this.hideEditPopup();
				
				if(!this.popup.featureModified.attributes && !this.popup.featureModified.saved){
					this.vectorLayer.destroyFeatures([this.popup.feature]);					
				}
			});
			
			var edit_reshape = new OpenLayers.Control.ModifyFeature(this.vectorLayer, {
				title: "Modify Feature Reshape",
				displayClass: "olControlModifyFeature",
				mode:  OpenLayers.Control.ModifyFeature.RESHAPE
			});
			
			edit_reshape.events.register('deactivate', this, function(){
				this.hideEditPopup();
			});
			
			/*var edit = new OpenLayers.Control.ModifyFeature(this.vectorLayer, {
				title: "Modify Feature Edit",
				displayClass: "olControlModifyFeatureDrag",
				mode:  OpenLayers.Control.ModifyFeature.RESIZE |  OpenLayers.Control.ModifyFeature.DRAG | OpenLayers.Control.ModifyFeature.ROTATE
			});*/

			var del = new DeleteFeature(this.vectorLayer, {title: "Delete Feature"});
			
			del.events.register('activate', this, function(){
				this.hideEditPopup();
			});
		   
			/*var save = new OpenLayers.Control.Button({
				title: "Save Changes",
				trigger: function() {
					//var control = edit.feature ? edit : (edit_reshape.feature ? edit_reshape : null); 
					var control = edit_reshape.feature ? edit_reshape : null; 
					if(control) {
						control.selectControl.unselectAll();
					}
					
					//saveStrategy.save();
					
					alert("Saved Successfully");
				},
				displayClass: "olControlSaveFeatures"
			});*/
			
			var select = new OpenLayers.Control.SelectFeature(
				this.vectorLayer,
				{
					title: "Annotation Select Feature",
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
			
			var panel = new OpenLayers.Control.Panel({
				displayClass: 'customEditingToolbar',
				allowDepress: true
			});

			panel.addControls([drawLine, edit_reshape, /*edit,*/ del/*, save*/, select]);
			
			this.map.addControl(panel);
		}
    },
		
	attachEventListeners: function(){
		this.vectorLayer.events.on({
			featureselected: function (event) {
				var feature = event.feature;
				
				// Check if the select control is active, in this case don't show buttons in popup
				var control = this.map.getControlsBy("title", "Annotation Select Feature")[0];
				this.showEditPopup(feature, control.active ? false : true);
			},
			featureadded: function(event){
				var feature = event.feature;
				
				if(this.featureAttributes.length < 1){
					for(attribute in feature.attributes){
						this.featureAttributes.push(attribute);
					}
				}
				
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
		var centerLonLat = feature.geometry.bounds.getCenterLonLat();
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


