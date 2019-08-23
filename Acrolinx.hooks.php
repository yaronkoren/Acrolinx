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

		//$action = $out->getRequest()->getVal( 'action' );

		//if ( !$action || ( $action === 'edit' &&  ) ) {
			/*if ( self::enableAcrolinxForPage( $out->getTitle() ) ) {
				$out->addModules( 'ext.acrolinx.ve' );
			} else {
				if ( $out->getRequest()->getVal( 'title' ) === 'Special:FormEdit' ||
					 $out->getRequest()->getVal( 'action' ) === 'formedit' ) {
					$out->addModules( 'ext.acrolinx' );
				}
			}*/
		//}

		if ( !self::enableAcrolinxForPage( $out->getTitle() ) ) {
			// return;
		}

		/*if (
			$out->getRequest()->getVal( 'title' ) === 'Special:FormEdit' ||
			$out->getRequest()->getVal( 'action' ) === 'formedit' ||
			$out->getRequest()->getVal( 'action' ) === 'edit' )
		{
			$out->addModules( 'ext.acrolinx' );
		}*/

		$out->addModules( 'ext.acrolinx' );

		return true;
	}

}
