OLTools.Tool.RichText = OLTools.Class(OLTools.Tool, {
	
	layer: null,
	
	popup: null,
	
	featureAttributes: [],
	
	controls: [],
	
	panel: null,
	
	active: false,
	
	textAttribute: null,
	
    initialize: function(options) {
	    OLTools.Tool.prototype.initialize.apply(this, arguments);	

		if(options.textAttribute){
			this.textAttribute = options.textAttribute;
			this.popup = new OLTools.Tool.RichTextEditPopup(options); 
		}
    },
	
	activate: function(){		
		if(this.options){			
			// /////////////////////////////////////
			// Defining Layer Vector for this tool
			// /////////////////////////////////////		
			if(this.options.url){
				this.layer = new OpenLayers.Layer.HTMLMarkers(this.options.vectorName || "rich-text-vector", {
					location: this.options.url,
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
				this.layer = new OpenLayers.Layer.HTMLMarkers(this.options.vectorName || "rich-text-vector", {
					style: {
						'externalGraphic': OpenLayers.Util.getImageLocation("marker.png")
					}
				});
			}	

			this.attachEventListeners();
			
			this.map.addLayers([this.layer]);
			
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

				var markerFeature = new OpenLayers.HTMLFeature(this.layer, position, data);			
				this.layer.features.push(markerFeature);
				var marker = markerFeature.createMarker(data.attributes[this.textAttribute], this.layer.markerClick);
				this.layer.addMarker(marker);
				
				this.showEditPopup(markerFeature, true);	
			};
			drawPoint.events.register('activate', this, function(){
				this.hideEditPopup();
				this.map.events.register("click", this, clickHandler);
			});
			drawPoint.events.register('deactivate', this, function(){
				this.hideEditPopup();
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
		this.layer.destroy();
		
		this.featureAttributes = [];
		
		this.hideEditPopup();
		
		this.active = false;
	},
	
	attachEventListeners: function(){		
		this.layer.events.register("loadend", this,function(features){
			// Save locally the feature attributes to use for new features
			var feature = features[0];				
			for(attribute in feature.data.attributes){
				this.featureAttributes.push(attribute);
			}
		});
		
		var me = this;
		this.layer.markerClick = function(evt) {
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


