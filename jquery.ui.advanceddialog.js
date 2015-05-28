/*!
 * 高级的对话框
 * 
 * 基于jQuery UI Widget 1.9.2扩展
 * 
 * 1.继承dialog
 * 2.区分了标题和图标
 * 3.增加了对内容的遮挡层
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
 */
(function( $, undefined ) {
	
	$.widget( "ui.advanceddialog", $.ui.dialog, {
		
		version: "1.9.2",
		
		options: {
			/*
				标题旁的图标，是一个图片路径
				String
			*/
			icon: null,	
			/*
				内容遮挡层，当对话框在drag和resize的时候会把对话框的内容遮挡
				Boolean		true显示
			*/
			contentOverlay: false,
			/*
				调用close方法后并且调用destroy方法（销毁对话框）
				Boolean		true销毁
			*/
			closeAndDestroy: false,
			/*
			 	调用destroy方法后直接销毁元素,不再添加到之前的位置或body
				Boolean		true销毁
			*/
			destroyElement: false,
			/*
				对话框销毁事件
				fuction(event, ui) : void
			*/
			destroy: $.noop
		},
		
		_create: function(){
			this._super();
			var that = this;
			
			this._on(this.uiDialogTitlebar,{
				"dblclick .ui-dialog-titlebar-close":function(event){
					event.stopPropagation();
				}
			});
			this.uiDialog.addClass("ui-advanceddialog");
			this.element.addClass("ui-advanceddialog-content");
			this._setTitle( this.options.icon, this.options.title );
			this._setContentOverlay(this.options.contentOverlay);
			this.element.data( "contentoverlay", this.uiDialog.contentOverlay );
			this.uiDialog.bind("mousedown",function(){
				that.overlayOther();
			});
		},
		
		/*
			加上其他的对话框阴影，去除自己的阴影。
		*/
		overlayOther: function(){
			var that = this;
			$(".ui-advanceddialog > .ui-dialog-content").each( function( i, content ){
				var content = $( content ),
					contentOverlay = content.data( "contentoverlay" );
				if( !contentOverlay ){
					return;
				}
				if( contentOverlay != that.uiDialog.contentOverlay){
					contentOverlay.show();
				}
				else{
					contentOverlay.hide();
				}
			});
		},
		
		_setContentOverlay: function( contentOverlay ){
			if( contentOverlay ){
				if( !this.uiDialog.contentOverlay ){
					(this.uiDialog.contentOverlay = $( "<div>" ) )
						.addClass( "ui-widget-overlay ui-advanceddialog-contentoverlay ui-corner-all" )
						.appendTo( this.uiDialog );
				}
			}else{
				if( this.uiDialog.contentOverlay ){
					this.uiDialog.contentOverlay.remove();
					delete this.uiDialog.contentOverlay;
				}
			}
		},
		
		_setTitle: function( icon, title ){
			if( icon ){
				if( icon.indexOf( "ui-icon" ) != -1 && icon.indexOf( "." ) == -1 ){
					icon = '<span class="ui-icon ' + icon + ' ui-dialog-title-icon"></span>';
				}
				else{
					icon = '<span class="ui-dialog-title-icon"><img align="absmiddle" src="' + icon + '" /></span>';
				}
			}
			else{
				icon = '<span class="ui-dialog-title-icon"></span>';
			}
			title = '<span class="ui-dialog-title-text">' + ( title ? title : "&#160;" ) + '</span>'
			$( ".ui-dialog-title", this.uiDialogTitlebar )
				.addClass( "ui-helper-clearfix" )
				.html( icon + title );
		},

		/*	
			在标题栏添加按钮。
			@param	button	Object - 按钮对象
				{
					name:	String - 按钮名称
					text:	String - 按钮显示名称
					icon:	String - 按钮图标
					position:	Integer - 按钮的位置（右起）
					events:		Object - 按钮触发的事件集合
					{
						key = 事件类型
						value = 事件函数
					}
				}
			@return button
		 */
		_addTitleButton: function( button ){
			if(this["uiDialogTitlebar" + button.name + "Text"]){
				return $.error( "叫[" + button.name + "]的按钮已经存在!" );
			}
			
			button.position = !button.position 
				? ( this.uiDialogTitlebar.find( "> a.ui-dialog-titlebar-close" ).size() + 1 )
				: button.position;
				
			var uiDialogTitlebarClose = this.uiDialogTitlebarCloseText.parent(),
				right = 3.6,
				width = uiDialogTitlebarClose.width(),
			 	right = ( button.position - 1 ) * ( right + width ) + right,
				titleButton = $( "<a href='javascript:void(0);'></a>" )
					.addClass( "ui-dialog-titlebar-close ui-corner-all ui-dialog-titlebar-" + name.toLowerCase() )
					.attr( "role", "button" )
					.css( { right: right } )
					.appendTo( this.uiDialogTitlebar );

			this._on( titleButton, button.events );
			
			this[ "uiDialogTitlebar" + button.name + "Text" ] = $( "<span>" )
				.text( button.text )
				.addClass( "ui-icon ui-icon " + button.icon )
				.appendTo( titleButton );
			
			this._hoverable( titleButton );
			this._focusable( titleButton );
			
			return titleButton;
		},
		
		/*
			根据按钮名称在标题栏获取按钮
			@param name	String - 按钮名称
			@return button
		*/
		_getTitleButton: function( name ){
			return this[ "uiDialogTitlebar" + name + "Text" ] === undefined
				? null
				: this[ "uiDialogTitlebar" + name + "Text" ].parent();
		},
		
		close: function( event ) {
			this._super( event );
			if( this.options.closeAndDestroy ){
				this._destroy();
			}
			return this;
		},
		
		_destroy: function() {
			if(this.options.destroyElement){
				if ( this.overlay ) {
					this.overlay.destroy();
				}
				this._off(this.element,"remove");
				this.uiDialog.hide().remove();
			}
			else{
				this._super();
			}
			this.element.removeClass( "ui-advanceddialog-content" );
			this._trigger( "destroy", null);
		},
		
		_setOption: function( key, value ) {
			switch ( key ) {
				case "icon":
					this._setTitle(value,this.options.title);
					break;
				case "title":
					this._setTitle(this.options.icon,value);
					this.options.title = value;
					return;
				case "contentOverlay":
					this._setContentOverlay(value);
					break;
			}
			this._super(key, value);
		},
		
		/*
			修正源码bug
		*/
		_makeResizable: function( handles ) {
			handles = (handles === undefined ? this.options.resizable : handles);
			var that = this,
				options = this.options,
				// .ui-resizable has position: relative defined in the stylesheet
				// but dialogs have to use absolute or fixed positioning
				position = this.uiDialog.css( "position" ),
				resizeHandles = typeof handles === 'string' ?
					handles	:
					"n,e,s,w,se,sw,ne,nw";
	
			function filteredUi( ui ) {
				return {
					originalPosition: ui.originalPosition,
					originalSize: ui.originalSize,
					position: ui.position,
					size: ui.size
				};
			}
	
			this.uiDialog.resizable({
				cancel: ".ui-dialog-content",
				containment: "document",
				alsoResize: this.element,
				maxWidth: options.maxWidth,
				maxHeight: options.maxHeight,
				minWidth: options.minWidth,
				minHeight: this._minHeight(),
				handles: resizeHandles,
				start: function( event, ui ) {
					$( this ).addClass( "ui-dialog-resizing" );
					that._trigger( "resizeStart", event, filteredUi( ui ) );
				},
				resize: function( event, ui ) {
					that._trigger( "resize", event, filteredUi( ui ) );
				},
				stop: function( event, ui ) {
					$( this ).removeClass( "ui-dialog-resizing" );
					//源码bug options.height = $( this ).height();
					options.height = $( this ).outerHeight();
					options.width = $( this ).width();
					that._trigger( "resizeStop", event, filteredUi( ui ) );
					$.ui.dialog.overlay.resize();
				}
			})
			.css( "position", position )
			.find( ".ui-resizable-se" )
				.addClass( "ui-icon ui-icon-grip-diagonal-se" );
		}
		
	});
	
}( jQuery ));
