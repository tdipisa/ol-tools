OLTools.Tool.RichText = OLTools.Class(OLTools.Tool, {

	map: null,

	markersLayer: null,
	
	popup: null,
	
	featureAttributes: [],
	
    controls: [],
	
	panel: null,
	
	active: false,
	
	textAttribute: null,
	
    initialize: function(options) {
	    this.$super('initialize', options);		
		this.options = options;
		
		if(this.options.map && this.options.textAttribute){
			this.map = this.options.map;
			this.textAttribute = this.options.textAttribute;
			this.popup = new OLTools.Tool.RichTextEditPopup(this.map, this.textAttribute); 
		}
    },
	
	activate: function(){
		var options = this.options;
		
		if(options){			
			// /////////////////////////////////////
			// Defining Layer Vector for this tool
			// /////////////////////////////////////		
			if(options.url){
				this.markersLayer = new OpenLayers.Layer.HTMLMarkers(options.vectorName || "rich-text-vector", {
					location: options.url,
					/*styleMap: {
						style: {
							'externalGraphic': OpenLayers.Util.getImageLocation("marker.png"),
							'graphicWidth': 21,
							'graphicHeight': 25
						}
					},*/
					useIconStyle: false,
					labelAttribute: this.textAttribute
				});
			}else{
				this.markersLayer = new OpenLayers.Layer.HTMLMarkers(options.vectorName || "rich-text-vector", {
					style: {
						'externalGraphic': OpenLayers.Util.getImageLocation("marker.png")
					}
				});
			}	

			this.attachEventListeners();
			
			this.map.addLayers([this.markersLayer]);
			
			// /////////////////////////////////////
			// Defining Draw Control
			// /////////////////////////////////////
			var drawPoint = new OpenLayers.Control.Button({
				displayClass: "olControlDrawFeaturePoint", 
				id: "drawPoint",
				type: OpenLayers.Control.TYPE_TOGGLE
			});			
			var clickHandler = function(e) {
				var position = this.map.getLonLatFromPixel(e.xy);
				
				var data = {};
				var icon = OpenLayers.Marker.defaultIcon(); 
				data.icon = icon;
				
				// populate with empty attributes
				data.attributes = {};
				for(var i=0; i<this.featureAttributes.length; i++){
					var attribute = this.featureAttributes[i];
					data.attributes[attribute] = "";
				}

				var markerFeature = new OpenLayers.HTMLFeature(this.markersLayer, position, data);			
				this.markersLayer.features.push(markerFeature);
				var marker = markerFeature.createMarker(data.attributes[this.textAttribute], this.markersLayer.markerClick);
				this.markersLayer.addMarker(marker);
				
				this.showEditPopup(markerFeature, true);	
			};
			drawPoint.events.register('activate', this, function(){
				this.map.events.register("click", this, clickHandler);
			});
			drawPoint.events.register('deactivate', this, function(){
				this.map.events.unregister("click", this, clickHandler);
			});
			this.controls.push(drawPoint);
			
			//
			// Defining Control's Toolbar
			//
			this.panel = new OpenLayers.Control.Panel({
				displayClass: 'customEditingToolbar',
				allowDepress: true
			});

			this.panel.addControls(this.controls);			
			this.map.addControl(this.panel);
			
			this.active = true;
		}
	},
	
	deactivate: function(){
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
		
		// erase the markers layer and then destroy it
		this.markersLayer.destroy();
		
		this.featureAttributes = [];
		
		this.hideEditPopup();
		
		this.active = false;
	},
	
	attachEventListeners: function(){		
		this.markersLayer.events.register("loadend", this,function(features){
			// Save locally the feature attributes to use for new features
			var feature = features[0];				
			for(attribute in feature.data.attributes){
				this.featureAttributes.push(attribute);
			}
		});
		
		var me = this;
		this.markersLayer.markerClick = function(evt) {
			var drawControl = me.map.getControlsBy("id", "drawPoint")[0];
			
			if(drawControl){
				drawControl.deactivate();
			}
			
			var sameMarkerClicked = (this == this.layer.selectedFeature);
			this.layer.selectedFeature = (!sameMarkerClicked) ? this : null;
			if(this.layer.selectedFeature){
				me.showEditPopup(this.layer.selectedFeature, true);	
			}					
			OpenLayers.Event.stop(evt);
		};
	},
	
	showEditPopup: function(feature, edit){
		var location = this.map.getPixelFromLonLat(feature.lonlat);
		
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


