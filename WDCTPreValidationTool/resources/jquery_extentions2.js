(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellCopyManager": CellCopyManager
    }
  });


  function CellCopyManager() {
    var _grid;
    var _self = this;
    var _copiedRanges;

    function init(grid) {
      _grid = grid;
      _grid.onKeyDown.subscribe(handleKeyDown);
    }

    function destroy() {
      _grid.onKeyDown.unsubscribe(handleKeyDown);
    }

    function handleKeyDown(e, args) {
      var ranges;
      if (!_grid.getEditorLock().isActive()) {
        if (e.which == $.ui.keyCode.ESCAPE) {
          if (_copiedRanges) {
            e.preventDefault();
            clearCopySelection();
            _self.onCopyCancelled.notify({ranges: _copiedRanges});
            _copiedRanges = null;
          }
        }

        if (e.which == 67 && (e.ctrlKey || e.metaKey)) {
          ranges = _grid.getSelectionModel().getSelectedRanges();
          if (ranges.length != 0) {
            e.preventDefault();
            _copiedRanges = ranges;
            markCopySelection(ranges);
            _self.onCopyCells.notify({ranges: ranges});
          }
        }

        if (e.which == 86 && (e.ctrlKey || e.metaKey)) {
          if (_copiedRanges) {
            e.preventDefault();
            clearCopySelection();
            ranges = _grid.getSelectionModel().getSelectedRanges();
            _self.onPasteCells.notify({from: _copiedRanges, to: ranges}); 
            
            // 12 Aug 2016: RJ: Commented this line to allow user to paste the copied data as much as possible on
            // this screen
            //_copiedRanges = null;
          }
        }
      }
    }

    function markCopySelection(ranges) {
      var columns = _grid.getColumns();
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          hash[j] = {};
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell; k++) {
            hash[j][columns[k].id] = "copied";
          }
        }
      }
      _grid.setCellCssStyles("copy-manager", hash);
    }

    function clearCopySelection() {
      _grid.removeCellCssStyles("copy-manager");
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "clearCopySelection": clearCopySelection,

      "onCopyCells": new Slick.Event(),
      "onCopyCancelled": new Slick.Event(),
      "onPasteCells": new Slick.Event()
    });
  }
})(jQuery);

(function($) {

    $.extend(true, window, {
        "Slick": {
            "AutoColumnSize": AutoColumnSize
        }
    });

    function AutoColumnSize(maxWidth) {

        var grid, $container, context,
            keyCodes = {
                'A': 65
            };

        function init(_grid) {
            grid = _grid;
            maxWidth = maxWidth || 200;

            $container = $(grid.getContainerNode());
            $container.on("dblclick.autosize", ".slick-resizable-handle", reSizeColumn);
            $container.keydown(handleControlKeys);

            context = document.createElement("canvas").getContext("2d");
        }

        function destroy() {
            $container.off();
        }

        function handleControlKeys(event) {
            if (event.ctrlKey && event.shiftKey && event.keyCode === keyCodes.A) {
                resizeAllColumns();
            }
        }

        function resizeAllColumns() {
            var elHeaders = $container.find(".slick-header-column");
            var allColumns = grid.getColumns();
            elHeaders.each(function(index, el) {
                var columnDef = $(el).data('column');
                var headerWidth = getElementWidth(el);
                var colIndex = grid.getColumnIndex(columnDef.id);
                var column = allColumns[colIndex];
                var autoSizeWidth = Math.max(headerWidth, getMaxColumnTextWidth(columnDef, colIndex)) + 1;
                autoSizeWidth = Math.min(maxWidth, autoSizeWidth);
                column.width = autoSizeWidth;
            });
            grid.setColumns(allColumns);
            grid.onColumnsResized.notify();
        }

        function reSizeColumn(e) {
            var headerEl = $(e.currentTarget).closest('.slick-header-column');
            var columnDef = headerEl.data('column');

            if (!columnDef || !columnDef.resizable) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            var headerWidth = getElementWidth(headerEl[0]);
            var colIndex = grid.getColumnIndex(columnDef.id);
            var allColumns = grid.getColumns();
            var column = allColumns[colIndex];

            var autoSizeWidth = Math.max(headerWidth, getMaxColumnTextWidth(columnDef, colIndex)) + 1;

            if (autoSizeWidth !== column.width) {
                column.width = autoSizeWidth;
                grid.setColumns(allColumns);
                grid.onColumnsResized.notify();
            }
        }

        function getMaxColumnTextWidth(columnDef, colIndex) {
            var texts = [];
            var rowEl = createRow(columnDef);
            var data = grid.getData();
            if (Slick.Data && data instanceof Slick.Data.DataView) {
                data = data.getItems();
            }
            for (var i = 0; i < data.length; i++) {
                texts.push(data[i][columnDef.field]);
            }
            var template = getMaxTextTemplate(texts, columnDef, colIndex, data, rowEl);
            var width = getTemplateWidth(rowEl, template);
            deleteRow(rowEl);
            return width;
        }

        function getTemplateWidth(rowEl, template) {
            var cell = $(rowEl.find(".slick-cell"));
            cell.append(template);
            $(cell).find("*").css("position", "relative");
            return cell.outerWidth() + 1;
        }

        function getMaxTextTemplate(texts, columnDef, colIndex, data, rowEl) {
            var max = 0,
                maxTemplate = null;
            var formatFun = columnDef.formatter;
            $(texts).each(function(index, text) {
                var template;
                if (formatFun) {
                    template = $("<span>" + formatFun(index, colIndex, text, columnDef, data) + "</span>");
                    text = template.text() || text;
                }
                var length = text ? getElementWidthUsingCanvas(rowEl, text) : 0;
                if (length > max) {
                    max = length;
                    maxTemplate = template || text;
                }
            });
            return maxTemplate;
        }

        function createRow(columnDef) {
            var rowEl = $('<div class="slick-row"><div class="slick-cell"></div></div>');
            rowEl.find(".slick-cell").css({
                "visibility": "hidden",
                "text-overflow": "initial",
                "white-space": "nowrap"
            });
            var gridCanvas = $container.find(".grid-canvas");
            $(gridCanvas).append(rowEl);
            return rowEl;
        }

        function deleteRow(rowEl) {
            $(rowEl).remove();
        }

        function getElementWidth(element) {
            var width, clone = element.cloneNode(true);
            clone.style.cssText = 'position: absolute; visibility: hidden;right: auto;text-overflow: initial;white-space: nowrap;';
            element.parentNode.insertBefore(clone, element);
            width = clone.offsetWidth;
            clone.parentNode.removeChild(clone);
            return width;
        }

        function getElementWidthUsingCanvas(element, text) {
            context.font = element.css("font-size") + " " + element.css("font-family");
            var metrics = context.measureText(text);
            return metrics.width;
        }

        return {
            init: init,
            destroy: destroy
        };
    }
}(jQuery));

(function($) {
    // register namespace
    $.extend(true, window, {
        "Slick": {
            "CellSelectionModel": CellSelectionModel
        }
    });
    function CellSelectionModel(options) {
        var _grid;
        var _canvas;
        var _ranges = [];
        var _self = this;
        var _selector = new Slick.CellRangeSelector({
            "selectionCss": {
                "border": "2px solid black"
            }
        });
        var _options;
        var _defaults = {
            selectActiveCell: true
        };


        function init(grid) {
            _options = $.extend(true, {}, _defaults, options);
            _grid = grid;
            _canvas = _grid.getCanvasNode();
            _grid.onActiveCellChanged.subscribe(handleActiveCellChange);
            _grid.onKeyDown.subscribe(handleKeyDown);
            grid.registerPlugin(_selector);
            _selector.onCellRangeSelected.subscribe(handleCellRangeSelected);
            _selector.onBeforeCellRangeSelected.subscribe(handleBeforeCellRangeSelected);
        }

        function destroy() {
            _grid.onActiveCellChanged.unsubscribe(handleActiveCellChange);
            _grid.onKeyDown.unsubscribe(handleKeyDown);
            _selector.onCellRangeSelected.unsubscribe(handleCellRangeSelected);
            _selector.onBeforeCellRangeSelected.unsubscribe(handleBeforeCellRangeSelected);
            _grid.unregisterPlugin(_selector);
        }

        function removeInvalidRanges(ranges) {
            var result = [];

            for (var i = 0; i < ranges.length; i++) {
                var r = ranges[i];
                if (_grid.canCellBeSelected(r.fromRow, r.fromCell) && _grid.canCellBeSelected(r.toRow, r.toCell)) {
                    result.push(r);
                }
            }

            return result;
        }

        function setSelectedRanges(ranges) {
            _ranges = removeInvalidRanges(ranges);
            _self.onSelectedRangesChanged.notify(_ranges);
        }

        function getSelectedRanges() {
            return _ranges;
        }

        function handleBeforeCellRangeSelected(e, args) {
            if (_grid.getEditorLock().isActive()) {
                e.stopPropagation();
                return false;
            }
        }

        function handleCellRangeSelected(e, args) {
            setSelectedRanges([args.range]);
        }

        function handleActiveCellChange(e, args) {
            if (_options.selectActiveCell && args.row != null && args.cell != null) {
                setSelectedRanges([new Slick.Range(args.row, args.cell)]);
            }
        }

        function handleKeyDown(e) {
            /***
             * ?ey codes
             * 37 left
             * 38 up
             * 39 right
             * 40 down                     
             */
            var ranges, last;
            var active = _grid.getActiveCell();

            if (active && e.shiftKey && !e.ctrlKey && !e.altKey &&
                (e.which == 37 || e.which == 39 || e.which == 38 || e.which == 40)) {

                ranges = getSelectedRanges();
                if (!ranges.length)
                    ranges.push(new Slick.Range(active.row, active.cell));

                // keyboard can work with last range only          
                last = ranges.pop();

                // can't handle selection out of active cell
                if (!last.contains(active.row, active.cell))
                    last = new Slick.Range(active.row, active.cell);

                var dRow = last.toRow - last.fromRow,
                    dCell = last.toCell - last.fromCell,
                    // walking direction
                    dirRow = active.row == last.fromRow ? 1 : -1,
                    dirCell = active.cell == last.fromCell ? 1 : -1;

                if (e.which == 37) {
                    dCell -= dirCell;
                } else if (e.which == 39) {
                    dCell += dirCell;
                } else if (e.which == 38) {
                    dRow -= dirRow;
                } else if (e.which == 40) {
                    dRow += dirRow;
                }
                
                
                // define new selection range 
                var new_last = new Slick.Range(active.row, active.cell, active.row + dirRow * dRow, active.cell + dirCell * dCell);
                if (removeInvalidRanges([new_last]).length) {
                    ranges.push(new_last);
                    var viewRow = dirRow > 0 ? new_last.toRow : new_last.fromRow;
                    var viewCell = dirCell > 0 ? new_last.toCell : new_last.fromCell;
                    _grid.scrollRowIntoView(viewRow);
                    _grid.scrollCellIntoView(viewRow, viewCell);
                } else
                    ranges.push(last);

                setSelectedRanges(ranges);

                e.preventDefault();
                e.stopPropagation();
            }
        }

        $.extend(this, {
            "getSelectedRanges": getSelectedRanges,
            "setSelectedRanges": setSelectedRanges,

            "init": init,
            "destroy": destroy,

            "onSelectedRangesChanged": new Slick.Event()
        });
    }
})(jQuery);



(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellRangeSelector": CellRangeSelector
    }
  });


  function CellRangeSelector(options) {
    var _grid;
    var _gridOptions;
    var _$activeCanvas;
    var _dragging;
    var _decorator;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {
      selectionCss: {
        "border": "2px dashed blue"
      }
    };
    
    // Frozen row & column variables
    var _rowOffset;
    var _columnOffset;
    var _isRightCanvas;
    var _isBottomCanvas;

    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _decorator = new Slick.CellRangeDecorator(grid, options);
      _grid = grid;
      _gridOptions = _grid.getOptions();
      _handler
        .subscribe(_grid.onDragInit, handleDragInit)
        .subscribe(_grid.onDragStart, handleDragStart)
        .subscribe(_grid.onDrag, handleDrag)
        .subscribe(_grid.onDragEnd, handleDragEnd);
    }

    function destroy() {
        _handler.unsubscribeAll();
    }

    function handleDragInit(e, dd) {
        // Set the active canvas node because the decorator needs to append its
        // box to the correct canvas
        _$activeCanvas = $( _grid.getActiveCanvasNode( e ) );

        var c = _$activeCanvas.offset();

        _rowOffset = 0;
        _columnOffset = 0;
        _isBottomCanvas = _$activeCanvas.hasClass( 'grid-canvas-bottom' );

        if ( _gridOptions.frozenRow > -1 && _isBottomCanvas ) {
            _rowOffset = ( _gridOptions.frozenBottom ) ? $('.grid-canvas-bottom').height() : $('.grid-canvas-top').height();
        }
        
        _isRightCanvas = _$activeCanvas.hasClass( 'grid-canvas-right' );
        
        if ( _gridOptions.frozenColumn > -1 && _isRightCanvas ) {
            _columnOffset = $('.grid-canvas-left').width();
        }
        
        //S-448253 : commit current edit to resolve double drag problem
        if(typeof Slick.GlobalEditorLock.commitCurrentEdit != 'undefined') {
          window.setTimeout(function(){
            Slick.GlobalEditorLock.commitCurrentEdit();
          },  0);
        }
              
        // prevent the grid from cancelling drag'n'drop by default
        e.stopImmediatePropagation();
    }

    function handleDragStart(e, dd) {
        var cell = _grid.getCellFromEvent(e);
        if (_self.onBeforeCellRangeSelected.notify(cell) !== false) {
            if (_grid.canCellBeSelected(cell.row, cell.cell)) {
                _dragging = true;
                e.stopImmediatePropagation();
            }
        }
        if (!_dragging) {
            return;
        }

      _grid.focus();
       


       // new code
       var start = _grid.getCellFromPoint(
                dd.startX - _$activeCanvas.offset().left + _columnOffset,
                dd.startY - _$activeCanvas.offset().top + _rowOffset);



        dd.range = {
            start: start,
            end: {}
        };

        return _decorator.show(new Slick.Range(start.row, start.cell));
   
        // old code
        //dd.range = {start: cell, end: {}};
        //return _decorator.show(new Slick.Range(cell.row, cell.cell));
    }

    function handleDrag(e, dd) {
        if (!_dragging) {
            return;
        }
        e.stopImmediatePropagation();

        var end = _grid.getCellFromPoint(
            e.pageX - _$activeCanvas.offset().left + _columnOffset,
            e.pageY - _$activeCanvas.offset().top + _rowOffset
        );

        if ( (!_grid.canCellBeSelected( end.row, end.cell ) )
        /** COMMENTED THESE CONDITIONS HOWEVER THESE MIGHT SUPPORT THE BUTTOM CANVAS: TODO: Come back to check if bottom canvas used
             || ( !_isRightCanvas && ( end.cell > _gridOptions.frozenColumn ) )
             || ( _isRightCanvas && ( end.cell <= _gridOptions.frozenColumn ) )
             || ( !_isBottomCanvas && ( end.row >= _gridOptions.frozenRow ) )
             || ( _isBottomCanvas && ( end.row < _gridOptions.frozenRow ) )**/
           ) {
            return;
        }

        dd.range.end = end;
        // RJ: 11/23: Scroll Row into view
        _grid.scrollRowIntoView(end.row);
        // scroll the viewport in case scroll bar is visible
        _grid.scrollCellIntoView(end.row, end.cell);
        _decorator.show(new Slick.Range(dd.range.start.row, dd.range.start.cell, end.row, end.cell));
    }

    function handleDragEnd(e, dd) {
      if (!_dragging) {
        return;
      }

      _dragging = false;
      e.stopImmediatePropagation();

      _decorator.hide();
      _self.onCellRangeSelected.notify({
        range: new Slick.Range(
            dd.range.start.row,
            dd.range.start.cell,
            dd.range.end.row,
            dd.range.end.cell
        )
      });
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,

      "onBeforeCellRangeSelected": new Slick.Event(),
      "onCellRangeSelected": new Slick.Event()
    });
  }
})(jQuery);


(function ($) {

	$.fn.exportToExcel = function (fileName,sheetName, data, options, afterExportCallback) {
        
		//actual data to be imported to excel
		var excelData = data;


        var rgbToHexForExcel_Color = function(color) {
             if(typeof color == 'undefined' || color == null || color == '' || color == 'transparent') return '00000000';  
            
             if (color.charAt(0) === "#") {
                return color.replace('#', '00');
             }
        
             color = color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
             
             color = (color && color.length === 4) ? "00" +
              ("0" + parseInt(color[1],10).toString(16)).slice(-2) +
              ("0" + parseInt(color[2],10).toString(16)).slice(-2) +
              ("0" + parseInt(color[3],10).toString(16)).slice(-2) : '';
            
             return color;
        };
        
        
        var rgbToHexForExcel_BgColor = function(color) {
            
            if(typeof color == 'undefined' || color == null || color == '' || color == 'transparent' || color == 'rgba(0, 0, 0, 0)') return '00ffffff';  
            
            if (color.charAt(0) === "#") {
                return color.replace('#', '00');
            }
            
            color = color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
            
            
            color = (color && color.length === 4) ? "00" +
              ("0" + parseInt(color[1],10).toString(16)).slice(-2) +
              ("0" + parseInt(color[2],10).toString(16)).slice(-2) +
              ("0" + parseInt(color[3],10).toString(16)).slice(-2) : '';
            
            return color;
        }; 


		//store the base 64 content to be returned
		var returnValue;
        require(['excel-builder'], function (EB, downloader) {
            
            //new excel workbook created
            var newWorkbook = EB.createWorkbook();

            //new worksheet created in the already created newWorsheet
            var newWorksheet = newWorkbook.createWorksheet({ name: sheetName });

            //new stylesheet for adding styles to the newworkbook
            var stylesheet = newWorkbook.getStyleSheet();


            //styles array to store header and cell styles
            var styles = new Array();

            	//if header style is defined by the user, then use that styles
            	if (options && options.headerStyle)
            		styles["headerstyle"] = stylesheet.createFormat(options.headerStyle);

            		//else use default styles
            	else {
            		styles["headerstyle"] = stylesheet.createFormat({
            			font: {
            				bold: true,
            				size: 12,
            				color: '00000000'
            			},
            			fill: {
            				type: 'pattern',
            				patternType: 'solid',
            				fgColor: '00ffffff'
            			}
            		});
            	}

            	//if cell style is defined by the user, then use that styles
            	if (options && options.cellStyles)
            		styles["cellstyles"] = stylesheet.createFormat(options.cellStyle);

            		//else use default styles
            	else {
            		styles["cellstyles"] = stylesheet.createFormat({
            			font: {
            				bold: false,
            				size: 12,
            				color: '00000000'
            			},
            			fill: {
            				type: 'pattern',
            				patternType: 'solid',
            				fgColor: '00ffffff'
            			}
            		});
            	}

           

        	//Write the headers of the slick grid values into excel
            function writeHeaders() {
            	//frozen column support
            	var headers = []; 
            	
            	for(var _indx = 0; _indx < columnArr.length; _indx++){
            		headers.push({ value: columnArr[_indx], metadata: { style: styles["headerstyle"].id } });
            		
            	}
            	newWorksheet.data.push(headers);
            	return headers;
            };

        	//write the cell values of each rows in to the excel
            function writeCell(headers) {
            	
                var data = excelData;
                //console.log(data);
            	for(var indx = 0; indx < data.getLength(); indx++){
          		  var row = data.getItem(indx);
          		  var rowData = [];
          		  for(var jindx in row){
          			  //console.log(row[jindx]);
          			  try{
          			     rowData.push({ value: row[jindx], metadata: { style: styles["cellstyles"].id }});
          			  }catch(ex){console.log(ex);}
          		  }
          		  newWorksheet.data.push(rowData);
          		  
          		  rowData = null;
          	    }
            	
            	rowData = null;
            	data = null;
            	excelData = null;

            	
            };
                
        	//iniate the write Excel function
            var headers = writeHeaders();
            writeCell(headers);
            

            

            
           
            
          //downloader method to add the excel file as base 64 
            var downloader = function (filename, value) {
                
                //add the download and href attributes to the excel file download trigeer button
            	$("#downloadLink").attr({
                    download: filename,
                    href: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + value
            	});

            	//store the base 64 content to be returned
            	returnValue = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + value;
            };
            
            
        	
            //add the created worksheet to the new workbook
            newWorkbook.addWorksheet(newWorksheet);

            
            
            console.log(newWorksheet);
            //create the excel file
            var data = EB.createFile(newWorkbook);

            console.log('do i crash');
            
            //call the downloader method with the parameteres, 1.Name of the Excel file to be downloaded, 2.Created Excel File
            //downloader(fileName, data);

            //iniate the callback function
            //if (afterExportCallback)
            	//afterExportCallback(returnValue);
            	
            	
        });
    };

}(jQuery));

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellExternalCopyManager": CellExternalCopyManager
    }
  });


  function CellExternalCopyManager(options) {
    /*
      This manager enables users to copy/paste data from/to an external Spreadsheet application
      such as MS-Excel� or OpenOffice-Spreadsheet.
      
      Since it is not possible to access directly the clipboard in javascript, the plugin uses
      a trick to do it's job. After detecting the keystroke, we dynamically create a textarea
      where the browser copies/pastes the serialized data. 
      
      options:
        copiedCellStyle : sets the css className used for copied cells. default : "copied"
        copiedCellStyleLayerKey : sets the layer key for setting css values of copied cells. default : "copy-manager"
        dataItemColumnValueExtractor : option to specify a custom column value extractor function
        dataItemColumnValueSetter : option to specify a custom column value setter function
        clipboardCommandHandler : option to specify a custom handler for paste actions
        includeHeaderWhenCopying : set to true and the plugin will take the name property from each column (which is usually what appears in your header) and put that as the first row of the text that's copied to the clipboard
        bodyElement: option to specify a custom DOM element which to will be added the hidden textbox. It's useful if the grid is inside a modal dialog.
        onCopyInit: optional handler to run when copy action initializes
        onCopySuccess: optional handler to run when copy action is complete
    */
    var _grid;
    var _self = this;
    var _copiedRanges;
    var _options = options || {};
    var _copiedCellStyleLayerKey = _options.copiedCellStyleLayerKey || "copy-manager";
    var _copiedCellStyle = _options.copiedCellStyle || "copied";
    var _clearCopyTI = 0;
    var _bodyElement = _options.bodyElement || document.body;
    var _onCopyInit = _options.onCopyInit || null;
    var _onCopySuccess = _options.onCopySuccess || null;
    var _scrollInterval;
    
    var keyCodes = {
      'C': 67,
      'V': 86,
      'ESC': 27,
      'INSERT': 45
    };

    function init(grid) {
	  _grid = grid;
      _grid.onKeyDown.subscribe(handleKeyDown);
      
      // we need a cell selection model
      var cellSelectionModel = grid.getSelectionModel();
      if (!cellSelectionModel){
        throw new Error("Selection model is mandatory for this plugin. Please set a selection model on the grid before adding this plugin: grid.setSelectionModel(new Slick.CellSelectionModel())");
      }
      // we give focus on the grid when a selection is done on it.
      // without this, if the user selects a range of cell without giving focus on a particular cell, the grid doesn't get the focus and key stroke handles (ctrl+c) don't work
      //cellSelectionModel.onSelectedRangesChanged.subscribe(function(e, args){
      //  _grid.focus();
     // });
    }

    function destroy() {
      _grid.onKeyDown.unsubscribe(handleKeyDown);
    }
    
    function getDataItemValueForColumn(item, columnDef) {
      if (_options.dataItemColumnValueExtractor) {
        var dataItemColumnValueExtractorValue = _options.dataItemColumnValueExtractor(item, columnDef);

        if (dataItemColumnValueExtractorValue)
          return dataItemColumnValueExtractorValue;
      }

      var retVal = '';
      //console.log(columnDef.editor); 
      // if a custom getter is not defined, we call serializeValue of the editor to serialize
      if (columnDef.editor){
        var editorArgs = {
          'container':$("<p>"),  // a dummy container
          'column':columnDef,
          'position':{'top':0, 'left':0},  // a dummy position required by some editors
          'grid':_grid
        };
        var editor = new columnDef.editor(editorArgs);
        editor.loadValue(item);
        retVal = editor.serializeValue();
        editor.destroy();
      }
      else {
        retVal = item[columnDef.field];
      }
      return retVal;
    }
    
    function setDataItemValueForColumn(item, columnDef, value) {
      if (_options.dataItemColumnValueSetter) {
        return _options.dataItemColumnValueSetter(item, columnDef, value);
      }

      // if a custom setter is not defined, we call applyValue of the editor to unserialize
      if (columnDef.editor){
        var editorArgs = {
          'container':$("body"),  // a dummy container
          'column':columnDef,
          'position':{'top':0, 'left':0},  // a dummy position required by some editors
          'grid':_grid
        };
        var editor = new columnDef.editor(editorArgs);
        editor.loadValue(item);
        editor.applyValue(item, value);
        editor.destroy();
      }
    }
    
    
    function _createTextBox(innerText){
      var ta = document.createElement('textarea');
      var windowScrollTopPosition = $(window).scrollTop();
      
      ta.style.position = 'absolute';
      ta.style.left = '-1000px'; 
      ta.style.top = '0px';
      ta.style.zIndex = '-99999';
      
      ta.value = innerText;
      _bodyElement.appendChild(ta); 
      
      ta.select();
      
      ta.focus();
      
      var adjustScrollingPosition = function(){
          // clear the interval when window scroll matches the origin one
          if($(window).scrollTop() == windowScrollTopPosition){
            if(_scrollInterval) window.clearInterval(_scrollInterval);
          }  
          // set the scroll top
          $(window).scrollTop(windowScrollTopPosition); 
      }
      // clear the interval if that already exists
      if(_scrollInterval) window.clearInterval(_scrollInterval);
      // set the interval again for new operation
      _scrollInterval = window.setInterval(adjustScrollingPosition, 150);
      
      return ta;
    }
    
    function _decodeTabularData(_grid, ta){
      var columns = _grid.getColumns();

      var clipText = ta.value;
      
	  if (typeof(Storage) !== 'undefined' && clipText != null && typeof clipText != 'undefined') {
        // Store
        if(sessionStorage.getItem("clipText") != null && clipText.replace(/[\n\f\r]/g, '').trim() === sessionStorage.getItem("clipText").replace(/[\n\f\r]/g, '').trim()){
            sessionStorage.setItem("isSameText", "true");
        }
        else{
            sessionStorage.setItem("isSameText", "false");
        }
      }
      // below line support when pasting from excel;
      // from excel you always get trailing new line charater 
      clipText = clipText.replace(/[\n\f\r]$/, '');
      
      var clipRows = clipText.split(/[\n\f\r]/);
      //console.log(clipRows);
      var clippedRange = [];
      _bodyElement.removeChild(ta);
      
      for (var i = 0; i < clipRows.length; i++) {
        if (clipRows[i] != "")
          clippedRange[i] = clipRows[i].split("\t");
        else
          clippedRange[i] = [""];
      }
      var selectedCell = _grid.getActiveCell();
      var ranges = _grid.getSelectionModel().getSelectedRanges();
      var selectedRange = ranges && ranges.length ? ranges[0] : null;   // pick only one selection
      var activeRow = null;
      var activeCell = null;
      
      if (selectedRange){
        activeRow = selectedRange.fromRow;
        activeCell = selectedRange.fromCell;
      } else if (selectedCell){
        activeRow = selectedCell.row;
        activeCell = selectedCell.cell;
      } else {
        // we don't know where to paste
        return;
      }
      
      var oneCellToMultiple = false;
      var destH = clippedRange.length;
      var destW = clippedRange.length ? clippedRange[0].length : 0;
      if (clippedRange.length == 1 && clippedRange[0].length == 1 && selectedRange){
        oneCellToMultiple = true;
        destH = selectedRange.toRow - selectedRange.fromRow + 1;
        destW = selectedRange.toCell - selectedRange.fromCell + 1;
      }
      var availableRows = _grid.getData().length - activeRow;
      var addRows = 0;
      
      /**
      if(availableRows < destH)
      {
        var d = _grid.getData();
        for(addRows = 1; addRows <= destH - availableRows; addRows++)
          d.push({});
        _grid.setData(d);
        _grid.render();
      }
      **/
      var clipCommand = {

        isClipboardCommand: true,
        clippedRange: clippedRange,
        oldValues: [],
        cellExternalCopyManager: _self,
        _options: _options,
        setDataItemValueForColumn: setDataItemValueForColumn,
        markCopySelection: markCopySelection,
        oneCellToMultiple: oneCellToMultiple,
        activeRow: activeRow,
        activeCell: activeCell,
        destH: destH,
        destW: destW,
        desty: activeRow,
        destx: activeCell,
        maxDestY: _grid.getDataLength(),
        maxDestX: _grid.getColumns().length,
        h: 0,
        w: 0,
          
        execute: function() {
          this.h = 0;
          for (var y = 0; y < destH; y++){
            this.oldValues[y] = [];
            this.w = 0;
            this.h++;
            for (var x = 0; x < destW; x++){
              this.w++;
              var desty = activeRow + y;
              var destx = activeCell + x;
              
              if (desty < this.maxDestY && destx < this.maxDestX ) {
                var nd = _grid.getCellNode(desty, destx);
                var dt = _grid.getDataItem(desty);
                this.oldValues[y][x] = dt[columns[destx]['id']];
                
                if (oneCellToMultiple)
                  this.setDataItemValueForColumn(dt, columns[destx], clippedRange[0][0]);
                else{
                  //console.log(dt.id);
                  //console.log(dt + ',' + columns[destx] + ',' + clippedRange[y] + '?' + clippedRange[y][x] + ':' + '');
                  if(typeof dt.id != 'undefined') this.setDataItemValueForColumn(dt, columns[destx], clippedRange[y] ? clippedRange[y][x] : '');
                }
                _grid.updateCell(desty, destx);
              }
            }
          }
          
          var bRange = {
            'fromCell': activeCell,
            'fromRow': activeRow,
            'toCell': activeCell + this.w - 1,
            'toRow': activeRow + this.h - 1
          }



          this.markCopySelection([bRange]);
          _grid.getSelectionModel().setSelectedRanges([bRange]);


		if (typeof(Storage) !== 'undefined' && (typeof _copiedRanges != 'undefined' || _copiedRanges == null) && sessionStorage.getItem("_copiedRanges") != null) {
                // Store
                _copiedRanges = JSON.parse(sessionStorage.getItem("_copiedRanges"));
          }
          this.cellExternalCopyManager.onPasteCells.notify({ranges: [bRange], clippedRange: clippedRange, oneCellToMultiple : oneCellToMultiple, copiedRanges : _copiedRanges});
        },

        undo: function() {
          for (var y = 0; y < destH; y++){
            for (var x = 0; x < destW; x++){
              var desty = activeRow + y;
              var destx = activeCell + x;
              
              if (desty < this.maxDestY && destx < this.maxDestX ) {
                var nd = _grid.getCellNode(desty, destx);
                var dt = _grid.getDataItem(desty);
                if (oneCellToMultiple)
                  this.setDataItemValueForColumn(dt, columns[destx], this.oldValues[0][0]);
                else
                  this.setDataItemValueForColumn(dt, columns[destx], this.oldValues[y][x]);
                _grid.updateCell(desty, destx);
                _grid.onCellChange.notify({
                    row: desty,
                    cell: destx,
                    item: dt,
                    grid: _grid
                });
              }
            }
          }
          
          var bRange = {
            'fromCell': activeCell,
            'fromRow': activeRow,
            'toCell': activeCell+this.w-1,
            'toRow': activeRow+this.h-1
          }

          this.markCopySelection([bRange]);
          _grid.getSelectionModel().setSelectedRanges([bRange]);
          this.cellExternalCopyManager.onPasteCells.notify({ranges: [bRange], clippedRange: clippedRange, oneCellToMultiple : oneCellToMultiple, copiedRanges : _copiedRanges});
          
          if(addRows > 1){            
            var d = _grid.getData();
            for(; addRows > 1; addRows--)
              d.splice(d.length - 1, 1);
            _grid.setData(d);
            _grid.render();
          }
        }
      };

      if(_options.clipboardCommandHandler) {
        _options.clipboardCommandHandler(clipCommand);
      }
      else {
        clipCommand.execute();
      }
    }
    
    
    function handleKeyDown(e, args) {
      var ranges;
      if (!_grid.getEditorLock().isActive() || _grid.getOptions().autoEdit) {
        if (e.which == keyCodes.ESC) {
          if (_copiedRanges) {
            e.preventDefault();
            clearCopySelection();
            _self.onCopyCancelled.notify({ranges: _copiedRanges});
            _copiedRanges = null;
          }
        }

        if ((e.which === keyCodes.C || e.which === keyCodes.INSERT) && (e.ctrlKey || e.metaKey) && !e.shiftKey) {    // CTRL+C or CTRL+INS
          if (_onCopyInit) {
            _onCopyInit.call();
          }
          ranges = _grid.getSelectionModel().getSelectedRanges();
          if (ranges.length != 0) {
            _copiedRanges = ranges;
			if (typeof(Storage) !== 'undefined' && _copiedRanges != null && typeof _copiedRanges != 'undefined') {
                // Store
                sessionStorage.setItem("_copiedRanges", JSON.stringify(_copiedRanges));
            }
            markCopySelection(ranges);
            _self.onCopyCells.notify({ranges: ranges});
            
            var columns = _grid.getColumns();
            var clipText = "";




            for (var rg = 0; rg < ranges.length; rg++){
                var range = ranges[rg];
                var clipTextRows = [];
                for (var i = range.fromRow; i < range.toRow + 1 ; i++){
                    var clipTextCells = [];
                    var dt = _grid.getDataItem(i);
                    
                    if (clipTextRows == "" && _options.includeHeaderWhenCopying) {
                        var clipTextHeaders = [];
                        for (var j = range.fromCell; j < range.toCell + 1 ; j++) {

                            if (columns[j].name.length > 0)
                                clipTextHeaders.push(columns[j].name);
                        }
                        clipTextRows.push(clipTextHeaders.join("\t"));
                    }


					var column;
                    var prevCellText;
                    var cCode;
                    for (var j = range.fromCell; j < range.toCell + 1 ; j++){
						column = j;

						
						prevCellText = getDataItemValueForColumn(dt, columns[j]);
                        
                        clipTextCells.push(prevCellText);
                    }

					/**if(typeof data[i] != 'undefined' && 
                        typeof data[i].id != 'undefined' && 
                        typeof Timeline.fixedRowsTypes[data[i].id.toLowerCase()] != 'undefined'){
                    
                        for(var cellValue = column + 1; cellValue <= columns.length - 1; cellValue++) {
                            var cellText = getDataItemValueForColumn(dt, columns[cellValue]);
                            if(cellText != '' && cellText == prevCellText) {
                                clipTextCells.push(cellText);
                            } else {
                                break;
                            }
                        }
                    }**/

                    clipTextRows.push(clipTextCells.join("\t"));
                }
                clipText += clipTextRows.join("\r\n") + "\r\n";

            }
            console.log(clipText);
            if(window.clipboardData) {

                window.clipboardData.setData("Text", clipText);
                if (typeof(Storage) !== 'undefined' && clipText != null && typeof clipText != 'undefined') {
                    // Store
                    sessionStorage.setItem("clipText", clipText.trim());
                }
                return true;
            }
            else {
                var $focus = $(_grid.getActiveCellNode());
                var ta = _createTextBox(clipText);

				if (typeof(Storage) !== 'undefined' && clipText != null && typeof clipText != 'undefined') {
                    // Store
                    sessionStorage.setItem("clipText", clipText.trim());
                }

                setTimeout(function(){
                     _bodyElement.removeChild(ta);
                    // restore focus
                    if ($focus && $focus.length>0) {
                        $focus.attr('tabIndex', '-1');
                        $focus.focus();
                        $focus.removeAttr('tabIndex');
                    }
                }, 150);

                if (_onCopySuccess) {
                    var rowCount = 0;
                    // If it's cell selection, use the toRow/fromRow fields
                    if (ranges.length === 1) {
                        rowCount = (ranges[0].toRow + 1) - ranges[0].fromRow;
                    }
                    else {
                        rowCount = ranges.length;
                    }
                    _onCopySuccess.call(this, rowCount);
                }

                return false;
            }
          }
        }

        if ((e.which === keyCodes.V && (e.ctrlKey || e.metaKey) && !e.shiftKey || (e.which === keyCodes.INSERT && e.shiftKey && !e.ctrlKey))) {    // CTRL+V or Shift+INS
            var ta = _createTextBox('');
            
            setTimeout(function(){
                _decodeTabularData(_grid, ta);
            }, 100);
            
            return false;
        }
      }
    }

    function markCopySelection(ranges) {

      clearCopySelection();
      
      var columns = _grid.getColumns();
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          hash[j] = {};
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell && k < columns.length; k++) {
            hash[j][columns[k].id] = _copiedCellStyle;
          }
        }
      }
      _grid.setCellCssStyles(_copiedCellStyleLayerKey, hash);
      clearTimeout(_clearCopyTI);
      _clearCopyTI = setTimeout(function(){
        _self.clearCopySelection();
      }, 2000);
    }

    function clearCopySelection() {
      _grid.removeCellCssStyles(_copiedCellStyleLayerKey);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "clearCopySelection": clearCopySelection,
      "handleKeyDown":handleKeyDown,
      
      "onCopyCells": new Slick.Event(),
      "onCopyCancelled": new Slick.Event(),
      "onPasteCells": new Slick.Event()
    });
  }
})(jQuery);

(function ($) {
	  // register namespace
	  $.extend(true, window, {
	    "Slick": {
	      "Plugins": {
	        "HeaderMenu": HeaderMenu
	      }
	    }
	  });

	  function HeaderMenu(options) {
	    var _grid;
	    var _self = this;
	    var _handler = new Slick.EventHandler();
	    var _defaults = {
	      buttonCssClass: null,
	      buttonImage: null
	    };
	    var $menu;
	    var $activeHeaderColumn;


	    function init(grid) {
	      options = $.extend(true, {}, _defaults, options);
	      _grid = grid;
	      _handler
	        .subscribe(_grid.onHeaderCellRendered, handleHeaderCellRendered)
	        .subscribe(_grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy);

	      // Force the grid to re-render the header now that the events are hooked up.
	      _grid.setColumns(_grid.getColumns());

	      // Hide the menu on outside click.
	      $(document.body).bind("mousedown", handleBodyMouseDown);
	    }


	    function destroy() {
	      _handler.unsubscribeAll();
	      $(document.body).unbind("mousedown", handleBodyMouseDown);
	    }


	    function handleBodyMouseDown(e) {
	      if ($menu && $menu[0] != e.target && !$.contains($menu[0], e.target)) {
	        hideMenu();
	      }
	    }


	    function hideMenu() {
	      if ($menu) {
	        $menu.remove();
	        $menu = null;
	        $activeHeaderColumn
	          .removeClass("slick-header-column-active");
	      }
	    }

	    function handleHeaderCellRendered(e, args) {
	      var column = args.column;
	      var menu = column.header && column.header.menu;

	      if (menu) {
	        var $el = $("<div></div>")
	          .addClass("slick-header-menubutton")
	          .data("column", column)
	          .data("menu", menu);

	        if (options.buttonCssClass) {
	          $el.addClass(options.buttonCssClass);
	        }

	        if (options.buttonImage) {
	          $el.css("background-image", "url(" + options.buttonImage + ")");
	        }

	        if (menu.tooltip) {
	          $el.attr("title", menu.tooltip);
	        }

	        $el
	          .bind("click", showMenu)
	          .appendTo(args.node);
	      }
	    }


	    function handleBeforeHeaderCellDestroy(e, args) {
	      var column = args.column;

	      if (column.header && column.header.menu) {
	        $(args.node).find(".slick-header-menubutton").remove();
	      }
	    }


	    function showMenu(e) {
	      var $menuButton = $(this);
	      var menu = $menuButton.data("menu");
	      var columnDef = $menuButton.data("column");

	      // Let the user modify the menu or cancel altogether,
	      // or provide alternative menu implementation.
	      if (_self.onBeforeMenuShow.notify({
	          "grid": _grid,
	          "column": columnDef,
	          "menu": menu
	        }, e, _self) == false) {
	        return;
	      }


	      if (!$menu) {
	        $menu = $("<div class='slick-header-menu'></div>")
	          .appendTo(_grid.getContainerNode());
	      }
	      $menu.empty();


	      // Construct the menu items.
	      for (var i = 0; i < menu.items.length; i++) {
	        var item = menu.items[i];

	        var $li = $("<div class='slick-header-menuitem'></div>")
	          .data("command", item.command || '')
	          .data("column", columnDef)
	          .data("item", item)
	          .bind("click", handleMenuItemClick)
	          .appendTo($menu);

	        if (item.disabled) {
	          $li.addClass("slick-header-menuitem-disabled");
	        }

	        if (item.tooltip) {
	          $li.attr("title", item.tooltip);
	        }

	        var $icon = $("<div class='slick-header-menuicon'></div>")
	          .appendTo($li);

	        if (item.iconCssClass) {
	          $icon.addClass(item.iconCssClass);
	        }

	        if (item.iconImage) {
	          $icon.css("background-image", "url(" + item.iconImage + ")");
	        }

	        $("<span class='slick-header-menucontent'></span>")
	          .text(item.title)
	          .appendTo($li);
	      }


	     
	      //RJ: Added the conditional setting for offset of $menu to make this appear
	      var gridWidth = $menu.parent().width();
	      var menuWidth = $(this).offset().left + $menu.width();
	      
	      if(menuWidth < gridWidth){
	          // Position the menu.
	          $menu
	            .offset({ top: $(this).offset().top + $(this).height(), left: $(this).offset().left });
	      }else{
	          // Position the menu.
	          $menu
	            .offset({ top: $(this).offset().top + $(this).height(), left: ($(this).offset().left + $(this).width()) - $menu.width() });
	      }
	      
	      // Code in Past; Modified above 8 - 10 lines 
	      //$menu.offset({ top: $(this).offset().top + $(this).height(), left: $(this).offset().left });

	      // Mark the header as active to keep the highlighting.
	      $activeHeaderColumn = $menuButton.closest(".slick-header-column");
	      $activeHeaderColumn
	        .addClass("slick-header-column-active");

	      // Stop propagation so that it doesn't register as a header click event.
	      e.preventDefault();
	      e.stopPropagation();
	    }


	    function handleMenuItemClick(e) {
	      var command = $(this).data("command");
	      var columnDef = $(this).data("column");
	      var item = $(this).data("item");

	      if (item.disabled) {
	        return;
	      }

	      hideMenu();

	      if (command != null && command != '') {
	        _self.onCommand.notify({
	            "grid": _grid,
	            "column": columnDef,
	            "command": command,
	            "item": item
	          }, e, _self);
	      }

	      // Stop propagation so that it doesn't register as a header click event.
	      e.preventDefault();
	      e.stopPropagation();
	    }

	    $.extend(this, {
	      "init": init,
	      "destroy": destroy,

	      "onBeforeMenuShow": new Slick.Event(),
	      "onCommand": new Slick.Event()
	    });
	  }
	})(jQuery);


	jQuery.fn.center = function () {
	    this.css("position","absolute");
	    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
	                                                $(window).scrollTop()) + "px");
	    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
	                                                $(window).scrollLeft()) + "px");
	    return this;
	}