import { doc } from '../config/environment';
import { applyCSS } from '../global/css';
import Hook from '../events/Hook';
import { getElement } from '../utils/dom';
import runloop from '../global/runloop';
import { createFragment } from './initialise';

const renderHook = new Hook( 'render' );
const completeHook = new Hook( 'complete' );

export default function render ( ractive, target, anchor, occupants ) {
	// if `noIntro` is `true`, temporarily disable transitions
	const transitionsEnabled = ractive.transitionsEnabled;
	ractive.rendering = true;
	if ( noIntro( ractive ) ) ractive.transitionsEnabled = false;

	const promise = runloop.start( ractive, true );
	runloop.scheduleTask( () => renderHook.fire( ractive ), true );

	if ( ractive.fragment.rendered ) {
		throw new Error( 'You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first' );
	}

	if ( ractive.destroyed ) {
		ractive.destroyed = false;
		ractive.fragment = createFragment( ractive ).bind( ractive.viewmodel );
	}

	anchor = getElement( anchor ) || ractive.anchor;

	ractive.el = ractive.target = target;
	ractive.anchor = anchor;

	// ensure encapsulated CSS is up-to-date
	if ( ractive.cssId ) applyCSS();

	if ( target ) {
		( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( ractive );

		if ( anchor ) {
			const docFrag = doc.createDocumentFragment();
			ractive.fragment.render( docFrag );
			target.insertBefore( docFrag, anchor );
		} else {
			ractive.fragment.render( target, occupants );
		}
	}

	runloop.end();
	ractive.transitionsEnabled = transitionsEnabled;
	ractive.rendering = false;

	return promise.then( () => completeHook.fire( ractive ) );
}

function noIntro ( ractive ) {
	let instance = ractive;
	while ( instance && instance.rendering ) {
		if ( instance.hasOwnProperty( 'noIntro' ) ) return instance.noIntro;
		instance = instance.component && instance.component.ractive;
	}

	return ractive.noIntro;
}
