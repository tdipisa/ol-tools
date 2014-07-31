OLTools.Tool.RichTextEditPopup = OLTools.Class(OLTools.Tool.EditPopup, {
	
	textAttribute: null,
	
    initialize: function(options) {
		OLTools.Tool.EditPopup.prototype.initialize.apply(this, arguments);
		
		if(options.textAttribute){		
			this.textAttribute = options.textAttribute;
			
			this.featureModified = {
				geometry: false,
				attributes: false
			};
			
			$("<div id='ckeditor-panel'>" +
				'<textarea id="richText"></textarea>' +
			"</div>").appendTo("body"); 		
			
			// Creating the editor
			CKEDITOR.replace( 'richText', {
				customConfig : '../../config/ckeditor_config.js'
			});
		
			$( "#ckeditor-panel" ).draggable();
		}else{
			alert("The Rich Text Editor needs the map and the text attribute!");
		}
	},
	
	show: function(options){
		this.feature = options.feature;
		this.layer = this.feature.layer;
		
		$('#ckeditor-panel').css('left', options.location.x);
		$('#ckeditor-panel').css('top', options.location.y);
		$('#ckeditor-panel').css('display','inline');     
		$("#ckeditor-panel").css("position", "absolute");
		$("#ckeditor-panel").css("z-index", "10000");
		
		$("#rich_text_close_button").remove();
		$("#rich_text_save_button").remove();
			
		for(attribute in this.feature.data.attributes){
			if(attribute == this.textAttribute){
				var value = this.feature.data.attributes[attribute];
				if(value && value != ""){
					this.isNewFeature = false;
				}else{
					this.isNewFeature = true;
				}
				
				CKEDITOR.instances.richText.setData(value, function(){
					var isDirty = this.checkDirty();  // true
					if(isDirty){
						CKEDITOR.instances.richText.resetDirty(); // false
					}						
				});
			}	
		}
		
		// Check if the select control is active, in this case don't show buttons in popup
		var editPopup = this;
		if(options.edit === true){
			$("#ckeditor-panel").append( 
				"<button class=\"close_button\" id='rich_text_close_button' type='button'>Close</button>" +
				"<button class=\"save_button\" id='rich_text_save_button' type='button'>Save</button>"
			);	
			
		    $("#rich_text_save_button").click(function(){
				if (!CKEDITOR.instances.richText.checkDirty()){
					alert("Fill the editor before save the new feature");
				}else{
					var c = confirm("Are you sure to save these modifications");
					
					if(c){
						for(attribute in editPopup.feature.data.attributes){
							if(attribute == editPopup.textAttribute){
								var value = CKEDITOR.instances.richText.getData();
								editPopup.feature.data.attributes[attribute] = value;
								editPopup.feature.marker.updateLabel(value);
							}
						}
						
						editPopup.hide();	
						CKEDITOR.instances.richText.resetDirty();						
					}
				}				
			});
			
			$("#rich_text_close_button").click(function(){
				if (CKEDITOR.instances.richText.checkDirty()){
					var c = confirm("Do you want to save provided modifications before close");
					
					if(editPopup.isNewFeature){
						if(!c){
							editPopup.feature.destroy();
						}else{
							for(attribute in editPopup.feature.data.attributes){
								if(attribute == editPopup.textAttribute){
									var value = CKEDITOR.instances.richText.getData();
									editPopup.feature.data.attributes[attribute] = value;
									editPopup.feature.marker.updateLabel(value);
								}
							}
						}
					}else{
						if(c){
							for(attribute in editPopup.feature.data.attributes){
								if(attribute == editPopup.textAttribute){
									var value = CKEDITOR.instances.richText.getData();
									editPopup.feature.data.attributes[attribute] = value;
									editPopup.feature.marker.updateLabel(value);
								}
							}
						}
					}
					
					CKEDITOR.instances.richText.resetDirty();
				}else if(editPopup.isNewFeature){
					editPopup.feature.destroy();
				}
				
				editPopup.hide();
			});
		}
		
		this.visible = true;
	},
	
	hide: function(){
		$('#ckeditor-panel').css('display','none');		
		this.visible = false;
	}
});
