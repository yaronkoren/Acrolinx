/**
 * JavaScript to set up Acrolinx within MediaWiki Visual Editor interface
 */

'use strict';

console.log('Using mw_acrolinx_ve.js!');

// TODO: merge into a single file
var contentAdapter,
	// FIXME: duplicates config from mw_acrolinx.js
	basicConf = {
		sidebarContainerId: 'acrolinxContainer',
		serverAddress: mw.config.get( 'wgAcrolinxServerAddress' ),
		// Sandbox signature
		clientSignature: 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5',
		clientLocale: mw.config.get( 'wgAcrolinxUserLanguage' ),
		checkSettings: {
			language: mw.config.get( 'wgAcrolinxPageLanguage' )
		},
		getDocumentReference: function () {
			return window.location.href;
		},
		clientComponents: [
			{
				id: 'com.mediawiki.acrolinx.sidebar',
				name: 'Acrolinx Mediawiki Sidebar',
				version: '0.1.0.0',
				category: 'MAIN'
			}
		]
	},
	acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin( basicConf );

/**
 * Initializes the sidebar
 */
function initializeAcrolinxSidbar() {

	mw.hook( 've.activationComplete' ).add( function () {

		$( '#content' ).before( '<div id="acrolinxContainer" class="ve-enabled-acrolinx"></div>' );
		$( 'body' ).addClass( 'acrolinx-ve-sidebar' );

		var contentAdapter = new acrolinx.plugins.adapter.VisualEditorAdapter();

		acrolinxPlugin.registerAdapter( contentAdapter );
		acrolinxPlugin.init();

	} );

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
