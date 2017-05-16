(function ($) {
    // register namespace
    $.extend(true, window, {
        "Slick": {
            "RowMoveManager": RowMoveManager
        }
    });

    function RowMoveManager(options) {
        var _grid;
        var _canvases;
        var _dragging;
        var _scrollTimer;
        var _viewport;
        var _viewportTop;
        var _viewportBottom;
        var _self = this;
        var _handler = new Slick.EventHandler();
        var _defaults = {
            cancelEditOnDrag: false
        };

        function init(grid) {
            options = $.extend(true, {}, _defaults, options);
            _grid = grid;
            _canvases = _grid.getCanvases();
            _scrollTimer = null;
           
            //set the closest viewport with the canvas of frozen row
            if(typeof options.frozenRow == 'undefined' || options.frozenRow == -1){
              _viewport = _grid.getViewportNode();
            }else{
              _viewport = $(_canvases[2]).closest('.slick-viewport'); 
            }
            
            
            _viewportTop = $(_viewport).offset().top;
            _viewportBottom = _viewportTop + _viewport.clientHeight;
          
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
            
            
            // prevent the grid from cancelling drag'n'drop by default
            e.stopImmediatePropagation();
        }

        function handleDragStart(e, dd) {
          var cell = _grid.getCellFromEvent(e);

          if (options.cancelEditOnDrag && _grid.getEditorLock().isActive()) {
            _grid.getEditorLock().cancelCurrentEdit();
          }

          if (_grid.getEditorLock().isActive() || !/move|selectAndMove/.test(_grid.getColumns()[cell.cell].behavior)) {
            return false;
          }

          _dragging = true;
          e.stopImmediatePropagation();

          var selectedRows = _grid.getSelectedRows();

          if (selectedRows.length == 0 || $.inArray(cell.row, selectedRows) == -1) {
            selectedRows = [cell.row];
            _grid.setSelectedRows(selectedRows);
          }

          var rowHeight = _grid.getOptions().rowHeight;

          dd.selectedRows = selectedRows;

          //console.log('options.frozenRow' + options.frozenRow);
          if(typeof _grid.getOptions().frozenRow == 'undefined' || _grid.getOptions().frozenRow == -1){
              
              dd.selectionProxy = $("<div class='slick-reorder-proxy'/>")
              .css("position", "absolute")
              .css("zIndex", "99999")
              .css("width", $(_canvases[0]).innerWidth() + $(_canvases[1]).innerWidth())
              .css("height", rowHeight * selectedRows.length)
              .appendTo(_canvases);
          
          
          
              dd.guide = $("<div class='slick-reorder-guide'/>")
                  .css("position", "absolute")
                  .css("zIndex", "99998")
                  .css("width", $(_canvases[0]).innerWidth() + $(_canvases[1]).innerWidth())
                  .css("top", -1000)
                  .appendTo(_canvases);
              
              
          }else{
              //In case of frozenRow defined: append the selection proxy and the drag drop guide to the bottom canvases only
              
              dd.selectionProxy = $("<div class='slick-reorder-proxy'/>")
              .css("position", "absolute")
              .css("zIndex", "99999")
              .css("width", $(_canvases[2]).innerWidth() + $(_canvases[3]).innerWidth())
              .css("height", rowHeight * selectedRows.length)
              .appendTo([_canvases[2], _canvases[3]]);
          
          
          
              dd.guide = $("<div class='slick-reorder-guide'/>")
                  .css("position", "absolute")
                  .css("zIndex", "99998")
                  .css("width", $(_canvases[2]).innerWidth() + $(_canvases[3]).innerWidth())
                  .css("top", -1000)
                  .appendTo([_canvases[2], _canvases[3]]);
              
              
          }
                  
          dd.insertBefore = -1; 
        }

        function handleDrag(e, dd) {
          if (!_dragging) {
            return;
          }

          e.stopImmediatePropagation();

          var top = e.pageY - $(_canvases[0]).offset().top;
          
          
          if(typeof _grid.getOptions().frozenRow != 'undefined' && _grid.getOptions().frozenRow != -1){ 
              // In case of frozenRow defined: Add scrolling position of bottom canvas to top
              top = top + $(_canvases[2]).parent().scrollTop();
              dd.selectionProxy.css("top", (top - (_grid.getOptions().rowHeight * _grid.getOptions().frozenRow)) - 5);
          }else{
              dd.selectionProxy.css("top", top - 5);
          }
          

          var insertBefore = Math.max(0, Math.min(Math.round(top / _grid.getOptions().rowHeight), _grid.getDataLength()));
           
          
          
          if (insertBefore !== dd.insertBefore) {
            var eventData = {
              "rows": dd.selectedRows,
              "insertBefore": insertBefore
            };

            if (_self.onBeforeMoveRows.notify(eventData) === false) {
              dd.guide.css("top", -1000);
              dd.canMove = false;
            } else {
                
              if(typeof _grid.getOptions().frozenRow == 'undefined' || _grid.getOptions().frozenRow == -1){
                  dd.guide.css("top", insertBefore * _grid.getOptions().rowHeight);
              }else{
                 // frozenRow: Modification for displaying dd guide 
                 dd.guide.css("top", ((insertBefore - _grid.getOptions().frozenRow)  * _grid.getOptions().rowHeight)); 
                 _grid.scrollRowIntoView(insertBefore);
              } 
              
              dd.canMove = true;
            }

            dd.insertBefore = insertBefore;
          }

          
          if(typeof _grid.getOptions().frozenRow == 'undefined' || _grid.getOptions().frozenRow == -1){ 
            if (e.pageY > _viewportBottom) {
                
                if (!(_scrollTimer)) {
                    _scrollTimer = setInterval(scrollDown, 100);
                }
            } else if (e.pageY < _viewportTop) {
                if (!(_scrollTimer)) {
                    _scrollTimer = setInterval(scrollUp, 100); 
                }
            } else {
                clearInterval(_scrollTimer);
                _scrollTimer = null;
            }
          }
           
        }

        function handleDragEnd(e, dd) {
              if (!_dragging) {
                return;
              }
              _dragging = false;
    
             if (_scrollTimer) {
                clearInterval(_scrollTimer);
             }
    
              e.stopImmediatePropagation();
    
              dd.guide.remove();
              dd.selectionProxy.remove();
    
              if (dd.canMove) {
                var eventData = {
                  "rows": dd.selectedRows,
                  "insertBefore": dd.insertBefore
                };
                // TODO:  _grid.remapCellCssClasses ?
                _self.onMoveRows.notify(eventData);
              }
         }

         function scrollDown() {
                var visibleRange = _grid.getViewport();

                if (visibleRange.bottom >= _grid.getDataLength() ) {
                    return;
                }
                
                _grid.scrollRowIntoView(visibleRange.bottom);
            }

            function scrollUp() {
                var visibleRange = _grid.getViewport();

                if (visibleRange.top == 0) {
                    return;
                }

                _grid.scrollRowIntoView(visibleRange.top - 1);
        }

        $.extend(this, {
          "onBeforeMoveRows": new Slick.Event(),
          "onMoveRows": new Slick.Event(),

          "init": init,
          "destroy": destroy

        });
    }
})(jQuery);