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

var basicConf = {
	sidebarContainerId: 'acrolinxContainer',
	// See: https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.52/doc/pluginDoc/interfaces/_src_acrolinx_libs_plugin_interfaces_.initparameters.html
	serverAddress: mw.config.get( 'wgAcrolinxServerAddress' ),
	clientSignature: mw.config.get( 'wgAcrolinxClientSignature' ),
	clientLocale: mw.config.get( 'wgAcrolinxUserLanguage' ),

	checkSettings: {
		language: mw.config.get( 'wgAcrolinxPageLanguage' )
	},

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
var multiAdapter = new acrolinx.plugins.adapter.MultiEditorAdapter( {} );

jQuery.fn.addAcrolinxAdapterToFormInput = function () {
	return this.each( function () {
		var inputAdapter, textareaID = $( this ).attr( 'id' );

		if ( $( this ).hasClass( 'tinymce' ) ) {
			inputAdapter = new acrolinx.plugins.adapter.TinyMCEAdapter( {
				editorId: textareaID
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
		.not( '.multipleTemplateStarter textarea' )
		.not( '.multipleTemplateStarter input.createboxInput' )
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
