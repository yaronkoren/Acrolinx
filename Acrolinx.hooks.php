<?php
/**
 * Static functions called by various outside hooks, as well as by
 * extension.json.
 *
 * @author Yaron Koren
 * @file
 * @ingroup Acrolinx
 */

class AcrolinxHooks {

	public static function enableAcrolinxForPage( $title ) {
		global $wgAcrolinxNamespaces;

		return in_array( $title->getNamespace(), $wgAcrolinxNamespaces );
	}

	public static function setGlobalJSVariables( &$vars, $out ) {
		global $wgAcrolinxServerAddress, $wgAcrolinxClientSignature;
		global $wgLanguageCode;

		$vars['wgAcrolinxServerAddress'] = $wgAcrolinxServerAddress;
		$vars['wgAcrolinxClientSignature'] = $wgAcrolinxClientSignature;
		$context = $out->getContext();
		$mwUserLanguage = $context->getLanguage()->getCode();
		// More processing may be needed here, to convert from
		// MediaWiki language codes to Acrolinx ones...
		$vars['wgAcrolinxPageLanguage'] = $wgLanguageCode;
		$vars['wgAcrolinxUserLanguage'] = $mwUserLanguage;
		return true;
	}

	public static function addToEditPage( EditPage &$editPage, OutputPage &$output ) {
		$title = $editPage->getTitle();
		if ( self::enableAcrolinxForPage( $title ) ) {
			$output->addModules( 'ext.acrolinx' );
		}
		return true;
	}

	public static function addToFormEditPage( &$otherModules ) {
		// We'll just enable Acrolinx for all forms, for now.
		$otherModules[] = 'ext.acrolinx';
		return true;
	}

}
