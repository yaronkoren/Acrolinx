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

	/**
	 * @param Title $title
	 *
	 * @return bool
	 */
	public static function enableAcrolinxForPage( $title ) {
		global $wgAcrolinxNamespaces;

		return in_array( $title->getNamespace(), $wgAcrolinxNamespaces );
	}

	/**
	 * @param string[] &$vars
	 * @param OutputPage $out
	 *
	 * @return bool
	 */
	public static function setGlobalJSVariables( &$vars, $out ) {
		global $wgAcrolinxServerAddress, $wgAcrolinxClientSignature;
		global $wgAcrolinxPageLocationID;
		global $wgLanguageCode;

		$vars['wgAcrolinxServerAddress'] = $wgAcrolinxServerAddress;
		$vars['wgAcrolinxClientSignature'] = $wgAcrolinxClientSignature;
		$vars['wgAcrolinxPageLocationID'] = $wgAcrolinxPageLocationID;

		$context = $out->getContext();
		$mwUserLanguage = $context->getLanguage()->getCode();
		// More processing may be needed here, to convert from
		// MediaWiki language codes to Acrolinx ones...
		$vars['wgAcrolinxPageLanguage'] = $wgLanguageCode;
		$vars['wgAcrolinxUserLanguage'] = $mwUserLanguage;
		return true;
	}

	/**
	 * @param EditPage &$editPage
	 * @param OutputPage &$output
	 *
	 * @return bool
	 */
	public static function addToEditPage( EditPage &$editPage, OutputPage &$output ) {
		$title = $editPage->getTitle();
		if ( self::enableAcrolinxForPage( $title ) ) {
			$output->addModules( 'ext.acrolinx' );
		}
		return true;
	}

	/**
	 * @param string[] &$otherModules
	 *
	 * @return bool
	 */
	public static function addToFormEditPage( &$otherModules ) {
		// We'll just enable Acrolinx for all forms, for now.
		$otherModules[] = 'ext.acrolinx';
		return true;
	}

	/**
	 * Adds extension modules for Visual Editor mode
	 *
	 * @param OutputPage $out
	 * @param Skin $skin
	 *
	 * @return bool|void
	 */
	public static function BeforePageDisplay( OutputPage $out, Skin $skin ) {
		// TODO: perhaps find a way to detect VE/Forms more precisely to
		// avoid loading the library code on regular pages

		/*$isEditOrForm = in_array(
			$out->getRequest()->getVal('action'),
			[ 'edit', 'formedit' ]
		);
		$isVe = $out->getRequest()->getVal('veaction') === 'edit';*/
		$isEnabled = self::enableAcrolinxForPage( $out->getTitle() );

		if ( !$isEnabled /*|| !( $isEditOrForm || $isVe )*/ ) {
			return;
		}

		$out->addModules( 'ext.acrolinx' );
		return true;
	}

	/**
	 * @param array $paths
	 *
	 * @return bool
	 *
	 * @deprecated since 1.28, kept for b/c
	 */
	public static function onUnitTestsList( &$paths ) {
		$paths[] = __DIR__ . '/tests/phpunit/';
		return true;
	}

}
