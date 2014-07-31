OLTools.Tool.EditPopup = OLTools.Class(OLTools.Tool, {

	/**
	prevFeature:
	*/
	
	feature: null,
	
	featureModified: {
		geometry: false,
		attributes: false,
		saved: false
	},
	
    initialize: function(options) {
		OLTools.Tool.prototype.initialize.apply(this, arguments);
		
		this.featureModified = {
			geometry: false,
			attributes: false
		};
	},
	
	createPopup: function(){
		if($("#editPopup")){
			$("#editPopup").remove();
		}
		
		$("<div class='popup' id='editPopup'>" +
			"<table id='tblData'>" +
				"<thead>" +
					"<tr>" + 
						'<th class=\"popup_title\" id="popup_title" rowspan="3">' + 
							"Edit Attributes" +
						"</th>" +
					"</tr>" +
				"</thead>" +
				"<tbody>" +
				"</tbody>" +
			"</table>" +
		"</div>").appendTo("body"); 		

		$( "#editPopup" ).draggable();
		
		this.created = true
	},
	
	show: function(options){
		if(!this.created){
			this.createPopup();
		}		
		
		this.feature = options.feature;
		this.layer = this.feature.layer;
		
		this.layer.events.on({
			featuremodified: function(evt){
				this.featureModified.geometry = true;
			},
            scope: this
		});
		
		$('#editPopup').css('left', options.location.x);
		$('#editPopup').css('top', options.location.y);
		$('#editPopup').css('display','inline');     
		$("#editPopup").css("position", "absolute");
		$("#editPopup").css("z-index", "10000");
		
		$("#tblData tbody").empty();
		
		for(attribute in this.feature.attributes){
			var value = this.feature.attributes[attribute];
			
		    $("#tblData tbody").append( 
				"<tr>" + 
					"<td>" + 
						"<span id=\"span_" + attribute + "\">" + attribute + "</span>" + 
						"<span>:</span>" + 
						"<input id=\"attribute_field_" + attribute + "\" class='attribute_field' type='text' value='" + value + "'/>" + 
					"</td>" + 
				"</tr>"
			);		
		}
		
		// Check if the select control is active, in this case don't show buttons in popup
		var editPopup = this;
		if(options.edit === true){
			$("#popup_title").text("Edit Attributes");
			
			$("#tblData tbody").append( 
				"<button class=\"close_button\" id='popup_close_button' type='button'>Close</button>" +
				"<button class=\"save_button\" id='popup_save_button' type='button'>Save</button>"
			);	
			
			$("#popup_close_button").click(function(){
				var evalueatedAttr = 0, axistingAttr = 0;
				for(attribute in editPopup.feature.attributes){
					axistingAttr++;
					if(editPopup.feature.attributes[attribute]){
						evalueatedAttr++;
					}				
				}
				
				//
				// Delete the feature if any attributes has been evaluated
				//
				if(evalueatedAttr < axistingAttr){
					editPopup.layer.destroyFeatures([editPopup.feature]);
				}else{							
					//
					// Uselect the feature
					//
					var controls = editPopup.map.controls;
					for(var i=0; i<controls.length; i++){
						var control = controls[i];
						if(control.selectControl){
							control.selectControl.unselectAll();
						}
					}	
				
					// Check if the attributes values has been modified to
					for(attribute in editPopup.feature.attributes){					
						$("#tblData span").each(function(index){
							var value = this.innerHTML;
							if(value == attribute){
								if(editPopup.feature.attributes[attribute] != this.nextSibling.nextSibling.value){
									editPopup.featureModified.attributes = true;
								}
							}					
						});
					}
				
					if(editPopup.featureModified.geometry === true || editPopup.featureModified.attributes === true){
						// Ask the user to confirm the modification before save
						var c = confirm("Do you want to save provided modifications before close");
						
						if(!c){
							if(editPopup.featureModified.geometry === true){
								editPopup.layer.removeFeatures([editPopup.feature]);
								editPopup.layer.addFeatures([editPopup.prevFeature]);
							}
						}else{
							for(attribute in editPopup.feature.attributes){					
								var span = $("#tblData span[id*='span_']");
								span.each(function(index){
									var value = this.innerHTML;
									if(value == attribute){
										var input = $("#attribute_field_" + attribute)[0];
										editPopup.feature.attributes[attribute] = input.value;
									}					
								});
							}
						}
					}
				}		
				
				editPopup.restoreFeatureModified(false);
				editPopup.hide();
			});
			
			$("#popup_save_button").click(function(){
				for(attribute in editPopup.feature.attributes){	
					var span = $("#tblData span[id*='span_']");
					span.each(function(index){
						var value = this.innerHTML;
						if(value == attribute){
							var input = $("#attribute_field_" + attribute)[0];
							editPopup.feature.attributes[attribute] = input.value;
						}					
					});
				}
				
				var evalueatedAttr = 0, axistingAttr = 0;
				for(attribute in editPopup.feature.attributes){
					axistingAttr++;
					if(editPopup.feature.attributes[attribute]){
						evalueatedAttr++;
					}				
				}
				
				//
				// Delete the feature if any attributes has been evaluated
				//
				if(evalueatedAttr < axistingAttr){
					// Ask the user to fill the attributes form before save
					alert("Fill the form before save the new feature");
				}else{			
					// Uselect the feature
					var controls = editPopup.map.controls;
					for(var i=0; i<controls.length; i++){
						var control = controls[i];
						if(control.selectControl){
							control.selectControl.unselectAll();
						}
					}
					
					// Ask the user to confirm the modification before save
					var c = confirm("Are you sure to save these modifications");
					
					if(!c){
						editPopup.layer.removeFeatures([editPopup.feature]);
						if(editPopup.prevFeature){
							editPopup.layer.addFeatures([editPopup.prevFeature]);
						}
					}
					
					editPopup.restoreFeatureModified(true);
					editPopup.hide();
				}
			});
		}else{
			$("#popup_title").text("Attributes");
			$("[class*='attribute_field']").each(function(index){
				$(this).attr("readonly", true);
			});
			
			$("#tblData tbody").append( 
				"<button class=\"close_button\" id='popup_close_button' type='button'>Close</button>"
			);	
			
			$("#popup_close_button").click(function(){
				editPopup.hide();
				if(editPopup.layer.selectControl){
					editPopup.layer.selectControl.unselectAll();
				}				
			});
		}
		
		this.visible = true;
	},
	
	hide: function(){
		$("#tblData tbody").empty();
		$('#editPopup').css('display','none');
		
		this.visible = false;
	},
	
	isVisible: function(){
		return this.visible;
	},
	
	restoreFeatureModified: function(saved){
		this.featureModified.geometry = false;
		this.featureModified.attributes = false;
		this.featureModified.saved = saved;
	}
	
});
