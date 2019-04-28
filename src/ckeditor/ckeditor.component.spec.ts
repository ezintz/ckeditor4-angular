/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CKEditorComponent } from './ckeditor.component';

import { TestTools } from '../test.tools';
import { CKEditor4 } from './ckeditor';
import EditorType = CKEditor4.EditorType;

const whenEvent = TestTools.whenEvent;

declare var CKEDITOR: any;

describe( 'CKEditorComponent', () => {
	let component: CKEditorComponent,
		fixture: ComponentFixture<CKEditorComponent>;

	beforeEach( async( () => {
		TestBed.configureTestingModule( {
			declarations: [ CKEditorComponent ]
		} )
			.compileComponents();
	} ) );

	beforeEach( () => {
		fixture = TestBed.createComponent( CKEditorComponent );
		component = fixture.componentInstance;
	} );

	afterEach( () => {
		fixture.destroy();
	} );

	[ EditorType.DIVAREA, EditorType.INLINE ].forEach( ( editorType ) => {
		describe( `type="${editorType}"`, () => {
			beforeEach( () => {
				component.type = editorType;
			} );

			describe( 'on initialization', () => {
				const method = editorType === 'divarea' ? 'replace' : 'inline';

				it( `should create editor with CKEDITOR.${method}`, () => {
					const spy = spyOn( CKEDITOR, method );
					whenEvent( 'ready', component ).then( () => {
						fixture.detectChanges();
						expect( spy ).toHaveBeenCalled();
					} );
				} );

				it( 'should emit ready event', () => {
					const spy = jasmine.createSpy();
					component.ready.subscribe( spy );

					fixture.detectChanges();

					whenEvent( 'ready', component ).then( () => {
						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );
				} );

				describe( 'with tagName unset', () => {
					it( 'editor should be initialized using textarea element', () => {
						whenEvent( 'ready', component ).then( () => {
							expect( fixture.nativeElement.lastElementChild.firstElementChild.tagName ).toEqual( 'TEXTAREA' );
						} );
					} );
				} );

				describe( 'with tagName set to div', () => {
					beforeEach( () => {
						component.tagName = 'div';
					} );

					it( 'editor should be initialized using div element', () => {
						whenEvent( 'ready', component ).then( () => {
							fixture.detectChanges();
							expect( fixture.nativeElement.firstChild.tagName ).toEqual( 'DIV' );
						} );
					} );
				} );

				[ {
					config: undefined,
					msg: 'without config',
					warn: false
				}, {
					config: { extraPlugins: 'basicstyles,divarea,link' },
					msg: 'config.extraPlugins defined as a string',
					warn: false
				}, {
					config: { extraPlugins: [ 'basicstyles', 'divarea', 'link' ] },
					msg: 'config.extraPlugins defined as an array',
					warn: false
				}, {
					config: { removePlugins: 'basicstyles,divarea,link,divarea' },
					msg: 'config.removePlugins defined as a string',
					warn: true
				}, {
					config: { removePlugins: [ 'basicstyles', 'divarea', 'link', 'divarea' ] },
					msg: 'config.removePlugins defined as an array',
					warn: true
				}
				].forEach( ( { config, msg, warn } ) => {
					describe( msg, () => {
						beforeEach( () => {
							component.config = config;
						} );

						it( `console ${warn ? 'should' : 'shouldn\'t'} warn`, () => {
							const spy = spyOn( console, 'warn' );

							fixture.detectChanges();

							whenEvent( 'ready', component ).then( () => {
								warn
									? expect( spy ).toHaveBeenCalled()
									: expect( spy ).not.toHaveBeenCalled();
							} );
						} );

						it( 'editor should use divarea plugin', () => {
							fixture.detectChanges();

							whenEvent( 'ready', component ).then( ( { editor } ) => {
								expect( editor.plugins.divarea ).not.toBeUndefined();
							} );
						} );
					} );
				} );

				describe( 'when set with config', () => {
					beforeEach( ( done ) => {
						component.config = {
							readOnly: true,
							width: 1000,
							height: 1000
						};
						fixture.detectChanges();
						whenEvent( 'ready', component ).then( done );
					} );

					it( 'editor should be readOnly', () => {
						expect( component.instance.readOnly ).toBeTruthy();
					} );

					it( 'editor should have width and height', () => {
						expect( component.instance.config.width ).toBe( 1000 );
						expect( component.instance.config.height ).toBe( 1000 );
					} );
				} );
			} );

			describe( 'when component is ready', () => {
				beforeEach( ( done ) => {
					fixture.detectChanges();

					whenEvent( 'ready', component ).then( done );
				} );

				it( 'should be initialized', () => {
					expect( component ).toBeTruthy();
				} );

				it( `editor ${editorType === 'inline' ? 'should' : 'shouldn\'t'} be inline`, () => {
					const expectation = expect( component.instance.editable().hasClass( 'cke_editable_inline' ) );

					editorType === 'inline'
						? expectation.toBeTruthy()
						: expectation.toBeFalsy();
				} );

				it( 'editor shouldn\'t be read-only', () => {
					fixture.detectChanges();

					expect( component.readOnly ).toBeFalsy();
					expect( component.instance.readOnly ).toBeFalsy();
				} );

				describe( 'with changed read-only mode', () => {
					it( 'should allow to enable read-only mode', () => {
						component.readOnly = true;

						expect( component.readOnly ).toBeTruthy();
						expect( component.instance.readOnly ).toBeTruthy();
					} );

					it( 'should allow to disable read-only mode', () => {
						component.readOnly = false;

						expect( component.readOnly ).toBeFalsy();
						expect( component.instance.readOnly ).toBeFalsy();
					} );
				} );

				it( 'initial data should be empty', () => {
					fixture.detectChanges();

					expect( component.data ).toEqual( null );
					expect( component.instance.getData() ).toEqual( '' );
				} );

				describe( 'component data', () => {
					const data = '<b>foo</b>',
						expected = '<p><strong>foo</strong></p>\n';

					it( 'should be configurable at the start of the component', () => {
						fixture.detectChanges();
						component.data = data;

						expect( component.data ).toEqual( expected );
						expect( component.instance.getData() ).toEqual( expected );
					} );

					it( 'should be writeable by ControlValueAccessor', () => {
						fixture.detectChanges();
						component.writeValue( data );

						expect( component.instance.getData() ).toEqual( expected );

						component.writeValue( '<p><i>baz</i></p>' );

						expect( component.instance.getData() ).toEqual( '<p><em>baz</em></p>\n' );
					} );
				} );

				describe( 'editor event', () => {
					it( 'change should emit component change', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.change.subscribe( spy );

						component.instance.fire( 'change' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it( 'focus should emit component focus', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.focus.subscribe( spy );

						component.instance.fire( 'focus' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it( 'blur should emit component blur', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.blur.subscribe( spy );

						component.instance.fire( 'blur' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it( 'paste should emit component paste', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.paste.subscribe( spy );

						component.instance.fire( 'paste' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it( 'dragend should emit component dragend', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.dragEnd.subscribe( spy );

						component.instance.fire( 'dragend' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					});

					it( 'dragstart should emit component dragstart', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.dragStart.subscribe( spy );

						component.instance.fire( 'dragstart' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it( 'drop should emit component drop', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.drop.subscribe( spy );

						component.instance.fire( 'drop' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it('fileUploadRequest should emit component fileUploadRequest', () => {
						component.config = {
							extraPlugins: 'uploadimage'
						};
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.fileUploadRequest.subscribe( spy );

						component.instance.fire( 'fileUploadRequest' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );

					it('fileUploadResponse should emit component fileUploadResponse', () => {
						component.config = {
							extraPlugins: 'uploadimage'
						};
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.fileUploadResponse.subscribe( spy );

						component.instance.fire( 'fileUploadResponse' );

						expect( spy ).toHaveBeenCalledTimes( 1 );
					} );
				} );

				describe( 'when control value accessor callbacks are set', () => {
					it( 'onTouched callback should be called when editor is blurred', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();

						component.registerOnTouched( spy );

						component.instance.fire( 'blur' );

						expect( spy ).toHaveBeenCalled();
					} );

					it( 'onChange callback should be called when editor model changes', () => {
						fixture.detectChanges();

						const spy = jasmine.createSpy();
						component.registerOnChange( spy );

						whenEvent( 'change', component ).then( () => {
							expect( spy ).toHaveBeenCalledTimes( 1 );
						} );

						component.instance.setData( 'initial' );
					} );
				} );
			} );
		} );
	} );
} );

