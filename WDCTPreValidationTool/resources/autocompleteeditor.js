function AutoCompleteEditor(args) {
    // USED FOR RESOURCE COLUMN 
    // LIKE A TYPE-AHEAD for resource search and apply
    
    var $input;
    var defaultValue = '';
    var scope = this;
    
    this.init = function () {
      $input = $("<INPUT placeholder='" + (typeof args.item.id == 'undefined' ? Timeline.ADD_RESOURCE_LABEL : '') + "' id='" + (typeof args.item.id == 'undefined' ? 'new' : args.item.id) + "' type=text class='editor-text' />");    
      //$input = $("<INPUT id='" + (typeof args.item.id == 'undefined' ? 'new' : args.item.id) + "' type=text class='editor-text' />");
      
      $input.appendTo(args.container)
            .keydown(function(e){
                if(e.which == 37 || e.which == 39 || e.which == 38 || e.which == 40 || e.which == 13){
                    
                    // Don't propogate the event to the document
                    if (e.stopPropagation) {
                        e.stopPropagation();   // W3C model
                        e.preventDefault();
                    } else {
                          e.cancelBubble = true; // IE model
                    }
                }
            }).keypress(function(e){
                if(e.which == 37 || e.which == 39 || e.which == 38 || e.which == 40 || e.which == 13){
                    
                    // Don't propogate the event to the document
                    if (e.stopPropagation) {
                        e.stopPropagation();   // W3C model
                        e.preventDefault();
                    } else {
                          e.cancelBubble = true; // IE model
                    }
                }
            });
            
      $input.focus().select();
      
      $input.autocomplete({
        delay: 0,
        minLength: 0,
        
        // use appendTo and position properties to be able to flip the position for good user experience
        appendTo: '#myGrid',
        position:{ my: "left top", at: "left bottom", collision: "flip", within: '#myGrid' },
       
        source: function(request, response){
        	var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        	var results = [];
        	
        	$(Timeline.rt_json).each(function(index, element) {
        		if(matcher.test(element.resource)){
			        results.push(element);
			      }
			    });
        	
        	response(results);
        },
        select: function( event, ui ) {
            //console.log('---' + ui.item.resource);
            $input.val(ui.item.resource);
            var isValid = false;
            $(Timeline.rt_json).each(function(index, element) {
        	    if(element.resource == $input.val()){ 
            	        isValid = true;
                        return false;
        	    }
        	});
            
            if(isValid){
                //console.log('valid entry');
                Timeline.onResourceSelectionChange(event, ui, $input.attr('id'));
            }
            
            return false;
		}
        
      }).data( "autocomplete" )._renderItem  = function( ul, item ) {
          
          return $( "<li></li>" )
	                .data( "item.autocomplete", item )
	                .append( "<a>" + item.resource + "</a>" )
	                .appendTo( ul ); 
      };
      
      
    };



    this.destroy = function() {
        $input.autocomplete("destroy");
        //$input.remove();
    };

    this.focus = function() {
        $input.focus();
    };

    this.loadValue = function(item) {
      defaultValue = item[args.column.field] || "";
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
    };

    this.serializeValue = function() {
        return $input.val();
    };

    this.applyValue = function(item, state) {
        item[args.column.field] = state;
    };

    this.isValueChanged = function() {
        return ($input.val() != defaultValue);
    };

    this.validate = function() {
        var isValid = false;
        
        if($input.val() == defaultValue){
            isValid = true;
        }
        
    	$(Timeline.rt_json).each(function(index, element) {
    	    if(element.resource == $input.val()){ 
    	        isValid = true;
                return false;
    	    }
    	});
        
        return {
            valid: isValid,
            msg: null
        };
    };

    this.init();
}