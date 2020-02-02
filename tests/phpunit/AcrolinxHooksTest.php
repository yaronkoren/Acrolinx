<?php

/**
 * Class AcrolinxHooksTest
 *
 * @group Database
 */
class AcrolinxHooksTest extends MediaWikiTestCase {

	/**
	 * @covers AcrolinxHooks::enableAcrolinxForPage
	 */
	public function testEnableAcrolinxForPage() {
		$this->setMwGlobals([
			'wgAcrolinxNamespaces' => [ NS_MAIN ]
		]);
		$page = $this->getExistingTestPage('UTest1');
		$this->assertTrue(
			AcrolinxHooks::enableAcrolinxForPage( $page->getTitle() )
		);
		$this->setMwGlobals([
			'wgAcrolinxNamespaces' => []
		]);
		$this->assertFalse(
			AcrolinxHooks::enableAcrolinxForPage( $page->getTitle() )
		);
	}
}
