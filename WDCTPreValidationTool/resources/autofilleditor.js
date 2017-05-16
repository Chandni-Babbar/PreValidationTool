function AutoFillEditor(args) {
    var $input, $picker;
    var defaultValue = 0;
    var scope = this; 

    this.init = function () {
      //console.log(args);
      $picker = $("<div class='editor-autofill-picker' />")
      
      // return when the row is phase or milestone 
      if(typeof args.item.id == 'undefined' || typeof Timeline.fixedRowsTypes[args.item.id] != 'undefined') return;
      
      
       // In case of frozen column feature; the picker gets hidden behind the divs
      // the position of the picker should be set specifically based on the parent container offset values
      // we also need to append the picker to dom and not to container as to display the picker over and above all the html elements;
      var parentOffset = args.container.offset();
      $picker.css({ 'position': 'absolute', 'left' : parentOffset.left, 'top' : parentOffset.top});
      $picker.appendTo(document.body);
      
      // commented to append picker to container; 
      //$picker.appendTo(args.container);
      
      
      $picker.append("<div class='editor-autofill-helper'><div class='editor-autofill-wrapper'><div class='editor-autofill-slider' /></div>");

      //$input.focus().select();

      $picker.find(".editor-autofill-slider").slider({
        min: 0,
        max: 40,
        step: 4,
        value: defaultValue,
        orientation: "horizontal",
        range: "min",
        slide: function (event, ui) {
          //$input.val(ui.value)
        },
        create: function( event, ui ) {
           
            // Get the options for this slider (specified above)
            var opt = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
    
            // Get the number of possible values
            //var vals = opt.max - opt.min;
        
            // Position the labels
            for (var i = 0; i < opt.length; i++) {
        
                // Create a new element and position it with percentages
                var el = $('<label>' + opt[i] + '</label>').css('left', ((opt[i]/(opt[opt.length - 1]))*100)+'%');
        
                // Add the element inside #slider
                $(this).append(el);
            }
           
        },
        stop: function( event, ui ) {
            //alert(args.item);
            
            if(typeof args.item.id != 'undefined'){
                var resourceId = args.item.id; 
                var nodes_order_json = '[';
                $.each(columns, function(indx1, colItem) {
                        if(indx1 >= Timeline.fixedColumns && typeof colItem.usedForCalculation != 'undefined' && colItem.usedForCalculation){
                             args.item[colItem.id] = ui.value;
                             nodes_order_json += '{"resourceId":"' + resourceId + '", "weekId":"' + colItem.id + '", "hours" : "' + ui.value + '"},';
                        }
                });        
                nodes_order_json = nodes_order_json.slice(0, -1);
                nodes_order_json += ']';
                Timeline.autoFill(nodes_order_json);
            }
            
            grid.focus();
            grid.setData(data);
            Timeline.renderGrid();
            
        }
      });
      
    };

    this.destroy = function () {
      //$input.remove();
      $picker.remove();
    };

    this.focus = function () {
      //$input.focus();
    };

    this.loadValue = function (item) {
      //$input.val(defaultValue = item[args.column.field]);
      //$input.select();
      //$input.val('Auto');
    };

    this.serializeValue = function () {
      return '';//$picker.find(".editor-autofill-slider").slider("option", "value"); 
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return true;//(!($input.val() == "" && defaultValue == null)) && ((parseInt($input.val(), 10) || 0) != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
}