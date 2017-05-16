function PhaseSelectionEditor(args) {
    var $input, $picker;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-percentcomplete' readonly/>");
      //$input = $("<INPUT type=text class='editor-percentcomplete'/>");
      $input.width($(args.container).innerWidth() - 25);
      $input.appendTo(args.container);

      $picker = $("<div class='editor-percentcomplete-picker' />").appendTo(args.container);
      $picker.append("<div class='editor-percentcomplete-helper'><div class='editor-percentcomplete-wrapper'><div class='editor-percentcomplete-buttons' /></div></div>");

      for(var _a in renderOptions_Phases){
          $picker.find(".editor-percentcomplete-buttons").append($('<button data="' + renderOptions_Phases[_a] + '" style="color:' + 
                                        (renderOptions_Phases[_a] == '' ? '#000000' : '#ffffff') + ';background:' + renderOptions_Phases[_a] + 
                                        '" val="' + _a + '">' + _a + '</button>'));
          $picker.find(".editor-percentcomplete-buttons").append($('<br/>'));
      }       

      $input.focus().select();

      $picker.find(".editor-percentcomplete-buttons button").bind("click", function (e) {
        $input.val($(this).attr("val"));
        $(args.container).css({
        'background-color': $(this).css('background-color'), 
        'color' : $(this).css('color')
        });
        
        e.stopPropagation();
        $input.focus().select();
        // add new line to remove the picker phase selection 
        // after user selection on phase
        //$input.remove();
        $picker.remove();
        return false;
      })
    };

    this.destroy = function () {
      $input.remove();
      $picker.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.loadValue = function (item) {
      $input.val(defaultValue = item[args.column.field]);
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return ($input.val() != defaultValue);
    };

    this.validate = function () {
      if ($input.val() != '' && typeof renderOptions_Phases[$input.val()] == 'undefined') {
        return {
          valid: false,
          msg: "Please enter a valid phase"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
}