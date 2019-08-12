/**
 * JavaScript to set up Acrolinx within MediaWiki editing interfaces -
 * including the standard edit page, TinyMCE editing pages, and Page
 * Forms form-based editing pages.
 *
 * @author Yaron Koren
 */

'use strict';

// $('#bodyContent').prepend( '<div id="acrolinxSidebar"><div id="acrolinxToggle"><div id="acrolinxContainer"></div></div>' );
$( '#bodyContent' ).prepend( '<div id="acrolinxContainer"></div>' );

// TODO: merge into a single file

var basicConf = {
	sidebarContainerId: 'acrolinxContainer',
	// See: https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.52/doc/pluginDoc/interfaces/_src_acrolinx_libs_plugin_interfaces_.initparameters.html
	serverAddress: mw.config.get( 'wgAcrolinxServerAddress' ),
	// Sandbox signature
	clientSignature: 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5',
	clientLocale: mw.config.get( 'wgAcrolinxUserLanguage' ),

	checkSettings: {
		language: mw.config.get( 'wgAcrolinxPageLanguage' )
	},

	clientComponents: [
		{
			id: 'com.mediawiki.acrolinx.sidebar',
			name: 'Acrolinx Mediawiki Sidebar',
			version: '0.1.0.0',
			category: 'MAIN'
		}
	],

	/**
	 * This callback can be used to set the documentReference.
	 * It is called in the moment when the document is checked.
	 * The default value is window.location.href.
	 * In a CMS the link to the article might be a good documentReference.
	 * On other cases the full file name might be a good option.
	 * @return {string}
	 */
	getDocumentReference: function () {
		return window.location.href;
	}

};

var acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin( basicConf );
var multiAdapter = new acrolinx.plugins.adapter.MultiEditorAdapter( {
	rootElement: {
		tagName: 'mediawiki'
	}
} );

jQuery.fn.addAcrolinxAdapterToFormInput = function () {

	return this.each( function () {
		var inputAdapter, textareaID = $( this ).attr( 'id' );

		if ( $( this ).hasClass( 'tinymce' ) ) {
			inputAdapter = new acrolinx.plugins.adapter.TinyMCEAdapter( {
				editorId: textareaID
			} );
		} else if ( $( this ).hasClass( 've-init-sa-target' ) ) {
			inputAdapter = new acrolinx.plugins.adapter.ContentEditableAdapter( {
				element: this
			} );
		} else {
			inputAdapter = new acrolinx.plugins.adapter.InputAdapter( {
				editorId: textareaID
			} );
		}
		multiAdapter.addSingleAdapter( inputAdapter );
	} );
};

var action = mw.config.get( 'wgAction' );
if ( action === 'edit' ) {
	var inputAdapter = new acrolinx.plugins.adapter.InputAdapter( {
		editorId: 'wpTextbox1'
	} );
	multiAdapter.addSingleAdapter( inputAdapter );
} else if ( action === 'tinymceedit' ) {
	var tinyMceAdapter = new acrolinx.plugins.adapter.TinyMCEAdapter( {
		editorId: 'wpTextbox1'
	} );
	multiAdapter.addSingleAdapter( tinyMceAdapter );
} else {
	// This is most likely a Page Forms editing interface, which will have
	// an action of either 'formedit' or 'view', depending on the URL.
	$( 'textarea, input.createboxInput' )
		.not( '.multipleTemplateStarter textarea' ) // ignore embed starter textarea
		.not( '.multipleTemplateStarter input.createboxInput' ) // ignore embed starter inputs
		.not( 'input.pfTokens' ) // ignore token input
		.not( 'textarea.visualeditor ' ) // ignore VEForAll input
		.addAcrolinxAdapterToFormInput();
}

acrolinxPlugin.registerAdapter( multiAdapter );
acrolinxPlugin.init();

// Use a JavaScript hook to also add an adapter for any textarea in a
// newly-created instane of a multiple-instance template.
mw.hook( 'pf.addTemplateInstance' ).add( function ( $newDiv ) {
	$newDiv.find( 'textarea' ).addAcrolinxAdapterToFormInput();
} );

function getContentAreaWidthWithAcrolinx( acrolinxWidth ) {
	var browserWidth = $( window ).width();
	var mainTextLeft = $( '#mw-content-text' ).offset().left;
	acrolinxWidth = acrolinxWidth || $( '#acrolinxContainer iframe' ).width();
	return browserWidth - mainTextLeft - acrolinxWidth - 50;
}

/**
 * Makes sure that the editing area fits into the available space.
 * Is there a way to do this with just CSS?
 */
function resizeForAcrolinx() {
	var newContentAreaWidth = getContentAreaWidthWithAcrolinx();
	$( '#mw-content-text' ).width( newContentAreaWidth );
}

resizeForAcrolinx();
$( window ).resize( function () {
	resizeForAcrolinx();
} );

$( '#acrolinxContainer' ).prepend( '<div id="acrolinxToggle">&gt;</div>' );

$( 'div#acrolinxToggle' ).click( function () {

	var acrolinxWidth;

	if ( $( this ).attr( 'minimized' ) === 'true' ) {
		$( this ).html( '>' );
		$( this ).removeAttr( 'minimized' );
		acrolinxWidth = 300;
	} else {
		$( this ).html( '<' );
		$( this ).attr( 'minimized', 'true' );
		acrolinxWidth = 10;
	}
	$( '#acrolinxContainer iframe' ).animate( {
		width: acrolinxWidth + 'px'
	} );
	var contentAreaWidth = getContentAreaWidthWithAcrolinx( acrolinxWidth );
	$( '#mw-content-text' ).animate( {
		width: contentAreaWidth
	} );
} );

/**
 * The code below adds surface-ready callbacks to all VE form field instances
 * and initializes an acrolinx.plugins.adapter.ContentEditableAdapter on these
 * @see $.addAcrolinxAdapterToFormInput()
 */
mw.loader.using( 'ext.veforall.main', function () {
	var instances = $( document ).getVEInstances();
	instances.forEach( function ( instance ) {
		instance.target.on( 'editor-ready', function () {

			if ( typeof instance.acrolinxEnabled === 'undefined' ) {
				instance.target.$element.addAcrolinxAdapterToFormInput();
				// TODO: This is a bit hacky - we store init flag on the instance
				//  to prevent it from being initialized again and again since
				//  editor-ready event will be triggered each time user switch from VE to textarea
				//  and versa
				instance.acrolinxEnabled = true;
			}

			// VE surface being recreated on editor switch so we need to rebind
			instance.target.getSurface().on( 'switchEditor', function () {
				// TODO: ideally we need to remove ContentEditable adapter on VE surface destroy
				//  and replace it with regular input adapter, though, the removeAdapter method
				//  is not implemented in Acrolinx MultiEditorAdapter SDK so perhaps this is a very
				//  special case need to be implemented as a new AdapterInterface class
				if ( $( instance.target.$node ).is( ':visible' ) ) {
					// Switch to VE
					// TODO: ...
				} else {
					// Switch to TEXTAREA
					// TODO: ...
				}
			} );

			// FIXME: without extra interface creating we barely can handle any error corrections
			//  coming form Acrolinx plugin

		} );
	} );
} );
