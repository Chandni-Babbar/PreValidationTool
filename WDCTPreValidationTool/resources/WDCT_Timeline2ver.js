/*** CUSTOM CODE***/

var data = [];
var data_startindex = 6, _start_index = 6;
var columnArrRowIndex = 2;
var contextArrRowIndex = 3;
var dataTypeArrRowIndex = 4;
var requredArrRowIndex = 5;
var inputfile_htmlclientId = 'xlf';
var dataErr = [];
var columns = [];
var loadingIndicator = null;
var grid;
var global_wb;
var columnArr;
var dataTypeArr;
var requredArr;
var contextArr;
var REQUIRED = 'required';
var OPTIONAL = 'optional';
var dataView;
var columnFilters = {};
var lookup_sheets_data = {};
var grid_clientId = '#myGrid';
var UNDEFINED = 'undefined';
var pager_clientId = '#pager';
var contextmenu_clientId = '#contextMenu';
var body_tag = 'body';
var id_tag = 'id';
var change_event = 'change';
var blur_event = 'blur';
var applying_configurations_msg = 'Applying configurations...';
var unload_msg = "All the chances on this page will lost on navigation, we recommend to export before navigating.\nAre you sure you want to navigate away?";
var preparing_to_load_msg = 'Preparing to load. Please wait..';
var lastChunkMergeText = '{lastChunk}';
var _resLenMergeText = '{_resLen}';
var processing_continue_msg = 'Processed ::' + lastChunkMergeText + ' out of ' + _resLenMergeText + ' records..';

//var xlsx_ws = {};
var xlsx_ws = [];
var xlsx_range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
var xlsx_chunk = 1000;
var xlsx_s_index = 1;
var xlsx_iteration = 1;

var data_chunk = 5000;
var data_iteration = 1;	
var res;


// On DOM Ready
$(function() {
	WDCT_Timeline.onDomReady();
});


var FILTER_A_EQUALS_B = function(a, b){
	return !(a == b);
}

var A_DATESHOULDLESSTHAN_B = function(a, b){
	return (new Date(a) < new Date(b));
}

var A_DATESHOULDGREATERTHAN_B = function(a, b){
	return (new Date(a) > new Date(b));
}

var VALIDATE_LOOUPSHEETDATA = function(cell, value){
	var isInvalid = false;
	if(typeof lookup_sheets_data != UNDEFINED &&
		       typeof lookup_sheets_data[cell] != UNDEFINED && 
		       typeof value != UNDEFINED && 
		       typeof lookup_sheets_data[cell][value] == UNDEFINED){
		        isInvalid = true;
		    }
	return isInvalid;
}


var WDCT_Timeline = {
  errorsCount : 0,
  
  sortfn : function (a, b) {
      return a[args.column.field] > b[args.column.field];
  },
  
  onDomReady: function(){
	   
		var xlf = document.getElementById(inputfile_htmlclientId);
		if(xlf.addEventListener) xlf.addEventListener(change_event, WDCT_Timeline.handleFile, false);
		
	    $( window ).resize(WDCT_Timeline.window_ResizeHandler);	    
	    WDCT_Timeline.resizeGrid();
	    // undo shortcut
	    $(document).keydown(WDCT_Timeline.document_keyDownHandler);
	    // document click event to save chnages in grid when moved outside gird : 
	    $(document).click(WDCT_Timeline.document_ClickHandler);  
	    $(body_tag).click(WDCT_Timeline.body_ClickHandler);
	    $(contextmenu_clientId).click(WDCT_Timeline.contextMenuClickHandler);
	    WDCT_Timeline.reFreshGrid();
	    window.onbeforeunload = WDCT_Timeline.window_UnLoadHandler;
	    $(grid_clientId).on(blur_event, WDCT_Timeline.grid_BlurHandler);
 },
 grid_BlurHandler:function(e){
	 Slick.GlobalEditorLock.commitCurrentEdit();
  },
  window_UnLoadHandler: function(e){
	  var dialogText =  unload_msg;
	  e.returnValue = dialogText;
	  return dialogText;
  },
  process_wb_callback: function(wb, current_sheet){
	  return (function(){
		    global_wb = wb;
			loader.showMore(applying_configurations_msg);
			lookup_sheets_data = {};
			
			if(typeof WDCT_LookUpConfig != UNDEFINED && 
					typeof WDCT_LookUpConfig[current_sheet.toUpperCase()] != UNDEFINED){
			    var colConfig = WDCT_LookUpConfig[current_sheet.toUpperCase()];	
			
				for(var _a in colConfig){
					lookup_sheets_data[_a] = {};
					var sheetName = colConfig[_a].sheet;
					var col = colConfig[_a].col;
					var display = colConfig[_a].display;
					var mergeWithCol = null;
					
					if(typeof colConfig[_a].display != UNDEFINED && 
							typeof colConfig[_a].display.mergeWithCol != UNDEFINED){
						mergeWithCol = colConfig[_a].display.mergeWithCol;
					}
					
					var sheet_data = to_multiArray(wb, sheetName);
					
					for(var _indx = data_startindex, len = sheet_data.length; _indx < len; _indx++){
						lookup_sheets_data[_a][sheet_data[_indx][col]] =  mergeWithCol == null ? 
								sheet_data[_indx][col]: sheet_data[_indx][col] + ' + ' + sheet_data[_indx][mergeWithCol];
					}
					sheetName = null;
					col = null;
					sheet_data = null;
				}
			} 
			
			columnArr = res[columnArrRowIndex];
			contextArr = res[contextArrRowIndex];
			dataTypeArr = res[dataTypeArrRowIndex];
			requredArr = res[requredArrRowIndex];
			
			columns = [];
			
			for(var _indx = 0, len = columnArr.length; _indx < len; _indx++){
				var col = columnArr[_indx];
				// do not push column where column name is not defined
				if(col.trim() == '') continue;
				columns.push(WDCT_Timeline.getColumnDefination(_indx, _indx, col, dataTypeArr[_indx], requredArr[_indx], contextArr[_indx]));
			}
			global_wb = null;
			wb = null;
			WDCT_Timeline.processData();
	  });
  },
  
  process_wb: function(wb) {
	  res = to_multiArray(wb, current_sheet);
	  setTimeout(WDCT_Timeline.process_wb_callback(wb, current_sheet), 500);
  },
	
  processData_callback: function(lastChunk, _resLen){
	  return (function(){
	    	loader.showMore(processing_continue_msg.replace(lastChunkMergeText, lastChunk).replace(_resLenMergeText, _resLen));
	    	data_iteration++;	
			WDCT_Timeline.processData();
	    });
  },
  processData_callback1: function(){
	return (function(){
		WDCT_Timeline.endProcess();
	});  
  },
  processData : function(){
	  var lastChunk = data_iteration * data_chunk;	
		for(var _indx = data_startindex, _indxLen = res.length; _indx < _indxLen && _indx < lastChunk; _indx++){
			var obj  = {};
			var row = res[_indx];
			var objErr = {};
			var isValidRow = false;
			for(_jindx = 0, _jindxLen = row.length; _jindx < _jindxLen; _jindx++){
				var val = row[_jindx];
				if(val.trim() != '') isValidRow = true;
				obj[_jindx] = row[_jindx];
				objErr[_jindx] = { error: false, msg: ''};
				//objErr[_jindx] = WDCT_Timeline.hasError(obj, _jindx, row[_jindx]);
			}
			// define id for an row as it is mandatory to have id column
			obj[id_tag] = data.length;
			
			if(isValidRow){
			  dataErr.push(objErr);	
			  data.push(obj);
			}
			objErr = null;
			obj = null;
			data_startindex = _indx;
		}
		data_startindex = _indx;
		var _resLen = res.length - _start_index;
		if(lastChunk <= res.length){
		    setTimeout(WDCT_Timeline.processData_callback(lastChunk, _resLen), 500);
		}else{
			loader.showMore(preparing_to_load_msg);
			setTimeout(WDCT_Timeline.processData_callback1(), 500);
		}
  },
  endProcess: function(){
	    res = null;
		loader.hide();
		WDCT_Timeline.reFreshGrid();
  },
  reFreshGrid : function(){
	    
	    if(grid != null || typeof grid != UNDEFINED){
	        grid.destroy();
	        grid = null;
	    }
	    
		dataView = new Slick.Data.DataView({ inlineFilters: false });
		//dataView.setPagingOptions({pageSize: 65000});
		grid = new Slick.Grid(grid_clientId, dataView, columns, WDCT_Timeline.getGridOptions());
	   
		var pager = new Slick.Controls.Pager(dataView, grid, $(pager_clientId));
		//grid.setSelectionModel(new Slick.RowSelectionModel());
		
		// wire up model events to drive the grid
	    dataView.onRowCountChanged.subscribe(function (e, args) {
	      grid.updateRowCount();
	      WDCT_Timeline.renderGrid();
	    });
	    dataView.onRowsChanged.subscribe(function (e, args) {
	      grid.invalidateRows(args.rows);
	      WDCT_Timeline.renderGrid();
	    });
		
	     // set keyboard focus on the grid 
	    grid.getCanvasNode().focus(); 
	    //grid.registerPlugin( new Slick.AutoColumnSize());
	    var headerButtonsPlugin = new Slick.Plugins.HeaderButtons();
	    // subscribe an action to header buttons
	    //headerButtonsPlugin.onCommand.subscribe(function(e, args) {
	      //var column = args.column;
	      //var button = args.button;
	      //var command = args.command;
	      
	    //});
	    grid.registerPlugin(headerButtonsPlugin);
	    grid.onHeaderClick.subscribe(WDCT_Timeline.onHeaderClickHandler);
	    
	    grid.setSelectionModel(new Slick.CellSelectionModel());
	    
	    /** COPY MANAGER PLUGIN **/
	    var copyManager = new Slick.CellExternalCopyManager();
	    grid.registerPlugin(copyManager);
	    copyManager.onPasteCells.subscribe(WDCT_Timeline.onPasteCellsHandler);
	    	    
	    /*** AUTO - TOOLTIP **/
	    grid.registerPlugin(new Slick.AutoTooltips());
	    
	    grid.onCellChange.subscribe(WDCT_Timeline.onCellChangeHandler);
	    // bind context menu
	    grid.onContextMenu.subscribe(WDCT_Timeline.onContextMenuHandler);
	    
	 
	    // initialize the model after all the events have been hooked up
	    dataView.beginUpdate();
	    dataView.setItems(data);
	    dataView.setFilter(WDCT_Timeline.filter);
	    dataView.endUpdate();
	    
	    var filterPlugin = new Ext.Plugins.HeaderFilter({});
        filterPlugin.onFilterApplied.subscribe(WDCT_Timeline.onFilterAppliedHandler);
        filterPlugin.onCommand.subscribe(WDCT_Timeline.filteronCommandHandler);
        grid.registerPlugin(filterPlugin);

        var overlayPlugin = new Ext.Plugins.Overlays({ decoratorWidth: 1});
        overlayPlugin.onFillUpDown.subscribe(WDCT_Timeline.overlayonFillUpDownHandler);
        grid.registerPlugin(overlayPlugin); 
	    
   
        
	    
	    WDCT_Timeline.renderGrid();
	    
  },
  
  onRowClickHandler: function(evt, dataContextId){
	  var rowId = dataContextId;
	  //console.log(rowId);
	  grid.gotoCell(rowId, 0);
	  WDCT_Timeline.selectRowRange(rowId);
	  
	  if(typeof evt.stopPropagation != UNDEFINED) {
	        evt.stopPropagation();
	  }else {
	        evt.cancelBubble = true;
	  }
  },
  
  onHeaderClickHandler: function(e, args) {
      var columnID = args.column.field;
      grid.gotoCell(0, columnID);
      WDCT_Timeline.selectColumnRange(columnID);
      
      e.stopPropagation();
  },
  
  overlayonFillUpDownHandler: function (e, args) {
      var column = grid.getColumns()[args.range.fromCell];

      if (!column.editor) {
          return;
      }

      var value = dataView.getItem(args.range.fromRow)[column.field];

      dataView.beginUpdate();

      for (var i = args.range.fromRow + 1; i <= args.range.toRow; i++) {
          dataView.getItem(i)[column.field] = value;
          grid.invalidateRow(i);
      }

      dataView.endUpdate();
      WDCT_Timeline.renderGrid();
  },
  
  filteronCommandHandler: function (e, args) {
      var comparer = function (a, b) {
          return a[args.column.field] > b[args.column.field];
      };

      switch (args.command) {
          case "sort-asc":
              dataView.sort(comparer, true);
              break;
          case "sort-desc":
              dataView.sort(comparer, false);
              break;
      }
  },
  onFilterAppliedHandler: function () {
      dataView.refresh();
      grid.resetActiveCell();  
      WDCT_Timeline.removeSelection();
      WDCT_Timeline.renderGrid();
  },
  
  setDataErrorObj: function(item, columnDef, error, msg){
	  dataErr[item.id][columnDef.id].error = error;
	  dataErr[item.id][columnDef.id].msg = msg;
  },
  
  filter: function (item) {
      var columns = grid.getColumns();

      var value = true;
      //console.log(item.id);
      for (var i = 0, colLen = columns.length; i < colLen; i++) {
          var columnDef = columns[i];
          dataErr[item.id][columnDef.id].error = false;
      	  dataErr[item.id][columnDef.id].msg = '';
      	    
          if(typeof WDCT_Validator != UNDEFINED && 
        		typeof WDCT_Validator.columns != UNDEFINED && 
          		typeof WDCT_Validator.columns[columnDef.id] != UNDEFINED &&
          		typeof WDCT_Validator.columns[columnDef.id]['VALIDATIONS'] != UNDEFINED){
	          	for(var _a in WDCT_Validator.columns[columnDef.id]["VALIDATIONS"]){
	          		var applyValidation = columnDef[_a] || false;
	          		if(applyValidation){
	          			//what type of validation
	          			var type = WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["TYPE"];
	          			var val = item[columnDef.field];
	          			var lookupCell = WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["LOOKUPINDEX"];
	          			var lookupCellValue = '';
	          			var rule = WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["VALIDATIONRULE"];
	          			var msg = WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["MSG"];
	          			
	          			if(typeof lookupCell != UNDEFINED){
	          				lookupCellValue = item[lookupCell];
	          			}
	          			
	          			
	          			if(type == 'DUPLICATE'){
	          			// if it is DUPLICATE TYPE
	          	          	if(typeof columnDef['dupData'] != UNDEFINED && columnDef['dupData'][val] == 1){
	          	          		value = value && false;
	          	          	}else{
	          	          	  WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);	
        	          	      value = value && true;
	          	          	}
	          			}else if(type == 'REGEX'){
	          			// if it is REGEX TYPE
	          				var reg_pattern = rule;
	          				
	          				if(WDCT_REGEX.BLANK == reg_pattern){
		          				if(reg_pattern.test(val.trim())){
		          					WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);
		        	          	    value = value && true;
		          				}else{
		          					value = value && false;
		          				}
	          				}else{
	          					if(reg_pattern.test(val.trim())){
	          						value = value && false;
		          				}else{
		          					
		          					WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);
		        	          	    value = value && true;
		          				}
	          				}
	          				//console.log(reg_pattern.test(val.trim()));
	          			}else if(type == 'JSFUNCTION_COMPARE'){
	          				var func = rule;
	          				if(window[func](val, lookupCellValue)) value = value && false;
	          				else value = value && true, WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);	
	          				
	          			}else if(type == 'MAP'){
	          				var jsmap = rule;
	          				if(typeof jsmap[lookupCellValue.toUpperCase()] != UNDEFINED) value = value && (jsmap[lookupCellValue.toUpperCase()] != val), value&&WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);
	          				else value = value && false;
	          			}else if(type == 'MAP_REGEX'){
	          				var jsmap1 = rule;
	          				if(typeof jsmap1[lookupCellValue.toUpperCase()] != UNDEFINED) value = value && !jsmap1[lookupCellValue.toUpperCase()].test(val.trim()), value&&WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);
	          				else value = value && false;
	          			}else if(type == 'JSFUNCTION_LOOKUP'){
	          				var func1 = rule;
	          				if(!window[func1](columnDef.id, val)) value = value && false;
	          				else value = value && true, WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);
	          			}else if(type == 'JSFUNCTION_INPUT_EQUALS'){
	          				var filterValue = typeof columnDef['filterValues'] != UNDEFINED && columnDef['filterValues']; 
	          				var func = rule;
	          				if(window[func](val, filterValue)) value = value && false;
	          				else value = value && true, WDCT_Timeline.setDataErrorObj(item, columnDef, true, msg);
	          			}
	          			
	          		}
	          	}
          }
      }
      
     
      return value;
      
  },
  
  
  body_ClickHandler: function () {
      $(contextmenu_clientId).hide();
  },
  
  document_ClickHandler: function(e) {
      //if (e.target.id != "myDiv" && !$(e.target).parents("#myDiv").size()) { 
      Slick.GlobalEditorLock.commitCurrentEdit();
      //}
   },
  
  document_keyDownHandler: function(e) {
      if (e.which == 90 && (e.ctrlKey || e.metaKey)) { // CTRL + (shift) + Z
          if (e.shiftKey) {
              undoRedoBuffer.redo();
          } else {
              undoRedoBuffer.undo();
          }
      }
  },
  
  window_ResizeHandler: function(e){
	  WDCT_Timeline.resizeGrid();
  },
  
  readerOnLoadHandler: function(e) {
		var data = e.target.result;
		var wb;
		if(rABS) {
			wb = X.read(data, {type: 'binary'});
			
		} else {
			var arr = fixdata(data);
			wb = X.read(btoa(arr), {type: 'base64'});
		}
		WDCT_Timeline.process_wb(wb);
		wb = null;
		data = null;
  },
  
  handleFile_Callback: function(e){
	  return (function(){
			var files = e.target.files;
			var f = files[0];
			{
				var reader = new FileReader();
				var name = f.name;
				reader.onload = WDCT_Timeline.readerOnLoadHandler;
				
				if(rABS) reader.readAsBinaryString(f);
				else reader.readAsArrayBuffer(f);
				
			}
			
		});
  },
  
  handleFile: function(e) {
		loader.show();
		setTimeout(WDCT_Timeline.handleFile_Callback(e), 1000);
  },
  
  
  
  onContextMenuHandler: function (e) {
      e.preventDefault();
      var cell = grid.getCellFromEvent(e);
      
      $(contextmenu_clientId).hide();
      
      
      $(contextmenu_clientId)
          .data("data", { range : grid.getSelectionModel().getSelectedRanges(), row : cell.row, cell : cell.cell})
          .css("top", e.pageY)
          .css("left", e.pageX)
          .show();
      
    },
    
    removeSelection: function(){
    	
    	//remove previous selected
    	grid.getSelectionModel().setSelectedRanges([]);
    },
    
    
    selectColumnRange: function(cell){
    	
    	var ranges = [];
    	//remove previous selected
    	WDCT_Timeline.removeSelection();
    	
    	ranges.push(new Slick.Range(0, cell, grid.getData().getLength() - 1, cell));
    	grid.getSelectionModel().setSelectedRanges(ranges);
    	
    	
    	
    },
    selectRowRange: function(row){
    	var ranges = [];
    	//remove previous selected
    	WDCT_Timeline.removeSelection();
    	//console.log(row);
    	ranges.push(new Slick.Range(row, 1, row, columns.length - 1));
    	//console.log(ranges);
    	grid.getSelectionModel().setSelectedRanges(ranges);
    	
    },
    
    contextMenuClickHandler:function (e) {
        //alert($(e.target).is("button"));
    	e.stopPropagation();
    	//e.cancelBubble();
    	
    	         //console.log('in'); 
                 if (!$(e.target).is("button")) {
                     return;
                 }
                 //console.log('in 1');
                 if (!grid.getEditorLock().commitCurrentEdit()) {
                     return;
                 }
                 //console.log('in 2');
                
                 if ($(e.target).is("button")) {
                     var context_data = $(this).data("data");
                     var val = typeof $(e.target).attr("data") == UNDEFINED ? '' : $(e.target).attr("data");
                     //console.log(context_data);
                     
                     if (context_data.range.length > 0) {
                         var from = context_data.range[0];
                         
                         dataView.beginUpdate();
                         
                          
                         for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                              
                              for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                            	  if(typeof dataView.getItem(from.fromRow + i) == UNDEFINED) continue;
                            	  var rowId = dataView.getItem(from.fromRow + i).id;
                                  var field = columns[from.fromCell + j].field;
                                  var value = dataView.getItem(from.fromRow + i)[columns[from.fromCell + j].field];
                                  var replaceValue = '';
                                  
                                  if (val.toLowerCase() == 'clear') {
                                	  replaceValue = '';
                                  }else if (val.toLowerCase() == 'prefix') {
                                         var prefix_value = $('#prefix_input').val();
                                         if(typeof prefix_value != UNDEFINED && prefix_value.trim() == ''){
                                        	 alert('No value defined for prefix!!!');
                                        	 return;
                                         }
                                         replaceValue = prefix_value + value;
                                         dataView.getItem(from.fromRow + i)[columns[from.fromCell + j].field] = replaceValue;
                                  }else if (val.toLowerCase() == 'fill') {
                                         var fill_value = $('#fill_input').val();
                                         if(typeof fill_value != UNDEFINED && fill_value.trim() == ''){
                                        	 alert('No value defined to fill!!!');
                                        	 return;
                                         }
                                         replaceValue = fill_value;
                                         dataView.getItem(from.fromRow + i)[columns[from.fromCell + j].field] = replaceValue;
                                  }else if (val.toLowerCase() == 'replace') {
                                      var replacefrom = $('#replace_input1').val();
                                      var replaceTo = $('#replace_input2').val();
                                      
                                      if(value.toLowerCase().trim() == replacefrom.toLowerCase().trim()){
                                    	  replaceValue = replaceTo;
                                    	  dataView.getItem(from.fromRow + i)[columns[from.fromCell + j].field] = replaceValue;
                                      }
                                  }
                                      
                                  grid.invalidateRow(from.fromRow + i);
                            	  
                            	  
                              }
                 
                          } 
                          
                          
                         WDCT_Timeline.removeSelection();
                         // initialize the model after all the events have been hooked up
                         dataView.endUpdate();
                         WDCT_Timeline.renderGrid(); 
 
                    } 
                     
                     $(contextmenu_clientId).hide();
                 }//end of is button check  
        
        
    },
  
  
  onCellChangeHandler: function(e, args){
	  dataView.updateItem(args.item.id, args.item);
  },
  
  hasDataTypeError: function(rowObj, cell, value){
      var isInvalid = false;
/**
      if(typeof dataTypeArr[cell] != UNDEFINED && dataTypeArr[cell].trim() != '' &&
          typeof WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != UNDEFINED && 
          WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != '' &&
          WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()].test(value.trim()) == false){
        
        isInvalid = true;
      }
**/      
      return isInvalid;
  },



  hasValidValuesError: function(rowObj, cell, value){
    var isInvalid = false;
    
    
    /**
    if(typeof WDCT_RELATEDVALIDATIONS != UNDEFINED &&
         typeof WDCT_RELATEDVALIDATIONS[cell] != UNDEFINED && 
         typeof value != UNDEFINED){
      
      var lookupCell = WDCT_RELATEDVALIDATIONS[cell]["LOOKUPINDEX"];
      var lookupCellValue = rowObj[lookupCell];
      if(lookupCellValue != ''){
	        var typeofCheck = WDCT_RELATEDVALIDATIONS[cell]["TYPE"];
	        var validationRule = WDCT_RELATEDVALIDATIONS[cell]["VALIDATIONRULE"];
	        if(typeofCheck == 'MAP' && 
	                        typeof validationRule != UNDEFINED &&     
	                        typeof validationRule[lookupCellValue.toUpperCase()] != UNDEFINED &&
	                                     validationRule[lookupCellValue.toUpperCase()] != value){
	                  // considering validationRule is a collection/map
	                     isInvalid = true; 
	        }else if(typeofCheck == 'MAP_REGEX' &&
	          typeof validationRule != UNDEFINED &&
	          typeof validationRule[lookupCellValue.toUpperCase()] != UNDEFINED &&
	          validationRule[lookupCellValue.toUpperCase()].test(value.trim()) == false){
	                isInvalid = true;
	        
	        }else if(typeofCheck == 'DATECOMPARE' &&
	        	  typeof validationRule != UNDEFINED &&
	        	  validationRule == 'LESSTHAN'){
	        	
	        	try{
	        	  var base_date = new Date(value); 
	        	  var compare_date = new Date(lookupCellValue);
	        	  if(base_date >= compare_date) isInvalid = true;
	        	}catch(ex) {
	        		isInvalid = true;
	        	}
	        	
	        }else if(typeofCheck == 'DATECOMPARE' &&
		        	  typeof validationRule != UNDEFINED &&
		        	  validationRule == 'GREATERTHAN'){
		        	
		        	try{
		        	  var base_date = new Date(value); 
		        	  var compare_date = new Date(lookupCellValue);
		        	  if(base_date <= compare_date) isInvalid = true;
		        	}catch(ex) {
		        		isInvalid = true;
		        	}
		        	
		     }
       }
    }
   **/
    /**
   if(typeof columnArr[cell] != UNDEFINED && columnArr[cell].trim() != '' &&
        typeof WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()] != UNDEFINED && 
        WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()] != '' &&
        WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()].test(value.trim()) == false){
        
        isInvalid = true;
   }

   if(typeof lookup_sheets_data != UNDEFINED &&
       typeof lookup_sheets_data[cell] != UNDEFINED && 
       typeof value != UNDEFINED && 
       typeof lookup_sheets_data[cell][value] == UNDEFINED){
        isInvalid = true;
    }
**/
      return isInvalid;
  },

  
  hasError: function(rowObj, cell, value){
  	var isInvalid = false;
  	
  	
  	isInvalid = WDCT_Timeline.hasDataTypeError(rowObj, cell, value);
  	
  	if(!isInvalid) isInvalid = WDCT_Timeline.hasValidValuesError(rowObj, cell, value);
  	
  	return isInvalid;
  },
  
  
  setAndDisplayErrorCount: function(){
	  WDCT_Timeline.errorsCount = 0;
	  /**for(var indx = 0, indxLen = dataErr.length; indx < indxLen; indx++){
		  var row = dataErr[indx];
		  
		  for(var jindx in row){
			  if(row[jindx] == true){
				  WDCT_Timeline.errorsCount++;
			  }
		  }
		 
	  }**/
	  $('#errors').text(WDCT_Timeline.errorsCount);  
  },	
  
  
  getColumnDefination: function(id, field, name, dataTypeText, requiredText, contextText){
	 var defaultEditor =  Slick.Editors.Text;
	 
	 
	 if(typeof field != UNDEFINED &&
			 typeof lookup_sheets_data != UNDEFINED &&
			 typeof lookup_sheets_data[field] != UNDEFINED ){
		 defaultEditor = Slick.Editors.PickListSelectEditor;
	 }
	 
	 // no need for editor in case if it is first column
	 if(id == 0){
		 
		 /**
		 return {
	         id: id,
	         field: field,
	         name: name,
	         width: 100,
	         selectable: false,
	         resizable: false,
	         focusable : false
	        
	     } 
		 **/
		 return {id: id, name: name, field: field, behavior: "select", cssClass: "cell-selection", width: 40, 
			 cannotTriggerInsert: true, resizable: false, selectable: false, formatter: WDCT_Timeline.validateFormatter };
		
	 }
	 
	 var column = {
         id: id,
         field: field,
         name: name,
         behavior: "",
         width: 150,
         selectable: true,
         resizable: true,
         focusable : true,
         editor: defaultEditor,
         cssClass: "",
         groupName: " ",
         header: {
        	    buttons: [],
        	    
        	    },
         headerCssClass: ""
         ,formatter: WDCT_Timeline.validateFormatter
         
     }
	 
	 if(typeof requiredText != UNDEFINED && requiredText.toLowerCase() == 'required'){
		 column.header.buttons.push({
		        image: "../resources/WDCT_SlickGrid/images/exclamation-red-icon.png"
	     });
	 }
	 
	 column.header.buttons.push({
         image: "../resources/WDCT_SlickGrid/images/help.png",
         showOnHover: false,
         tooltip: contextText,
         handler: function(e) {}
       });
	 
	 column.header.buttons.push({
         
       });
	 return column;
  },		
		

  resizeGrid: function(){
	  $(grid_clientId).css({'width': '100%', height: ($(window).outerHeight() - ($('#input_section').outerHeight() + $('.slick-pager').outerHeight() + 32))});
      if(typeof grid != UNDEFINED) grid.resizeCanvas();
  },
  
  getGridOptions: function(){ 
	  return {
          explicitInitialization : false,
          editable: true,
          enableAddRow: false,
          enableCellNavigation: true,
          asyncEditorLoading: false, // need true to implement single click
          autoEdit: false,
          enableColumnReorder: false
          ,forceFitColumns : false
          ,headerRowHeight : 30
          ,enableAsyncPostRender: false
          ,asyncPostRenderDelay : 20 // default 50
          //,leaveSpaceForNewRows : true
          ,frozenColumn : 0
          //,frozenRow : 3
          //,autoHeight: true
          //,fullWidthRows: true
          //,frozenBottom: true
          //,showHeaderRow: true
          //,editCommandHandler: undoRedoBuffer.queueAndExecuteCommand
      };  
        
    },
    
    renderGrid: function(){
    	grid.render();
        //console.log('me render');
        WDCT_Timeline.setAndDisplayErrorCount();
    },
    validateFormatter: function(row, cell, value, columnDef, dataContext) {
    	if(columnDef.field == 0){
    		//return row + 1;
    		return "<div onclick='WDCT_Timeline.onRowClickHandler(event," + row + ");' style='height:100%;width:100%;'>" + (row + 1) + "</div>";
    	}
    	//console.log(dataContext.id + ':::::' + columnDef.field);
    	//console.log(dataErr[dataContext.id][columnDef.field].error);
    	if(dataErr[dataContext.id][columnDef.field].error){
    		return "<div class='frmt-invalid' title='" + dataErr[row][cell].msg + "' style='width:100%;'>" + value + "</div>";
    	}
    	
    	return value;
    }, 
    
    onPasteCellsHandler: function(e, args) {
        
        var from = args.ranges[0];
        var to = args.ranges[0];
        var val;
        
        for (var i = 0; i <= from.toRow - from.fromRow; i++) {
            for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                if (i <= to.toRow - to.fromRow && j <= to.toCell - to.fromCell) {

                    if(typeof columns[to.fromCell + j] != UNDEFINED && typeof data[(to.fromRow + i)] != UNDEFINED && 
                              typeof data[to.fromRow + i].id != UNDEFINED && 
                              typeof columns[to.fromCell + j].field != UNDEFINED){ 
                        
                        if(args.oneCellToMultiple){
                            val = args.clippedRange[0][0];
                        }
                        else{
                            val = args.clippedRange[i][j];
                        }
                        
                        var rowId = data[to.fromRow + i].id;
                        var field = columns[to.fromCell + j].field;
                        //console.log(val);
                        data[to.fromRow + i][columns[to.fromCell + j].field] = val;
                        grid.invalidateRow(to.fromRow + i);
                        
                    }
                }
            }
        }
        
        
     // initialize the model after all the events have been hooked up
        dataView.beginUpdate();
        dataView.setItems(data);
        dataView.endUpdate();
        
        WDCT_Timeline.renderGrid();
    }, 
    // Method to convert b64 to blob for IE10+ export
    b64toBlob : function(b64Data, contentType, sliceSize) {
		        contentType = contentType || '';
		        sliceSize = sliceSize || 512;
		      
		        var byteCharacters = atob(b64Data);
		        var byteArrays = [];
		      
		        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		          var slice = byteCharacters.slice(offset, offset + sliceSize);
		      
		          var byteNumbers = new Array(slice.length);
		          for (var i = 0; i < slice.length; i++) {
		            byteNumbers[i] = slice.charCodeAt(i);
		          }
		      
		          var byteArray = new Uint8Array(byteNumbers);
		      
		          byteArrays.push(byteArray);
		        }
		      
		        var blob = new Blob(byteArrays, {type: contentType});
		        return blob;
	},
	
	
	registerExportToExcel: function(){
	  var gridData = grid.getData();    
	
	  WDCT_Timeline.writeHeaders();
	  WDCT_Timeline.exportMyXLSX(gridData);
	  
	  gridData = null;
	},
	
	downloadExcel_Click: function(src, event){
	 // change the width and height of the grid to make all the columns visible to be 
	 // able to be available at the time of render
     loader.show();
	 
	 WDCT_Timeline.registerExportToExcel();
	     
	 
	 return false;       
	},
	
	exportMyXLSX : function(excel_data){
		var data = excel_data;	
		var lastChunk = xlsx_iteration * xlsx_chunk;
		
			for(var R = xlsx_s_index, RLen = data.getLength(); R <= RLen && R <= lastChunk; R++){
				  //console.log('R:::' + R);
		  		  var row = data.getItem(R - 1);
		  		  var rowArray = [];
		  		  for(var jindx in row){
		  			  try{
		  				  
		  			    if(jindx != id_tag){
		  			    	rowArray.push(WDCT_Timeline.escapeCell(row[jindx]));
		  			    }
		  			  }catch(ex){console.log(ex);}
		  		  }
		  		xlsx_s_index = R; 
		  		//console.log(rowArray.length);
		  		var csv_str = rowArray.join(',');
		  		
		  		xlsx_ws.push(csv_str);
		  	}
			xlsx_s_index = R; 
			
			if(lastChunk <= data.getLength()){
				
				//loader.hide();
			    setTimeout(function(){
			    	loader.showMore('Processed ::' + lastChunk + ' out of ' + excel_data.getLength() + ' records..');
			    	xlsx_iteration++;
			    	WDCT_Timeline.exportMyXLSX(excel_data);
			    }, 500);
				
			}else{
				
				loader.showMore('Preparing to download. Please wait..');
				setTimeout(function(){
					
					//if(xlsx_range.s.c < 10000000) xlsx_ws['!ref'] = XLSX.utils.encode_range(xlsx_range);
					
					WDCT_Timeline.writeMyXLSX();
					loader.hide();
					
				}, 500);
				
			}
		
		
	},
	
	writeHeaders: function() {
		
		var rowArray = [];    	
		for(var _indx = 0, _indxLen = columns.length; _indx < _indxLen; _indx++){
			//console.log(columns[_indx].name);
			//console.log(rowArray);
			if(columns[_indx].name.trim() == '') continue;
			
			rowArray.push(WDCT_Timeline.escapeCell(columns[_indx].name));
			//console.log(WDCT_Timeline.escapeCell(columns[_indx].name));
		}
		//console.log(columns.length + '===' + rowArray.length);
		var rowStr = rowArray.join(',');
		//console.log(rowStr);
		xlsx_ws.push(rowStr);
		
		
		
	},

	writeMyXLSX : function(){
		/* original data */
		var ws_name = current_sheet;
		
		try{
		  var wbout = xlsx_ws.join('\r\n');	
		
		}catch(ex){
			alert('write error::' + ex);
		}
		
		try{
			saveAs(new Blob([WDCT_Timeline.s2ab(wbout)],{type:"application/octet-stream"}), current_sheet +".csv");
		}catch(ex){alert('saveAs error::' + ex);}
	},
	
	
	escapeCell: function (cell) {
		var qreg = /"/g;
		var val = cell || '';
		val = val.toString();
				  
		  var FS = ",", fs = FS.charCodeAt(0);
		  var RS = "\n", rs = RS.charCodeAt(0);
		  var endregex = new RegExp((FS)+"+$");		  
		  txt = ''+ val;
			for(var i = 0, cc = 0, ilen = txt.length; i !== ilen; ++i) if((cc = txt.charCodeAt(i)) === fs || cc === rs || cc === 34) {
				txt = "\"" + txt.replace(qreg, '""') + "\""; break; }
		  return txt;	
				  
	},
	
	datenum: function(v, date1904) {
		if(date1904) v+=1462;
		var epoch = Date.parse(v);
		return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
	},

	s2ab: function(s) {
		var buf = new ArrayBuffer(s.length);
		var view = new Uint8Array(buf);
		for (var i=0; i!=s.length; ++i){
			view[i] = s.charCodeAt(i) & 0xFF;
		}
		return buf;
	},
	
	file_callback: function(e){
		console.log('error::' + e);
	}

}


var undoRedoBuffer = {
	    commandQueue: [],
	    commandCtr: 0,

	    queueAndExecuteCommand: function(editCommand) {
	        this.commandQueue[this.commandCtr] = editCommand;
	        this.commandCtr++;
	        editCommand.execute();
	    },

	    undo: function() {
	        if (this.commandCtr == 0)
	            return;

	        this.commandCtr--;
	        var command = this.commandQueue[this.commandCtr];

	        if (command && Slick.GlobalEditorLock.cancelCurrentEdit()) {
	            command.undo();
	        }
	    },
	    redo: function() {
	        if (this.commandCtr >= this.commandQueue.length)
	            return;
	        var command = this.commandQueue[this.commandCtr];
	        this.commandCtr++;
	        if (command && Slick.GlobalEditorLock.cancelCurrentEdit()) {
	            command.execute();
	        }
	    }
	}


var loadSpinner = {
	    client_id : '#loadingSpinner',
	    
	    show: function(){
	        $(loadSpinner.client_id).show().css('height', $(document).outerHeight()).css('z-index', 99999);
	    },
	    
	    hide: function(){
	        $(loadSpinner.client_id).hide();
	    }
	}




var loader = {
	    show: function() {
	        if (!loadingIndicator) {
	            loadingIndicator = $("<span class='loading-indicator'><label>Processing...</label></span>").appendTo(document.body);
	            var $g = $(grid_clientId);

	            loadingIndicator
	                .css("position", "absolute")
	                .css("top", $g.position().top + $g.height() / 2 - loadingIndicator.height() / 2)
	                .css("left", $g.position().left + $g.width() / 2 - loadingIndicator.width() / 2);
	        }

	        loadingIndicator.show();
	    },

	    hide: function() {

	        loadingIndicator.fadeOut();
	        // To refresh the overview panel
	        //if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel();
	    },
	    
	    showMore: function(msg){
	    	if (!loadingIndicator) {
	            loadingIndicator = $("<span class='loading-indicator'><label>Processing...</label></span>").appendTo(document.body);
	            var $g = $(grid_clientId);

	            loadingIndicator
	                .css("position", "absolute")
	                .css("top", $g.position().top + $g.height() / 2 - loadingIndicator.height() / 2)
	                .css("left", $g.position().left + $g.width() / 2 - loadingIndicator.width() / 2);
	        }
            loadingIndicator.find('label').text(msg);
	        loadingIndicator.show();
	    }
}






