/*!
 * 窗体
 * 
 * 基于jQuery UI Widget 1.9.2扩展
 * 
 * 1.继承advancedDialog
 * 2.加了最大化(还原)按钮，最小化按钮
 * 
 * 依赖:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.ui.button.js
 *	jquery.ui.draggable.js
 *	jquery.ui.mouse.js
 *	jquery.ui.position.js
 *	jquery.ui.resizable.js
 * 	jquery.ui.dialog.js
 *  jquery.ui.advancedDialog.js
 */
(function( $, undefined ) {

	$.widget( "ui.window", $.ui.advanceddialog, {
		
		version: "1.9.2",
		
		options: {
			autoMax:false,			//Boolean 是否在初始化的时候最大化,true表示最大化。
			maxable: true,			//Boolean 是否可最大化
			beforeMax: $.noop,		//fuction(event, ui) : Boolean
			max: $.noop,			//fuction(event, ui) : void
			beforeMin: $.noop,		//fuction(event, ui) : Boolean
			min: $.noop,			//fuction(event, ui) : void
			beforeRestore: $.noop,	//fuction(event, ui) : Boolean
			restore: $.noop			//fuction(event, ui) : void
		},
		
		_create: function(){
			this._super();
			var that = this,
				options = this.options;
			
			this.uiDialog.addClass("ui-window");
			this.element.addClass("ui-window-content");
			this.uiDialogTitlebar.dblclick(function(event){
				event.preventDefault();
				if(options.maxable){
					that.maxOrRestore( event );
				}
			});
			this._addTitleButton({
				name: "Toggle",
				icon: "ui-icon-extlink",
				text:"最大化/还原",
				events: {
					click: function( event ) {
						if(options.maxable){
							that.maxOrRestore( event );
						}
						return false;
					}
				}
			});
			this._addTitleButton({
				name: "Min",
				text:"最小化",
				icon: "ui-icon-minus",
				events: {
					click: function( event ) {
						that.min( event );
						return false; 
					}
				}
			});
			this._isMax = false;
		},
		
		_init: function(){
			this._super();
			
			if(!this.options.maxable){
				this._getTitleButton( "Toggle" ).addClass( "ui-state-disabled" );
			}
			
			if ( this.options.autoMax ) {
				this.max();
			}
		},
	
		max: function(event){
			if( !this.options.maxable ){
				return;
			}
			if( !this._isOpen ){
				this.open( event );
			}
			if( this._isMax ){
				return;
			}
			if( false === this._trigger( "beforeMax", event ) ){
				return;
			}
			var window = this.window,
				options = this.options,
				w = parseFloat(this.uiDialog.css("padding-left")),
				h = parseFloat(this.uiDialog.css("padding-top"));
			this.uiDialogTitlebarToggleText.removeClass("ui-icon-extlink")
				.addClass("ui-icon-newwin");
			this.oldState = {
				width: options.width,
				height: options.height,
				draggable: options.draggable,
				resizable: options.resizable,
				position: options.position
			};
			this._setOptions({
				position: [0, 0],
				width: window.width() - 2 * w - 2,
				height: window.height(),
				draggable: false,
				resizable: false,
				disabled:options.disabled
			});
			this._isMax = true;
			this._trigger( "max", event );
			return this;
		},
		
		restore: function( event ){
			if( !this._isOpen ){
				this.open( event );
			}
			if( !this._isMax ){
				return;
			}
			if( false === this._trigger( "beforeRestore", event ) ){
				return;
			}
			var window = this.window,
				options = this.options;
			options.width = this.oldState.width;
			options.height = this.oldState.height;
			options.position = this.oldState.position;
			this.uiDialogTitlebarToggleText.removeClass("ui-icon-newwin")
				.addClass("ui-icon-extlink");
			this._size();
			this._position(options.position);
			this._setOptions({
				draggable: this.oldState.draggable,
				resizable: this.oldState.resizable
			});
			this._isMax = false;
			this._trigger( "restore", event );
			return this;
		},
		
		maxOrRestore: function(event){
			if(!this._isOpen){
				this.open(event);
			}
			return this._isMax ? this.restore(event) : this.max(event);
		},
		
		min: function(event){
			var that = this,
				maxZ, thisZ;
			if ( !this._isOpen ) {
				return;
			}
			if ( false === this._trigger( "beforeMin", event ) ) {
				return;
			}
			this._isOpen = false;
			if ( this.overlay ) {
				this.overlay.destroy();
			}
			if ( this.options.hide ) {
				this._hide( this.uiDialog, this.options.hide, function() {
					that._trigger( "min", event );
				});
			} else {
				this.uiDialog.hide();
				this._trigger( "min", event );
			}
			$.ui.dialog.overlay.resize();
			// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
			if ( this.options.modal ) {
				maxZ = 0;
				$( ".ui-dialog" ).each(function() {
					if ( this !== that.uiDialog[0] ) {
						thisZ = $( this ).css( "z-index" );
						if ( !isNaN( thisZ ) ) {
							maxZ = Math.max( maxZ, thisZ );
						}
					}
				});
				$.ui.dialog.maxZ = maxZ;
			}
			return this;
		},
		
		isMax: function(){
			return this._isMax;
		},
		
		openOrClose: function(event){
			return this._isOpen ? this.close(event) : this.open(event);
		},
		
		_destroy: function() {
			this.element.removeClass( "ui-window-content" );
			this._super();
		},
		
		_setOption: function( key, value ) {
			switch ( key ) {
				case "maxable":
					this.uiDialogTitlebarToggleText.parent()[ value ? "removeClass" : "addClass" ]("ui-state-disabled");
					break;
			}
			this._super(key, value);
		}
		
	});
	
}( jQuery ));