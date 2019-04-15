/**
 * JavaScript to set up Acrolinx within MediaWiki Visual Editor interface
 */

'use strict';

var contentAdapter,
	// FIXME: duplicates config from mw_acrolinx.js
	basicConf = {
		sidebarContainerId: 'acrolinxContainer',
		serverAddress: mw.config.get( 'wgAcrolinxServerAddress' ),
		clientSignature: mw.config.get( 'wgAcrolinxClientSignature' ),
		clientLocale: mw.config.get( 'wgAcrolinxUserLanguage' ),
		checkSettings: {
			language: mw.config.get( 'wgAcrolinxPageLanguage' )
		},
		getDocumentReference: function () {
			return window.location.href;
		},
		// FIXME: we can't properly apply corrections on VE surface so make it readonly
		readOnlySuggestions: true
	},
	acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin( basicConf );

/**
 * Initializes the sidebar
 */
function initializeAcrolinxSidbar() {

	$( '#content' ).before( '<div id="acrolinxContainer" class="ve-enabled-acrolinx"></div>' );
	$( 'body' ).addClass( 'acrolinx-ve-sidebar' );

	contentAdapter = new acrolinx.plugins.adapter.ContentEditableAdapter( {
		element: $( '.ve-ce-documentNode' ).get( 0 )
	} );

	acrolinxPlugin.registerAdapter( contentAdapter );
	acrolinxPlugin.init();

}

/**
 * Destroys the sidebar
 */
function destroyAcrolinxSidebar() {

	$( 'body' ).removeClass( 'acrolinx-ve-sidebar' );
	acrolinxPlugin.dispose( function () {
		// done
	} );

}

/**
 * Catches VE initialization event
 * The event being fired for both dynamic and static activation of VE surface
 */
mw.hook( 've.activationComplete' ).add( function () {
	initializeAcrolinxSidbar();
} );

/**
 * Catches VE destroy event
 */
mw.hook( 've.deactivationComplete' ).add( function () {
	destroyAcrolinxSidebar();
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
