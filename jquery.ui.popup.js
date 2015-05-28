/*!
 * 弹出
 * 
 * 基于jQuery UI Widget 1.9.2扩展
 * 
 * 依赖:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 */
(function( $, undefined ) {
	
	$.widget( "ui.popup", {
		
		version: "1.9.2",
		
		options: {
			position: {
				my: "left top",
				at: "left bottom"
			},	
			beforeClose: $.noop,		//fuction(event, ui) : Boolean
			close: $.noop,				//fuction(event, ui) : void
			beforeOpen: $.noop,			//fuction(event, ui) : Boolean
			open: $.noop,				//fuction(event, ui) : void
			hide: null,
			show: null,
			ofEvent: false,				//位置始终根据触发时的事件
			disabled: false,
			
			/*
			 * 弹出元素的策略集合
				{	
					name:{						 //策略名 自定义,根据策略名可以修改策略
						trigger: content,		 //事件触发元素
						delegate: selector,		 //被代理元素
						cancel: selector,		 //根据selector排除事件触发元素的子元素，在代理模式下 排除被代理元素的子元素
						events: "click dblclick",//触发事件绑定
						createClose: [],		 //要绑定的close策略名数组,与 createOnOpen联合使用  在打开时绑定,在关闭时移除
						stopOpen: true,			 //已经打开时 能不能在调用打开方法
						override: {				 //在当前的策略下,以下配置可以覆盖默认的配置
							disabled:false,
							ofEvent: false,
							position: {
								my: "left top",
								at: "left bottom"
							},
							beforeOpen,
							open,
							show: null
						}
					}
				}
			*/
			openTriggers: null,
			/*
			 * 隐藏元素的策略集合
				{	
					name:{
						trigger:content,
						delegate:selector,
						cancel:selector,
						events:"click dblclick",
						createOnOpen: false,			//关闭事件在open的时候绑定，并且在close后移除
						override: {
							disabled: false,
							ofEvent: false,
							position: {
								my: "left top",
								at: "left bottom"
							},
							beforeClose,
							close,
							hide: null
						}
					}
				}
			*/
			closeTriggers: null
		},
		
		_create: function(){
			var that = this;
			this.element
				.hide()
				.attr( "role", "popup")
				.addClass( "ui-popup" );
			this._bindTriggers( true, this.options.openTriggers );
			this._bindTriggers( false, this.options.closeTriggers );
			this._isOpen = false;
			this._prev = this.element.prev();
			if( !this._prev.length ){
				this._prev = this.element.parent();
			}
		},
		
		/*
			根据策略名数组或者策略对象移除策略，在option会删除该策略属性
		*/
		removeTriggers: function( isOpenTriggers, triggers ){	
			var that = this,
				ploy = isOpenTriggers ? "openTriggers" : "closeTriggers";
			$.each( triggers, function( triggerName, trigger ){
				var triggerObj = {};
				if( typeof trigger === "string" ){
					triggerName = trigger;
					if( !triggerName in that.options[ ploy ] ){
						return;
					}
					trigger = that.options[ ploy ][ triggerName ];
				}
				delete that.options[ ploy ][ triggerName ];	
				triggerObj[ triggerName ] = trigger;
				that._unbindTriggers( isOpenTriggers, triggerObj );
			});
		},
		
		/*
			返回当前使用的策略名称
		*/
		currentTrigger: function(){
			return this.currentTrigger;
		},
		
		_setTriggersOption: function( isOpenTriggers, options ){
			var that = this,
				ploy = isOpenTriggers ? "openTriggers" : "closeTriggers";
			$.each( options, function( triggerName, trigger ){
				var	rebind,
					options;
				$.each( trigger, function( key, value ){
					options = $.extend( {}, that.options[ ploy ][ triggerName ] );
					if( key == "override" ){
						$.extend( true, that.options[ ploy ][ triggerName ][ key ], value );
					}
					else{
						that.options[ ploy ][ triggerName ][ key ] = value;
						if( !rebind && key != "cancel" && key != "createClose" ){
							rebind = true;
						}
					}
				});
				if( rebind ){
					var triggerObj = {};
					triggerObj[ triggerName ] = options;
					that._unbindTriggers( isOpenTriggers, triggerObj );
					triggerObj[ triggerName ] = that.options[ ploy ][ triggerName ];
					that._bindTriggers( isOpenTriggers, triggerObj );
				}
			});
		},
		/*
			设置或获取策略相关的选项
		
		*/
		triggersOption: function( isOpenTriggers, triggerName, key, value ){
			var that = this,
				parts,
				curOption,
				options = triggerName,
				trigger = {},
				ploy = isOpenTriggers ? "openTriggers" : "closeTriggers";
			if( !triggerName ){
				return $.widget.extend( {}, this.options[ ploy ] );
			}
			if( key ){
				trigger[ triggerName ] = key;
				if( typeof key === "string" ){
					options = {};
					parts = key.split( "." );
					key = parts.shift();
					if ( parts.length ) {
						curOption = options[ key ] = $.widget.extend( {}, this.options[ ploy ][ triggerName ][ key ] );
						for (var i = 0; i < parts.length - 1; i++ ) {
							curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
							curOption = curOption[ parts[ i ] ];
						}
						key = parts.pop();
						if ( value === undefined ) {
							return curOption[ key ] === undefined ? null : curOption[ key ];
						}
						curOption[ key ] = value;
					} else {
						if ( value === undefined ) {
							return this.options[ ploy ][ triggerName ][ key ] === undefined ? null : this.options[ ploy ][ triggerName ][ key ];
						}
						options[ key ] = value;
					}
					trigger[ triggerName ] = options;
				}
				options = trigger;
			}else{
				if( typeof triggerName === "string" ){
					return $.widget.extend( {}, this.options[ ploy ][ triggerName ] );
				}
			}
			this._setTriggersOption( isOpenTriggers, options );
		},

		/*
		 	设置一组策略，有则覆盖
			triggers
			{
				name:{
					trigger:content,
					delegate:selector,
					cancel:selector,
					events:"click dblclick",
				}
			}  
		*/
		setTriggers: function( isOpenTriggers, triggers ){
			var that = this,
				ploy = isOpenTriggers ? "openTriggers" : "closeTriggers";	
			this.options[ ploy ] = this.options[ ploy ] || {};
			$.each( triggers, function( triggerName, trigger ){
				var triggerObj = {};
				triggerObj[ triggerName ] = that.options[ ploy ][ triggerName ];
				if( triggerObj[ triggerName ] ){
					that._unbindTriggers( isOpenTriggers, triggerObj );
				}
				triggerObj[ triggerName ] = that.options[ ploy ][ triggerName ] = trigger;
				that._bindTriggers( isOpenTriggers,triggerObj );
			});
		},
		
		/*
			移除所有触发策略
		*/
		removeAllTriggers: function(){
			this.removeTriggers( true, this.options.openTriggers );
			this.removeTriggers( false, this.options.closeTriggers );
		},
		
		/*
		 	绑定事件 不会更改options的属性值
		
			ploy 强制绑定 忽略trigger.one
		*/
		_bindTriggers: function( isOpenTriggers, triggers, bind ){
			if( !triggers ){
				return;
			}
			var instance = this,
				handler = isOpenTriggers ? instance._open : instance._close;
			$.each( triggers, function( triggerName, trigger ){
				if( !bind && !isOpenTriggers && trigger.createOnOpen ){
					return;
				}
				if( typeof triggerName === "number"){
					triggerName = trigger;
					var ploy = instance.options[ isOpenTriggers ? "openTriggers" : "closeTriggers" ];
					if( !ploy || !ploy[ triggerName ]){
						return;
					}
					trigger = ploy[ triggerName ];
				}
				var eventName = trigger.events.split( " " ).join( instance.eventNamespace + " " ) + instance.eventNamespace,
					element = $( trigger.trigger ),
					selector = trigger.delegate;
				function handlerProxy( event ) {
					var newOptions = $.extend( true, {}, instance.options, trigger.override );
					if( newOptions.disabled ){
						return;
					}
					if( trigger.cancel ){
						if( $.isFunction( trigger.cancel ) ){
							if( trigger.cancel.apply( instance.element[0], [ event, {
									currentTrigger: triggerName,
									currentOptions: newOptions
								}] 
							) ){
								return;
							}
						}
						else{
							var obj = typeof trigger.cancel === "string" ? element : undefined,
							    closest = $( event.target ).closest( trigger.cancel, obj ); 
							if( closest.length && closest[0] != element[0] ){
								return;
							}
						}
					}
					instance.currentTrigger = triggerName;
					return handler.apply( instance, [ event, newOptions ] );
				}
				if(selector){
					element.find( selector )
						.addClass( "ui-popuptrigger" );
					element//.addClass( "ui-popuptrigger" )
						.delegate( selector, eventName, handlerProxy );
				}
				else{
					element.addClass( "ui-popuptrigger" )
						.bind( eventName, handlerProxy );
				}
			});
		},
		
		_unbindTriggers: function( isOpenTriggers, triggers ){
			if( !triggers ){
				return;
			}
			var instance = this;
			$.each( triggers, function( triggerName, trigger ){
				if( typeof triggerName === "number"){
					triggerName = trigger;
					var ploy = instance.options[ isOpenTriggers ? "openTriggers" : "closeTriggers" ];
					if( !ploy || !ploy[ triggerName ]){
						return;
					}
					trigger = ploy[ triggerName ];
				}
				var eventName = trigger.events.split( " " ).join( instance.eventNamespace + " " ) + instance.eventNamespace,
					element = $( trigger.trigger ),
					selector = trigger.delegate;
				if(selector){
					element.find( selector ).removeClass( "ui-popuptrigger" );
					element//.removeClass( "ui-popuptrigger" )
						.undelegate( selector, eventName );
				}
				else{
					element.removeClass( "ui-popuptrigger" )
						.unbind( eventName );
				}
			});
		},
		
		/*
			根据策略名打开
		*/
		open: function( event, triggerName, options ){
			this.currentTrigger = triggerName;
			if( options ){
				return this._open( event, options );
			}
			return this._open( event, $.extend( true, {}, this.options, this.options.openTriggers[ triggerName ].override ) );
		},
		
		_open: function( event, options ){
			var openTriggers = this.options.openTriggers,
				currentTrigger = openTriggers ? openTriggers[ this.currentTrigger ] : undefined;
			if( currentTrigger && currentTrigger.stopOpen ){
				if ( this._isOpen ) {
					return;
				}
			}
			var that = this,
				eventData = {
					currentTrigger: this.currentTrigger,
					currentOptions: options
				};
			if ( false === this._trigger( "beforeOpen", event, eventData, options ) ) {
				return;
			}
			if( !this._isOpen ){
				if( currentTrigger ){
					this._bindTriggers( false, currentTrigger.createClose, true );
				}
			}
			this._prevEvent = event;
			this._positionOf( options, event, true );
			this._isOpen = true;
			if ( options.show ) {
				this._show( this.element, options.show, function() {
					that._trigger( "open", event, eventData, options);
				});
			}
			else {
				this.element.show();
				this._trigger( "open", event, eventData, options);
			}
			return this;
		},
		
		_trigger: function( type, event, data, options ) {
			var prop, orig,
				options = options || this.options,
				callback = options[ type ];
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
		
		isOpen: function(){
			return this._isOpen;
		},

		/*
			根据策略名关闭
		*/
		close: function( event, triggerName, options ){
			this.currentTrigger = triggerName;
			if( options ){
				return this._close( event, options );
			}
			return this._close( event, $.extend( true, {}, this.options, this.options.closeTriggers[ triggerName ].override ) );
		},
		
		_close: function( event, options ){
			if ( !this._isOpen ) {
				return;
			}
			var that = this,
				closeTriggers = this.options.closeTriggers,
				currentTrigger = closeTriggers ? closeTriggers[ this.currentTrigger ] : undefined;
				eventData = {
					currentTrigger: this.currentTrigger,
					currentOptions: options
				};
			if ( false === this._trigger( "beforeClose", event, eventData, options ) ) {
				return;
			}
			if( currentTrigger && currentTrigger.createOnOpen ){
				this._unbindTriggers( false, [ this.currentTrigger ]);
			}
			this._isOpen = false;
			this._positionOf( options, event );
			if ( options.hide ) {
				this._hide( this.element, options.hide, function() {
					that._trigger( "close", event, eventData, options );
				});
			}
			else {
				this.element.hide();
				this._trigger( "close", event, eventData, options );
			}
			return this;
		},
		
		_destroy: function() {
			this.element.removeClass( "ui-popup" )
				.removeAttr( "role", "popup");
			this.removeAllTriggers();
		},
		
		_positionOf: function( options, event, isHide ){
			if( options.ofEvent ){
				options.position.of = event;
			}
			if( !options.position.of ){
				options.position.of = ( !isHide ? this._prevEvent : undefined ) || this._prev;
			}
			this.element.show().position( options.position );
			if( isHide ){
				this.element.hide();
			}
		},
		
		_setOption: function( key, value ) {
			switch ( key ) {
				case "openTriggers":
					this.setTriggers( true, value );
					break;
				case "closeTriggers":
					this.setTriggers( false, value );
					break;
			}
			this._super( key, value );
		}
		
	});
	
}( jQuery ));
