/**
 * JavaScript to set up Acrolinx within MediaWiki editing interfaces -
 * including the standard edit page, TinyMCE editing pages, and Page
 * Forms form-based editing pages.
 *
 * @authors Yaron Koren
 */

'use strict';

( function ( $, mw ) {

	/**
	 * @constructor
	 */
	var MediawikiAcrolinx = function () {
		this.setup();
	};

	/**
	 * Initial setup actions
	 */
	MediawikiAcrolinx.prototype.setup = function () {

		var initializers;
		this.editMode = this.getEditMode();

		// Install the plugin
		this.acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin( this.getConfig() );
		this.multiAdapter = new acrolinx.plugins.adapter.MultiEditorAdapter( {
			rootElement: {
				tagName: 'mediawiki'
			}
		} );

		initializers = this.getInitializers();
		if ( !initializers.length ) {
			return;
		}

		this.startAcrolinx( initializers );

	};

	/**
	 * Starts Acrolinx plugin
	 * @param {Array} initializers
	 */
	MediawikiAcrolinx.prototype.startAcrolinx = function ( initializers ) {
		$.when.apply( $, initializers ).done( function () {
			this.addMarkup();
			// Register the adapters
			this.acrolinxPlugin.registerAdapter( this.multiAdapter );
			// Start the plugin
			this.acrolinxPlugin.init();
			// Setup toggles
			this.setupToggle();
			// Bind to window resize to match the sidebar width
			$( window ).resize( this.onResize.bind( this ) );
			// Call the resize callback right away
			this.onResize();
		}.bind( this ) );
	};

	/**
	 * Builds up array of initializers to be executed
	 * @return {Array}
	 */
	MediawikiAcrolinx.prototype.getInitializers = function () {
		var initializers = [];
		// Take edit mode specific actions
		switch ( this.editMode ) {
			case 'textarea':
				initializers = [
					this.mockDeferCall( this.setupForTextarea ),
					this.mockDeferCall( this.handleVESwitch )
				];
				break;
			case 'tinymce':
				initializers = [ this.mockDeferCall( this.setupForTinyMCE ) ];
				break;
			case 'form':
				initializers = [ this.mockDeferCall( this.setupForForm ) ];
				break;
			case 've':
				initializers = [ this.setupForVE() ];
				break;
			default:
				// By default we'll wait for VE activation
				this.editMode = 've';
				initializers = [ this.setupForVE() ];
				break;
		}
		return initializers;
	};

	/**
	 * Handles switch from source editing to VE editing mode and vise versa
	 */
	MediawikiAcrolinx.prototype.handleVESwitch = function () {
		mw.hook( 've.activationComplete' ).add( function () {
			if ( this.editMode === 'textarea' ) {
				this.acrolinxPlugin.dispose( function () {
					this.editMode = 've';
					this.startAcrolinx( this.getInitializers() );
				}.bind( this ) );
			}
		}.bind( this ) );
	};

	/**
	 * Rough bypass for deferred calls
	 * @param {Function} method
	 */
	MediawikiAcrolinx.prototype.mockDeferCall = function ( method ) {
		var defer = $.Deferred();
		method.bind( this )();
		defer.resolve();
	};

	/**
	 * Adds sidebar markup to the dom
	 */
	MediawikiAcrolinx.prototype.addMarkup = function () {
		if ( this.editMode === 've' ) {
			$( '#content' ).before( '<div id="acrolinxContainer" class="ve-enabled-acrolinx"></div>' );
			$( 'body' ).addClass( 'acrolinx-ve-sidebar' );
		} else {
			$( '#bodyContent' ).prepend( '<div id="acrolinxContainer"></div>' );
		}
	};

	/**
	 * Do necessary setups for regular source editing mode
	 */
	MediawikiAcrolinx.prototype.setupForTextarea = function () {
		var inputAdapter = new acrolinx.plugins.adapter.InputAdapter( {
			editorId: 'wpTextbox1'
		} );
		this.multiAdapter.addSingleAdapter( inputAdapter );
	};

	/**
	 * Do necessary setups for TinyMCE editing mode
	 */
	MediawikiAcrolinx.prototype.setupForTinyMCE = function () {
		var inputAdapter = new acrolinx.plugins.adapter.TinyMCEAdapter( {
			editorId: 'wpTextbox1'
		} );
		this.multiAdapter.addSingleAdapter( inputAdapter );
	};

	/**
	 * Do necessary setups for form editing mode
	 */
	MediawikiAcrolinx.prototype.setupForForm = function () {
		var $inputs = $( 'textarea, input.createboxInput' )
			.not( '.multipleTemplateStarter textarea' ) // ignore embed starter textarea
			.not( '.multipleTemplateStarter input.createboxInput' ) // ignore embed starter inputs
			.not( 'input.pfTokens' ) // ignore token input
			// TODO: ...
			.not( 'textarea.visualeditor' ); // ignore VEForAll input

		$inputs.each( function ( i, input ) {
			this.setupFormField( input );
		}.bind( this ) );

		// Use a JavaScript hook to also add an adapter for any textarea in a
		// newly-created instane of a multiple-instance template.
		mw.hook( 'pf.addTemplateInstance' ).add( function ( $newDiv ) {

			// TODO: refactor into a better approach with less duplication
			var $inputs = $newDiv.find( 'textarea, input.createboxInput' )
				.not( '.multipleTemplateStarter textarea' )
				.not( '.multipleTemplateStarter input.createboxInput' )
				.not( 'input.pfTokens' )
				.not( 'textarea.visualeditor' );

			$inputs.each( function ( i, input ) {
				this.setupFormField( input );
			}.bind( this ) );

		}.bind( this ) );

		// Handle VEForAll instances inside the form, it won't do anything if there are no VEForAll
		this.setupVEForAll();

	};

	/**
	 * Adds necessary bindings for VEForAll fields in form
	 */
	MediawikiAcrolinx.prototype.setupVEForAll = function () {
		var self = this;
		mw.hook( 'veForAll.targetCreated' ).add( function( instance ) {
			self.setupVEForAllField( instance );
		});
	};

	MediawikiAcrolinx.prototype.setupVEForAllField = function ( instance ) {
		var self = this;
		instance.target.on( 'editor-ready', function () {

			if ( typeof instance.acrolinxEnabled === 'undefined' ) {

				// TODO: needs extra modification on SDK
				var inputAdapter = new acrolinx.plugins.adapter.VisualEditorAdapter( {
					ve: instance
				} );
				self.multiAdapter.addSingleAdapter( inputAdapter );

				// TODO: This is a bit hacky - we store init flag on the instance
				//  to prevent it from being initialized again and again since
				//  editor-ready event will be triggered each time user switch from VE to textarea
				//  and versa
				instance.acrolinxEnabled = true;
			}

			// VE surface being recreated on editor switch so we need to rebind
			instance.target.getSurface().on( 'switchEditor', function () {
				// TODO: ideally we need to remove the adapter upon VE surface destroy
				//  and replace it with regular input adapter, though, the removeAdapter method
				//  is not implemented in the Acrolinx SDK so perhaps this is a very
				//  special case need to be implemented in the new VisualEditorAdapter class in Acrolinx SDK
				if ( $( instance.target.$node ).is( ':visible' ) ) {
					// Switch to VE
					// TODO: ...
				} else {
					// Switch to TEXTAREA
					// TODO: ...
				}
			} );

		} );
	};

	/**
	 * Creates per-field content adapters
	 * @param {Element} fieldElement
	 */
	MediawikiAcrolinx.prototype.setupFormField = function ( fieldElement ) {
		var inputAdapter, textareaID = $( fieldElement ).attr( 'id' );

		if ( $( this ).hasClass( 'tinymce' ) ) {
			inputAdapter = new acrolinx.plugins.adapter.TinyMCEAdapter( {
				editorId: textareaID
			} );
		} else {
			inputAdapter = new acrolinx.plugins.adapter.InputAdapter( {
				editorId: textareaID
			} );
		}

		this.multiAdapter.addSingleAdapter( inputAdapter );
	};

	/**
	 * Setup necessary bindings for Visual Editor mode
	 * @return {$.Deferred}
	 */
	MediawikiAcrolinx.prototype.setupForVE = function () {
		var defer = $.Deferred();
		/**
		 * Catches VE initialization event
		 * The event being fired for both dynamic and static activation of VE surface
		 */
		mw.hook( 've.activationComplete' ).add( function () {

			// TODO: ...
			$( '#content #acrolinxContainer' ).addClass( 've-enabled-acrolinx' );

			var contentAdapter = new acrolinx.plugins.adapter.VisualEditorAdapter( {
				ve: window.ve
			} );
			this.multiAdapter.addSingleAdapter( contentAdapter );

			if ( this.editMode !== 've' ) {
				this.startAcrolinx( [] );
			}

			defer.resolve();

		}.bind( this ) );

		/**
		 * Catches VE destroy event
		 */
		mw.hook( 've.deactivationComplete' ).add( function () {
			$( 'body' ).removeClass( 'acrolinx-ve-sidebar' );
			this.acrolinxPlugin.dispose( function () {
				// hack to support VE re-enabling
				this.editMode = 'textarea';
			}.bind( this ) );
		}.bind( this ) );

		return defer;
	};

	/**
	 * Handles window resize
	 */
	MediawikiAcrolinx.prototype.onResize = function () {
		var newContentAreaWidth = this.getContentAreaWidthWithAcrolinx();
		$( '#mw-content-text' ).width( newContentAreaWidth );
	};

	/**
	 * Calculates width
	 * @param {int} acrolinxWidth
	 * @return {number}
	 */
	MediawikiAcrolinx.prototype.getContentAreaWidthWithAcrolinx = function ( acrolinxWidth ) {
		var browserWidth = $( window ).width();
		var mainTextLeft = $( '#mw-content-text' ).offset().left;
		acrolinxWidth = acrolinxWidth || $( '#acrolinxContainer iframe' ).width();
		return browserWidth - mainTextLeft - acrolinxWidth - 50;
	};

	/**
	 * Setups toggle button
	 */
	MediawikiAcrolinx.prototype.setupToggle = function () {
		$( '#acrolinxContainer' ).prepend( '<div id="acrolinxToggle">&gt;</div>' );
		$( 'div#acrolinxToggle' ).click( this.onToggle.bind( this ) );
	};

	/**
	 * Handles toggle button click
	 * @param {Event} event
	 */
	MediawikiAcrolinx.prototype.onToggle = function ( event ) {
		var acrolinxWidth, contentAreaWidth;

		if ( $( event.target ).attr( 'minimized' ) === 'true' ) {
			$( event.target ).html( '>' );
			$( event.target ).removeAttr( 'minimized' );
			acrolinxWidth = 300;
		} else {
			$( event.target ).html( '<' );
			$( event.target ).attr( 'minimized', 'true' );
			acrolinxWidth = 10;
		}
		$( '#acrolinxContainer iframe' ).animate( {
			width: acrolinxWidth + 'px'
		} );
		contentAreaWidth = this.getContentAreaWidthWithAcrolinx( acrolinxWidth );
		$( '#mw-content-text' ).animate( {
			width: contentAreaWidth
		} );
	};

	/**
	 * Detect page type (textarea/tinymce/form/ve)
	 * @return {string|null}
	 */
	MediawikiAcrolinx.prototype.getEditMode = function () {
		var action = mw.util.getParamValue( 'action' ),
			title = mw.config.get( 'wgTitle' );

		// Page has default form and being edited
		if ( action === 'formedit' ) {
			return 'form';
		}

		// Page is being edited through special page
		if ( title.indexOf( 'FormEdit/' ) !== -1 ) {
			return 'form';
		}

		// VE4All bindings are in place so we're in form
		// if ( typeof $( document ).getVEInstances !== 'undefined' ) {
		// return 'form';
		// }

		// VE bindings are in place and surface is active so we're in VE mode
		if ( typeof window.ve !== 'undefined' &&
			(
				( typeof window.ve.init !== 'undefined' && window.ve.init.target.getSurface() ) ||
				mw.util.getParamValue( 'veaction' ) === 'edit'
			)
		) {
			return 've';
		}

		// Support for TinyMCE editor
		if ( action === 'tinymceedit' ) {
			return 'tinymce';
		}

		// Just a regular editing mode with textarea
		if ( action === 'edit' ) {
			return 'textarea';
		}

		// Nothing is found, are we editing something at all?
		return null;

	};

	/**
	 * Generates config for Acrolinx plugin
	 * @return {Object}
	 */
	MediawikiAcrolinx.prototype.getConfig = function () {
		return {
			sidebarContainerId: 'acrolinxContainer',
			serverAddress: mw.config.get( 'wgAcrolinxServerAddress' ),
			clientSignature: 'R2VuZXN5cyBNZWRpYVdpa2kgKFNpZGViYXIp',
			clientLocale: mw.config.get( 'wgAcrolinxUserLanguage' ),
			checkSettings: {
				language: mw.config.get( 'wgAcrolinxPageLanguage' )
			},
			clientComponents: [
				{
					id: 'com.mediawiki.acrolinx.sidebar',
					name: 'Genesys MediaWiki (Sidebar)',
					version: '0.1.0.0',
					category: 'MAIN'
				}
			],
			getDocumentReference: function () {
				return window.location.href;
			}
		};
	};

	window.MediawikiAcrolinx = MediawikiAcrolinx;

}( jQuery, mediaWiki ) );
