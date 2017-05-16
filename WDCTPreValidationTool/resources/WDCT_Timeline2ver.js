/*** CUSTOM CODE***/

var data = [];
var data_startindex = 6, _start_index = 6;
var columnArrRowIndex = 2;
var contextArrRowIndex = 3;
var dataTypeArrRowIndex = 4;
var requredArrRowIndex = 5;

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
var default_columns = [
    {
      id: "selector",
      name: "",
      field: "num",
      width: 30
    }
  ];
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


var WDCT_Timeline = {
  errorsCount : 0,
  
  sortfn : function (a, b) {
      return a[args.column.field] > b[args.column.field];
  },
  
  onDomReady: function(){
	    /**var drop = document.getElementById('drop');
		if(drop.addEventListener) {
			drop.addEventListener('dragenter', WDCT_Timeline.handleDragover, false);
			drop.addEventListener('dragover', WDCT_Timeline.handleDragover, false);
			drop.addEventListener('drop', WDCT_Timeline.handleDrop, false);
		}
		**/
		var xlf = document.getElementById('xlf');
		if(xlf.addEventListener) xlf.addEventListener('change', WDCT_Timeline.handleFile, false);
		
	    // Bind the window resize event to adjust the with of all the iframes with the resized 
	    // width of the window
	    // on screen for good user experience
	    $( window ).resize(WDCT_Timeline.window_ResizeHandler);	    
	    WDCT_Timeline.resizeGrid();
	    // undo shortcut
	    $(document).keydown(WDCT_Timeline.document_keyDownHandler);
	 // document click event to save chnages in grid when moved outside gird : 
	    $(document).click(WDCT_Timeline.document_ClickHandler);  
	    $("body").click(WDCT_Timeline.body_ClickHandler);
	    $(contextmenu_clientId).click(WDCT_Timeline.contextMenuClickHandler);
	    WDCT_Timeline.reFreshGrid();
	    
	    //$( window ).unload(WDCT_Timeline.window_UnLoadHandler);
	    
	    window.onbeforeunload = function() {
	    	  return "All the chances on this page will lost on navigation, we recommend to export before navigating.\nAre you sure you want to navigate away?";
	    	}
 },
  window_UnLoadHandler: function(){
	  return false;
	  
  },
  process_wb: function(wb) {
	  
	  res = to_multiArray(wb, current_sheet);
	  
	  setTimeout(function(){
		global_wb = wb;
		
		
		loader.showMore('Applying configurations...');
		//console.log(res);
		lookup_sheets_data = {};
		
		
		if(typeof WDCT_LookUpConfig != UNDEFINED && 
				typeof WDCT_LookUpConfig[current_sheet.toUpperCase()] != UNDEFINED){
		    var colConfig = WDCT_LookUpConfig[current_sheet.toUpperCase()];	
		
			for(var _a in colConfig){
				lookup_sheets_data[_a] = {};
				var sheetName = colConfig[_a].sheet;
				var col = colConfig[_a].col;
				var sheet_data = to_multiArray(wb, sheetName);
				
				for(var _indx = data_startindex, len = sheet_data.length; _indx < len; _indx++){
					lookup_sheets_data[_a][sheet_data[_indx][col]] = sheet_data[_indx][col];
				}
				sheetName = null;
				col = null;
				sheet_data = null;
			}
		} 
		
		
		//console.log(lookup_sheets_data);
		
		columnArr = res[columnArrRowIndex];
		contextArr = res[contextArrRowIndex];
		dataTypeArr = res[dataTypeArrRowIndex];
		requredArr = res[requredArrRowIndex];
		
		columns = [];
		
		for(var _indx = 0, len = columnArr.length; _indx < len; _indx++){
			
			var col = columnArr[_indx];
			
			if(col.trim() == '') continue;
			
			columns.push(WDCT_Timeline.getColumnDefination(_indx, _indx, col, dataTypeArr[_indx], requredArr[_indx], contextArr[_indx]));
		}
		
		//console.log('columns length --prep--' + columns.length);
		
		global_wb = null;
		wb = null;
		
		WDCT_Timeline.processData();
	  }, 500);	
		
		
	},
	
  
  
  processData : function(){
	  //data = [];
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
				objErr[_jindx] = false;
				//objErr[_jindx] = WDCT_Timeline.hasError(obj, _jindx, row[_jindx]);
				
			}
			
			obj['id'] = _indx;
			
			if(isValidRow){
			  dataErr.push(objErr);	
			  data.push(obj);
			}
			objErr = null;
			obj = null;
			
			data_startindex = _indx;
			//console.log(_indx);
		}
		data_startindex = _indx;
		var _resLen = res.length - _start_index;
		
		if(lastChunk <= res.length){
			
			//loader.hide();
		    setTimeout(function(){
		    	loader.showMore('Processed ::' + lastChunk + ' out of ' + _resLen + ' records..');
		    	data_iteration++;	
				WDCT_Timeline.processData();
		    }, 500);
			
		}else{
			
			loader.showMore('Preparing to load. Please wait..');
			setTimeout(function(){
				
				WDCT_Timeline.endProcess();
				
			}, 500);
			
		}
		
		
	  
  },
  endProcess: function(){
	  
	    res = null;
		loader.hide();
		WDCT_Timeline.bindMetadata();
		WDCT_Timeline.reFreshGrid();
	  
  },
  reFreshGrid : function(){
	    
	    if(grid != null || typeof grid != UNDEFINED){
	        grid.destroy();
	        grid = null;
	    }
	    
	    //columns.push(default_columns);
	    
		
		dataView = new Slick.Data.DataView({ inlineFilters: false });
		//dataView.setPagingOptions({pageSize: 65000});
		grid = new Slick.Grid(grid_clientId, dataView, columns, WDCT_Timeline.getGridOptions());
	    //grid = new Slick.Grid(grid_clientId, data, columns, WDCT_Timeline.getGridOptions());
		var pager = new Slick.Controls.Pager(dataView, grid, $(pager_clientId));
		
		
		// wire up model events to drive the grid
	    dataView.onRowCountChanged.subscribe(function (e, args) {
	      grid.updateRowCount();
	      WDCT_Timeline.renderGrid();
	    });
	    dataView.onRowsChanged.subscribe(function (e, args) {
	      grid.invalidateRows(args.rows);
	      WDCT_Timeline.renderGrid();
	    });
		
		
	    
	    /**
	    $(grid.getHeaderRow()).delegate(":input", "change keyup", function (e) {
	        var columnId = $(this).data("columnId");
	        if (columnId != null) {
	          columnFilters[columnId] = $.trim($(this).val());
	        
	          dataView.refresh();
	         
	        }
	      });
	    
	    
	      grid.onHeaderRowCellRendered.subscribe(function(e, args) {
	          $(args.node).empty();
	          if(typeof args.column.id != UNDEFINED && args.column.id != 0){
	            $("<input type='text'>")
	             .data("columnId", args.column.id)
	             .val(columnFilters[args.column.id])
	             .appendTo(args.node);
	           
	          }
	      });
	    **/
	     // set keyboard focus on the grid 
	    grid.getCanvasNode().focus(); 
	    
	    //grid.registerPlugin( new Slick.AutoColumnSize());
	    
	    
	    
	    
	    /**
	    // add header menu plugin
	    var headerMenuPlugin = new Slick.Plugins.HeaderMenu({});
	    // bind on command event
	    headerMenuPlugin.onCommand.subscribe(WDCT_Timeline.onHeaderMenuCommandHandler);
	    // register the plugin
	    grid.registerPlugin(headerMenuPlugin);
       **/
	    var headerButtonsPlugin = new Slick.Plugins.HeaderButtons();
	    //headerButtonsPlugin.onCommand.subscribe(function(e, args) {
	      //var column = args.column;
	      //var button = args.button;
	      //var command = args.command;
	      
	    //});
	    grid.registerPlugin(headerButtonsPlugin);
	    
	    
	    grid.onHeaderClick.subscribe(function(e, args) {
	        var columnID = args.column.id;
	        //console.log(columnID);
	        grid.gotoCell(0, columnID);
	        WDCT_Timeline.selectColumnRange(columnID);
	    });
	    
	   
	    
	    
	    grid.setSelectionModel(new Slick.CellSelectionModel());
	    
	    
	    /** COPY MANAGER PLUGIN **/
	    
	    var copyManager = new Slick.CellExternalCopyManager();
	    grid.registerPlugin(copyManager);
	    copyManager.onPasteCells.subscribe(WDCT_Timeline.onPasteCellsHandler);
	     

	    /***  ROW - REORDERING ***/
	    //var moveRowsPlugin = new Slick.RowMoveManager();
	    //moveRowsPlugin.onBeforeMoveRows.subscribe(Timeline.onBeforeMoveRowsHandler);
	    //moveRowsPlugin.onMoveRows.subscribe(Timeline.onMoveRowsHandler);
	    //grid.registerPlugin(moveRowsPlugin);

	    
	    /*** AUTO - TOOLTIP **/
	    grid.registerPlugin(new Slick.AutoTooltips());
	    
	    
	    // bind cell change event
	    //grid.onCellChange.subscribe(WDCT_Timeline.onCellChangeHandler);
	   
	    
	    grid.onCellChange.subscribe(function (e, args) {
	        dataView.updateItem(args.item.id, args.item);
	      });
	    
	    //grid.onActiveCellChanged.subscribe(WDCT_Timeline.onCellChangeHandler);
	    // bind addnew row event
	    //grid.onAddNewRow.subscribe(Timeline.onAddNewRowHandler);
	    
	    // bind edit cell event
	    //grid.onBeforeEditCell.subscribe(WDCT_Timeline.onBeforeEditCellHandler);
	    
	    
	    // bind context menu
	    grid.onContextMenu.subscribe(WDCT_Timeline.onContextMenuHandler);
	    
	    $(grid_clientId).on('blur', function() {
	        Slick.GlobalEditorLock.commitCurrentEdit();
	    });
	    
	    
	    function filter(item) {
            var columns = grid.getColumns();

            var value = true;

            for (var i = 0, colLen = columns.length; i < colLen; i++) {
                var col = columns[i];
                var filterValues = col.filterValues;
                var dup = col.findDup;
                var dt = col.findDt;
                var iv = col.findIv;

                if (filterValues && filterValues.length > 0) {
                    value = value & _.contains(filterValues, item[col.field]);
                }
                
                if(dup){
                	// get duplicate code here
                	//console.log(col.dupData);
                	var val = item[col.field];
                	if(typeof col.dupData != 'undefined' && col.dupData[val] == 1){
                		value = false;
                	}
                }
                
                if(dt){
                	value = WDCT_Timeline.hasDataTypeError(item, col.field, item[col.field]);
                }
                
                if(iv){
                	value = WDCT_Timeline.hasValidValuesError(item, col.field, item[col.field]);
                }
            }
            return value;
            
            
        }
	    
	    
	 // initialize the model after all the events have been hooked up
	    dataView.beginUpdate();
	    dataView.setItems(data);
	    //dataView.setFilter(WDCT_Timeline.filter);
	    dataView.setFilter(filter);
	    dataView.endUpdate();
	    
	    
	    
	    
	    var filterPlugin = new Ext.Plugins.HeaderFilter({});

        filterPlugin.onFilterApplied.subscribe(function () {
            dataView.refresh();
            grid.resetActiveCell();  
            WDCT_Timeline.renderGrid();
        });

        filterPlugin.onCommand.subscribe(function (e, args) {
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
        });

        grid.registerPlugin(filterPlugin);

        var overlayPlugin = new Ext.Plugins.Overlays({ decoratorWidth: 1});

        overlayPlugin.onFillUpDown.subscribe(function (e, args) {
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
            grid.render();
        });

        grid.registerPlugin(overlayPlugin); 
	    
	    
	    
	    //grid.init();
	    WDCT_Timeline.renderGrid();
	    
  },
  
  onBeforeEditCellHandler: function(e, args) {
      // make row un-editable [rows such as weekname, total]
	 var data = grid.getData();
  	 dataErr[args.row][args.cell] = WDCT_Timeline.hasError(data.getItem(args.row), args.cell, data.getItem(args.row)[grid.getColumns()[args.cell].field]);
     
  	 WDCT_Timeline.renderGrid();
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
  
  handleDrop: function(e) {
		e.stopPropagation();
		e.preventDefault();
		loader.show();
		
		setTimeout(function(){
			var files = e.dataTransfer.files;
			var f = files[0];
			{
				var reader = new FileReader();
				var name = f.name;
				reader.onload = function(e) {
					//if(typeof console !== UNDEFINED) console.log("onload", new Date(), rABS, use_worker);
					var data = e.target.result;
					//if(use_worker) {
						//xw(data, process_wb);
					//} else {
						var wb;
						if(rABS) {
							wb = X.read(data, {type: 'binary'});
						} else {
							var arr = fixdata(data);
							wb = X.read(btoa(arr), {type: 'base64'});
						}
						WDCT_Timeline.process_wb(wb);
					//}
				};
				if(rABS) reader.readAsBinaryString(f);
				else reader.readAsArrayBuffer(f);
				loader.hide();
			}
			
		}, 1000);
		
		
	},

	handleDragover: function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	},


	handleFile: function(e) {
		loader.show();
		
		setTimeout(function(){
			var files = e.target.files;
			var f = files[0];
			{
				var reader = new FileReader();
				var name = f.name;
				reader.onload = function(e) {
					//if(typeof console !== UNDEFINED) console.log("onload", new Date(), rABS, use_worker);
					var data = e.target.result;
					//if(use_worker) {
						//xw(data, process_wb);
					//} else {
						var wb;
						if(rABS) {
							//console.log('binary');
							wb = X.read(data, {type: 'binary'});
							
						} else {
							//console.log('base64');
							var arr = fixdata(data);
							wb = X.read(btoa(arr), {type: 'base64'});
						}
						
						WDCT_Timeline.process_wb(wb);
					//}
				};
				
				if(rABS) reader.readAsBinaryString(f);
				else reader.readAsArrayBuffer(f);
				
				//loader.hide();
			}
			
		}, 1000);
		
  },
  
  
  
  onContextMenuHandler: function (e) {
      e.preventDefault();
      var cell = grid.getCellFromEvent(e);
      
      $(contextmenu_clientId).hide();
      
      
      //console.log(cell);
      $(contextmenu_clientId)
          .data("data", { range : grid.getSelectionModel().getSelectedRanges(), row : cell.row, cell : cell.cell})
          .css("top", e.pageY)
          .css("left", e.pageX)
          .show();
      
    },
    
    selectColumnRange: function(cell){
    	
    	var ranges = [];
    	//remove previous selected
    	grid.getSelectionModel().setSelectedRanges([]);
    	
    	ranges.push(new Slick.Range(0, cell, grid.getData().getLength() - 1, cell));
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
                            	  if(typeof dataView.getItem(from.fromRow + i) == 'undefined') continue;
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
                            	  
                            	  /**
                                      var rowId = data[from.fromRow + i].id;
                                      var field = columns[from.fromCell + j].field;
                                      var value = data[from.fromRow + i][columns[from.fromCell + j].field];
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
	                                  }else if (val.toLowerCase() == 'fill') {
	                                         var fill_value = $('#fill_input').val();
	                                         if(typeof fill_value != UNDEFINED && fill_value.trim() == ''){
	                                        	 alert('No value defined to fill!!!');
	                                        	 return;
	                                         }
	                                         replaceValue = fill_value;
	                                  }
                                      
                                      
                                      data[from.fromRow + i][columns[from.fromCell + j].field] = replaceValue;
                                          
                                      grid.invalidateRow(from.fromRow + i);
                                 **/
                              }
                 
                          } 
                          
                          
                         grid.getSelectionModel().setSelectedRanges([]);
                         // initialize the model after all the events have been hooked up
                         dataView.endUpdate();
                         WDCT_Timeline.renderGrid(); 
 
                    } 
                     
                     $(contextmenu_clientId).hide();
                 }//end of is button check  
        
        
    },
  
  onHeaderMenuCommandHandler: function(e, args) {
	  
      if (args.command === 'select_rows') {
          //Timeline.addMoreColumnsOnRight(args.column.id, 1);
    	  //alert('select rows called');
    	  WDCT_Timeline.selectColumnRange(args.column.id);
      }

  },
  
  
  onCellChangeHandler: function(e, args){
	  WDCT_Timeline.onBeforeEditCellHandler(e, args);
	  WDCT_Timeline.setAndDisplayErrorCount();
	  
  },
  
  hasDataTypeError: function(rowObj, cell, value){
      var isInvalid = false;

      if(typeof dataTypeArr[cell] != UNDEFINED && dataTypeArr[cell].trim() != '' &&
          typeof WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != UNDEFINED && 
          WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != '' &&
          WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()].test(value.trim()) == false){
        
        isInvalid = true;
      }

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
        }
          }
    }

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

      return isInvalid;
  },

  
  hasError: function(rowObj, cell, value){
  	var isInvalid = false;
  	
  	//console.log(columnArr[cell].trim().toUpperCase());
  	//console.log(WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()]);
  	
  	
  	isInvalid = WDCT_Timeline.hasDataTypeError(rowObj, cell, value);
  	isInvalid = WDCT_Timeline.hasValidValuesError(rowObj, cell, value);
  	
  	
  	/**
  	// return if field is optional and empty
    if(typeof requredArr[cell] != UNDEFINED && requredArr[cell].trim() != '' &&
  			requredArr[cell].trim().toLowerCase() != REQUIRED && value.trim() == ''){
  		return isInvalid;
  	}
  	
    // check for required validation
  	if(typeof requredArr[cell] != UNDEFINED && requredArr[cell].trim() != '' &&
  			requredArr[cell].trim().toLowerCase() == REQUIRED && value.trim() == ''){
  		isInvalid = true;
  		// check for datatype validations
  	}else if(typeof dataTypeArr[cell] != UNDEFINED && dataTypeArr[cell].trim() != '' &&
  			  typeof WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != UNDEFINED && 
  			WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != '' &&
  			WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()].test(value.trim()) == false){
  		
  		isInvalid = true;
  	}else if(typeof columnArr[cell] != UNDEFINED && columnArr[cell].trim() != '' &&
			  typeof WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()] != UNDEFINED && 
			  WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()] != '' &&
			  WDCT_HEADER_REGEX[columnArr[cell].trim().toUpperCase()].test(value.trim()) == false){
	  		
	  		isInvalid = true;
	}else if(typeof lookup_sheets_data != UNDEFINED &&
			 typeof lookup_sheets_data[cell] != UNDEFINED && 
			 typeof value != UNDEFINED && 
			 typeof lookup_sheets_data[cell][value] == UNDEFINED){
		    isInvalid = true;
		//check for Phone Formats
	}else if(typeof WDCT_RELATEDVALIDATIONS != UNDEFINED &&
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
			  }
          }   

	}
  	**/
  	//console.log("**********" + );

  	return isInvalid;
  },
  
  
  setAndDisplayErrorCount: function(){
	  WDCT_Timeline.errorsCount = 0;
	  for(var indx = 0, indxLen = dataErr.length; indx < indxLen; indx++){
		  var row = dataErr[indx];
		  
		  for(var jindx in row){
			  if(row[jindx] == true){
				  WDCT_Timeline.errorsCount++;
			  }
		  }
		 
	  }
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
		 return {
	         id: id,
	         field: field,
	         name: name,
	         width: 100,
	         selectable: false,
	         resizable: false,
	         focusable : false
	        
	     } 
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
        	    menu: {
	        	        items: [
	        	          { 
	        	            title: "Select Rows",
	        	            command: "select_rows"
	        	          }
	        	        ]
	        	      }
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
         handler: function(e) {
           //alert('Help');
       	  //for(var _a in e){
       		//  console.log(_a);
       	  //}
         }
       });
	 
	 column.header.buttons.push({
         
       });
	 return column;
  },		
		

  resizeGrid: function(){
      //$(grid_clientId).css({'width': '100%', height: ($(window).outerHeight() - ($('#input_section').outerHeight() + $('.slick-pager').outerHeight() + 35))});
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
          ,asyncPostRenderDelay : 50 // default 50
          //,leaveSpaceForNewRows : true
          //,frozenColumn : 4
          //,frozenRow : 3
     
          //,autoHeight: true
          //,fullWidthRows: true
          //,frozenBottom: true
          
          //,showHeaderRow: true
          //,editCommandHandler: undoRedoBuffer.queueAndExecuteCommand
      };  
        
    },
    
    renderGrid: function(){
    	WDCT_Timeline.errorsCount = 0;
        grid.render();
        WDCT_Timeline.setAndDisplayErrorCount();
    },
    
    validateFormatter: function(row, cell, value, columnDef, dataContext) {
    	var data = grid.getData();
    	dataErr[row][cell] = WDCT_Timeline.hasError(data.getItem(row), cell, value);
    	if(dataErr[row][cell]){
    		return "<div class='frmt-invalid' style='width:100%;'>" + value + "</div>";
    	}
    	//WDCT_Timeline.setAndDisplayErrorCount();
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
    
    bindMetadata: function(){
    	
    	/**
        // set the grid's data as new rows
    	dataView.getItemMetadata = function (row) {
        	      var metadata;
                  if(row < 3){
	                    metadata =  {
	                	  cssClasses:"slick-gray_background",
	                      selectable: false,
	                      focusable: false,
	                      columns:{}
	                    };
	                   for(var _indx = 0; _indx < columns.length; _indx++){
	                	   metadata.columns[_indx] = {
	                			   editor:"",
	                			   formatter: function(row, cell, value, columnDef, dataContext) {
	                			        return value;
	                			    }  
	                	   };
	                   }
                  }
                  
                  
                  
                  
                  return metadata; 
        }
        **/
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
	
	filter: function(item) {
	    for (var columnId in columnFilters) {
	      if (columnId !== undefined && columnFilters[columnId] !== "") {
	        var c = grid.getColumns()[grid.getColumnIndex(columnId)];

	        //console.log(item);
	        //console.log(columnFilters[columnId]);
	        var input_value = columnFilters[columnId];

	         if(input_value == 'Data_Type_Error'){
	           return WDCT_Timeline.hasDataTypeError(item, c.field, item[c.field]);
	         }

	         if(input_value == 'Invalid_Values_Error'){
	          return WDCT_Timeline.hasValidValuesError(item, c.field, item[c.field]);
	         }

	         if (item[c.field] != input_value) {
	          return false;
	         }
	        
	        
	      }
	    }
	    return true;
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
		  				  
		  			    //console.log(jindx);
		  			    if(jindx != 'id'){
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
		
		/**
		var data = excel_data;	
		var lastChunk = xlsx_iteration * xlsx_chunk;
		
			for(var R = xlsx_s_index; R <= data.getLength() && R <= lastChunk; R++){
				  //console.log('R:::' + R);
		  		  var row = data.getItem(R - 1);
		  		  
		  		  for(var jindx in row){
		  			  try{
		  				  
		  			    //console.log(jindx);
		  			    if(jindx != 'id'){
			  				var C = parseInt(jindx);
			  				//console.log('C:::' + C);
			  				if(xlsx_range.s.r > R) xlsx_range.s.r = R;
							if(xlsx_range.s.c > C) xlsx_range.s.c = C;
							if(xlsx_range.e.r < R) xlsx_range.e.r = R;
							if(xlsx_range.e.c < C) xlsx_range.e.c = C; 
			  				
							var cell = {v: row[jindx] };
							
							if(cell.v != null){ 
								var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
								
								if(typeof cell.v === 'number') cell.t = 'n';
								else if(typeof cell.v === 'boolean') cell.t = 'b';
								else if(cell.v instanceof Date) {
									cell.t = 'n'; cell.z = XLSX.SSF._table[14];
									cell.v = WDCT_Timeline.datenum(cell.v);
								}
								else cell.t = 's';
								
								xlsx_ws[cell_ref] = cell;
							}
							
		  			    }
		  			  }catch(ex){console.log(ex);}
		  		  }
		  		  
		  		  
		  		xlsx_s_index = R;
		  		  
		  	}
			
			
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
					
					if(xlsx_range.s.c < 10000000) xlsx_ws['!ref'] = XLSX.utils.encode_range(xlsx_range);
					
					WDCT_Timeline.writeMyXLSX();
					loader.hide();
					
				}, 500);
				
			}
		**/
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
		
		/**
		for(var _indx = 0; _indx < columnArr.length; _indx++){
			var R = 0;
			var C = _indx;
			if(xlsx_range.s.r > R) xlsx_range.s.r = R;
			if(xlsx_range.s.c > C) xlsx_range.s.c = C;
			if(xlsx_range.e.r < R) xlsx_range.e.r = R;
			if(xlsx_range.e.c < C) xlsx_range.e.c = C; 
				
			var cell = {v: columnArr[_indx] };
			
			if(cell.v == null){ 
				continue;
			}
			var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
			
			if(typeof cell.v === 'number') cell.t = 'n';
			else if(typeof cell.v === 'boolean') cell.t = 'b';
			else if(cell.v instanceof Date) {
				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
				cell.v = WDCT_Timeline.datenum(cell.v);
			}
			else cell.t = 's';
			
			xlsx_ws[cell_ref] = cell;
			
		}
		**/
		
	},

	writeMyXLSX : function(){
		/* original data */
		var ws_name = current_sheet;
		
		//function Workbook() {
			//if(!(this instanceof Workbook)) return new Workbook();
			//this.SheetNames = [];
			//this.Sheets = {};
		//}
		
		//var wb = new Workbook();
		 
		/* add worksheet to workbook */
		//wb.SheetNames.push(ws_name);
		//wb.Sheets[ws_name] = xlsx_ws;
		
		try{
		  //original//var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:false, type: 'binary'});
		  var wbout = xlsx_ws.join('\r\n');	
		  ///[\r\n]/
		
		}catch(ex){
			alert('write::' + ex);
		}
		
		try{
			//saveAs(new Blob([WDCT_Timeline.s2ab(wbout)],{type:"application/octet-stream"}), current_sheet +".xlsx");
			saveAs(new Blob([WDCT_Timeline.s2ab(wbout)],{type:"application/octet-stream"}), current_sheet +".csv");
		}catch(ex){alert('saveAs::' + ex);}
	},
	
	
	escapeCell: function (cell) {
		var qreg = /"/g;
		var val = cell || '';
		val = val.toString();
		/**
		  cell = cell || '';
		  cell = cell.toString();
		  return (cell.indexOf(',') !== -1 || cell.indexOf('"') !== -1 || cell.indexOf('\n') !== -1) ?
				  "\"" + cell.replace(qreg, '""') + "\"" :
		    cell;
		**/		  
				  
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






