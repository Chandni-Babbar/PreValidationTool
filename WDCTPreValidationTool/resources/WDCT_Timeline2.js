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
            				color: '00ffffff'
            			},
            			fill: {
            				type: 'pattern',
            				patternType: 'solid',
            				fgColor: '00428BCA'
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

            	
                $.each(grid.getColumns(), function(indx1, colItem) {
                  headers.push({ value: (typeof colItem != 'undefined' && typeof colItem.name != 'undefined' ? colItem.name : ''), metadata: { style: styles["headerstyle"].id } });
                });
            	
            	//push the headers in to excel
            	newWorksheet.data.push(headers);
                
            	return headers;
            };

        	//write the cell values of each rows in to the excel
            function writeCell(headers) {
              
                
                var gridData = grid.getData();
                
                $.each(gridData, function(indx2, dataItem) {
                    var rowData = [];
                    var prev_cell;
                    
                    $.each(grid.getColumns(), function(indx1, colItem) {
                       var cell = grid.getCellNode(indx2, indx1);
                       
                       if(typeof cell != 'undefined'){ 
                           
                           var metaformat = {
                                        			font: { 
                                        				bold: false,
                                        				size: 12,
                                        				color: rgbToHexForExcel_Color((
                                                                        				    cell.css('color') == 'transparent' || cell.css('color') == '' ? 
                                                                        				    cell.parent('.slick-row').css('color') : 
                                                                        				    cell.css('color')))
                                        			}, 
                                        			fill: {
                                        				type: 'pattern',
                                        				patternType: 'solid',
                                        				fgColor: rgbToHexForExcel_BgColor((
                                                                        				    cell.css('background-color') == 'transparent' || cell.css('background-color') == '' ? 
                                                                        				    cell.parent('.slick-row').css('background-color') : 
                                                                        				    cell.css('background-color')))
                                        			},
                                        			alignment: {
                                                        horizontal: cell.css('text-align')
                                                    }
                                       		};
                               
                             
                             // 10/28/2016: RJ: To resolve issue of showing numbers as text in exported excel; need to typecast text to number;
                             var cellValue = (cell.find('div').length ? cell.find('div').text() : cell.text());
                             cellValue = cellValue.removeCommaFrmt();
                             cellValue = isNaN(parseInt(cellValue)) ? cellValue : parseInt(cellValue);
                             rowData.push({ value: cellValue, metadata: { style: stylesheet.createFormat(metaformat).id }});
                             // old code: commented for reference purpose; TODO: remove after some releases
                             //rowData.push({ value: (cell.find('div').length ? cell.find('div').text() : cell.text()), metadata: { style: stylesheet.createFormat(metaformat).id }});
                                


                             prev_cell = cell;  
                       }else if(typeof prev_cell != 'undefined'){
                           rowData.push({ value: '', metadata: { style: stylesheet.createFormat({
                                    			font: { 
                                    				bold: false,
                                    				size: 12,
                                    				color: rgbToHexForExcel_Color((
                                                                    				    prev_cell.css('color') == 'transparent' || prev_cell.css('color') == '' ? 
                                                                    				    prev_cell.parent('.slick-row').css('color') : 
                                                                    				    prev_cell.css('color')))
                                    			}, 
                                    			fill: {
                                    				type: 'pattern',
                                    				patternType: 'solid',
                                    				fgColor: rgbToHexForExcel_BgColor((
                                                                    				    prev_cell.css('background-color') == 'transparent' || prev_cell.css('background-color') == '' ? 
                                                                    				    prev_cell.parent('.slick-row').css('background-color') : 
                                                                    				    prev_cell.css('background-color')))
                                    			},
                                    			alignment: {
                                                    horizontal: prev_cell.css('text-align')
                                                }
                                    			
                                    		}).id } });
                           
                       }
                       
                    });
                    
                    newWorksheet.data.push(rowData);
                });
            	

            	
            };
                
        	//iniate the write Excel function
            var headers = writeHeaders();
            writeCell(headers);
            



            //set column width for each column in excel
            newWorksheet.setColumns([
                    { width: 30 },
                    { width: 20, hidden: false }, //enable hidden if that column needs to be hidden in the excel file
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 },
            ]);


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

            //create the excel file
            var data = EB.createFile(newWorkbook);

            //call the downloader method with the parameteres, 1.Name of the Excel file to be downloaded, 2.Created Excel File
            downloader(fileName, data);

            //iniate the callback function
            if (afterExportCallback)
            	afterExportCallback(returnValue);
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
                        if(typeof data[i] != 'undefined' && 
                            typeof data[i].id != 'undefined' && 
                            typeof Timeline.fixedRowsTypes[data[i].id.toLowerCase()] != 'undefined'){
                            
                            //var meta_info = Timeline.fixedRowsTypes[rowId];
                            //var colorCodePostFix = meta_info.colorcodepostfix;
                            //var cCode = '';
                            //if(typeof data[args.row][columns[column].field + colorCodePostFix] != 'undefined'){
                              // cCode = data[args.row][columns[column].field + colorCodePostFix];
                            //}    
                        }
                        clipTextCells.push(prevCellText);
                    }

					if(typeof data[i] != 'undefined' && 
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
                    }

                    clipTextRows.push(clipTextCells.join("\t"));
                }
                clipText += clipTextRows.join("\r\n") + "\r\n";

            }
            
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

Number.prototype.toCommaFrmt = function(){
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
String.prototype.toCommaFrmt = function(){
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

Number.prototype.removeCommaFrmt = function(){
    return this.toString().replace(/\,/g,'');
}
String.prototype.removeCommaFrmt = function(){
    return this.replace(/\,/g,'');
}

Date.prototype.startOfWeek = function(pStartOfWeek) {
    var mDifference = this.getDay() - pStartOfWeek;

    if (mDifference < 0) {
        mDifference += 7;
    }

    return new Date(this.addDays(mDifference * -1));
}

Date.prototype.addDays = function(pDays) {
    var mDate = new Date(this.valueOf());
    mDate.setDate(mDate.getDate() + pDays);
    return mDate;
}

Date.prototype.toYYYYMMDD = function() {
    var d = new Date(this.valueOf()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}




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


function SkillEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-text' />");
      
      // return when the row is phase or milestone or any fixed row
      if(typeof args.item.id == 'undefined' || typeof Timeline.fixedRowsTypes[args.item.id] != 'undefined') return;
      
          $input.appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
    };

    this.destroy = function () {
      $input.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.getValue = function () {
      return $input.val();
    };

    this.setValue = function (val) {
      $input.val(val);
    };

    this.loadValue = function (item) {
      defaultValue = item[args.column.field] || "";
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      if (args.column.validator) {
        var validationResults = args.column.validator($input.val());
        if (!validationResults.valid) {
          return validationResults;
        }
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }



function MilestoneEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-text' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
    };

    this.destroy = function () {
      $input.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.getValue = function () {
      return $input.val();
    };

    this.setValue = function (val) {
      $input.val(val);
    };

    this.loadValue = function (item) {
      defaultValue = item[args.column.field] || "";
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
     return {
        valid: true,
        msg: null
      };
    };

    this.init();
}

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



var data = [];
var columns = [];
var loadingIndicator = null;
var grid;
var WEBSERVICE_NAME = "E2_TimelineWS";


var loadSpinner = {
    client_id : '#loadingSpinner',
    
    show: function(){
        $(loadSpinner.client_id).show().css('height', $(document).outerHeight()).css('z-index', 99999);
    },
    
    hide: function(){
        $(loadSpinner.client_id).hide();
    }
}



var CustomAlert = {
    notifyContainerCssSelector: '.slds-notify_container',
    notifyCloseCssSelector: '.slds-notify__close',
    notifyMsgCssSelector: '.slds-text-heading--small',
    notifyTypeCssDiv: '#sldsalertdiv',
    notifyEditContainer: '.slds-edit-alert',
    notifyEditContainerbackdrop: '.slds-edit-alert-backdrop',
    showIsDirtyWarning: function() {
        $(CustomAlert.notifyEditContainerbackdrop).show().css('height', $(document).outerHeight());
        $(CustomAlert.notifyEditContainer).show();
    },
    hideIsDirtyWarning: function() {
        $(CustomAlert.notifyEditContainer).hide();
        $(CustomAlert.notifyEditContainerbackdrop).hide();
    },
    show: function(msg) {
        $(CustomAlert.notifyContainerCssSelector).css({
            position: 'absolute !important',
            'opacity': '100',
            'display': 'block'
        });
        $(CustomAlert.notifyTypeCssDiv).removeClass("slds-theme--error");
        $(CustomAlert.notifyTypeCssDiv).addClass("slds-theme--success");
        $(CustomAlert.notifyContainerCssSelector).find(CustomAlert.notifyMsgCssSelector).text(msg);
        $(CustomAlert.notifyContainerCssSelector).find(CustomAlert.notifyCloseCssSelector).unbind("click");
        $(CustomAlert.notifyContainerCssSelector).find(CustomAlert.notifyCloseCssSelector).bind("click", function() {
            $(CustomAlert.notifyContainerCssSelector).stop(true, true).fadeTo().slideUp();
            return false;
        });
        window.setTimeout(function() {
            if ($(CustomAlert.notifyContainerCssSelector).is(":visible")) {
                $(CustomAlert.notifyContainerCssSelector).fadeTo(500, 0).slideUp(500, function() {
                    $(this).hide();
                });
            }
        }, 2000);
    },
    hide: function() {
        $(CustomAlert.notifyContainerCssSelector).hide();
    },
    showError: function(msg) {
        $(CustomAlert.notifyContainerCssSelector).css({
            position: 'absolute !important',
            'opacity': '100',
            'display': 'block'
        });
        $(CustomAlert.notifyTypeCssDiv).removeClass("slds-theme--success");
        $(CustomAlert.notifyTypeCssDiv).addClass("slds-theme--error");
        $(CustomAlert.notifyContainerCssSelector).find(CustomAlert.notifyMsgCssSelector).text(msg);
        $(CustomAlert.notifyContainerCssSelector).find(CustomAlert.notifyCloseCssSelector).unbind("click");
        $(CustomAlert.notifyContainerCssSelector).find(CustomAlert.notifyCloseCssSelector).bind("click", function() {
            $(CustomAlert.notifyContainerCssSelector).stop(true, true).fadeTo().slideUp();
            return false;
        });
        window.setTimeout(function() {
            if ($(CustomAlert.notifyContainerCssSelector).is(":visible")) {
                $(CustomAlert.notifyContainerCssSelector).fadeTo(500, 0).slideUp(500, function() {
                    $(this).hide();
                });
            }
        }, 2000);
    }
}

var makeManageRateCardsCollapsible = function(){
    $('#manageratecardtable tbody tr.header').click(function(){
         
         loadSpinner.show();
         var that = $(this);
         setTimeout(function(){
            that.toggleClass('expand').siblings('tr.' + that.attr('childCss')).toggle("slow", function() {
              loadSpinner.hide();
            });  
         }, 50);
         
         
         
    });
}

function preventEnterSubmit(e) {
    if (e.which == 13) {
        var $targ = $(e.target);

        if (!$targ.is("textarea") && !$targ.is(":button,:submit")) {
            var focusNext = false;
            $(this).find(":input:visible:not([disabled],[readonly]), a").each(function(){
                if (this === e.target) {
                    focusNext = true;
                }
                else if (focusNext){
                    $(this).focus();
                    return false;
                }
            });

            return false;
        }
    }
}



// On DOM Ready
$(function() {
	
	
	/**
    // Bind the window resize event to adjust the with of all the iframes with the resized 
    // width of the window
    // on screen for good user experience
    $( window ).resize(function() {
        Timeline.resizeGrid();
    });
    

    applyNumericValidation();
    TimelineSummary.applyNumericValidation();
    makeManageRateCardsCollapsible();
    tabpanel.bindEvents();
    tabpanel.showTimelineTab();
    Timeline.resizeGrid();
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
    // document click event to save chnages in grid when moved outside gird : 	I-232609
    $(document).click(function(e) {
        if (e.target.id != "myDiv" && !$(e.target).parents("#myDiv").size()) { 
             Slick.GlobalEditorLock.commitCurrentEdit();
        }
        
        if(parent&&parent.TimelineSummary&&typeof parent.TimelineSummary.hideTimelineListMenu != 'undefined'){
            parent.TimelineSummary.hideTimelineListMenu();
        }
        
        if(parent&&parent.TimelineSummary&&typeof parent.TimelineSummary.updateTimelineName != 'undefined'){
            parent.TimelineSummary.updateTimelineName();
        }
        
    });
    
    // bind the data picker controller with the input field for date.
    $("#datepicker").datepicker(datepickerOptions);
    $("#contextMenu").click(Timeline.contextMenuClickHandler);
   // Code for enablePhaseContextMenu : Rohit
    for(var _a in renderOptions_Phases){
        $("#phaseContextMenu").append('<span><button id="phase_btn" onclick="return false;" colorCode="' + renderOptions_Phases[_a] + '" data="' + _a + '" style="width:95%;color:' + 
                                    (renderOptions_Phases[_a] == '' ? '#000000' : '#ffffff') + ';background:' + renderOptions_Phases[_a] + ';" val="' + 
                                    _a + '">' + _a + '</button></span>');
    }   
    $("#phaseContextMenu").click(Timeline.phaseContextMenuClickHandler);
    
    //to hide open contextmenus : Rohit
    $("body").click(function () {
            $("#contextMenu").hide();
            $("#phaseContextMenu").hide();
          });
    
    // handle key down event for enter click on the manage rate cards section.
    $('input.discountRateTextBox').keydown(function(event){
        if(event.keyCode == 13) {
          event.stopPropagation();    
          event.preventDefault();
          //$('.buttonSaveCustom').click();// this is making the page to reload; not working so call the actionfunction instead
          Timeline.updateEstimateRateCards();
          return false;
        }        
    });
    reFreshGrid();
    loadSpinner.show();
    //TimelineSummary.domReady();
    **/
    
});


var reFreshGrid = function(){
    
    if(grid != null || typeof grid != 'undefined'){
        Timeline.rt_json = null;
        Timeline.rt_json = [];
        grid.destroy();
        grid = null;
    }
    gridMainInitiate();
    //Timeline.init(estimateId);
    Timeline.getEstimateRateCards(estimateId);
}


var gridMainInitiate = function(){
    //var dataProvider = new TotalsDataProvider(data, columns); 
    
    grid = new Slick.Grid("#myGrid", data, columns, Timeline.getGridOptions());
                                                    
     // set keyboard focus on the grid 
    //grid.getCanvasNode().focus(); // commented to get default page focus on load : I-232604
    
    grid.registerPlugin( new Slick.AutoColumnSize());
    // add header menu plugin
    var headerMenuPlugin = new Slick.Plugins.HeaderMenu({});
    // bind on command event
    headerMenuPlugin.onCommand.subscribe(Timeline.onHeaderMenuCommandHandler);
    // register the plugin
    grid.registerPlugin(headerMenuPlugin);

    
    grid.setSelectionModel(new Slick.CellSelectionModel());
    
    
    /** COPY MANAGER PLUGIN **/
    //var copyManager = new Slick.CellCopyManager(); //commented as using CellExternalCopyManager now to enable copy and paste from outside
    var copyManager = new Slick.CellExternalCopyManager();
    grid.registerPlugin(copyManager);
    copyManager.onPasteCells.subscribe(Timeline.onPasteCellsHandler);
     

    /***  ROW - REORDERING ***/
    var moveRowsPlugin = new Slick.RowMoveManager();
    moveRowsPlugin.onBeforeMoveRows.subscribe(Timeline.onBeforeMoveRowsHandler);
    moveRowsPlugin.onMoveRows.subscribe(Timeline.onMoveRowsHandler);
    grid.registerPlugin(moveRowsPlugin);

    
    /*** AUTO - TOOLTIP **/
    grid.registerPlugin(new Slick.AutoTooltips());
    
    
    // bind cell change event
    grid.onCellChange.subscribe(Timeline.onCellChangeHandler);
   
    // bind addnew row event
    grid.onAddNewRow.subscribe(Timeline.onAddNewRowHandler);
    
    // bind edit cell event
    grid.onBeforeEditCell.subscribe(Timeline.onBeforeEditCellHandler);
    
    
    // bind context menu
    grid.onContextMenu.subscribe(Timeline.onContextMenuHandler);
    
    //$('#myGrid').on('blur', 'input.editor-text', function() {
   //     Slick.GlobalEditorLock.commitCurrentEdit();
   // });
    
    Timeline.renderGrid();
    
    
}






var datepickerOptions = {
    onSelect: function(dateText) {
        if(!$('#build_div').is(':visible')){
          Timeline.onStartDateSelectionChange(new Date(dateText).toYYYYMMDD());
        }
    },
    beforeShowDay: function(date) {
        return [date.getDay() == 1, ""]
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
    }
}


var tabpanel = {
    containerId : '#tabpanel',
    timeline_tabId : '#tab-default-1__item',
    ratecard_tabId : '#tab-default-2__item',
    contentToShow : null,
    bindEvents : function(){
       $('.slds-tabs--default__item').on('click', function(){
                  tabpanel.contentToShow = $('#'+ $(this).find('a').attr('aria-controls'));
                  $(this).addClass('slds-active');
			      $(this).find('a').attr('aria-selected', true);
			      tabpanel.contentToShow.removeClass('slds-hide');
			      tabpanel.contentToShow.addClass('slds-show');
			      var tabId = '#' + $(this).find('a').attr('id');
			      if(tabId == tabpanel.timeline_tabId) {
			          Timeline.resizeGrid();
			      }
			      $(this).siblings().removeClass('slds-active');
			      $(this).siblings().find('a').attr('aria-selected', false);
			      tabpanel.contentToShow.siblings('.slds-tabs--default__content').removeClass('slds-show');
			      tabpanel.contentToShow.siblings('.slds-tabs--default__content').addClass('slds-hide');
			      
		});
    },
    activateTab: function(that){
                    that.addClass('slds-active');
			        that.find('a').attr('aria-selected', true);
			        var $contentToShow = $('#'+ that.find('a').attr('aria-controls'));
			        $contentToShow.removeClass('slds-hide');
			        $contentToShow.addClass('slds-show');			
			        that.siblings().removeClass('slds-active');
			        that.siblings().find('a').attr('aria-selected', false);
			        $contentToShow.siblings('.slds-tabs--default__content').removeClass('slds-show');
			        $contentToShow.siblings('.slds-tabs--default__content').addClass('slds-hide');
        
    },
    
    showTimelineTab: function(){
        tabpanel.activateTab($(tabpanel.timeline_tabId).parent());
    },
    
    showRatecardTab: function(){
        tabpanel.activateTab($(tabpanel.ratecard_tabId).parent());
    }
    
}





var Timeline = {
    fixedRows: 8,
    fixedColumns : 5,
    maxHours : 45,
    calcuation_cols_css : {'text-align' : 'center', 'background-color': '#666666', 'color' : '#ffffff', 'font-weight' : 'bold'},
    highlight_cols_css : {'text-align' : 'center', 'background-color': '#000080', 'color' : '#ffffff', 'font-weight' : 'bold'},
    capacityneeds_cols_css : {'text-align' : 'center', 'background-color': '#0070d2', 'color' : '#fff', 'font-weight' : 'bold'},
    hoursperphase_cols_css : {'text-align' : 'center', 'background-color': '#0070d2', 'color' : '#fff', 'font-weight' : 'bold'},
    rt_json : [],
    cellOldText : '',
    ADD_RESOURCE_LABEL : 'Type here to add resource...',
    
    resizeGrid: function(){
      $('#myGrid').css({'width': '100%', height: ($(window).outerHeight() - ($('.slds-tabs--default__nav').outerHeight() + $('#buildPanel').outerHeight() + $('#overview_div').outerHeight()))});
      if(typeof grid != 'undefined') grid.resizeCanvas();
    },
    renderGrid: function(){
        grid.setCellCssStyles("label_highlights", {
           1: {
                move: "slds-weekname-cell",
                id: "slds-weekname-cell",
                selector1: "slds-weekname-cell",
                skill: "slds-weekname-cell",
                autofill: "slds-weekname-cell"
               }
               ,
            2: {
                move: "slds-milestones-cell",
                id: "slds-milestones-cell",
                selector1: "slds-milestones-cell",
                skill: "slds-milestones-cell",
                autofill: "slds-milestones-cell"
               },
             3: {
                move: "slds-milestones-cell",
                id: "slds-milestones-cell",
                selector1: "slds-milestones-cell",
                skill: "slds-milestones-cell",
                autofill: "slds-milestones-cell"
               },
                4: {
                move: "slds-milestones-cell",
                id: "slds-milestones-cell",
                selector1: "slds-milestones-cell",
                skill: "slds-milestones-cell",
                autofill: "slds-milestones-cell"
               }
        });
        
        grid.render();
        
        Timeline.applyAddNewRowResourceCellLabel();
        
    },
    
    applyAddNewRowResourceCellLabel: function(){
        if(Timeline.getGridOptions().enableAddRow)  $(grid.getCellNode(grid.getData().length, 2)).not(':has(.add-resource-label)').append('<span class="add-resource-label">' + Timeline.ADD_RESOURCE_LABEL + '</span>');
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
       
       $('body').exportToExcel(timelineName + ' - ' + estimate_name + ".xlsx", 'Timeline', gridData, null, function (response) {
            //console.log(response);
            // use vanilla way of calling click action on anchor tag
            // jquery click doesn't work on anchor tags
            //document.getElementById("downloadLink").click();
            
            if (navigator.msSaveBlob) { // IE 10+ 
                //alert('in IE');
                response = response.replace('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,', '');
                //console.log('NEWRESPONSE' + response);
                navigator.msSaveBlob(Timeline.b64toBlob(response, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'Timeline - ' + estimate_name + '.xlsx'); 
            
                
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
            
            Timeline.resizeGrid();
            loadSpinner.hide();
            loader.hide();
        }); 
        
        gridData = null;
    },
    
    downloadExcel_Click: function(src, event){
       // change the width and height of the grid to make all the columns visible to be 
       // able to be available at the time of render
       
       $('#myGrid').css({'width': '15000px', height: '15000px'});
       grid.resizeCanvas();
       Timeline.applyAddNewRowResourceCellLabel();
       
       //grid.destroy();
       //gridMainInitiate();
       loadSpinner.show();
       loader.show();
       // 3 seconds are benchmarks
       // Need to give 3 secs wait period to load the grid with 
       // all the asyncPostRender items and then start reading grid content
       
       setTimeout(function(){
           try{
              Timeline.registerExportToExcel();
           }catch(ex){
              //in case exception comes while generating the xlsx; do handle the exception 
              // and render the grid properly
              loadSpinner.hide();
              loader.hide();
           }
       }, 3000);
       
       return false;       
    },
    
    
    getGridOptions: function(){ 
      return {
                                                        explicitInitialization : true,
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
                                                        ,leaveSpaceForNewRows : true
                                                        ,frozenColumn : 4
                                                        ,frozenRow : 8

                                                        //,autoHeight: true
                                                        //,fullWidthRows: true
                                                        //,frozenBottom: true
                                                    };  
        
    },
     
    getDefaultColumns: function() {
        return [{
            id: "move",
            name: "",
            field: "move",
            width: 15,
            behavior: "selectAndMove",
            selectable: false,
            resizable: false,
            focusable : false,
            cssClass: "cell-reorder dnd",
            groupName: " ",
            header: {},
            headerCssClass: "Fixed-Header-Style",
            order: null
            ,notUsedForCalculation : true
        }, {
            id: "id",
            name: "",
            field: "id",
            width: 15,
            behavior: "",
            selectable: false,
            resizable: false,
            focusable : false,
            cssClass: "",
            groupName: " ",
            header: {},
            headerCssClass: "Fixed-Header-Style",
            order: null,
            formatter: function(row, cell, value, columnDef, dataContext) {
                return "<a href='javascript:void(0);' title='Delete' class='delete_button' style='color:#4996D0; text-decoration:none;cursor:pointer' rowId='" + dataContext.id + "' onclick='Timeline.deleteRow(this);'>&nbsp;</a>";
            }
            ,notUsedForCalculation : true

        }, {
            id: "selector1",
            field: "e2Resource",
            name: "Resource",
            behavior: "",
            width: 350,
            selectable: false,
            resizable: false,
            focusable : true,
            editor: AutoCompleteEditor,
            cssClass: "",
            groupName: " ",
            header: {},
            headerCssClass: "Fixed-Header-Style",
            order: null
            ,notUsedForCalculation : true
            ,formatter: function(row, cell, value, columnDef, dataContext) {
                // 09/23 RJ: Added this formatter to display only role name in the column
                // Need not to display the whole text with practice, region, role 
                // show the whole text as tooltip than on screen
                var SEPARATOR = ' - ';
                if(typeof value != 'undefined' && value != ''){
                    var valArr = value.split(SEPARATOR);
                    if(valArr.length > 0){ 
                        return '<div class="info_icon" style="cursor:pointer;font-weight:bold;color:#000" title="' + value + '">' + dataContext.roleToDisplay + '</div>';
                    }
                }
                return value;
            }
        },{
            id: "skill",
            field: "skill",
            name: "Notes", 
            width: 100,
            selectable: false,
            resizable: true,
            focusable : true,
            editor: SkillEditor,
            cssClass: "",
            groupName: " ",
            header: {},
            headerCssClass: "Fixed-Header-Style",
            order: null
            ,notUsedForCalculation : true
        }, {
            id: "autofill",
            field: "autofill",
            name: "",
            behavior: "",
            width: 15,
            selectable: false,
            resizable: false,
            focusable : true,
            cssClass: "",
            groupName: " ",
            header: {},
            headerCssClass: "Fixed-Header-Style",
            order: null
            ,notUsedForCalculation : true
            ,formatter: function(row, cell, value, columnDef, dataContext) {
                    //if(row < Timeline.fixedRows || dataContext.id == ''){
                    //  return "";
                    //}
                    if(typeof Timeline.fixedRowsTypes[data[row].id] != 'undefined' || dataContext.id == '') return "";
                    //return "<button style='color:#4996D0; height: 16px;line-height: 16px;' rowId='" + dataContext.id + "' onclick='return false;'>Auto</button>";
                    return "<a href='javascript:void(0);' title='Double click to auto fill hours' class='setup_button' style='color:#4996D0;' rowId='" + dataContext.id + "' onclick='return false;'>&nbsp;</a>";
              }
              ,editor: AutoFillEditor
        }];
    },
    
     getEndColumns: function() {
        return [{
                    id: "hours",
                    name: "Hours",
                    field: "hours",
                    //width: 50,
                    selectable: false,
                    resizable: true,
                    focusable : false,
                    order: null
                    ,cssClass : "slds-calculated-cell"
                    ,headerCssClass: "Fixed-Header-Style"
                    ,notUsedForCalculation : true
                    ,formatter: Timeline.waitingFormatter
                    ,asyncPostRender: function(cellNode, row, dataContext, colDef) {
                        //console.log('postrender');
                        if(row < Timeline.fixedRows){
                            if(data[row].id == Timeline.fixedRowsTypes.total.id){
                                 //$(cellNode).empty().html(Timeline.getSumOfHoursForRows()).css({'text-align' : 'center', 'background-color': '#666666', 'color' : '#fff'});
                                 $(cellNode).empty().html(Timeline.getSumOfHoursForAllRows(cellNode, row, dataContext, colDef).toCommaFrmt()).addClass('slds-totalhrsperweek-cell-sum');
                            }
                            return;
                        }else{
                          $(cellNode).empty().html(Timeline.getHoursSum(cellNode, row, dataContext, colDef).toCommaFrmt()).addClass('slds-totalhrsperweek-cell');//.css({'text-align':'center','background-color': '#bacde3'});
                        }
                    }
                },
                {

                    id: "capacityneedshours",
                    name: "Capacity Needs (Hrs)",
                    field: "capacityneedshours",
                    width: 130,
                    selectable: false,
                    resizable: true,
                    focusable : false,
                    order: null
                    ,cssClass : "slds-calculated-cell"
                    ,headerCssClass: "Fixed-Header-Style"
                    ,notUsedForCalculation : true
                    ,formatter: Timeline.waitingFormatter
                    ,asyncPostRender: function(cellNode, row, dataContext, colDef) {
                        //console.log('postrender');
                        if(row < Timeline.fixedRows){
                            /*if(data[row].id == Timeline.fixedRowsTypes.milestone2.id){
                                $(cellNode).empty().html('# Hours Scoped').css(Timeline.highlight_cols_css);
                            }else if(data[row].id == Timeline.fixedRowsTypes.capacityneedsperphase.id){
                                
                                var totalHours = 0;
                                if(typeof capacityNeeds_JSON != 'undefined' && typeof capacityNeeds_JSON.TotalHours != 'undefined'){
                                    totalHours = capacityNeeds_JSON.TotalHours;
                                }
                                $(cellNode).empty().html(totalHours.toCommaFrmt()).css(Timeline.highlight_cols_css);
                                 
                            }else if(data[row].id == Timeline.fixedRowsTypes.total.id){
                                
                                 var sum = 0;
                                 var rowData = data.slice(Timeline.fixedRows);
                                 $.each(rowData, function(indx, rowItem) {
                                     var row_sum = 0; 
                                           
                                      var resourceRateCardRole = rowItem.resourceRateCardRole;
                                      resourceRateCardRole = (typeof resourceRateCardRole == 'undefined' ? '' : resourceRateCardRole.toLowerCase());
                                     
                                      if(typeof capacityNeeds_JSON != 'undefined' && 
                                            typeof capacityNeeds_JSON.RoleHours != 'undefined' &&
                                            typeof capacityNeeds_JSON.RoleHours[resourceRateCardRole] != 'undefined'){
                                          row_sum = capacityNeeds_JSON.RoleHours[resourceRateCardRole];
                                      }
                                           
                                     sum += parseInt(row_sum);
                                     
                                 });
                                 $(cellNode).empty().html(sum.toCommaFrmt()).css(Timeline.calcuation_cols_css);
                                 
                            }*/

                            return;
                        }else{
                          var hours = 0;
                          var resourceRateCardRole = data[row].resourceRateCardRole;
                          resourceRateCardRole = (typeof resourceRateCardRole == 'undefined' ? '' : resourceRateCardRole.toLowerCase());
                          // RS : 02/13 : In case no resource level being defined in Capacity needs 
                          // let map with resource role only (without level)
                          var resource = data[row].resource;
                          var SEPARATOR = ' - ';
                          if(typeof resource != 'undefined' && resource != '') {
                              var arr = resource.split(SEPARATOR);
                              resource = arr[arr.length - 1];
                              // RS: 04/17 : In case resource name contains - in name get the remaning
                              // resource name and concat it.
                              if(arr.length > 2) {
                                  var roleName = arr[arr.length - 2];
                                  resource = roleName + SEPARATOR + resource;
                              }
                              resource = resource.toLowerCase();
                          }
                          if(typeof capacityNeeds_JSON != 'undefined' && 
                                typeof capacityNeeds_JSON.RoleHours != 'undefined' &&
                                typeof capacityNeeds_JSON.RoleHours[resourceRateCardRole] != 'undefined'){
                              hours = capacityNeeds_JSON.RoleHours[resourceRateCardRole];
                          } else if(typeof capacityNeeds_JSON != 'undefined' && 
                                typeof capacityNeeds_JSON.RoleHours != 'undefined' && 
                                typeof resource != 'undefined' && 
                                typeof capacityNeeds_JSON.RoleHours[resource] != 'undefined') {
                                // RS : 02/13 : In case no resource level being defined in Capacity needs 
                                // let map with resource role only (without level)
                              hours = capacityNeeds_JSON.RoleHours[resource];
                          }
                          
                          $(cellNode).empty().html(hours.toCommaFrmt()).css({'text-align':'center'});
                        }
                    }
                }, {

                    id: "rate",
                    name: "Rate",
                    field: "rate",
                    width: 100,
                    selectable: false,
                    resizable: true,
                    focusable : false,
                    order: null
                    ,cssClass : "slds-weekname-cell"// "slds-calculated-cell"
                    ,headerCssClass: "Fixed-Header-Style"
                    ,notUsedForCalculation : true
                    ,formatter: function(row, cell, value, columnDef, dataContext) {
                        //if(row < Timeline.fixedRows){
                        //    return '';
                        //}
                        //console.log('my value::::' + value);
                        if(typeof Timeline.fixedRowsTypes[data[row].id] != 'undefined' || dataContext.id == '') return "";
                        var returnVal =  value == '' ? '0.00' : parseFloat(value).toFixed(2).toCommaFrmt();
                        
                        //if(typeof dataContext.isRateOverridden != 'undefined' 
                          //  && dataContext.isRateOverridden == 'true') {
                            //return '<div class="isRateOverridden">' + returnVal + '</div>';
                        //}
                        return returnVal;
                        
                    },asyncPostRender: function(cellNode, row, dataContext, colDef) {
                        if(typeof dataContext.isRateOverridden != 'undefined' && dataContext.isRateOverridden == 'true') {
                            $(cellNode).addClass('isRateOverridden');
                        }
                        //if(row < Timeline.fixedRows){
                            //if(data[row].id == Timeline.fixedRowsTypes.total.id){
                                 //$(cellNode).empty().html(Timeline.getSumOfBelowRows()).css({'text-align' : 'center', 'background-color': '#666666', 'color' : '#fff'});
                                 //var rate = Timeline.getAvgOfBelowRows(cellNode, row, dataContext, colDef);
                                 //$(cellNode).empty().html(parseFloat(isNaN(rate) ? 0 : rate).toFixed(2).toCommaFrmt()).css(Timeline.calcuation_cols_css);
                                 
                            //}
                            //return;
                        //}
                    }
                }, {
                    id: "cost",
                    name: "Cost",
                    field: "cost",
                    width: 100,
                    selectable: false,
                    resizable: true,
                    focusable : false,
                    order: null
                    ,cssClass : "slds-weekname-cell"// "slds-calculated-cell"
                    ,headerCssClass: "Fixed-Header-Style"
                    ,notUsedForCalculation : true
                    ,formatter: function(row, cell, value, columnDef, dataContext) {
                        //if(row < Timeline.fixedRows){
                        //    return '';
                        //}
                        if(typeof Timeline.fixedRowsTypes[data[row].id] != 'undefined' || dataContext.id == '') return "";
                        return value == '' ? '0.00' : parseFloat(value).toFixed(2).toCommaFrmt();
                        
                    },asyncPostRender: function(cellNode, row, dataContext, colDef) {
                        //console.log('postrender');
                        if(row < Timeline.fixedRows){
                            if(data[row].id == Timeline.fixedRowsTypes.total.id){
                                 //$(cellNode).empty().html(Timeline.getSumOfBelowRows()).css({'text-align' : 'center', 'background-color': '#666666', 'color' : '#fff'});
                                 var cost = Timeline.getAvgOfBelowRows(cellNode, row, dataContext, colDef);
                                 //$(cellNode).empty().html(parseFloat(isNaN(cost) ? 0 : cost).toFixed(2).toCommaFrmt()).css(Timeline.calcuation_cols_css);
                            }
                            return;
                        }
                    }
                },{
                    id: "cost_price",
                    name: "Total Cost",
                    field: "cost_price",
                    width: 100,
                    selectable: false,
                    resizable: true,
                    focusable : false,
                    order: null
                    ,cssClass : "slds-weekname-cell"// "slds-calculated-cell"
                    ,headerCssClass: "Fixed-Header-Style"
                    ,notUsedForCalculation : true
                    ,formatter: Timeline.waitingFormatter
                    ,asyncPostRender: function(cellNode, row, dataContext, colDef) {
                        if(row < Timeline.fixedRows){
                            if(data[row].id == Timeline.fixedRowsTypes.total.id){
                                 var sum = 0;
                                 var rowData = data.slice(Timeline.fixedRows);
                                 var colData = columns.slice(Timeline.fixedColumns);
                                 $.each(rowData, function(indx, rowItem) {
                                    var row_sum = 0; 
                                    $.each(colData, function(indx1, colItem) {
                                       if(typeof colItem.notUsedForCalculation == 'undefined' || !colItem.notUsedForCalculation) {
                                           row_sum += (typeof rowItem[colItem.id] == 'undefined' || rowItem[colItem.id] == ''? 0 : parseInt(rowItem[colItem.id]));
                                       }       
                                    });
                                    sum += parseInt(row_sum) * rowItem.cost;
                                    //console.log('----------' + sum + '-------------' + rowItem.id);
                                 });
                                 
                                 var total_cost = parseFloat(sum).toFixed(2);
                                 $(cellNode).empty().html(total_cost.toCommaFrmt()).css(Timeline.calcuation_cols_css);
                            }
                            return;
                        }
                        $(cellNode).empty().html(parseFloat(Timeline.getHoursSum(cellNode, row, dataContext, colDef) * dataContext.cost).toFixed(2).toCommaFrmt());
                    }
                },{
                    id: "selling_price",
                    name: "Total Price",
                    field: "selling_price",
                    width: 100,
                    selectable: false,
                    resizable: true,
                    focusable : false,
                    order: null
                    ,cssClass : "slds-weekname-cell"//"slds-calculated-cell"
                    ,headerCssClass: "Fixed-Header-Style"
                    ,notUsedForCalculation : true
                    ,formatter: Timeline.waitingFormatter
                    ,asyncPostRender: function(cellNode, row, dataContext, colDef) {
                        if(row < Timeline.fixedRows){
                            if(data[row].id == Timeline.fixedRowsTypes.total.id){
                                 var sum = 0;
                                 var rowData = data.slice(Timeline.fixedRows);
                                 var colData = columns.slice(Timeline.fixedColumns);
                                 $.each(rowData, function(indx, rowItem) {
                                    var row_sum = 0; 
                                    $.each(colData, function(indx1, colItem) {
                                       if(typeof colItem.notUsedForCalculation == 'undefined' || !colItem.notUsedForCalculation) {
                                           row_sum += (typeof rowItem[colItem.id] == 'undefined' || rowItem[colItem.id] == ''? 0 : parseInt(rowItem[colItem.id]));
                                       }       
                                    });
                                    sum += parseInt(row_sum) * rowItem.rate;
                                    //console.log('----------' + sum + '-------------' + rowItem.id);
                                 });
                                 
                                 var total_price = parseFloat(sum).toFixed(2);
                                 $(cellNode).empty().html(total_price.toCommaFrmt()).css(Timeline.calcuation_cols_css);
                            }
                            return;
                        }
                        $(cellNode).empty().html(parseFloat(Timeline.getHoursSum(cellNode, row, dataContext, colDef) * dataContext.rate).toFixed(2).toCommaFrmt());
                    }
                }];
    },
    
    
    // Code for enablePhaseContextMenu : Rohit
    fixedRowsTypes : {
                      'weekname' : {
                          id : 'weekname',
                          defaultValue : '',
                          valuefield: 'order'
                          , rowLabel: 'WEEK'
                          , enableColorCodeContextMenu : false
                          , enablePhaseContextMenu : false
                          ,editable : false
                          ,rowIndex : 0
                      }, 
                      'phase' : {
                          id : 'phase',
                          defaultValue : '',
                          valuefield: 'phase',
                          colorcodefield : 'phaseColorCode',
                          colorcodepostfix : '_phasecolorcode',
                          apply_css : true
                          , rowLabel: 'PHASE'
                          , enableColorCodeContextMenu : false
                          , enablePhaseContextMenu : true
                          ,rowIndex : 1
                          ,editable : false
                          
                          
                      }, 'milestone' : {
                          id : 'milestone',
                          defaultValue : '',
                          valuefield: 'milestone',
                          colorcodefield : 'milestoneColorCode',
                          colorcodepostfix : '_milestonecolorcode',
                          apply_css : true
                          , rowLabel: 'MILESTONE'
                          , enableColorCodeContextMenu : true
                          , enablePhaseContextMenu : false
                          ,rowIndex : 2
                          
                      }, 'milestone1' : {
                          id : 'milestone1',
                          defaultValue : '',
                          valuefield: 'milestone1',
                          colorcodefield : 'milestoneColorCode1',
                          colorcodepostfix : '_milestonecolorcode1',
                          apply_css : true
                          , rowLabel: ''
                          , enableColorCodeContextMenu : true
                          , enablePhaseContextMenu : false
                          ,rowIndex : 3
                          
                      }, 'milestone2' : {
                          id : 'milestone2',
                          defaultValue : '',
                          valuefield: 'milestone2',
                          colorcodefield : 'milestoneColorCode2',
                          colorcodepostfix : '_milestonecolorcode2',
                          apply_css : true
                          , rowLabel: ''
                          , enableColorCodeContextMenu : true
                          , enablePhaseContextMenu : false
                          ,rowIndex : 4
                          
                      }, 'capacityneedsperphase' : {
                          id : 'capacityneedsperphase',
                          defaultValue : 0
                          , rowLabel: 'CAPACITY NEEDS PER PHASE (Hrs)'
                          , enableColorCodeContextMenu : false
                          , enablePhaseContextMenu : false,
                          apply_css : false
                          ,editable : false
                          ,rowIndex : 5
                          
                      },'hoursperphase' : {
                          id : 'hoursperphase',
                          defaultValue : 0
                          , rowLabel: 'HOURS PER PHASE (Hrs)'
                          , enableColorCodeContextMenu : false
                          , enablePhaseContextMenu : false,
                          apply_css : false
                          ,editable : false
                          ,rowIndex : 6
                          
                      }, 'total' : {
                          id : 'total',
                          defaultValue : 0
                          , rowLabel: 'TOTAL PER WEEK (Hrs)'
                          , enableColorCodeContextMenu : false
                          , enablePhaseContextMenu : false,
                          apply_css : false
                          ,editable : false
                          ,rowIndex : 7
                      }
        
    },
                                                          
    bindMetadata: function(){
        // set the grid's data as new rows
        data.getItemMetadata = function (row) {
                  
                   var metadata =  {
                      selectable: false,
                      //cssClasses: "custom-fix-row",
                      "columns": {
                                        "id": {
                                                  formatter: function(row, cell, value, columnDef, dataContext) {
                                                        return "";
                                                  },
                                                  focusable : false,
                                                  editor: ""
                                                },
                                        "selector1" : {
                                                  formatter: function(row, cell, value, columnDef, dataContext) {
                                                      var meta_info = Timeline.fixedRowsTypes[data[row].id];
                                                      if(typeof meta_info != 'undefined'){
                                                          var rowLabel = (typeof meta_info.rowLabel == 'undefined' ? '' : meta_info.rowLabel);
                                                          return "<div style='width:100%;text-align:right;font-weight: bold;'>" + rowLabel + "</div>";
                                                      }
                                                      return value;
                                                  },
                                                  focusable : false,
                                                  editor: ""
                                        }       
                      }
                    };
                
               
                
                
                if(typeof data[row] != 'undefined' && (data[row].id == Timeline.fixedRowsTypes.milestone.id || data[row].id == Timeline.fixedRowsTypes.milestone1.id || data[row].id == Timeline.fixedRowsTypes.milestone2.id)){
                      var currentRow = data[row];
                      
                     $.each(columns, function(indx1, colItem) {
                        if(indx1 >= Timeline.fixedColumns && typeof colItem.usedForCalculation != 'undefined' && colItem.usedForCalculation){
                             //added code for colspan
                             metadata.selectable = true;
                             var val = currentRow[columns[indx1].field];
                             var nextCellIndex = indx1 + 1;
                             var colspan = 1;
                             while(nextCellIndex < columns.length){
                                 if(val == currentRow[columns[nextCellIndex].field] && val != ''){ 
                                   colspan++;  
                                 }else {
                                     break;
                                 } 
                                 nextCellIndex += 1;
                             }
                             // end of colspan calcuation
                             metadata.columns[colItem.field] = {};
                             metadata.columns[colItem.field].editor = MilestoneEditor;
                             metadata.columns[colItem.field].colspan = colspan; // added for colspan
                        }
                    });
                    //metadata['cssClasses'] = 'slds-milestones-cell';
                    return metadata;
                    
                }else if(typeof data[row] != 'undefined' && data[row].id == Timeline.fixedRowsTypes.phase.id){
                    
                    var currentRow = data[row];
                             
                    $.each(columns, function(indx1, colItem) {
                        if(indx1 >= Timeline.fixedColumns && typeof colItem.usedForCalculation != 'undefined' && colItem.usedForCalculation){
                            //added code for colspan
                             metadata.selectable = true;
                             var val = currentRow[columns[indx1].field];
                             var nextCellIndex = indx1 + 1;
                             var colspan = 1;
                             while(nextCellIndex < columns.length){
                                 if(val == currentRow[columns[nextCellIndex].field] && val != ''){ 
                                   colspan++;  
                                 }else {
                                     break;
                                 } 
                                 nextCellIndex += 1;
                             }
                             // end of colspan calcuation
                             metadata.columns[colItem.field] = {};
                             //metadata.columns[colItem.field].editor = MilestoneEditor; // commented after adding colspan no need for phase editor now
                             //metadata.columns[colItem.field].editor = PhaseSelectionEditor; 
                             metadata.columns[colItem.field].colspan = colspan; // added for colspan
                        }
                    });
                    
                    return metadata;
                    
                }else if(typeof data[row] != 'undefined' && data[row].id == Timeline.fixedRowsTypes.capacityneedsperphase.id){
                    
                    //for(var _a in Timeline.fixedRowsTypes.phase.rowIndex)
                    
                    var currentRow = data[Timeline.fixedRowsTypes.phase.rowIndex];
                    
                             
                    $.each(columns, function(indx1, colItem) {
                        if(indx1 >= Timeline.fixedColumns && typeof colItem.usedForCalculation != 'undefined' && colItem.usedForCalculation){
                            //added code for colspan
                             //metadata.selectable = true;
                             metadata.focusable = false; 
                             var val = currentRow[columns[indx1].field];
                             var nextCellIndex = indx1 + 1;
                             var colspan = 1;
                             while(nextCellIndex < columns.length){
                                 if(val == currentRow[columns[nextCellIndex].field] && val != ''){ 
                                   colspan++;  
                                 }else {
                                     break;
                                 } 
                                 nextCellIndex += 1;
                             }
                             // end of colspan calcuation
                             metadata.columns[colItem.field] = {};
                             metadata.columns[colItem.field].colspan = colspan; // added for colspan
                        }
                    });
                    metadata['cssClasses'] = 'slds-capacityperphase-cell';
                    return metadata;
                    
                }else if(typeof data[row] != 'undefined' && data[row].id == Timeline.fixedRowsTypes.hoursperphase.id){
                    
                    //for(var _a in Timeline.fixedRowsTypes.phase.rowIndex)
                    
                    var currentRow = data[Timeline.fixedRowsTypes.phase.rowIndex];
                    
                             
                    $.each(columns, function(indx1, colItem) {
                        if(indx1 >= Timeline.fixedColumns && typeof colItem.usedForCalculation != 'undefined' && colItem.usedForCalculation){
                            //added code for colspan
                             //metadata.selectable = true;
                             metadata.focusable = false;
                             var val = currentRow[columns[indx1].field];
                             var nextCellIndex = indx1 + 1;
                             var colspan = 1;
                             while(nextCellIndex < columns.length){
                                 if(val == currentRow[columns[nextCellIndex].field] && val != ''){ 
                                   colspan++;  
                                 }else {
                                     break;
                                 } 
                                 nextCellIndex += 1;
                             }
                             // end of colspan calcuation
                             metadata.columns[colItem.field] = {};
                             metadata.columns[colItem.field].colspan = colspan; // added for colspan
                        }
                    });
                    metadata['cssClasses'] = 'slds-hoursperphase-cell';
                    return metadata;
                    
                }else if(typeof data[row] != 'undefined' && data[row].id == Timeline.fixedRowsTypes.total.id){
                    
                   metadata['cssClasses'] = 'slds-totalhrsperweek-cell';
                   metadata.focusable = false;
                   return metadata;
                }else if(typeof data[row] != 'undefined' && data[row].id == Timeline.fixedRowsTypes.weekname.id){
                    
                   metadata['cssClasses'] = 'slds-weekname-cell';
                   return metadata;
                }else if(typeof data[row] != 'undefined' && typeof Timeline.fixedRowsTypes[data[row].id] != 'undefined'){
                    return metadata;
                }
                
           }
        
        
    },
    
    onContextMenuHandler: function (e) {
      e.preventDefault();
      var cell = grid.getCellFromEvent(e);
      $("#phaseContextMenu").hide();
      $("#contextMenu").hide();
      
      if(typeof Timeline.fixedRowsTypes[data[cell.row].id] == 'undefined'){
          return; // if not an fixed header row
      }
      // Code for enablePhaseContextMenu : Rohit
      if(Timeline.fixedRowsTypes[data[cell.row].id].enableColorCodeContextMenu == false
         && Timeline.fixedRowsTypes[data[cell.row].id].enablePhaseContextMenu == false){
          return; // if context menu disabled for an fixed header row
      }
      
      if(typeof columns[cell.cell] != 'undefined' && typeof columns[cell.cell].usedForCalculation == 'undefined'){
          return;
      }
      if(Timeline.fixedRowsTypes[data[cell.row].id].enableColorCodeContextMenu == true) {
          //console.log(cell);
          $("#contextMenu")
              .data("data", { range : grid.getSelectionModel().getSelectedRanges(), row : cell.row, cell : cell.cell})
              .css("top", e.pageY)
              .css("left", e.pageX)
              .show();
      }
      // Code for enablePhaseContextMenu : Rohit
      else if(Timeline.fixedRowsTypes[data[cell.row].id].enablePhaseContextMenu == true) {
          //console.log(cell);
          $("#phaseContextMenu")
              .data("data", { range : grid.getSelectionModel().getSelectedRanges(), row : cell.row, cell : cell.cell})
              .css("top", e.pageY)
              .css("left", e.pageX)
              .show();
      }
    },
    
    contextMenuClickHandler:function (e) {
        //alert($(e.target).is("button"));
                 if (!$(e.target).is("li") && !$(e.target).is("button")) {
                     return;
                 }
                
                 if (!grid.getEditorLock().commitCurrentEdit()) {
                     return;
                 }
                
                
                 if ($(e.target).is("li")) {
                     var context_data = $(this).data("data");
                     var val = typeof $(e.target).attr("data") == 'undefined' ? '' : $(e.target).attr("data");
                
                     if (context_data.range.length > 0) {
                         var from = context_data.range[0];
                
                
                         var nodes_order_json = '[';
                
                         for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                             //console.log('from:' + from); 
                             for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                 if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                
                                     var rowId = data[from.fromRow + i].id;
                                     var field = columns[from.fromCell + j].field;
                                     //console.log(rowId + '---' + field + '---' + val);
                
                                     var meta_info = Timeline.fixedRowsTypes[rowId];
                                     if (typeof meta_info != 'undefined') {
                                         var colorCodePostFix = meta_info.colorcodepostfix;
                                         if (typeof colorCodePostFix != 'undefined') {
                                             data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = val;
                                             //Timeline.updatePhaseColorCode(field, val);
                                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"},';
                                             grid.invalidateRow(from.fromRow + i);
                                         }
                                     }
                
                
                
                                 }
                             }
                
                         }
                         // do a database update for milestone and phase color code update
                         if (nodes_order_json != '[') {
                             nodes_order_json = nodes_order_json.slice(0, -1);
                             nodes_order_json += ']';
                             Timeline.updateColorCode(nodes_order_json);
                         }
                
                     } else {
                         var rowId = data[context_data.row].id;
                         var field = columns[context_data.cell].field;
                         
                         var meta_info = Timeline.fixedRowsTypes[rowId];
                         // RS : update color in merge cells
                         var nodes_order_json = '[';
                         var cellText = data[context_data.row][columns[context_data.cell].field];
                         if (typeof meta_info != 'undefined') {
                            var colorCodePostFix = meta_info.colorcodepostfix;
                            if (typeof colorCodePostFix != 'undefined') {
                                 for(var cellValue = context_data.cell; cellValue <= columns.length - 1; cellValue++) {
                                    var cellText1 = data[context_data.row][columns[cellValue].field];
                                    if(cellText1 != '' && cellText == cellText1) {
                                            data[context_data.row][columns[cellValue].field + colorCodePostFix] = val;
                                            nodes_order_json += '{"weekId":"' + columns[cellValue].field + '", "type":"' + rowId.toLowerCase() + '", "value":"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"},';
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }
                        grid.invalidateRow(context_data.row);
                        // do a database update for milestone and phase color code update
                         if (nodes_order_json != '[') {
                             nodes_order_json = nodes_order_json.slice(0, -1);
                             nodes_order_json += ']';
                             Timeline.updateColorCode(nodes_order_json);
                         }
                     }
                     grid.getSelectionModel().setSelectedRanges([]);
                     grid.setData(data);
                     Timeline.renderGrid();
                 }else if ($(e.target).is("button")) {
                     var context_data = $(this).data("data");
                     var val = typeof $(e.target).attr("data") == 'undefined' ? '' : $(e.target).attr("data");
                
                     if (context_data.range.length > 0) {
                         var from = context_data.range[0];
                
                         if (val.toLowerCase() == 'merge') {
                             var nodes_order_json = '[';
                             var cellValue_register = [];
                             var cellColor_register = [];
                             for(var i = 0; i <= from.toRow - from.fromRow; i++) {
                                 var cellValue = '';
                                 var cellColor = '';
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     
                                     if(data[from.fromRow + i][columns[from.fromCell + j].field] != 'undefined' 
                                     && data[from.fromRow + i][columns[from.fromCell + j].field] != '') {
                                         cellValue = data[from.fromRow + i][columns[from.fromCell + j].field];
                                         // changes to get merge cell color
                                         var rowId = data[from.fromRow + i].id;
                                         var meta_info = Timeline.fixedRowsTypes[rowId];
                                         if (typeof meta_info != 'undefined') {
                                             var colorCodePostFix = meta_info.colorcodepostfix;
                                             if (typeof colorCodePostFix != 'undefined') {
                                                 cellColor = data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix];
                                             } else {
                                                 cellColor = '';
                                             }
                                         }
                                         break;
                                     }
                                 }
                                 cellValue_register.push(cellValue);
                                 cellColor_register.push(cellColor);
                             }
                             
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                 var cellValue = cellValue_register[i];//data[from.fromRow + i][columns[from.fromCell].field];
                                 var cellColor = cellColor_register[i];
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         data[from.fromRow + i][columns[from.fromCell + j].field] = cellValue;
                                         var meta_info = Timeline.fixedRowsTypes[rowId];
                                         if (typeof meta_info != 'undefined') {
                                            var colorCodePostFix = meta_info.colorcodepostfix;
                                             if (typeof colorCodePostFix != 'undefined') {
                                                data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = cellColor;
                                             }
                                         }
                                         nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"' + cellValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '", "colorCode":"' + cellColor + '"},';
                                         grid.invalidateRow(from.fromRow + i);
                
                                     }
                                 }
                
                             }
                             
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                         }else if (val.toLowerCase() == 'unmerge') {
                             var nodes_order_json = '[';
                    
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                 var cellValue = data[from.fromRow + i][columns[from.fromCell].field];
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         var value = data[from.fromRow + i][columns[from.fromCell + j].field];
                    
                                         if (columns[from.fromCell].field != columns[from.fromCell + j].field && value == cellValue) {
                                             data[from.fromRow + i][columns[from.fromCell + j].field] = '';
                                             
                                             var meta_info = Timeline.fixedRowsTypes[rowId];
                                             if (typeof meta_info != 'undefined') {
                                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                                 if (typeof colorCodePostFix != 'undefined') {
                                                    data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = '';
                                                 }
                                             }
                                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"", "colorCode":""},';
                                         }
                                         grid.invalidateRow(from.fromRow + i);
                                     }
                                 }
                    
                             }
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                    
                         }else if (val.toLowerCase() == 'clear') {
                            var nodes_order_json = '[';
                    
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                // var cellValue = data[from.fromRow + i][columns[from.fromCell].field];
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         var value = data[from.fromRow + i][columns[from.fromCell + j].field];
                    
                                         //if (columns[from.fromCell].field != columns[from.fromCell + j].field && value == cellValue) {
                                             data[from.fromRow + i][columns[from.fromCell + j].field] = '';
                                             
                                             var meta_info = Timeline.fixedRowsTypes[rowId];
                                             if (typeof meta_info != 'undefined') {
                                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                                 if (typeof colorCodePostFix != 'undefined') {
                                                    data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = '';
                                                 }
                                             }
                                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"", "colorCode":""},';
                                         //}
                                         grid.invalidateRow(from.fromRow + i);
                                     }
                                 }
                    
                             }
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                             
                         }
 
                    }// end of context length check 
                    else if(val.toLowerCase() == 'clear' || val.toLowerCase() == 'unmerge') {
                         var nodes_order_json = '[';
                         if(val.toLowerCase() == 'clear') {
                             var rowId = data[context_data.row].id;
                             var field = columns[context_data.cell].field;
                             var meta_info = Timeline.fixedRowsTypes[rowId];
                             data[context_data.row][columns[context_data.cell].field] = '';
                             if (typeof meta_info != 'undefined') {
                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                 if (typeof colorCodePostFix != 'undefined') {
                                     data[context_data.row][columns[context_data.cell].field + colorCodePostFix] = '';
                                     //Timeline.triggerUpdateColorCode(field, val, rowId);
                                     grid.invalidateRow(context_data.row);
                                 }
                             }
                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"", "colorCode":""},';
                         } else if(val.toLowerCase() == 'unmerge') {
                             var cellText = data[context_data.row][columns[context_data.cell].field];
                             var rowid = data[context_data.row].id;
                             var meta_info = Timeline.fixedRowsTypes[rowid];
                             for(var cellValue = context_data.cell+1; cellValue <= columns.length - 1; cellValue++) {
                                 var cellText1 = data[context_data.row][columns[cellValue].field];
                                 if(cellText1 != '' && cellText == cellText1) {
                                     data[context_data.row][columns[cellValue].field] = '';
                                     if (typeof meta_info != 'undefined') {
                                        var colorCodePostFix = meta_info.colorcodepostfix;
                                        if (typeof colorCodePostFix != 'undefined') {
                                            data[context_data.row][columns[cellValue].field + colorCodePostFix] = '';
                                        }
                                    }
                                    nodes_order_json += '{"weekId":"' + columns[cellValue].field + '", "type":"' + rowid.toLowerCase() + '", "value":"", "colorCode":""},';
                                 } else {
                                     break;
                                 }
                             }
                             grid.invalidateRow(context_data.row);
                         } 
                         // do a database update for milestone and phase color code update
                         if (nodes_order_json != '[') {
                             nodes_order_json = nodes_order_json.slice(0, -1);
                             nodes_order_json += ']';
                             Timeline.updateMilestoneWeeks(nodes_order_json);
                         }
                         grid.setData(data);
                         Timeline.renderGrid();
                
                     } 
                 }//end of is button check  
        
        
    }, 
    phaseContextMenuClickHandler:function (e) {
                 if (!$(e.target).is("button")) {
                     return;
                 }
                 
                 if (!grid.getEditorLock().commitCurrentEdit()) {
                     return;
                 }
                
                 if ($(e.target).is("button")) {
                     var context_data = $(this).data("data");
                     var val = typeof $(e.target).attr("data") == 'undefined' ? '' : $(e.target).attr("data");
                     console.log(context_data);
                     if (context_data.range.length > 0) {
                         var from = context_data.range[0];
                
                         if (val.toLowerCase() == 'merge') {
                             var nodes_order_json = '[';
                             var cellValue_register = [];
                             for(var i = 0; i <= from.toRow - from.fromRow; i++) {
                                 var cellValue = '';
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if(data[from.fromRow + i][columns[from.fromCell + j].field] != 'undefined' 
                                     && data[from.fromRow + i][columns[from.fromCell + j].field] != '') {
                                         cellValue = data[from.fromRow + i][columns[from.fromCell + j].field];
                                         break;
                                     }
                                 }
                                 cellValue_register.push(cellValue);
                             }
                             
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                 var cellValue = cellValue_register[i];//]data[from.fromRow + i][columns[from.fromCell].field];
                
                
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         data[from.fromRow + i][columns[from.fromCell + j].field] = cellValue;
                                         
                                         nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"' + cellValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
                                         
                                         var meta_info = Timeline.fixedRowsTypes[rowId];
                                         if (typeof meta_info != 'undefined') {
                                             var colorCodePostFix = meta_info.colorcodepostfix;
                                             if (typeof colorCodePostFix != 'undefined') {
                                                 var cCode = data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix];
                                                 nodes_order_json += ', "colorCode":"' + cCode + '"';
                                             }
                                         }
                                         
                                         nodes_order_json += '},';
                                         grid.invalidateRow(from.fromRow + i);
                
                                     }
                                 }
                
                             }
                             
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                         }else if (val.toLowerCase() == 'unmerge') {
                             var nodes_order_json = '[';
                    
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                 var cellValue = data[from.fromRow + i][columns[from.fromCell].field];
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         var value = data[from.fromRow + i][columns[from.fromCell + j].field];
                    
                                         if (columns[from.fromCell].field != columns[from.fromCell + j].field && value == cellValue) {
                                             data[from.fromRow + i][columns[from.fromCell + j].field] = '';
                                             
                                             var meta_info = Timeline.fixedRowsTypes[rowId];
                                             if (typeof meta_info != 'undefined') {
                                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                                 if (typeof colorCodePostFix != 'undefined') {
                                                    data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = '';
                                                 }
                                             }
                                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"", "colorCode":""},';
                                         }
                                         grid.invalidateRow(from.fromRow + i);
                                     }
                                 }
                    
                             }
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                    
                         } else if (val.toLowerCase() == 'clear') {
                            var nodes_order_json = '[';
                    
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                // var cellValue = data[from.fromRow + i][columns[from.fromCell].field];
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         var value = data[from.fromRow + i][columns[from.fromCell + j].field];
                    
                                         //if (columns[from.fromCell].field != columns[from.fromCell + j].field && value == cellValue) {
                                             data[from.fromRow + i][columns[from.fromCell + j].field] = '';
                                             
                                             var meta_info = Timeline.fixedRowsTypes[rowId];
                                             if (typeof meta_info != 'undefined') {
                                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                                 if (typeof colorCodePostFix != 'undefined') {
                                                    data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = '';
                                                 }
                                             }
                                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"", "colorCode":""},';
                                         //}
                                         grid.invalidateRow(from.fromRow + i);
                                     }
                                 }
                    
                             }
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                             
                         } else if(typeof val != 'undefined' && typeof renderOptions_Phases[val] != 'undefined'){
                             var nodes_order_json = '[';
                    
                             for (var i = 0; i <= from.toRow - from.fromRow; i++) {
                                // var cellValue = data[from.fromRow + i][columns[from.fromCell].field];
                                 for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                                     if (typeof columns[from.fromCell + j].usedForCalculation != 'undefined' && columns[from.fromCell + j].usedForCalculation == true) {
                                         var rowId = data[from.fromRow + i].id;
                                         var field = columns[from.fromCell + j].field;
                                         var value = data[from.fromRow + i][columns[from.fromCell + j].field];
                    
                                         //if (columns[from.fromCell].field != columns[from.fromCell + j].field && value == cellValue) {
                                             data[from.fromRow + i][columns[from.fromCell + j].field] = val;
                                             
                                             var meta_info = Timeline.fixedRowsTypes[rowId];
                                             if (typeof meta_info != 'undefined') {
                                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                                 if (typeof colorCodePostFix != 'undefined') {
                                                    data[from.fromRow + i][columns[from.fromCell + j].field + colorCodePostFix] = renderOptions_Phases[val];
                                                 }
                                             }
                                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"'+ val +'", "colorCode":"' + renderOptions_Phases[val] + '"},';
                                         //}
                                         grid.invalidateRow(from.fromRow + i);
                                     }
                                 }
                    
                             }
                             // do a database update for milestone and phase color code update
                             if (nodes_order_json != '[') {
                                 nodes_order_json = nodes_order_json.slice(0, -1);
                                 nodes_order_json += ']';
                                 Timeline.updateMilestoneWeeks(nodes_order_json);
                             }
                             grid.getSelectionModel().setSelectedRanges([]);
                             grid.setData(data);
                             Timeline.renderGrid();
                         }
 
                    }// end of context length check   
                    else if(val.toLowerCase() == 'clear' || typeof renderOptions_Phases[val] != 'undefined' || val.toLowerCase() == 'unmerge') {
                         var nodes_order_json = '[';
                         if(val.toLowerCase() == 'clear') {
                             var rowId = data[context_data.row].id;
                             var field = columns[context_data.cell].field;
                             var meta_info = Timeline.fixedRowsTypes[rowId];
                             data[context_data.row][columns[context_data.cell].field] = '';
                             if (typeof meta_info != 'undefined') {
                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                 if (typeof colorCodePostFix != 'undefined') {
                                     data[context_data.row][columns[context_data.cell].field + colorCodePostFix] = '';
                                     //Timeline.triggerUpdateColorCode(field, val, rowId);
                                     grid.invalidateRow(context_data.row);
                                 }
                             }
                             nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"", "colorCode":""},';
                         } else if(val.toLowerCase() == 'unmerge') {
                             var phaseText = data[context_data.row][columns[context_data.cell].field];
                             var rowid = data[context_data.row].id;
                             var meta_info = Timeline.fixedRowsTypes[rowid];
                             for(var cellValue = context_data.cell+1; cellValue <= columns.length - 1; cellValue++) {
                                 var phaseText1 = data[context_data.row][columns[cellValue].field];
                                 if(phaseText == phaseText1) {
                                     data[context_data.row][columns[cellValue].field] = '';
                                     if (typeof meta_info != 'undefined') {
                                        var colorCodePostFix = meta_info.colorcodepostfix;
                                        if (typeof colorCodePostFix != 'undefined') {
                                            data[context_data.row][columns[cellValue].field + colorCodePostFix] = '';
                                        }
                                    }
                                    nodes_order_json += '{"weekId":"' + columns[cellValue].field + '", "type":"' + rowid.toLowerCase() + '", "value":"", "colorCode":""},';
                                 } else {
                                     break;
                                 }
                             }
                             grid.invalidateRow(context_data.row);
                         } else {
                             var rowId = data[context_data.row].id;
                             var field = columns[context_data.cell].field;
                             var meta_info = Timeline.fixedRowsTypes[rowId];
                             var phaseText = data[context_data.row][columns[context_data.cell].field];
                             data[context_data.row][columns[context_data.cell].field] = val;
                             if (typeof meta_info != 'undefined') {
                                 var colorCodePostFix = meta_info.colorcodepostfix;
                                 if (typeof colorCodePostFix != 'undefined') {
                                     data[context_data.row][columns[context_data.cell].field + colorCodePostFix] = renderOptions_Phases[val];
                                     //Timeline.triggerUpdateColorCode(field, val, rowId);
                                     grid.invalidateRow(context_data.row);
                                 }
                             }
                            nodes_order_json += '{"weekId":"' + field + '", "type":"' + rowId.toLowerCase() + '", "value":"'+ val +'", "colorCode":"' + renderOptions_Phases[val] + '"},';
                            
                             for(var cellValue = context_data.cell+1; cellValue <= columns.length - 1; cellValue++) {
                                 var phaseText1 = data[context_data.row][columns[cellValue].field];
                                 if(phaseText1 != '' && phaseText == phaseText1) {
                                     data[context_data.row][columns[cellValue].field] = val;
                                     var meta_info = Timeline.fixedRowsTypes[rowId];
                                     if (typeof meta_info != 'undefined') {
                                        var colorCodePostFix = meta_info.colorcodepostfix;
                                        if (typeof colorCodePostFix != 'undefined') {
                                            data[context_data.row][columns[cellValue].field + colorCodePostFix] = renderOptions_Phases[val];
                                        }
                                    }
                                    nodes_order_json += '{"weekId":"' + columns[cellValue].field + '", "type":"' + rowId.toLowerCase() + '", "value":"'+ val +'", "colorCode":"' + renderOptions_Phases[val] + '"},';
                                 } else {
                                     break;
                                 }
                             }
                         }
                         // do a database update for milestone and phase color code update
                         if (nodes_order_json != '[') {
                             nodes_order_json = nodes_order_json.slice(0, -1);
                             nodes_order_json += ']';
                             Timeline.updateMilestoneWeeks(nodes_order_json);
                         }
                         grid.setData(data);
                         Timeline.renderGrid();
                
                     } 
                 }//end of is button check  
        
        
    }, 
    triggerUpdateColorCode: function(field, val, rowId){
        if(rowId.toLowerCase() == Timeline.fixedRowsTypes.phase.id){
            Timeline.updatePhaseColorCode(field, val);
        }else if(rowId.toLowerCase() == Timeline.fixedRowsTypes.milestone.id){
            Timeline.updateMilestoneColorCode(field, val);
        }else if(rowId.toLowerCase() == Timeline.fixedRowsTypes.milestone1.id){
            Timeline.updateMilestoneColorCode1(field, val);
        }else if(rowId.toLowerCase() == Timeline.fixedRowsTypes.milestone2.id){
            Timeline.updateMilestoneColorCode2(field, val);
        }
    },
    
    
    triggerUpdateCell: function(field, rowId, val, row, cell){
        
        val = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        if(rowId.toLowerCase() == Timeline.fixedRowsTypes.phase.id){
            
            var cellNode = grid.getCellNode(row, cell);
            //alert($(cellNode).css('background-color'));
            var colorCode = $(cellNode).css('background-color');
            colorCode = (val == '' ? 'transparent' : colorCode);
            data[row][columns[cell].field + Timeline.fixedRowsTypes.phase.colorcodepostfix] = colorCode;
            Timeline.updatePhaseAndColorCode(field, val, colorCode);
            
            //Timeline.updatePhase(field, val); 
        }else if(rowId.toLowerCase() == Timeline.fixedRowsTypes.milestone.id){
            Timeline.updateMilestone(field, val);
        }else if(rowId.toLowerCase() == Timeline.fixedRowsTypes.milestone1.id){
            Timeline.updateMilestone1(field, val);
        }else if(rowId.toLowerCase() == Timeline.fixedRowsTypes.milestone2.id){
            Timeline.updateMilestone2(field, val);
        }else if(field.toLowerCase() == 'skill'){
            Timeline.updateSkill(rowId, val);    
        }else{
           Timeline.updateHours(field, rowId, val);
        }
    },
    
    
    
    
    onAddNewRowHandler: function(e, args) {
        //var item = args.item;
        //var column = args.column;
        //grid.invalidateRow(data.length);
        //data.push(item);
        //grid.updateRowCount();
        //Timeline.renderGrid();
    },
    
    onHeaderMenuCommandHandler: function(e, args) {

        if (args.command === 'insert_1_right') {
            Timeline.addMoreColumnsOnRight(args.column.id, 1);
        }
        if (args.command === 'insert_2_right') {
            Timeline.addMoreColumnsOnRight(args.column.id, 2);
        }
        if (args.command === 'insert_3_right') {
            Timeline.addMoreColumnsOnRight(args.column.id, 3);
        }
        if (args.command === 'insert_5_right') {
            Timeline.addMoreColumnsOnRight(args.column.id, 5);
        }
        if (args.command === 'insert_10_right') {
            Timeline.addMoreColumnsOnRight(args.column.id, 10);
        }

        if (args.command === 'insert_1_left') {
            Timeline.addMoreColumnsOnLeft(args.column.id, 1);
        }
        if (args.command === 'insert_2_left') {
            Timeline.addMoreColumnsOnLeft(args.column.id, 2);
        }
        if (args.command === 'insert_3_left') {
            Timeline.addMoreColumnsOnLeft(args.column.id, 3);
        }
        if (args.command === 'insert_5_left') {
            Timeline.addMoreColumnsOnLeft(args.column.id, 5);
        }
        if (args.command === 'insert_10_left') {
            Timeline.addMoreColumnsOnLeft(args.column.id, 10);
        }

        if (args.command === 'delete_column') {
            var respond = confirm("Deleting a column will delete all the data for this week/column!!! \nAre you sure you want to delete?");
            if(respond == true) Timeline.deleteColumn(args.column.id);
        }

    },
    
    

    onPasteCellsHandler: function(e, args) {
        
        var from = args.ranges[0];
        var to = args.ranges[0];
        var val;
        


        var nodes_order_json = '[';
        
        for (var i = 0; i <= from.toRow - from.fromRow; i++) {
            for (var j = 0; j <= from.toCell - from.fromCell; j++) {
                if (i <= to.toRow - to.fromRow && j <= to.toCell - to.fromCell) {

                    if(typeof columns[to.fromCell + j] && typeof data[(to.fromRow + i)] != 'undefined' && 
                              typeof columns[to.fromCell + j].usedForCalculation != 'undefined' && 
                              columns[to.fromCell + j].usedForCalculation == true &&
                              typeof data[to.fromRow + i].id != 'undefined' && 
                              typeof columns[to.fromCell + j].field != 'undefined'
                              && data[to.fromRow + i].id != Timeline.fixedRowsTypes.capacityneedsperphase.id
                              && data[to.fromRow + i].id != Timeline.fixedRowsTypes.hoursperphase.id
                              && data[to.fromRow + i].id != Timeline.fixedRowsTypes.total.id){ 
                        
                        if(args.oneCellToMultiple){
                            val = args.clippedRange[0][0];
                        }
                        else{
                            val = args.clippedRange[i][j];
                        }
                        
                        var rowId = data[to.fromRow + i].id;
                        var field = columns[to.fromCell + j].field;

						var cCode = "";
                        
                        
                        if(typeof args.copiedRanges != 'undefined' && sessionStorage.getItem("isSameText") == 'true'){
                            var copied_rowId = data[args.copiedRanges[0].fromRow + i].id;
                            var copied_meta_info = Timeline.fixedRowsTypes[copied_rowId];
                            if (typeof copied_meta_info != 'undefined') {
                              var colorCodePostFix = copied_meta_info.colorcodepostfix;
                              if (typeof colorCodePostFix != 'undefined') {
                                 cCode = data[args.copiedRanges[0].fromRow + i][columns[args.copiedRanges[0].fromCell + j].field + colorCodePostFix]
                              }
                            }
                            
                            if(typeof cCode != 'undefined' && cCode != null && cCode != ""){
                                var meta_info = Timeline.fixedRowsTypes[rowId];
                                //console.log(cCode);
                                if (typeof meta_info != 'undefined') {
                                    var colorCodePostFix = meta_info.colorcodepostfix;
                                    //console.log(colorCodePostFix);
                                    if (typeof colorCodePostFix != 'undefined') {
                                        //console.log((to.fromRow + i)+'===='+(to.fromCell + j));
                                        data[to.fromRow + i][columns[to.fromCell + j].field + colorCodePostFix] = cCode;
                                    }
                                }
                            }
                        }

                        if(rowId.toLowerCase() != Timeline.fixedRowsTypes.phase.id || typeof renderOptions_Phases[val] != 'undefined') {
                            if(rowId.toLowerCase() != Timeline.fixedRowsTypes.milestone.id 
                                    && rowId.toLowerCase() != Timeline.fixedRowsTypes.milestone1.id 
                                    && rowId.toLowerCase() != Timeline.fixedRowsTypes.milestone2.id
                                    && rowId.toLowerCase() != Timeline.fixedRowsTypes.phase.id
                                    && ((typeof val != undefined && !Timeline.numFieldValidator(val).valid) || val == '')){
                                val = '0';
                            }
                            
                            if(typeof val == 'undefined' || val == 'undefined'){
                                val = '';
                            }
                            
                            //console.log(val);
                            data[to.fromRow + i][columns[to.fromCell + j].field] = val;
                           
                            nodes_order_json += '{"rowId":"' + rowId + '", "cellId":"' + field + '", "value":"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '", "colorCode":"' + cCode + '"},';
                            grid.invalidateRow(to.fromRow + i);
                        }
                        
                    }
                }
            }
        }
        
        if (nodes_order_json != '[') {
            nodes_order_json = nodes_order_json.slice(0, -1);
            nodes_order_json += ']';
            Timeline.updateResourceWeeks(nodes_order_json);
            grid.setData(data);
        }
        Timeline.renderGrid();
    },
    
    onBeforeMoveRowsHandler: function(e, data) {
        for (var i = 0; i < data.rows.length; i++) {
            // no point in moving before or after itself
            if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
                e.stopPropagation();
                return false;
            }
        }
        return true;
    },
    
    onMoveRowsHandler : function(e, args) {
        // stop the row movement of first fixed Rows
        if(args.insertBefore < Timeline.fixedRows || args.rows < Timeline.fixedRows){
            e.stopPropagation();
            return false;
        }
        var extractedRows = [],
            left, right;
        var rows = args.rows;
        var insertBefore = args.insertBefore;
        left = data.slice(0, insertBefore);
        right = data.slice(insertBefore, data.length);

        rows.sort(function(a, b) {
            return a - b;
        });

        for (var i = 0; i < rows.length; i++) {
            extractedRows.push(data[rows[i]]);
        }

        rows.reverse();

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row < insertBefore) {
                left.splice(row, 1);
            } else {
                right.splice(row - insertBefore, 1);
            }
        }

        data = left.concat(extractedRows.concat(right));

        var selectedRows = [];
        for (var i = 0; i < rows.length; i++)
            selectedRows.push(left.length + i);

        grid.resetActiveCell();
        Timeline.bindMetadata();
        grid.setData(data);
        grid.setSelectedRows(selectedRows);
        Timeline.renderGrid();
        Timeline.reOrderResources(data);
    },
    
    onBeforeEditCellHandler: function(e, args) {
        // make row un-editable [rows such as weekname, total]
        
      //if (typeof data[args.row] != 'undefined' && (data[args.row].id === Timeline.fixedRowsTypes.weekname.id || data[args.row].id === Timeline.fixedRowsTypes.total.id)) {
      //      return false;
      //}
      //if (typeof data[args.row] != 'undefined')
      
     
      
      if (typeof data[args.row] != 'undefined' && 
           typeof data[args.row].id != 'undefined' && 
           typeof Timeline.fixedRowsTypes[data[args.row].id.toLowerCase()] != 'undefined' && 
           typeof Timeline.fixedRowsTypes[data[args.row].id.toLowerCase()].editable != 'undefined' &&
           Timeline.fixedRowsTypes[data[args.row].id.toLowerCase()].editable == false) {
          return false;
      }else if(typeof data[args.row] != 'undefined' && 
           typeof data[args.row].id != 'undefined' && 
           typeof Timeline.fixedRowsTypes[data[args.row].id.toLowerCase()] != 'undefined'){
            
            Timeline.cellOldText = data[args.row][grid.getColumns()[args.cell].field];
      }
      
    },
    
    onCellChangeHandler: function(e, args){
        var field = grid.getColumns()[args.cell].field;
        
        if (field != 'e2Resource' && field != 'autofill') {
            var item = args.item;
            var column = args.cell;
            var row = args.row;
            var value = data[args.row][grid.getColumns()[args.cell].field];
            var rowId = item.id;
            //alert(value);
            if(typeof data[args.row] != 'undefined' && 
                typeof data[args.row].id != 'undefined' && 
                typeof Timeline.fixedRowsTypes[data[args.row].id.toLowerCase()] != 'undefined'){
                
                var meta_info = Timeline.fixedRowsTypes[rowId];
                var colorCodePostFix = meta_info.colorcodepostfix;
                var cCode = '';
                if(typeof data[args.row][columns[column].field + colorCodePostFix] != 'undefined'){
                   cCode = data[args.row][columns[column].field + colorCodePostFix];
                }
                var nodes_order_json = '[';
                nodes_order_json += '{"weekId":"' + columns[column].field + '", "type":"' + rowId.toLowerCase() + '", "value":"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '", "colorCode":"' + cCode + '"},';
                for(var cellValue = column + 1; cellValue <= columns.length - 1; cellValue++) {
                    var cellText = data[args.row][columns[cellValue].field];
                    if(cellText != '' && cellText == Timeline.cellOldText) {
                        data[args.row][columns[cellValue].field] = value;
                        nodes_order_json += '{"weekId":"' + columns[cellValue].field + '", "type":"' + rowId.toLowerCase() + '", "value":"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '", "colorCode":"' + cCode + '"},';
                    } else {
                         break;
                    }
                }
                if (nodes_order_json != '[') {
                    nodes_order_json = nodes_order_json.slice(0, -1);
                    nodes_order_json += ']';
                    Timeline.updateMilestoneWeeks(nodes_order_json);
                }
                grid.invalidateRow(args.row);
            }else if (rowId && field) {
                Timeline.triggerUpdateCell(field, rowId, value, row, column);   
            }
        }
        
        //console.log('cellchange');
        grid.setData(data);
        Timeline.renderGrid();
        
    },
    
    
    numFieldValidator : function(value) {
        if (value == null || value == undefined || !value.length || !(/\D/.test(value))) {
          //if((value != null || value != undefined || value.length) && value > Timeline.maxHours){
            // return {valid: false, msg: "More than 40 not allowed"};    
          //}else{
             return {valid: true, msg: null};   
          //}   
        } else {
          return {valid: false, msg: "This requires only number"};
        }
    },
    textFieldValidator : function(value) {
       
             return {valid: true, msg: null};   
          
    },
    waitingFormatter : function (row, cell, value, columnDef, dataContext) {
        
        if(typeof dataContext.id != 'undefined' && typeof Timeline.fixedRowsTypes[dataContext.id.toLowerCase()] != 'undefined') return '';
        
        return '';
        //return 'wait..';
    },

   onResourceSelectionChange: function(event, ui, id) {
        
    	var cost = ui.item.cost;
    	var rate = ui.item.discountedRate;
    	var role = ui.item.e1resource;
    	var e2role = ui.item.resource;
    	var rateCode = ui.item.code == undefined ? '' : ui.item.code;
    	var estimateRateCardId = ui.item.id == 'undefined' ? '' : ui.item.id; 
    	
    	var order = 1; //this is just dummy setting here; actually set before calling ajax to server
    	var skill = '';
        //console.log('COST:::' + cost);
    	if (id.toLowerCase().indexOf('new') != -1) {
    		Timeline.addRow(estimateId, order, cost, rate, role, e2role, skill, rateCode, estimateRateCardId);
    	} else {
    		Timeline.updateRow(estimateId, id, role, e2role, skill, rateCode, cost, rate,  estimateRateCardId);
    	}
    
    },

    
    getHoursSum: function(cellNode, row, dataContext, colDef){
            var rowData = data[row];
            var sum = 0;
            $.each(columns, function(indx1, colItem) {
                if(indx1 >= Timeline.fixedColumns && typeof colItem.usedForCalculation != 'undefined' && colItem.usedForCalculation){
                    //sum += parseInt(isNaN(rowData[colItem.field]) ? 0 : rowData[colItem.field]);
                    sum += (typeof rowData[colItem.field] == 'undefined' || rowData[colItem.field] == '' ? 0 : parseInt(rowData[colItem.field]));
                }
            });
            //console.log(str);
            return sum;
    },
    getSumOfHoursForAllRows: function(cellNode, row, dataContext, colDef){
        var sum = 0;
        var rowData = data.slice(Timeline.fixedRows);
        var colData = columns.slice(Timeline.fixedColumns);
        $.each(rowData, function(indx, rowItem) {
            $.each(colData, function(indx1, colItem) {
               if(!colItem.notUsedForCalculation) {
                   sum += (typeof rowItem[colItem.id] == 'undefined' || rowItem[colItem.id] == ''? 0 : parseInt(rowItem[colItem.id]));
               }
            });
        });
        return sum;
    },
    getSumOfBelowRows: function(cellNode, row, dataContext, colDef){
        var sum = 0;
        var rowData = data.slice(row + 1);
         $.each(rowData, function(indx, rowItem) {
            sum += (typeof rowItem[colDef.id] == 'undefined' || rowItem[colDef.id] == ''? 0 : parseInt(rowItem[colDef.id]));
         });
         
         return sum;
    },
    getAvgOfBelowRows: function(cellNode, row, dataContext, colDef){
        var sum = 0;
        var rowData = data.slice(row + 1);
         $.each(rowData, function(indx, rowItem) {
            sum += (typeof rowItem[colDef.id] == 'undefined' || rowItem[colDef.id] == ''? 0 : parseInt(rowItem[colDef.id]));
         });
         
         return parseFloat(sum/rowData.length).toFixed(2);
    },
   
    getEstimateRateCards: function(estimateId){
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "getEstimateRateCards", {
            estimateId: estimateId
        }, Timeline.getEstimateRateCards_Callback);
        
    }, 
    getEstimateRateCards_Callback: {
         onSuccess: function(result) {
             Timeline.rt_json = [];
            //result = (result.length > 0 ? result[0] : result); 
            $.each(result, function(indx, row) {
                var e1resource = row.Region__c + ' - ' + row.Resource_Role__c;
                var resource = row.Practice__c + ' - ' + e1resource;
                var json_obj = {};
                json_obj['id'] = row.Id;
                json_obj['practice'] = row.Practice__c;
                json_obj['region'] = row.Region__c;
                json_obj['role'] = row.Resource_Role__c;
                json_obj['code'] = row.Code__c;
                
                // 12/26: RJ: Added Resource Level field changes 
                json_obj['level'] = '';
                if(typeof row.Resource_Level__c != 'undefined' && row.Resource_Level__c != ''){ 
                    json_obj['level'] = row.Resource_Level__c;
                    resource += ' - ' + row.Resource_Level__c;
                }
                
                // rate card rate
                json_obj['suggestedRate'] = row.Bill_Rate__c;
                // custom/editable bill rate
                json_obj['discountedRate'] = row.Discounted_Rate__c;
                // resource cost
                json_obj['cost'] = row.Resource_Cost__c;
                json_obj['e1resource'] = e1resource;
                json_obj['resource'] = resource;
                
                
                
                Timeline.rt_json.push(json_obj);
            });
            
            // clear the initital array
            result = [];
            Timeline.init(estimateId);
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
        
    },
    init: function(estimateId) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
            estimateId: estimateId
        }, Timeline.initCallback);
    },
    initCallback: {
        onSuccess: function(result) {
            //result = (result.length > 0 ? result[0] : result); 
            columns = Timeline.getDefaultColumns();
            
            if(result.length == 0) $('#build_div').show();
            
            $.each(result, function(indx, column) {
                columns.push(Timeline.defineAddPropForColumn(column));
                if (indx === 0) {
                    $("#datepicker").datepicker('setDate', new Date(column.sDate));
                    $('#build_div').hide();
                };
            });
            
            
            // clear the initital array
            result = [];
            
            columns = columns.concat(Timeline.getEndColumns());
            // set the grid's columns as the new columns
            grid.setColumns(columns);
            
            // when columns are now in; go for grid init
            grid.init();
            
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                estimateId: estimateId
            }, Timeline.getRows_CallBack);
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }

    },
    defineAddPropForColumn : function(column){
        column.header = JSON.parse(column.header);
        column.editor = Slick.Editors.Text;
        column.width = parseInt(column.width);
        column.order = parseInt(column.order);
        column["usedForCalculation"] = true;
        column["headerCssClass"] = "Fixed-Header-Style";
        // 09/23: RJ Added below line for applying css on hours column too. 
        column["cssClass"] = "hours-cell-style-text-center";
        column["validator"] = Timeline.numFieldValidator;
        column.asyncPostRender = function(cellNode, row, dataContext, colDef) {
                //console.log('postrender');
                if(row < Timeline.fixedRows){
                     if(data[row].id == Timeline.fixedRowsTypes.total.id){
                        var sum = 0;
                        var rowData = data.slice(row + 1);
                         $.each(rowData, function(indx, rowItem) {
                            sum += (typeof rowItem[colDef.id] == 'undefined' || rowItem[colDef.id] == ''? 0 : parseInt(rowItem[colDef.id]));
                         });
                         $(cellNode).empty().html(sum).addClass('slds-totalhrsperweek-cell');;//.css({'text-align' : 'center', 'background-color': '#666666', 'color' : '#fff'});
                     }
                     
                     
                     //var capacityNeeds_JSON = {"PhaseHours" : {"Plan" : "171.0","Build" : "50.0"},"RoleHours" : {"BI Architect" : "101.0","BI Business Analyst" : "10.0","Business Analyst - Jaipur" : "60.0","Developer" : "50.0"},"TotalHours" : "221.0"};    
                     
                     if(data[row].id == Timeline.fixedRowsTypes.capacityneedsperphase.id){
                         var sum = 0;
                         //console.log(data[Timeline.fixedRowsTypes.phase.rowIndex]);
                         var selectedPhase = data[Timeline.fixedRowsTypes.phase.rowIndex][colDef.id];
                         if(typeof selectedPhase != 'undefined' && selectedPhase != ''){
                             $(cellNode).css({'text-align' : 'center', 'background-color': (typeof renderOptions_Phases[selectedPhase] == 'undefined' ? '' : renderOptions_Phases[selectedPhase]), 'color' : '#fff'});
                             selectedPhase = selectedPhase.toLowerCase();
                             if(typeof capacityNeeds_JSON != 'undefined' && 
                                            typeof capacityNeeds_JSON.PhaseHours != 'undefined' &&
                                            typeof capacityNeeds_JSON.PhaseHours[selectedPhase] != 'undefined'){
                                          sum = capacityNeeds_JSON.PhaseHours[selectedPhase];
                             }
                             $(cellNode).empty().html(sum);  
                         }else{
                           $(cellNode).css({'text-align' : 'center', 'background-color': '', 'color' : ''});  
                           $(cellNode).empty().html('');
                         }
                         //$(cellNode).empty().html(sum).css(Timeline.capacityneeds_cols_css);
                     }
                     
                     
                     if(data[row].id == Timeline.fixedRowsTypes.hoursperphase.id){
                                 var sum = 0;
                                 var selectedPhase = data[Timeline.fixedRowsTypes.phase.rowIndex][colDef.id];
                                 if(selectedPhase != ''){
                                     var rowData = data.slice(Timeline.fixedRows);
                                     var colData = columns.slice(Timeline.fixedColumns);
                                     $.each(rowData, function(indx, rowItem) {
                                        var row_sum = 0; 
                                        $.each(colData, function(indx1, colItem) {
                                           if(typeof selectedPhase != 'undefined' && 
                                                       typeof data[Timeline.fixedRowsTypes.phase.rowIndex] != 'undefined' && 
                                                       typeof data[Timeline.fixedRowsTypes.phase.rowIndex][colItem.id] != 'undefined' && 
                                                       data[Timeline.fixedRowsTypes.phase.rowIndex][colItem.id].toLowerCase() == selectedPhase.toLowerCase() && 
                                                       (typeof colItem.notUsedForCalculation == 'undefined' || !colItem.notUsedForCalculation)) {
                                               row_sum += (typeof rowItem[colItem.id] == 'undefined' || rowItem[colItem.id] == ''? 0 : parseInt(rowItem[colItem.id]));
                                           }       
                                        });
                                        sum += parseInt(row_sum);
                                     });
                                     $(cellNode).css({'text-align' : 'center', 'background-color': (typeof renderOptions_Phases[selectedPhase] == 'undefined' ? '' : renderOptions_Phases[selectedPhase]), 'color' : '#fff'});
                                     $(cellNode).empty().html(sum);  
                                 }else{
                                      $(cellNode).css({'text-align' : 'center', 'background-color': '', 'color' : ''});  
                                      $(cellNode).empty().html('');
                                 }
                                 //$(cellNode).empty().css(Timeline.hoursperphase_cols_css);
                     }
                     
                     
                     var meta_info = Timeline.fixedRowsTypes[data[row].id];
                      if(typeof meta_info != 'undefined'){
                          var colorCodePostFix = meta_info.colorcodepostfix;
                          var apply_css = meta_info.apply_css;
                          
                          if(meta_info.id == Timeline.fixedRowsTypes.phase.id){
                              $(cellNode).css({'background-color': '', 'color' : '#000000'});
                              var phase_value = data[row][colDef.id];
                              if(typeof renderOptions_Phases != 'undefined' && typeof phase_value != 'undefined' && typeof renderOptions_Phases[phase_value] != 'undefined') $(cellNode).css({'background-color': renderOptions_Phases[phase_value], 'color' : '#FFFFFF'});
                            
                          }else if(typeof colorCodePostFix != 'undefined' && typeof apply_css != 'undefined' && apply_css == true){
                               var backgroundColor = data[row][colDef.id + colorCodePostFix]; 
                               $(cellNode).css({'background-color': '', 'color' : '#000000'}); 
                               if(typeof backgroundColor != 'undefined') $(cellNode).css({'text-align' : 'center', 'background-color': backgroundColor, 'color' : (backgroundColor == '' ? '#000' : '#eee')});
                          }
                      }
                      
                }else{
                    return;
                }
        };
        
        
        return column;
    },
    getColumns_Callback: {
        onSuccess: function(result) {
            //result = (result.length > 0 ? result[0] : result); 
            columns = Timeline.getDefaultColumns();
            
            if(result.length == 0) $('#build_div').show();
            
            $.each(result, function(indx, column) {
                columns.push(Timeline.defineAddPropForColumn(column));
                if (indx === 0) {
                    $("#datepicker").datepicker('setDate', new Date(column.sDate));
                    $('#build_div').hide();
                };
            });
            // clear the initital array
            result = [];
            // set the grid's columns as the new columns
            columns = columns.concat(Timeline.getEndColumns());
            grid.setColumns(columns);
             // when columns are now in; go for grid init
            grid.init();
            loader.hide();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }

    },
    getRows: function() {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
            estimateId: estimateId
        }, Timeline.getRows_CallBack);
    },
    
    
    
    getRows_CallBack: {
        onSuccess: function(result) {
            data = [];
            
            
            for(var _a in Timeline.fixedRowsTypes){
                var row = {
                    id : _a
                };
                
                $.each(columns, function(indx1, colRow) {
                    if(indx1 >= Timeline.fixedColumns){
                      //console.log('phase' + indx1 + ':' + (typeof colRow.phase == 'undefined' || colRow.phase == null ? '' : colRow.phase));    
                      var meta_info = Timeline.fixedRowsTypes[row.id];
                      if(typeof meta_info != 'undefined'){
                          row[colRow.id] = meta_info.defaultValue;
                          var valueField = meta_info.valuefield;
                          var colorCodeField = meta_info.colorcodefield;
                          var colorCodePostFix = meta_info.colorcodepostfix;
                          if(typeof valueField != 'undefined'){
                            row[colRow.id] = (typeof colRow[valueField] == 'undefined' || colRow[valueField] == null ? '' : colRow[valueField]);  
                          } 
                          
                          if(typeof colorCodeField != 'undefined' && typeof colorCodePostFix != 'undefined'){
                            row[colRow.id + colorCodePostFix] = (typeof colRow[colorCodeField] == 'undefined' || colRow[colorCodeField] == null ? '' : colRow[colorCodeField]); 
                          }
                      }
                    }        
                });
                data.push(row);
                
            }
            
           
            $.each(result, function(indx, row) {
                row.cost = parseFloat(row.cost).toFixed(2);
                row.rate = parseFloat(row.rate).toFixed(2);
                if (typeof row.colRows != 'undefined') {
                    if (row.colRows.constructor === Array) {
                        $.each(row.colRows, function(indx1, colRow) {
                            row[colRow.columnId] = parseInt(colRow.hours);
                        });
                    } else {
                        row[row.colRows.columnId] = parseInt(row.colRows.hours);
                    }
                }
                
                data.push(row);
            });

            // clear the initital array
            result = [];
             
            Timeline.bindMetadata();                      
            grid.setData(data);
            Timeline.renderGrid();
            //grid.init();
            loadSpinner.hide();
            loader.hide();
        },
        onFailure: function(error) {
            alert(error);
            loadSpinner.hide();
            loader.hide();
        }

    },
    onStartDateSelectionChange: function(sDate) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "onStartDateSelectionChange", {
            estimateId: estimateId,
            sDate: sDate,
            order: 1,
            name: 'Week1'
        }, Timeline.onStartDateSelectionChange_Callback);
    },

    onStartDateSelectionChange_Callback: {
        onSuccess: function(result) {
            //alert('in in in');
            //alert(result);
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            
            // process success
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);

        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    addMoreColumnsOnRight: function(weekId, noOfColumnsToAdd) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "addMoreColumnsOnRight", { 
            estimateId: estimateId,
            weekId: weekId,
            noOfColumnsToAdd: noOfColumnsToAdd
        }, Timeline.addMoreColumnsOnRight_Callback);
    },
    addMoreColumnsOnRight_Callback: {
        onSuccess: function(result) {
            
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            
            // Refresh top panel on estimate on resource change
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            // process success
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);
            
            Timeline.refreshTimelineSummaryOnParentWindow();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    addMoreColumnsOnLeft: function(weekId, noOfColumnsToAdd) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "addMoreColumnsOnLeft", {
            estimateId: estimateId,
            weekId: weekId,
            noOfColumnsToAdd: noOfColumnsToAdd
        }, Timeline.addMoreColumnsOnLeft_Callback);
    },
    addMoreColumnsOnLeft_Callback: {
        onSuccess: function(result) {
            
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            
            // Refresh top panel on estimate on resource change
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            // process success
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);
            
            Timeline.refreshTimelineSummaryOnParentWindow();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    deleteColumn: function(weekId) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "deleteColumn", {
            estimateId: estimateId,
            weekId: weekId
        }, Timeline.deleteColumn_Callback);
    },
    deleteColumn_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // Refresh top panel on estimate on resource change
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);
            
            Timeline.refreshTimelineSummaryOnParentWindow();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    deleteRow: function(link) {
        var result = confirm("Are you sure you want to permenantly delete this record!");
        if (result == true) {
            var rowId = ($(link).attr('rowId'));
            loader.show();
            sforce.apex.execute(WEBSERVICE_NAME, "deleteRow", {
                rowId: rowId
            }, Timeline.deleteRow_Callback);
        }
    },
    deleteRow_Callback: {
        onSuccess: function(result) {

            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                estimateId: estimateId
            }, Timeline.getRows_CallBack);
            
            Timeline.refreshTimelineSummaryOnParentWindow();

        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    addRow: function(estimateId, order,
        cost, rate, role, e2role,
        skill, rateCode, estimateRateCardId) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "addRow", {
            estimateId: estimateId,
            order: ((data.length - Timeline.fixedRows) + 1),
            cost: cost,
            rate: rate,
            role: role,
            e2role: e2role,
            skill: skill,
            rateCode: rateCode,
            estimateRateCardId : estimateRateCardId
        }, Timeline.addRow_Callback);
       
    },
    addRow_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // Refresh top panel on estimate on resource change
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);
            Timeline.refreshTimelineSummaryOnParentWindow();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    updateRow: function(estimateId, rowId,
        role, e2role,
        skill, rateCode, cost,rate,estimateRateCardId) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "updateRow", {
            estimateId: estimateId,
            rowId: rowId,
            role: role,
            e2role: e2role,
            skill: skill,
            rateCode: rateCode,
            cost: cost, 
            rate: rate,  
            estimateRateCardId: estimateRateCardId
        }, Timeline.updateRow_Callback);
    },
    updateRow_Callback: {
        onSuccess: function(result) {

            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            //loader.hide();
            // Refresh top panel on estimate on resource change
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            // Because we need rate and cost updated as per the latest selected resource
            // also needed the phases/milestone data too.
             sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);
            
            Timeline.refreshTimelineSummaryOnParentWindow();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    reOrderResources: function(data) {
        if (data.length > 0) {
            loader.show();
            var nodes_order_json = '[';
            
            $.each(data, function(indx, row) {
                // bypass fixedRows count
                if(indx >= Timeline.fixedRows) nodes_order_json += '{"resourceId":"' + row.id + '", "displayOrder":"' + ((indx + 1) - Timeline.fixedRows) + '"},';
            });
            nodes_order_json = nodes_order_json.slice(0, -1);
            nodes_order_json += ']';

            sforce.apex.execute(WEBSERVICE_NAME, "reOrderResources", {
                jsonstr: nodes_order_json
            }, Timeline.reOrderResources_Callback);
        }
    },
    reOrderResources_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            loader.hide();
            Timeline.renderGrid();
            //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
            //    estimateId: estimateId
            //}, Timeline.getRows_CallBack);

        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    updateHours_call_register: {},
    updateHours: function(weekId, resourceId, hours) {
        loader.show();
        var hrs = 0;
        if(hours != '' && !isNaN(hours)) hrs = parseInt(hours);
        Timeline.updateHours_call_register[weekId + '-' + resourceId] = 'hrs';  
        sforce.apex.execute(WEBSERVICE_NAME, "updateHours", {
            weekId: weekId,
            resourceId: resourceId,
            hours: hrs
        }, Timeline.updateHours_Callback);
        
    },
    updateHours_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateHours_call_register && Timeline.updateHours_call_register[result]){ delete Timeline.updateHours_call_register[result];}
            if (Timeline.updateHours_call_register && JSON.stringify(Timeline.updateHours_call_register) == '{}') {
                loader.hide();
                if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
                Timeline.refreshTimelineSummaryOnParentWindow();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            } 
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    
    updateSkill: function(resourceId, skill) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "updateSkill", {
            estimateId: estimateId,
            resourceId: resourceId,
            skill: skill
        }, Timeline.updateSkill_Callback);
        
    },
    
    
    updateSkill_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
           
            loader.hide();
                
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    
    updatePhaseAndColorCode_call_register: {},
    updatePhaseAndColorCode: function(weekId, phase, colorCode) {
        loader.show();
        Timeline.updatePhaseAndColorCode_call_register[weekId] = 'phaseAndColorCode';  
        sforce.apex.execute(WEBSERVICE_NAME, "updatePhaseAndColorCode", {
            weekId: weekId,
            phase: phase,
            colorCode: colorCode
        }, Timeline.updatePhaseAndColorCode_Callback);
        
    },
    updatePhaseAndColorCode_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updatePhaseAndColorCode_call_register && Timeline.updatePhaseAndColorCode_call_register[result]){ delete Timeline.updatePhaseAndColorCode_call_register[result];}
            if (Timeline.updatePhaseAndColorCode_call_register && JSON.stringify(Timeline.updatePhaseAndColorCode_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
            
            Timeline.renderGrid();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    
    
    updatePhase_call_register: {},
    updatePhase: function(weekId, phase) {
        loader.show();
        Timeline.updatePhase_call_register[weekId] = Timeline.fixedRowsTypes.phase.id;  
        sforce.apex.execute(WEBSERVICE_NAME, "updatePhase", {
            weekId: weekId,
            phase: phase
        }, Timeline.updatePhase_Callback);
        
    },
    updatePhase_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updatePhase_call_register && Timeline.updatePhase_call_register[result]){ delete Timeline.updatePhase_call_register[result];}
            if (Timeline.updatePhase_call_register && JSON.stringify(Timeline.updatePhase_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
            
            Timeline.renderGrid();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    updatePhaseColorCode_call_register: {},
    updatePhaseColorCode: function(weekId, phaseColorCode) {
        loader.show();
        Timeline.updatePhaseColorCode_call_register[weekId] = 'phaseColorCode';  
        sforce.apex.execute(WEBSERVICE_NAME, "updatePhaseColorCode", {
            weekId: weekId,
            phaseColorCode: phaseColorCode
        }, Timeline.updatePhaseColorCode_Callback);
        
    },
    updatePhaseColorCode_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updatePhaseColorCode_call_register && Timeline.updatePhaseColorCode_call_register[result]){ delete Timeline.updatePhaseColorCode_call_register[result];}
            if (Timeline.updatePhaseColorCode_call_register && JSON.stringify(Timeline.updatePhaseColorCode_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
            
            Timeline.renderGrid();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    updateMilestone_call_register: {},
    updateMilestone: function(weekId, milestone) {
        loader.show();
        Timeline.updateMilestone_call_register[weekId] = Timeline.fixedRowsTypes.milestone.id; 
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestone", {
            weekId: weekId,
            milestone: milestone
        }, Timeline.updateMilestone_Callback);
        
    },
    updateMilestone_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateMilestone_call_register && Timeline.updateMilestone_call_register[result]){ delete Timeline.updateMilestone_call_register[result];}
            if (Timeline.updateMilestone_call_register && JSON.stringify(Timeline.updateMilestone_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    updateMilestone1_call_register: {},
    updateMilestone1: function(weekId, milestone1) {
        loader.show();
        Timeline.updateMilestone1_call_register[weekId] = Timeline.fixedRowsTypes.milestone1.id; 
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestone1", {
            weekId: weekId,
            milestone1: milestone1
        }, Timeline.updateMilestone1_Callback);
        
    },
    updateMilestone1_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateMilestone1_call_register && Timeline.updateMilestone1_call_register[result]){ delete Timeline.updateMilestone1_call_register[result];}
            if (Timeline.updateMilestone1_call_register && JSON.stringify(Timeline.updateMilestone1_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    updateMilestone2_call_register: {},
    updateMilestone2: function(weekId, milestone2) {
        loader.show();
        Timeline.updateMilestone2_call_register[weekId] = Timeline.fixedRowsTypes.milestone2.id; 
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestone2", {
            weekId: weekId,
            milestone2: milestone2
        }, Timeline.updateMilestone2_Callback);
        
    },
    updateMilestone2_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateMilestone2_call_register && Timeline.updateMilestone2_call_register[result]){ delete Timeline.updateMilestone2_call_register[result];}
            if (Timeline.updateMilestone2_call_register && JSON.stringify(Timeline.updateMilestone2_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    
    updateMilestoneColorCode_call_register: {},
    updateMilestoneColorCode: function(weekId, milestoneColorCode) {
        loader.show();
        Timeline.updateMilestoneColorCode_call_register[weekId] = 'milestonecolor'; 
        
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestoneColorCode", {
                                                                            weekId: weekId,
                                                                            milestoneColorCode: milestoneColorCode
                                                                        }, Timeline.updateMilestoneColorCode_Callback);
        
    },
    updateMilestoneColorCode_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateMilestoneColorCode_call_register && Timeline.updateMilestoneColorCode_call_register[result]){ delete Timeline.updateMilestoneColorCode_call_register[result];}
            if (Timeline.updateMilestoneColorCode_call_register && JSON.stringify(Timeline.updateMilestoneColorCode_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
        },
        onFailure: function(error) {
            alert('ERROR:' + error);
            loader.hide();
        }
    },
   
   updateMilestoneColorCode1_call_register: {},
   updateMilestoneColorCode1: function(weekId, milestoneColorCode1) {
        loader.show();
        Timeline.updateMilestoneColorCode1_call_register[weekId] = 'milestonecolor1'; 
        
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestoneColorCode1", {
                                                                            weekId: weekId,
                                                                            milestoneColorCode1: milestoneColorCode1
                                                                        }, Timeline.updateMilestoneColorCode1_Callback);
        
    },
   updateMilestoneColorCode1_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateMilestoneColorCode1_call_register && Timeline.updateMilestoneColorCode1_call_register[result]){ delete Timeline.updateMilestoneColorCode1_call_register[result];}
            if (Timeline.updateMilestoneColorCode1_call_register && JSON.stringify(Timeline.updateMilestoneColorCode1_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
        },
        onFailure: function(error) {
            alert('ERROR:' + error);
            loader.hide();
        }
    }, 
   
   updateMilestoneColorCode2_call_register: {},
   updateMilestoneColorCode2: function(weekId, milestoneColorCode2) {
        loader.show();
        Timeline.updateMilestoneColorCode2_call_register[weekId] = 'milestonecolor2'; 
        
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestoneColorCode2", {
                                                                            weekId: weekId,
                                                                            milestoneColorCode2: milestoneColorCode2
                                                                        }, Timeline.updateMilestoneColorCode2_Callback);
        
    },
   updateMilestoneColorCode2_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            // if there is no failure; delete respective call registers
            if (Timeline.updateMilestoneColorCode2_call_register && Timeline.updateMilestoneColorCode2_call_register[result]){ delete Timeline.updateMilestoneColorCode2_call_register[result];}
            if (Timeline.updateMilestoneColorCode2_call_register && JSON.stringify(Timeline.updateMilestoneColorCode2_call_register) == '{}') {
                loader.hide();
                //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
                //    estimateId: estimateId
                //}, Timeline.getRows_CallBack);
            }
        },
        onFailure: function(error) {
            alert('ERROR:' + error);
            loader.hide();
        }
    },
   
    updateColorCode: function(jsonstr) {
        loader.show();
        
        sforce.apex.execute(WEBSERVICE_NAME, "updateColorCode", {
            jsonstr: jsonstr
        }, Timeline.updateColorCode_Callback);
        
    },
    
    updateColorCode_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            
            loader.hide();
            //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
            //    estimateId: estimateId
            //}, Timeline.getRows_CallBack);
            Timeline.renderGrid();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    updateMilestoneWeeks: function(jsonstr) {
        loader.show();
        
        sforce.apex.execute(WEBSERVICE_NAME, "updateMilestoneWeeks", {
            jsonstr: jsonstr
        }, Timeline.updateMilestoneWeeks_Callback);
        
    },
    
    updateMilestoneWeeks_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            
            loader.hide();
            //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
            //    estimateId: estimateId
            //}, Timeline.getRows_CallBack);
            Timeline.renderGrid();
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    autoFill: function(jsonstr) {
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "autoFill", {
            jsonstr: jsonstr
        }, Timeline.autoFill_Callback);
    },
    autoFill_Callback: {
        onSuccess: function(result) {

            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            loader.hide();
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            Timeline.refreshTimelineSummaryOnParentWindow();
            //sforce.apex.execute(WEBSERVICE_NAME, "getTimelineRows", {
            //    estimateId: estimateId
            //}, Timeline.getRows_CallBack);

        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    updateEstimateRateCards: function(){
        loadSpinner.show();
        // invoke action function
        updateEstimateRateCards();
        return false;
    },
    updateEstimateRateCards_complete: function(){
        loadSpinner.hide();
        makeManageRateCardsCollapsible();
        applyNumericValidation();
        CustomAlert.show('Rate card has been successfully updated!!!');
        tabpanel.showTimelineTab();
        if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
        reFreshGrid();
        Timeline.refreshTimelineSummaryOnParentWindow();
    },
    refreshRateCardRatesAndCost: function(){
        if(!confirm('Refreshing cost and rate will updated existing rate card entries with the latest rates & cost in the system!!\nAre you sure you want to try this?')){
            return false;
        }
        loadSpinner.show();
        // invoke action function
        refreshRateCardRatesAndCost();
        return false;
    },
    refreshRateCardRatesAndCost_complete: function(){
        loadSpinner.hide();
        makeManageRateCardsCollapsible();
        applyNumericValidation();
        CustomAlert.show('Rate card has been successfully refreshed!!!');
        tabpanel.showTimelineTab();
        if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel();
        reFreshGrid();
        Timeline.refreshTimelineSummaryOnParentWindow();
    },
    build: function(){
        $('#datepicker').parent().removeClass('slds-has-error');
        var dateText = $("#datepicker").datepicker('getDate');
        // check that date is supplied before build progress
        if(dateText == null){
            $('#datepicker').parent().addClass('slds-has-error');
            return false;
        }
        
        var sDate = new Date(dateText).toYYYYMMDD();
        var noOfColumnsToAdd = $('#no_of_weeks').val();
        
        loader.show();
        sforce.apex.execute(WEBSERVICE_NAME, "onBuild", {
            estimateId: estimateId,
            sDate: sDate,
            noOfColumnsToAdd: noOfColumnsToAdd
        }, Timeline.onbuild_Callback);
        
        return false;
        //onBuild(string estimateId, string sDate, integer noOfColumnsToAdd)
    },
    onbuild_Callback: {
        onSuccess: function(result) {

            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            loader.hide();
            
            // process success
            sforce.apex.execute(WEBSERVICE_NAME, "getTimelineColumns", {
                estimateId: estimateId
            }, Timeline.initCallback);

        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    
    updateResourceWeeks: function(jsonstr) {
        loader.show();
        
        sforce.apex.execute(WEBSERVICE_NAME, "updateResourceWeeks", {
            jsonstr: jsonstr
        }, Timeline.updateResourceWeeks_Callback);
        
    },
    
    updateResourceWeeks_Callback: {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                var exception = 'INSUFFICIENT_ACCESS_OR_READONLY';
                if (result.toLowerCase().indexOf(exception.toLowerCase()) != -1) {
                    alert(result); //CustomAlert.showError('Reparenting Failed: You do not have permission to reparent this scope!!! Please contact scope owner for reparenting!!');    
                } else {
                    alert(result);
                }
                loader.hide();
                return;
            }
            if(typeof refreshOverviewPanel === 'function') refreshOverviewPanel(); 
            Timeline.renderGrid();
            Timeline.refreshTimelineSummaryOnParentWindow();
            loader.hide();
            
        },
        onFailure: function(error) {
            alert(error);
            loader.hide();
        }
    },
    refreshTimelineSummaryOnParentWindow : function() {
        //04/17/2017 : RS : resize timeline grid
        window.setTimeout(function(){
            Timeline.resizeGrid();
          },  100);
        // 03/02/2017 : RS : update timeline summary on timeline refresh
        if(parent&&parent.TimelineSummary&&typeof parent.TimelineSummary.refreshTimelineSummaryOnUpdate != 'undefined'){
            parent.TimelineSummary.refreshTimelineSummaryOnUpdate();
        }
        return false;
    },
    updateTimelineName : function(newName) {
        if(typeof timelineName != 'undefined') {
            timelineName = updatedTimelineName;
        }
    }
    
}



var TimelineSummary = {
   json: {}, 
   hoursPerWeek: 0,
   DEV_CAPACITY_PER_DAY_ID : '#devhoursperday',
   domReady : function() {
       
     $(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).keydown(function(event){
        if(event.keyCode == 13) {
          event.stopPropagation();    
          event.preventDefault();
          TimelineSummary.onChange_InputDevHoursPerWeek();
          return false;
        }        
    });
     TimelineSummary.applyNumericValidation();
     TimelineSummary.generateSummarySection();
     TimelineSummary.load();  
   },
   applyNumericValidation : function(){
       /**
	   $('.mandate-numeric').change(function(evt) {	
	        
		    $('body div.slds-error--tooltip').remove();
		    var inputVal = $(this).val();
		    
		    //var numericReg = /^[0-9]*$/;
		    var numericReg = /^[1-9]\d*(\.\d+)?$/;
		    if(!numericReg.test(inputVal)) {
                $(this).val(inputVal.substring(0, inputVal.length - 1)); 
		        $(document.body).append('<div class="slds slds-error--tooltip"><div class="slds slds-popover slds-popover--tooltip slds-nubbin--bottom" role="tooltip"><div class="slds-popover__body">Numeric only.</div></div></div>');
		        var top = $(this).offset().top - $(this).height() + 'px';
		        var left = $(this).offset().left + 'px';
		        $('body div.slds-error--tooltip').css({position : 'absolute', top : top , left : left});
		        
		        $(this).focus(); $(this).select();
		    }
		    
		});
		
		$('.mandate-numeric').blur(function(evt) {
		   $('body div.slds-error--tooltip').remove(); 
		});
		**/
	},
   
   load: function(){
     var hours = 0;
     if($(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).val() != '' && !isNaN($(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).val())) hours = parseInt($(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).val());
     TimelineSummary.calcuateHoursPerWeek(hours);
     TimelineSummary.updatejsonWithWeeks();
     TimelineSummary.renderSummarySection();
   },
   
   generateSummarySection: function(){
      delete TimelineSummary.json;
	  TimelineSummary.json = {};
      var phaseHoursSum = 0;
	  var weekSum = 0;
      for(var _a in capacityNeeds_JSON){
	     if(_a == 'PhaseHours'){			    
			for(var _b in capacityNeeds_JSON[_a]){
			   TimelineSummary.json[_b] = {};
			   var phaseHours = typeof capacityNeeds_JSON[_a][_b] != 'undefined' ? parseInt(capacityNeeds_JSON[_a][_b]) : 0;
			   TimelineSummary.json[_b]['Hours'] = phaseHours;
			   TimelineSummary.json[_b]['Weeks'] = 0;
			   phaseHoursSum += phaseHours;
			   
			}				
		 }		  
	  }
	  
	  TimelineSummary.json['Total'] = {};
	  TimelineSummary.json['Total']['Hours'] = phaseHoursSum;
	  TimelineSummary.json['Total']['Weeks'] = weekSum;
	  
   },
   
   renderSummarySection: function(){
       var html = '';
       document.getElementById('summaryTbody').innerHTML = html;
	   for(var _c in TimelineSummary.json){
	     html +=  '<tr '+ (_c.toLowerCase() == 'total' ? 'style="font-weight:bold;"' : '') + '>';
	     html +=  '<td>' + _c.toUpperCase() + '</td>';
		 html +=  '<td>' + TimelineSummary.json[_c]['Hours'] + '</td>';
		 html +=  '<td>' + TimelineSummary.json[_c]['Weeks'] + '</td>';
		 html +=  '</tr>';			 
	   }
	   document.getElementById('summaryTbody').innerHTML = html;
   },
   
   calcuateHoursPerWeek: function(devHours){
       var totalHours = capacityNeeds_JSON["TotalHours"];
       var role_json = capacityNeeds_JSON['RoleHours'];
	   var hoursPerDay = 0;
	   var hoursPerWeek = 0;
	   var validate = false;
	   // check that developer hours exists and is greater than 0
	   if(typeof role_json['developer'] != 'undefined' && parseInt(role_json['developer']) > 0){
	      validate = true;
	   } 
	   if(validate == true){
		   for(var _a in role_json){
			  if(_a != 'developer'){
			       var roleHours = isNaN(parseInt(role_json[_a])) ? 0 : parseInt(role_json[_a]);
			       var hours = (Math.round(roleHours/parseInt(totalHours)) * parseInt(devHours));
				   hoursPerDay += isNaN(hours) ? 0 : hours;
			  }			  
		   }
		   hoursPerDay += parseInt(devHours);
		   hoursPerWeek = hoursPerDay * 5;
		   TimelineSummary.hoursPerWeek = parseInt(hoursPerWeek);
		   document.getElementById('hoursperweekdiv').innerHTML = hoursPerWeek;
       }
   },
   
   updatejsonWithWeeks: function(){
       var _weekSum = 0;    
       for(var _c in TimelineSummary.json){
            if(_c.toLowerCase() != 'total'){
    	     	var phaseHour = parseInt(TimelineSummary.json[_c]['Hours']);
                TimelineSummary.json[_c]['Weeks'] = TimelineSummary.hoursPerWeek > 0 ? Math.round(phaseHour/TimelineSummary.hoursPerWeek) : 0;
                
                if(TimelineSummary.json[_c]['Weeks'] < 1 && phaseHour > 0 && TimelineSummary.hoursPerWeek > 0){
                      TimelineSummary.json[_c]['Weeks'] = 1;
                }
                
                _weekSum += parseInt(TimelineSummary.json[_c]['Weeks']);
                console.log(_weekSum);
            }
	   }
	   
	  //TimelineSummary.json['Total'] = {};
	  //TimelineSummary.json['Total']['Hours'] = phaseHoursSum;
	  TimelineSummary.json['Total']['Weeks'] = _weekSum;
	  console.log(TimelineSummary.json);
   },
   
   onChange_InputDevHoursPerWeek: function(){
       loadSpinner.show();
       var hours = 0;
       if($(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).val() != '' && !isNaN($(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).val())) hours = parseInt($(TimelineSummary.DEV_CAPACITY_PER_DAY_ID).val());
       sforce.apex.execute(WEBSERVICE_NAME, "updateDevCapacity", {
            estimateId : estimateId,
            devCapacity: hours
        }, TimelineSummary.onChange_InputDevHoursPerWeek_Callback);
       
   },
   
   onChange_InputDevHoursPerWeek_Callback : {
        onSuccess: function(result) {
            result = (result.length > 0 ? result[0] : result);
            // check for failure message, show alert and stop
            if (result.indexOf('Fail') != -1) {
                    alert(result);
                loadSpinner.hide();
                return;
            }
            TimelineSummary.load();
            loadSpinner.hide();
        },
        onFailure: function(error) {
            alert(error);
            loadSpinner.hide();
        }
    }

}
// method for numeric field validation
var applyNumericValidation = function(){
        $('.mandate-numeric-estimate').change(function(evt) {		    
    		    $('body div.slds-error--tooltip').remove();
    		    var inputVal = $(this).val();
    		     
    		    //var numericReg = /^[0-9]*$/;
    		    var numericReg = /^[1-9]\d*(\.\d+)?$/;
    		    if(!numericReg.test(inputVal)) {
    		        $(this).val(inputVal.substring(0, inputVal.length - 1)); 
    		        $(document.body).append('<div class="slds slds-error--tooltip"><div class="slds slds-popover slds-popover--tooltip slds-nubbin--bottom" role="tooltip"><div class="slds-popover__body">Numeric only.</div></div></div>');
    		        var top = $(this).offset().top - ($(this).height() + 10) + 'px';
    		        var left = $(this).offset().left + 'px';
    		        $('body div.slds-error--tooltip').css({position : 'absolute', top : top , left : left});
    		        
    		        $(this).focus(); $(this).select();
    		    }
		    
		});
		
		//$('.mandate-numeric-estimate').blur(function(evt) {
		   //$('body div.slds-error--tooltip').remove(); 
		//});
}