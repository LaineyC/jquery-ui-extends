/*!
 * 带iframe的窗体插件
 * 
 * 基于jQuery UI Widget 1.9.2扩展
 * 
 * 1.继承window
 * 2.加了一个内框架的刷新按钮
 * 
 * 依赖:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.ui.button.js
 *	jquery.ui.draggable.js
 *	jquery.ui.mouse.js
 *	jquery.ui.position.js
 *	jquery.ui.resizable.js
 *  jquery.ui.dialog.js
 *  jquery.ui.advanceddialog.js
 *	jquery.ui.window.js
 */
(function( $, undefined ) {
	
	$.widget( "ui.webwindow", $.ui.window, {
		
		version: "1.9.2",
		
		options: {
			url : "#",					//
			name: null,					//
			loadingText: "正在加载...",	//
			autoLoad: true,				//
			beforeLoad: $.noop,			//fuction(event, ui) : Boolean
			load: $.noop				//fuction(event, ui) : void
		},
		
		timeout:5000,
		
		_loadTimes: 0,					//加载次数
		
		_create: function(){
			var that = this,
				options = this.options;
			
			options.name = ( options.name ? options.name : "ui-webwindow-iframe-" + that.uuid );
			if( window.frames[ options.name ] ){
				return $.error( "叫[" + options.name + "]的iframe已经存在!" );
			}
			
			this._super();
			this.uiDialog.addClass( "ui-webwindow" );
			this.element.addClass( "ui-webwindow-content" );
			this._addTitleButton({
				name: "Reload",
				icon: "ui-icon-refresh",
				text: "刷新",
				events: {
					click: function( event ) {
						that.reload( event );
						return false;
					}
				}
			});
			
			this._iframeLoad = function( event ){
				if( that.iframe.state != "loading" ){
					return;
				}
				clearTimeout( that._timeOut );
				that.uiDialog.removeClass( "ui-webwindow-loading" );
				that._loadTimes += 1;
				that.iframe.state = "loaded";
				that._trigger( "load", event );
				that.uiDialog.loadingbar.hide();
			}
			this.iframe = $( "<iframe>" )
				.load( this._iframeLoad )
				.attr({
					src: options.url,
					scrolling: "auto",
					frameborder: "no",
					name : options.name,
					allowtransparency : true
				})
				.addClass( "ui-webwindow-iframe" );
			this.iframe.state = "init";
			this.uiDialog.loadingbar = $( "<div>" )
				.addClass( "ui-webwindow-loadingbar ui-corner-all" )
				.hide()
				.appendTo( this.uiDialog );

			$("<div>").addClass( "ui-state-default ui-state-active ui-webwindow-loading-text" )
				.html( options.loadingText )
				.appendTo( this.uiDialog.loadingbar );
		},
		
		_init: function(){
			this._super();
			if ( this.options.autoLoad && this._isOpen ) {
				this.load();
			}
		},
		
		load: function( event ){
			if( this.iframe.state == "loading" ){
				return;
			}
			if( false === this._trigger( "beforeLoad", event )){
				return;
			}
			this.uiDialog.loadingbar.show();
			this.uiDialog.addClass( "ui-webwindow-loading" );
			this.iframe.state = "loading";
			if( !this._loadTimes ){
				this.iframe.appendTo( this.element );
			}
			else{
				this.iframe.attr( "src", this.options.url );
			}
			this._timeOut = this._delay( this._iframeLoad, this.timeout );
			return this;
		},
		
		loadTimes: function(){
			return this._loadTimes;
		},
		
		loadState: function(){
			return this.iframe.state;
		},
		
		iframeWidget: function(){
			return this.iframe;
		},
		
		reload: function( event ){
			return this.load(event);
		},
		
		_destroy: function() {
			this.element.removeClass( "ui-webwindow-content" );
			if( this.options.destroyElement ){
				//真正删除iframe
				window.frames[ this.options.name ] = undefined;
			}
			//必须放在最后一行 保证了destroy事件在最后触发
			this._super();
		},
		
		_setOption: function( key, value ) {
			switch ( key ) {
				case "loadingText":
					this.uiDialog.loadingbar.find( ".ui-webwindow-loading-text" ).html( value );
					break;
				case "name":
					this.iframe.attr( "name", value );
					break;
				case "url":
					this.options.url = value;
					this.load();
					break;
			}
			this._super( key, value );
		}
		
	});
	
}( jQuery ));
