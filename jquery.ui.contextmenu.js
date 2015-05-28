/*!
 * 上下文菜单
 * 
 * 基于jQuery UI Widget 1.9.2扩展
 * 
 * 依赖:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 * 	jquery.ui.menu.js
 *	jquery.ui.position.js
 *  jquery.ui.popup.js
 */
(function( $, undefined ) {
	
	var contextList = $();
	
	function createContext( context ){
		context = $( context );
		if( context.length != 1 ){
			$.error("context必须且只能匹配一个元素,当前长度:" + context.length );
			return;
		}
		var contextmenu = $( '<div class="ui-contextmenu"></div>' ),
			contextmenuData = {
				current: null,
				contextmenu: contextmenu
			};
		context.data("contextmenudata", contextmenuData ).
			addClass( "ui-context");
		contextList = contextList.add( context );
		contextmenu.appendTo( context.html() === undefined ? document.body : context )
			.bind("mousedown", function( event ) {
				return false;
			})
			.popup({
				stopOpen: false,
				ofEvent: true,
				position: {
					my: "left top",
					at: "left bottom"
				},
				closeTriggers: {
					contextmenuclose: {
						trigger: context,
						events: "mousedown",
						cancel: function( event, ui ){
							if($( event.target ).closest( ".ui-contextmenuowner", context ).length && event.button == 2){
								ui.currentOptions.hide = null;
							}
						},
						createOnOpen: true,
						override: {
							beforeClose: function( event, ui ){
								return contextmenuData.current._beforeClose( event );
							},		
							close: function( event, ui ){
								contextmenuData.current._close( event );
							},			
							hide: null,
							ofEvent: false
						}
					}
				}
			});
		return context;
	}
	
	$.widget( "ui.contextmenu", {
		
		version: "1.9.2",
		
		options: {
			context: document,		//	菜单上下文	不可更改
			menu: null,				//	DOM || jQuery || selector 上下文菜单模板
			bindings: null,			//	Object{key:value},key = selector,value = fuction(event, ui{ menu, target }) : void 
			delegate: null,			//	String 为selector的元素代理上下文菜单  delegate(selector,[type],[data],fn)
			cancel: false,			//	string || jquery || function 
			beforeOpen: $.noop,		//	fuction(event, ui{ menu }) : Boolean  如果为false就不打开了
			open: $.noop,			//	fuction(event, ui{ menu }) : void 
			beforeClose: $.noop,	//	fuction(event, ui{ menu }) : Boolean  如果为false就不关闭了
			close: $.noop,			//	fuction(event, ui{ menu }) : void
			show: null,
			hide: null
		},
		
		_create: function(){
			var that = this,
				openConfig = {},
				options = this.options;
			this.context = contextList.filter( $( options.context ) );
			if( !this.context.length ){
				this.context = createContext( options.context );
			}
			this.menu = $( options.menu ).clone( true );
			this.contextmenuData = this.context.data( "contextmenudata" )
			this.contextmenu = this.contextmenuData.contextmenu;
			this.contextmenuOpenUUID = "contextmenuopen" + this.uuid;
			openConfig[ this.contextmenuOpenUUID ] = {
				trigger: this.element,
				delegate: options.delegate,
				cancel: options.cancel,
				events: "contextmenu",
				createClose:[ "contextmenuclose" ],
				override: {
					beforeOpen: function( event ){
						return that._beforeOpen( event );
					},		
					open: function( event ){
						that._open( event );
					},				
					show: options.show
				}
			}
			this.contextmenu.popup( "setTriggers", true, openConfig );
			if( options.delegate ){
				$( options.delegate, this.element ).addClass( "ui-contextmenuowner" );
			}
			else{
				this.element.addClass( "ui-contextmenuowner" );
			}
		},	
		
		contextmenu: function() {
			return this.contextmenu;
		},
		
		isOpen: function(){
			return this.contextmenu.popup( "isOpen" );
		},
		
		_createBindings: function( bindings ){
			var that = this;
			if( bindings ){
				$.each( bindings, function( selector, func ) {
					var item = $( selector + ":not(.ui-state-disabled)", that.eventData.menu )
						.bind( "click" + that.eventNamespace, function( event ) {
							event.preventDefault();
							that.close( event );
							func.apply( this, [ event, that.eventData ] ); 
						});
	    		});
			}
			this.eventData.menu.menu()
				.focus( 1 )
				.show()
				.appendTo( this.contextmenu.empty() );
		},
		
		disableItem: function( selectors, menu ){
			this._disableItem( true, selectors, menu );
		},
		
		enableItem: function( selectors, menu ){
			this._disableItem( false, selectors, menu );
		},
		
		_disableItem: function( disable, selectors, menu ){
			menu = menu ? menu : this.eventData.menu;
			if( typeof selectors === "string" ){
				selectors = [ selectors ];
			}
			$.each( selectors, function( i , selector ){
				$( selector, menu )[ disable ? "addClass" : "removeClass" ]( "ui-state-disabled" );
			})
		},
		
		open: function( event ){
			this.contextmenu.popup( "open", event, this.contextmenuOpenUUID );
		},
		
		_beforeOpen: function( event ){
			event.preventDefault();
			this.eventData = {
				menu: this.menu.clone( true ),
				owner: $( event.currentTarget )
			};
			this.contextmenuData.current = this;
			if( this._trigger( "beforeOpen", event, this.eventData ) ){
				this.contextmenu.empty().popup( "triggersOption", false, "contextmenuclose", "override.hide" , this.options.hide );
				this._createBindings( this.options.bindings );
				return true;
			}
			return false;
		},
		
		_open: function( event ){
			this._trigger( "open", event, this.eventData );
		},
		
		close: function( event ){
			this.contextmenu.popup( "close", event, "contextmenuclose" );
		},
		
		_beforeClose: function( event ){
			return this._trigger( "beforeClose", event, this.eventData );
		},
		
		_close: function( event ){
			this._trigger( "close", event, this.eventData );
		},
		
		_destroy: function() {
			this.contextmenu.popup( "removeTriggers", true, [ this.contextmenuOpenId ] );
			if( this.options.delegate ){
				$( this.options.delegate, this.element ).removeClass( "ui-contextmenuowner" );
			}
			else{
				this.element.removeClass( "ui-contextmenuowner" );
			}
		},
		
		_trigger: function( type, event, data ) {
			var prop, orig,
				callback = this.options[ type ];
			data = data || {};
			event = $.Event( event );
			event.type = ( type === this.widgetEventPrefix ?
				type :
				this.widgetEventPrefix + type ).toLowerCase();
			//event.target = this.element[ 0 ];
			orig = event.originalEvent;
			if ( orig ) {
				for ( prop in orig ) {
					if ( !( prop in event ) ) {
						event[ prop ] = orig[ prop ];
					}
				}
			}
			this.element.trigger( event, data );
			return !( $.isFunction( callback ) &&
				callback.apply( this.element[0], [ event ].concat( data ) ) === false );
		},
		
		_setOption: function( key, value ) {
			switch ( key ) {
				case "context": //不能更改
					return;
				/*case "bindings":
					break;*/
				case "menu":
					this.menu = $( value );
					break;
				case "delegate":
					this.contextmenu.popup( "triggersOption", true, this.contextmenuOpenUUID, key, value );
					break;
				case "cancel":
					this.contextmenu.popup( "triggersOption", true, this.contextmenuOpenUUID, key, value );
					break;
				/*case "beforeOpen":
					break;
				case "open":
					break;
				case "beforeClose":
					break;
				case "close":*/
					break;
				case "hide":
					this.contextmenu.popup( "triggersOption", false, "contextmenuclose", "override." + key, value );
					break;
				case "show":
					this.contextmenu.popup( "triggersOption", true, this.contextmenuOpenUUID, "override." + key, value );
					break;
			}
			this._super( key, value );
		}
		
	});
	
}( jQuery ));
