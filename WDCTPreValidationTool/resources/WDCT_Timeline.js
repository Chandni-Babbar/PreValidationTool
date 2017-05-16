/*** CUSTOM CODE***/

var data = [];
var dataErr = [];
var columns = [];
var loadingIndicator = null;
var grid;
var global_wb;
var columnArr;
var dataTypeArr;
var requredArr;
var REQUIRED = 'required';
var OPTIONAL = 'optional';
var dataView;

var addNewColumn = function(columnDefinition) {
    var columns = grid.getColumns();
    columns.push(columnDefinition);
    grid.setColumns(columns);
    // when columns are now in; go for grid init
    grid.init();
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









// On DOM Ready
$(function() {
	
	
	var drop = document.getElementById('drop');
	if(drop.addEventListener) {
		drop.addEventListener('dragenter', handleDragover, false);
		drop.addEventListener('dragover', handleDragover, false);
		drop.addEventListener('drop', handleDrop, false);
	}
	
	
	var xlf = document.getElementById('xlf');
	if(xlf.addEventListener) xlf.addEventListener('change', handleFile, false);
		
	
    // Bind the window resize event to adjust the with of all the iframes with the resized 
    // width of the window
    // on screen for good user experience
    $( window ).resize(function() {
        WDCT_Timeline.resizeGrid();
    });
    

    
    WDCT_Timeline.resizeGrid();
    // undo shortcut
    $(document).keydown(function(e) {
        if (e.which == 90 && (e.ctrlKey || e.metaKey)) { // CTRL + (shift) + Z
            if (e.shiftKey) {
                undoRedoBuffer.redo();
            } else {
                undoRedoBuffer.undo();
            }
        }
    });
   
 // document click event to save chnages in grid when moved outside gird : 
    $(document).click(function(e) {
        //if (e.target.id != "myDiv" && !$(e.target).parents("#myDiv").size()) { 
             Slick.GlobalEditorLock.commitCurrentEdit();
        //}
    });    
    
   reFreshGrid();
   
    
});





var gridMainInitiate = function(){
	columns.push(default_columns);
    
	
	dataView = new Slick.Data.DataView({ inlineFilters: false });
	
	
    grid = new Slick.Grid("#myGrid", data, columns, WDCT_Timeline.getGridOptions());
                                                    
     // set keyboard focus on the grid 
    grid.getCanvasNode().focus(); 
    
    grid.registerPlugin( new Slick.AutoColumnSize());
    
    // add header menu plugin
    //var headerMenuPlugin = new Slick.Plugins.HeaderMenu({});
    // bind on command event
    //headerMenuPlugin.onCommand.subscribe(Timeline.onHeaderMenuCommandHandler);
    // register the plugin
    //grid.registerPlugin(headerMenuPlugin);

    
    //grid.setSelectionModel(new Slick.CellSelectionModel());
    
    
    /** COPY MANAGER PLUGIN **/
    
    //var copyManager = new Slick.CellExternalCopyManager();
    //grid.registerPlugin(copyManager);
    //copyManager.onPasteCells.subscribe(Timeline.onPasteCellsHandler);
     

    /***  ROW - REORDERING ***/
    //var moveRowsPlugin = new Slick.RowMoveManager();
    //moveRowsPlugin.onBeforeMoveRows.subscribe(Timeline.onBeforeMoveRowsHandler);
    //moveRowsPlugin.onMoveRows.subscribe(Timeline.onMoveRowsHandler);
    //grid.registerPlugin(moveRowsPlugin);

    
    /*** AUTO - TOOLTIP **/
    grid.registerPlugin(new Slick.AutoTooltips());
    
    
    // bind cell change event
    grid.onCellChange.subscribe(WDCT_Timeline.onCellChangeHandler);
   
    // bind addnew row event
    //grid.onAddNewRow.subscribe(Timeline.onAddNewRowHandler);
    
    // bind edit cell event
    //grid.onBeforeEditCell.subscribe(Timeline.onBeforeEditCellHandler);
    
    
    // bind context menu
    //grid.onContextMenu.subscribe(Timeline.onContextMenuHandler);
    
    $('#myGrid').on('blur', function() {
        Slick.GlobalEditorLock.commitCurrentEdit();
    });
    
    
 
    
    WDCT_Timeline.renderGrid();
}


var reFreshGrid = function(){
    
    if(grid != null || typeof grid != 'undefined'){
        grid.destroy();
        grid = null;
    }
    gridMainInitiate();
    
}


var default_columns = [
    {
      id: "selector",
      name: "",
      field: "num",
      width: 30
    }
  ];

function process_wb(wb) {
	global_wb = wb;
	var output = "";
	
	var res = to_multiArray(wb, 'employee data');

	columnArr = res[2];
	dataTypeArr = res[4];
	requredArr = res[5];
	
	columns = [];
	for(var _indx = 0; _indx < columnArr.length; _indx++){
		var col = columnArr[_indx];
		columns.push(WDCT_Timeline.getColumnDefination(_indx, _indx, col, dataTypeArr[_indx], requredArr[_indx]));
	}
	
	data = [];
	
	for(var _indx = 3; _indx < res.length; _indx++){
		var obj  = {};
		var row = res[_indx];
		var objErr = {};
		
		var isValidRow = false;
		
		for(_jindx = 0; _jindx < row.length; _jindx++){
			var val = row[_jindx];
			if(val.trim() != '') isValidRow = true;
			obj[_jindx] = row[_jindx];
			objErr[_jindx] = WDCT_Timeline.hasError(_jindx, row[_jindx]);
			
		}
		if(isValidRow){
		  dataErr.push(objErr);	
		  data.push(obj);
		}
	}
	
	
	// release the memory allocated to res
	res = null;
	global_wb = null;
	wb = null;
	
	WDCT_Timeline.bindMetadata();
	reFreshGrid();
	
}




var WDCT_Timeline = {
  errorsCount : 0,
  
  onCellChangeHandler: function(e, args){
	  WDCT_Timeline.setAndDisplayErrorCount();
	  
  },
  
  
  hasError: function(cell, value){
  	var isInvalid = false;
  	/**if(typeof requredArr[cell] != 'undefined' && requredArr[cell].trim() != '' &&
  			requredArr[cell].trim().toLowerCase() == REQUIRED && value.trim() == ''){
  		isInvalid = true;
  	}else if(typeof dataTypeArr[cell] != 'undefined' && dataTypeArr[cell].trim() != '' &&
  			  typeof WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != 'undefined' && 
  			WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()] != '' &&
  			WDCT_REGEX[dataTypeArr[cell].trim().toUpperCase()].test(value.trim()) == false){
  		
  		isInvalid = true;
  	}**/
  	
  	
  	return isInvalid;
  },
  
  
  setAndDisplayErrorCount: function(){
	  WDCT_Timeline.errorsCount = 0;
	  for(var indx = 0; indx < dataErr.length; indx++){
		  var row = dataErr[indx];
		  
		  for(var jindx in row){
			  if(row[jindx] == true){
				  WDCT_Timeline.errorsCount++;
			  }
		  }
		 
	  }
	  $('#errors').text(WDCT_Timeline.errorsCount);  
  },	
  
  
  getColumnDefination: function(id, field, name, dataTypeText, requiredText){
	 var defaultEditor =  Slick.Editors.Text;
	 
	 //if(typeof dataTypeText != 'undefined' && dataTypeText != '' && 
	//		 typeof Slick.Editors[dataTypeText.toLowerCase()] != 'undefined'){
	//	 defaultEditor = Slick.Editors[dataTypeText.toLowerCase()];
	// }
	 
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
	 
	 return {
         id: id,
         field: field,
         name: name,
         behavior: "",
         width: 150,
         selectable: false,
         resizable: true,
         focusable : true,
         editor: defaultEditor,
         cssClass: "",
         groupName: " ",
         header: {},
         headerCssClass: ""
         //,formatter: WDCT_Timeline.validateFormatter
     } 
  },		
		

  resizeGrid: function(){
      $('#myGrid').css({'width': '100%', height: ($(window).outerHeight() - ($('#input_section').outerHeight()))});
      if(typeof grid != 'undefined') grid.resizeCanvas();
  },
  
  getGridOptions: function(){ 
	  return {
          explicitInitialization : false,
          editable: true,
          enableAddRow: true,
          enableCellNavigation: true,
          asyncEditorLoading: true, // need true to implement single click
          autoEdit: true,
          enableColumnReorder: false
          ,forceFitColumns : false
          ,headerRowHeight : 30
          ,enableAsyncPostRender: true
          ,asyncPostRenderDelay : 50 // default 50
          //,leaveSpaceForNewRows : true
          //,frozenColumn : 4
          ,frozenRow : 3

          //,autoHeight: true
          //,fullWidthRows: true
          //,frozenBottom: true
      };  
        
    },
    
    renderGrid: function(){
    	WDCT_Timeline.errorsCount = 0;
        grid.render();
        WDCT_Timeline.setAndDisplayErrorCount();
    },
    
    validateFormatter: function(row, cell, value, columnDef, dataContext) {
    	dataErr[row][cell] = WDCT_Timeline.hasError(cell, value);
    	if(dataErr[row][cell]){
    		return "<div class='frmt-invalid' style='width:100%;height:100%;'>" + value + "</div>";
    	}
    	//WDCT_Timeline.setAndDisplayErrorCount();
    	return value;
    }, 
    
    
    bindMetadata: function(){
        // set the grid's data as new rows
        data.getItemMetadata = function (row) {
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
		
		 $('body').exportToExcel("export.xlsx", 'Timeline', gridData, null, function (response) {
		      //console.log(response);
		      // use vanilla way of calling click action on anchor tag
		      // jquery click doesn't work on anchor tags
		      //document.getElementById("downloadLink").click();
		      
		      if (navigator.msSaveBlob) { // IE 10+ 
		          //alert('in IE');
		          response = response.replace('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,', '');
		          //console.log('NEWRESPONSE' + response);
		          navigator.msSaveBlob(Timeline.b64toBlob(response, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'export' + '.xlsx'); 
		      
		          
		      }else if(typeof sforce != 'undefined' && typeof sforce.one != 'undefined'){
		           
		           // Lightning experience show - working
		           window.top.location.href = document.getElementById("downloadLink").getAttribute("href");
		           
		          
		      }else {
		          //alert('in Firefox/Mozilla/Chrome');
		          // use vanilla way of calling click action on anchor tag
		          // jquery click doesn't work on anchor tags
		        
		          // Does Not work in lightning
		          document.getElementById("downloadLink").click();
		          
		      }
		      
		      //WDCT_Timeline.resizeGrid();
		      //loadSpinner.hide();
		      loader.hide();
		      
		  }); 
		  
		  gridData = null;
		},
		
		downloadExcel_Click: function(src, event){
		 // change the width and height of the grid to make all the columns visible to be 
		 // able to be available at the time of render
	     loader.show();
		 //$('#myGrid').css({'width': '15000px', height: '15000px'});
		 //grid.resizeCanvas();
		 
		 
		 //grid.destroy();
		 //gridMainInitiate();
		 //loadSpinner.show();
		 
		 // 3 seconds are benchmarks
		 // Need to give 3 secs wait period to load the grid with 
		 // all the asyncPostRender items and then start reading grid content
		 
		 setTimeout(function(){
		     try{
		        WDCT_Timeline.registerExportToExcel();
		     }catch(ex){
		        //in case exception comes while generating the xlsx; do handle the exception 
		        // and render the grid properly
		        //loadSpinner.hide();
		    	console.log(ex);
		        loader.hide();
		     }
		 }, 3000);
		 
		 return false;       
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
	            var $g = $("#myGrid");

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
	    }
	}
